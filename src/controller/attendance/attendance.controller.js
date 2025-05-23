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

    let attDate = date.includes("T") ? date.split("T")[0] : date;

    const getAttendanceRes = await knex('attendance')
      .select('employee_id', knex.raw("DATE_FORMAT(login_date, '%Y-%m-%d') as login_date"), 'login_time', knex.raw("DATE_FORMAT(logout_date, '%Y-%m-%d') as logout_date"), 'logout_time', 'total_minutes', 'total_time')
      .whereRaw("DATE(created_at) = ?", [attDate]);

    if (getAttendanceRes) {
      logger.info("Attendance List retrieved successfully", {
        username: user_name,
        reqdetails: "attendance-getAttendance",
      });
      return res.status(200).json({
        message: "Attendance List retrieved successfully",
        data: getAttendanceRes,
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
    let formattedTime = "00:00:00";
    if (data.length > 0) {
      const loginDateTime = moment(`${data[0].login_date} ${data[0].login_time}`, "YYYY-MM-DD HH:mm:ss");
      const logoutDateTime = moment(`${logout_date} ${logout_time}`, "YYYY-MM-DD HH:mm:ss");
      const totalSeconds = logoutDateTime.diff(loginDateTime, 'seconds');
      totalMinutes = Math.ceil(totalSeconds / 60);
      totalMinutes = Math.floor(totalSeconds / 60);
      const extraMinute = (totalSeconds % 60) > 30 ? 1 : 0;
      totalMinutes += extraMinute;

      formattedTime = moment.utc(totalSeconds * 1000).format("HH:mm:ss");
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
        total_minutes: totalMinutes,
        total_time: formattedTime
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
    const { emp_id, user_id, start_date, end_date } = req.body;
    const { dbname, user_name } = req.user;

    logger.info("Get Attendance List Request Received", {
      username: user_name,
      reqdetails: "attendance-getAttendanceByDate",
    });

    knex = await createKnexInstance(dbname);

    let startDate = start_date.includes("T") ? start_date.split("T")[0] : start_date;
    let endDate = end_date.includes("T") ? end_date.split("T")[0] : end_date;

    const query = knex('attendance')
      .select(
        'employee_id',
        knex.raw("DATE_FORMAT(login_date, '%Y-%m-%d') as login_date"),
        knex.raw("MIN(login_time) as login_time"),
        knex.raw("DATE_FORMAT(MAX(logout_date), '%Y-%m-%d') as logout_date"),
        knex.raw("MAX(logout_time) as logout_time"),
        knex.raw("SUM(total_minutes) as total_minutes"),
        knex.raw("SEC_TO_TIME(SUM(TIME_TO_SEC(total_time))) as total_time")
      )
      .groupBy('employee_id', 'login_date')
      .orderBy("login_date", "desc");

    const employee = await knex("employees").select("*").where("employee_id", user_id).first();

    if (emp_id == "" && employee.role == 3) {
      query.where("employee_id", user_id);
    }

    if (emp_id) {
      query.where("employee_id", emp_id);

      if (startDate != "" && endDate != "") {
        query.whereRaw("DATE(created_at) BETWEEN ? AND ?", [startDate, endDate]);
      } else {
        query.whereRaw("DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)");
      }
    } else {
      query.whereRaw("DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)");
    }

    const getAttendanceRes = await query;

    for (const data of getAttendanceRes) {
      const employee = await knex("employees")
        .select("name")
        .where({ employee_id: data.employee_id }).first();
      data["employee_name"] = employee?.name || null;
    }

    if (getAttendanceRes) {
      logger.info("Attendance List retrieved successfully", {
        username: user_name,
        reqdetails: "attendance-getAttendanceByDate",
      });
      return res.status(200).json({
        message: "Attendance List retrieved successfully",
        data: getAttendanceRes,
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

export const checkTodayAttendance = async (req, res, next) => {
  let knex = null;
  try {
    const { emp_id } = req.body;
    const { dbname, user_name } = req.user;

    logger.info("Get Today Attendance List Request Received", {
      username: user_name,
      reqdetails: "attendance-checkTodayAttendance",
    });

    knex = await createKnexInstance(dbname);

    const getAttendanceRes = await knex('attendance')
      .select('*', knex.raw("DATE_FORMAT(login_date, '%Y-%m-%d') as login_date"), knex.raw("DATE_FORMAT(logout_date, '%Y-%m-%d') as logout_date"))
      .whereRaw("DATE(created_at) = CURDATE()")
      .andWhere("employee_id", emp_id);

    let returnData = [];

    let todayMinutes = 0;
    let totalSeconds = 0;
    let totalTime;

    if (getAttendanceRes.length > 0) {
      for (let data of getAttendanceRes) {
        if (data.logout_time == null) {
          returnData.push(data);
        } else {
          todayMinutes += data.total_minutes;
          const timeParts = data.total_time?.split(":").map(Number); // Convert "HH:MM:SS" -> [HH, MM, SS]
          const seconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
          totalSeconds += seconds;
          totalTime = moment.utc(totalSeconds * 1000).format("HH:mm:ss");
        }
      }
    }

    const recordsToUpdate = await knex('attendance')
      .select(knex.raw("DATE_FORMAT(login_date, '%Y-%m-%d') as login_date"), 'login_time', 'attendance_id')
      // .where("employee_id", emp_id)
      .whereRaw("DATE(login_date) < CURDATE()")
      .whereNull("logout_time");

    if (recordsToUpdate.length > 0) {
      for (const data of recordsToUpdate) {
        const loginDateTime = moment(`${data.login_date} ${data.login_time}`, "YYYY-MM-DD HH:mm:ss");
        const logoutDateTime = moment(`${data.login_date} 20:00:00`, "YYYY-MM-DD HH:mm:ss");

        const totalSeconds = logoutDateTime.diff(loginDateTime, 'seconds');
        let totalMinutes = Math.floor(totalSeconds / 60);
        const extraMinute = (totalSeconds % 60) > 30 ? 1 : 0;
        totalMinutes += extraMinute;

        const formattedTime = moment.utc(totalSeconds * 1000).format("HH:mm:ss");

        await knex('attendance')
          .where("attendance_id", data.attendance_id)
          .update({
            logout_date: data.login_date,
            logout_time: "20:00:00",
            total_minutes: totalMinutes,
            total_time: formattedTime
          });
      }
    }

    if (getAttendanceRes) {
      logger.info("Today Attendance List retrieved successfully", {
        username: user_name,
        reqdetails: "attendance-checkTodayAttendance",
      });
      return res.status(200).json({
        message: "Today Attendance List retrieved successfully",
        data: returnData,
        today_work_minutes: todayMinutes,
        today_work_time: totalTime,
        status: true,
      });
    } else {
      logger.warn("No Today Attendance Details found", {
        username: user_name,
        reqdetails: "attendance-checkTodayAttendance",
      });
      return res.status(404).json({
        message: "No Today Attendance Details found",
        status: false,
      });
    }
  } catch (err) {
    logger.error("Error fetching Today Attendance List", {
      error: err.message,
      username: req.user?.user_name,
      reqdetails: "attendance-checkTodayAttendance",
    });
    next(err);
  } finally {
    if (knex) {
      knex.destroy();
    }
  }
};

export const mobTimerData = async (req, res, next) => {
  let knex = null;
  try {
    const { emp_id } = req.body;
    const { dbname, user_name } = req.user;

    logger.info("Get Today Attendance Timer Data Request Received", {
      username: user_name,
      reqdetails: "attendance-mobTimerData",
    });

    if (!emp_id) {
      logger.error("Employee ID Mandatory fields are missing", {
        username: user_name,
        reqdetails: "attendance-mobTimerData",
      });
      return res.status(400).json({
        message: "Employee ID Mandatory field are missing",
        status: false,
      });
    }

    knex = await createKnexInstance(dbname);

    const result = await knex('attendance')
      .where({'employee_id': emp_id, 'status': "0"})
      .andWhereRaw('login_date = CURRENT_DATE')
      .sum({
        total_seconds: knex.raw(`
      CASE 
        WHEN logout_date IS NOT NULL AND logout_time IS NOT NULL 
          THEN TIMESTAMPDIFF(SECOND, login_time, logout_time)
        ELSE TIMESTAMPDIFF(SECOND, login_time, CURRENT_TIME)
      END
    `)
      });

    const runningTimer = await knex('attendance').select("attendance_id")
      .where({'employee_id': emp_id, 'status': "0"})
      .andWhereRaw('login_date = CURRENT_DATE')
      .whereNull('logout_date');

    if (result) {
      logger.info("Today Attendance Timer Data retrieved successfully", {
        username: user_name,
        reqdetails: "attendance-mobTimerData",
      });
      return res.status(200).json({
        message: "Today Attendance Timer Data retrieved successfully",
        data: result[0].total_seconds,
        timerStatus: runningTimer.length > 0 ? true : false,
        id: runningTimer.length > 0 ? runningTimer[0].attendance_id : null,
        status: true,
      });
    } else {
      logger.warn("No Today Attendance Timer Data found", {
        username: user_name,
        reqdetails: "attendance-mobTimerData",
      });
      return res.status(404).json({
        message: "No Today Attendance Timer Data found",
        status: false,
      });
    }
  } catch (err) {
    logger.error("Error fetching Today Attendance Timer Data", {
      error: err.message,
      username: req.user?.user_name,
      reqdetails: "attendance-mobTimerData",
    });
    next(err);
  } finally {
    if (knex) {
      knex.destroy();
    }
  }
};