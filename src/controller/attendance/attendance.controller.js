import createKnexInstance from "../../../configs/db.js";
import { logger } from "../../../configs/winston.js";

export const getAttendance = async (req, res, next) => {
  let knex = null;
  try {
    const { date } = req.body;
    const { dbname, user_name } = req.user;

    logger.info("Get Attendance List Request Received", {
      username: user_name,
      reqdetails: "attendance-getAttendance",
    });

    knex = await createKnexInstance(dbname);

    const getEmpResult = await knex('attendance')
      .select('employee_id', 'login_date', 'login_time', 'logout_date', 'logout_time', 'total_minutes')
      .whereRaw("DATE(created_at) = ?", [date]);

    if (getEmpResult) {
      logger.info("Attendance List retrieved successfully", {
        username: user_name,
        reqdetails: "attendance-getAttendance",
      });
      return res.status(200).json({
        message: "Attendance List retrieved successfully",
        data: getEmpResult,
        status: true,
      });
    } else {
      logger.warn("No Attendance Details found", {
        username: user_name,
        reqdetails: "attendance-getAttendance",
      });
      return res.status(404).json({
        message: "No Attendance Details found",
        status: false,
      });
    }
  } catch (err) {
    logger.error("Error fetching Attendance List", {
      error: err.message,
      username: req.user?.user_name,
      reqdetails: "attendance-getAttendance",
    });
    next(err);
  } finally {
    if (knex) {
      knex.destroy();
    }
  }
};

export const loginAttendance = async (req, res, next) => {
  let knex = null;
  try {
    const { emp_id, start_time, start_date } = req.body;
    const { dbname, user_name } = req.user;

    logger.info("Add Attendance Request Received", {
      username: user_name,
      reqdetails: "attendance-loginAttendance",
    });

    if (!emp_id || !start_time || !start_date) {
      logger.error("Mandatory fields are missing", {
        username: user_name,
        reqdetails: "attendance-loginAttendance",
      });
      return res.status(400).json({
        message: "Mandatory fields are missing",
        status: false,
      });
    }

    knex = await createKnexInstance(dbname);

    const insertAttResult = await knex('attendance')
      .insert({
        employee_id: emp_id,
        login_date: knex.raw('?', [start_date]),
        login_time: knex.raw('?', [start_time])
      });

    if (insertAttResult) {
      logger.info("Attendance inserted successfully", {
        username: user_name,
        reqdetails: "attendance-loginAttendance",
      });
      return res.status(200).json({
        message: "Attendance inserted successfully",
        status: true,
        data: insertAttResult[0]
      });
    } else {
      logger.error("Failed to insert Attendance", {
        username: user_name,
        reqdetails: "attendance-loginAttendance",
      });
      return res.status(500).json({
        message: "Failed to insert Attendance",
        status: false,
      });
    }
  } catch (error) {
    console.error("Error inserting Attendance:", error);
    next(error);
  } finally {
    if (knex) {
      knex.destroy();
    }
  }
};

export const logoutAttendance = async (req, res, next) => {
  let knex = null;
  try {
    const { att_id, logout_date, logout_time, total_mins } = req.body;
    const { dbname, user_name } = req.user;

    logger.info("Update Attendance Request Received", {
      username: user_name,
      reqdetails: "attendance-logoutAttendance",
    });

    if (!att_id || !logout_date || !logout_time || !total_mins) {
      logger.error("Mandatory fields are missing", {
        username: user_name,
        reqdetails: "attendance-logoutAttendance",
      });
      return res.status(400).json({
        message: "Mandatory fields are missing",
        status: false,
      });
    }

    knex = await createKnexInstance(dbname);

    const updateAttResult = await knex('attendance')
      .update({
        logout_date: logout_date,
        logout_time: logout_time,
        total_minutes: total_mins
      }).where("attendance_id", att_id);

    if (updateAttResult) {
      logger.info("Attendance updated successfully", {
        username: user_name,
        reqdetails: "attendance-logoutAttendance",
      });
      return res.status(200).json({
        message: "Attendance updated successfully",
        status: true,
      });
    } else {
      logger.error("Failed to update Attendance", {
        username: user_name,
        reqdetails: "attendance-logoutAttendance",
      });
      return res.status(500).json({
        message: "Failed to update Attendance",
        status: false,
      });
    }
  } catch (error) {
    console.error("Error updating Attendance:", error);
    next(error);
  } finally {
    if (knex) {
      knex.destroy();
    }
  }
};