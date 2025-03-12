import createKnexInstance from "../../../configs/db.js";
import { logger } from "../../../configs/winston.js";

export const getClientTimesheet = async (req, res, next) => {
    let knex = null;
    try {
        const { dbname, user_name } = req.user;

        logger.info("Get Client Timesheet List Request Received", {
            username: user_name,
            reqdetails: "timesheet-getClientTimesheet",
        });

        knex = await createKnexInstance(dbname);

        const getClientRes = await knex('time_sheets').select('employee_id', 'employee', 'date', 'total_minutes', 'service_id', 'service').where("status", "0");

        if (getClientRes) {
            logger.info("Client Timesheet List retrieved successfully", {
                username: user_name,
                reqdetails: "timesheet-getClientTimesheet",
            });
            return res.status(200).json({
                message: "Client Timesheet List retrieved successfully",
                data: getClientRes,
                status: true,
            });
        } else {
            logger.warn("No Client Timesheet Details found", {
                username: user_name,
                reqdetails: "timesheet-getClientTimesheet",
            });
            return res.status(404).json({
                message: "No Client Timesheet Details found",
                status: false,
            });
        }
    } catch (err) {
        logger.error("Error fetching Client Timesheet List", {
            error: err.message,
            username: req.user?.user_name,
            reqdetails: "timesheet-getClientTimesheet",
        });
        next(err);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};

export const searchClientTimesheet = async (req, res, next) => {
    let knex = null;
    try {
        const { start_date, end_date, client_id } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Search Client Timesheet List Request Received", {
            username: user_name,
            reqdetails: "timesheet-searchClientTimesheet",
        });

        if (!start_date || !client_id || !end_date) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "timesheet-searchClientTimesheet",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        knex = await createKnexInstance(dbname);

        const getClientRes = await knex('time_sheets')
            .select('client_id', 'date', 'total_minutes', 'service_id')
            .where('status', '0')
            .where('client_id', client_id)
            .whereBetween('date', [start_date, end_date]);

        if (getClientRes) {
            logger.info("Client Timesheet List retrieved successfully", {
                username: user_name,
                reqdetails: "timesheet-searchClientTimesheet",
            });
            return res.status(200).json({
                message: "Client Timesheet List retrieved successfully",
                data: getClientRes,
                status: true,
            });
        } else {
            logger.warn("No Client Timesheet Details found", {
                username: user_name,
                reqdetails: "timesheet-searchClientTimesheet",
            });
            return res.status(404).json({
                message: "No Client Timesheet Details found",
                status: false,
            });
        }
    } catch (err) {
        logger.error("Error fetching Client Timesheet List", {
            error: err.message,
            username: req.user?.user_name,
            reqdetails: "timesheet-searchClientTimesheet",
        });
        next(err);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};