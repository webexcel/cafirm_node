import createKnexInstance from "../../../configs/db.js";
import { logger } from "../../../configs/winston.js";
import moment from 'moment';

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
      .select('employee_id', knex.raw("DATE_FORMAT(login_date, '%Y-%m-%d') as login_date"), 'login_time', knex.raw("DATE_FORMAT(logout_date, '%Y-%m-%d') as logout_date"), 'logout_time', 'total_minutes')
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
    const { att_id, logout_date, logout_time } = req.body;
    const { dbname, user_name } = req.user;

    logger.info("Update Attendance Request Received", {
      username: user_name,
      reqdetails: "attendance-logoutAttendance",
    });

    if (!att_id || !logout_date || !logout_time) {
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

    const data = await knex('attendance').select(knex.raw("DATE_FORMAT(login_date, '%Y-%m-%d') as login_date"), 'login_time').where("attendance_id", att_id);

    let totalMinutes = 0;

    if (data.length > 0) {
      const loginDateTime = moment(`${data[0].login_date} ${data[0].login_time}`, "YYYY-MM-DD HH:mm:ss");
      const logoutDateTime = moment(`${logout_date} ${logout_time}`, "YYYY-MM-DD HH:mm:ss");
      totalMinutes = logoutDateTime.diff(loginDateTime, 'minutes');
    } else {
      logger.error("No Attendance Record Found.", {
        username: user_name,
        reqdetails: "attendance-logoutAttendance",
      });
      return res.status(500).json({
        message: "No Attendance Record Found.",
        status: false,
      });
    }

    const updateAttResult = await knex('attendance')
      .update({
        logout_date: logout_date,
        logout_time: logout_time,
        total_minutes: totalMinutes
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

export const getAttendanceByDate = async (req, res, next) => {
  let knex = null;
  try {
    const { emp_id, start_date, end_date } = req.body;
    const { dbname, user_name } = req.user;

    logger.info("Get Attendance List Request Received", {
      username: user_name,
      reqdetails: "attendance-getAttendanceByDate",
    });

    knex = await createKnexInstance(dbname);

    const query = knex('attendance')
      .select(
        'employee_id',
        knex.raw("DATE_FORMAT(login_date, '%Y-%m-%d') as login_date"),
        'login_time',
        knex.raw("DATE_FORMAT(logout_date, '%Y-%m-%d') as logout_date"),
        'logout_time',
        'total_minutes'
      )
      .orderBy("created_at", "desc");

    if (emp_id) {
      query.where("employee_id", emp_id)
        .whereRaw("DATE(created_at) BETWEEN ? AND ?", [start_date, end_date]);
    } else {
      query.whereRaw("DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)");
    }

    const getEmpResult = await query;

    for (const data of getEmpResult) {
      const employee = await knex("employees")
          .select("name")
          .where({ employee_id: data.employee_id }).first();
          data["employee_name"] = employee?.name || null;
  }

    if (getEmpResult) {
      logger.info("Attendance List retrieved successfully", {
        username: user_name,
        reqdetails: "attendance-getAttendanceByDate",
      });
      return res.status(200).json({
        message: "Attendance List retrieved successfully",
        data: getEmpResult,
        status: true,
      });
    } else {
      logger.warn("No Attendance Details found", {
        username: user_name,
        reqdetails: "attendance-getAttendanceByDate",
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
      reqdetails: "attendance-getAttendanceByDate",
    });
    next(err);
  } finally {
    if (knex) {
      knex.destroy();
    }
  }
};