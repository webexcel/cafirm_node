import responseCode from "../../../constants/responseCode.js";
import createKnexInstance from "../../..//configs/db.js";
import { generateAccessToken } from "../../middleware/auth.middleware.js";
import { logger } from "../../../configs/winston.js";
import message from "../../../constants/messages.js";
import errorStatus from "../../../constants/responseCode.js";
import bcrypt from 'bcrypt';
import sendEmail from "../../utills/sendEmail.js";

export const login = async (req, res, next) => {
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

    const knex = await createKnexInstance();

    const checkData = await knex("employees")
      .select("password_hash")
      .where({ email });

    if (checkData.length > 0) {
      const storedPassword = checkData[0]?.password_hash;
      let isMatch = false;

      // Check if the stored password is hashed (bcrypt hashes start with "$2")
      if (storedPassword.startsWith("$2")) {
        isMatch = await bcrypt.compare(password, storedPassword);
      } else {
        // Temporary fallback for plain-text passwords (should be removed after migrating all to bcrypt)
        isMatch = password === storedPassword;
      }

      if (isMatch) {
        const loginData = await knex("employees")
          .select("employee_id", "name", "email", "phone", "role")
          .where({ email });

        logger.info("Found user details in the Database", {
          username: email,
          reqdetails: "login",
        });

        const { employee_id, email: userEmail, name, role } = loginData[0];
        const userdata = { employee_id, email: userEmail, name, role };

        const token = generateAccessToken(userdata);
        logger.info("Logged in Successfully", {
          username: email,
          reqdetails: "login",
        });

        return res.status(responseCode.SUCCESS).json({
          status: true,
          message: "Login Successfully",
          token,
          userdata,
        });
      } else {
        logger.info("Login Failed due to incorrect credentials", {
          username: email,
          reqdetails: "login",
        });
        return res.status(responseCode.FAILURE.DATA_NOT_FOUND).json({
          status: false,
          message: "Incorrect Password",
        });
      }
    } else {
      logger.info("Login Failed due to incorrect credentials", {
        username: email,
        reqdetails: "login",
      });
      return res.status(responseCode.FAILURE.DATA_NOT_FOUND).json({
        status: false,
        message: "Invalid Username",
      });
    }
  } catch (error) {
    next(error);
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

    // Hash the new password before storing it
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in the database
    await knex("employees")
      .where({ email })
      .update({ password_hash: hashedPassword });

    return res.status(200).json({ status: true, message: "Password reset successfully" });
  } catch (error) {
    return res.status(500).json({ status: false, message: "Something went wrong" });
  }
};

