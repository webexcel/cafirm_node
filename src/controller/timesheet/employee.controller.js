import createKnexInstance from "../../../configs/db.js";
import { logger } from "../../../configs/winston.js";

export const getEmployeeTimesheet = async (req, res, next) => {
    let knex = null;
    try {
        const { dbname, user_name } = req.user;

        logger.info("Get Employee Timesheet List Request Received", {
            username: user_name,
            reqdetails: "timesheet-getEmployeeTimesheet",
        });

        knex = await createKnexInstance(dbname);

        const getClientRes = await knex('time_sheets').select('employee_id', 'employee', 'date', 'total_minutes', 'service_id', 'service', 'description').where("status", "0");

        if (getClientRes) {
            logger.info("Employee Timesheet List retrieved successfully", {
                username: user_name,
                reqdetails: "timesheet-getEmployeeTimesheet",
            });
            return res.status(200).json({
                message: "Employee Timesheet List retrieved successfully",
                data: getClientRes,
                status: true,
            });
        } else {
            logger.warn("No Employee Timesheet Details found", {
                username: user_name,
                reqdetails: "timesheet-getEmployeeTimesheet",
            });
            return res.status(404).json({
                message: "No Employee Timesheet Details found",
                status: false,
            });
        }
    } catch (err) {
        logger.error("Error fetching Employee Timesheet List", {
            error: err.message,
            username: req.user?.user_name,
            reqdetails: "timesheet-getEmployeeTimesheet",
        });
        next(err);
    } finally {
        if (knex) {
            await knex.destroy();
        }
    }
};

export const searchEmployeeTimesheet = async (req, res, next) => {
    let knex = null;
    try {
        const { start_date, end_date, emp_id } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Search Employee Timesheet List Request Received", {
            username: user_name,
            reqdetails: "timesheet-searchEmployeeTimesheet",
        });

        if (!start_date || !emp_id || !end_date) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "timesheet-searchEmployeeTimesheet",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        knex = await createKnexInstance(dbname);

        const getClientRes = await knex('time_sheets')
            .select('employee_id', 'date', 'total_minutes', 'service_id', 'description')
            .where('status', '0')
            .where('employee_id', emp_id)
            .whereBetween('date', [start_date, end_date]);

        if (getClientRes) {
            logger.info("Employee Timesheet List retrieved successfully", {
                username: user_name,
                reqdetails: "timesheet-searchEmployeeTimesheet",
            });
            return res.status(200).json({
                message: "Employee Timesheet List retrieved successfully",
                data: getClientRes,
                status: true,
            });
        } else {
            logger.warn("No Employee Timesheet Details found", {
                username: user_name,
                reqdetails: "timesheet-searchEmployeeTimesheet",
            });
            return res.status(404).json({
                message: "No Employee Timesheet Details found",
                status: false,
            });
        }
    } catch (err) {
        logger.error("Error fetching Employee Timesheet List", {
            error: err.message,
            username: req.user?.user_name,
            reqdetails: "timesheet-searchEmployeeTimesheet",
        });
        next(err);
    } finally {
        if (knex) {
            await knex.destroy();
        }
    }
};