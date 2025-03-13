import responseCode from "../../../constants/responseCode.js";
import createKnexInstance from "../../..//configs/db.js";
import { generateAccessToken } from "../../middleware/auth.middleware.js";
import { logger } from "../../../configs/winston.js";
import message from "../../../constants/messages.js";
import errorStatus from "../../../constants/responseCode.js";

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
    const loginData = await knex("employees")
      .select("employee_id", "name", "email", "phone", "role")
      .where({ email, password_hash: password });

    if (loginData.length > 0) {
      logger.info("Found user details in the Database", {
        username: email,
        reqdetails: "login",
      });

      const { employee_id, email: userEmail, name, role } = loginData[0];
      const userdata = { employee_id, email: userEmail, name, role: role };

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
        message: "Incorrect username or password",
      });
    }
  } catch (error) {
    next(error);
  }
};

