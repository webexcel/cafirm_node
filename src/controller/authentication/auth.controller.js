import responseCode from "../../../constants/responseCode.js";
import createKnexInstance from "../../..//configs/db.js";
import { generateAccessToken } from "../../middleware/auth.middleware.js";
import { logger } from "../../../configs/winston.js";
import message from "../../../constants/messages.js";
import errorStatus from "../../../constants/responseCode.js";
import bcrypt from 'bcrypt';
import sendEmail from "../../utills/SendEmail.js";

export const login = async (req, res, next) => {
  let knex = null;
  try {
    const { email, password } = req.body;
    logger.info("User is trying to Login", {
      username: email,
      reqdetails: "login",
    });

    if (!email || !password) {
      return res.status(errorStatus?.FAILURE?.BAD_REQUEST).json({
        status: false,
        message: message?.MANDATORY_ERROR,
      });
    }

    knex = await createKnexInstance();

    const user = await knex("employees")
      .select("employee_id", "name", "email", "phone", "role", "password_hash", "photo")
      .where({ email, "status": "0" })
      .first();

    if (!user) {
      logger.info("Login Failed: Invalid Username", { username: email, reqdetails: "login" });
      return res.status(responseCode.FAILURE.DATA_NOT_FOUND).json({
        status: false,
        message: "Invalid Username",
      });
    }

    const { employee_id, name, role, photo, email: userEmail, password_hash: storedPassword } = user;

    let isMatch = false;
    let needsUpdate = false;

    if (storedPassword.startsWith("$2b$")) {
      // If password is already hashed, compare using bcrypt
      isMatch = await bcrypt.compare(password, storedPassword);
    } else {
      // If password is in plain text, compare directly
      isMatch = password === storedPassword;
      needsUpdate = isMatch; // If it matches, we should update it with bcrypt
    }

    if (!isMatch) {
      logger.info("Login Failed: Incorrect Password", { username: email, reqdetails: "login" });
      return res.status(responseCode.FAILURE.DATA_NOT_FOUND).json({
        status: false,
        message: "Incorrect Password",
      });
    }

    logger.info("Logged in Successfully", { username: email, reqdetails: "login" });

    // 🔹 If password was plain text, hash and update it after successful login
    if (needsUpdate) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await knex("employees").where({ email }).update({ password_hash: hashedPassword });
      logger.info("Password updated to bcrypt hash for better security", { username: email });
    }

    const token = generateAccessToken({ employee_id, email: userEmail, name, role, user_name: name });

    return res.status(responseCode.SUCCESS).json({
      status: true,
      message: "Login Successfully",
      token,
      userdata: { employee_id, email: userEmail, name, role, photo },
    });

  } catch (error) {
    next(error);
  } finally {
    if (knex) {
      await knex.destroy();
    }
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  // Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000);

  try {
    await sendEmail(email, otp);
    return res.status(200).json({ status: true, message: 'OTP sent to your email', otp });
  } catch (error) {
    return res.status(500).json({ status: false, message: 'Failed to send OTP' });
  }
};

export const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  const knex = await createKnexInstance();

  try {
    // Check if the email exists
    const user = await knex("employees").where({ email }).first();

    if (!user) {
      return res.status(404).json({ status: false, message: "Email not found" });
    }

    // Ensure password is hashed before storing
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in the database
    await knex("employees").where({ email }).update({ password_hash: hashedPassword });

    logger.info("Password reset successfully", { username: email });

    return res.status(200).json({
      status: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    logger.error("Error resetting password", { error: error.message });
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
    });
  } finally {
    if (knex) await knex.destroy();
  }
};

export const getUserDetails = async (req, res, next) => {
  let knex = null;
  try {
    const { email, user_name } = req.user;

    logger.info("Get User Details Request Received", {
      username: user_name,
      reqdetails: "getUserDetails",
    });

    knex = await createKnexInstance();

    const user = await knex("employees")
      .select("employee_id", "name", "email", "phone", "role", "password_hash", "photo")
      .where({ email, "status": "0" })
      .first();

    if (user) {
      logger.info("User Details retrieved successfully", {
        username: user_name,
        reqdetails: "getUserDetails",
      });
      return res.status(200).json({
        message: "User Details retrieved successfully",
        data: { employee_id: user.employee_id, email: email, name: user.name, role: user.role, photo: user.photo },
        status: true,
      });
    } else {
      logger.warn("No User Details found", {
        username: user_name,
        reqdetails: "getUserDetails",
      });
      return res.status(404).json({
        message: "No User Details found",
        status: false,
      });
    }
  } catch (err) {
    logger.error("Error fetching User Details", {
      error: err.message,
      username: req.user?.user_name,
      reqdetails: "getUserDetails",
    });
    next(err);
  } finally {
    if (knex) {
      await knex.destroy();
    }
  }
};