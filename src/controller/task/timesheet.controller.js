import createKnexInstance from "../../../configs/db.js";
import { logger } from "../../../configs/winston.js";

export const getTimesheet = async (req, res, next) => {
    let knex = null;
    try {
        const { dbname, user_name } = req.user;

        logger.info("Get Time-Sheet List Request Received", {
            username: user_name,
            reqdetails: "task-getTimesheet",
        });

        knex = await createKnexInstance(dbname);

        const getTaskRes = await knex('time_sheets').select('*').where('status', '0');;

        if (getTaskRes) {
            logger.info("Time-Sheet List retrieved successfully", {
                username: user_name,
                reqdetails: "task-getTimesheet",
            });
            return res.status(200).json({
                message: "Time-Sheet List retrieved successfully",
                data: getTaskRes,
                status: true,
            });
        } else {
            logger.warn("No Time-Sheet Details found", {
                username: user_name,
                reqdetails: "task-getTimesheet",
            });
            return res.status(404).json({
                message: "No Time-Sheet Details found",
                status: false,
            });
        }
    } catch (err) {
        logger.error("Error fetching Time-Sheet List", {
            error: err.message,
            username: req.user?.user_name,
            reqdetails: "task-getTimesheet",
        });
        next(err);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};

export const addTimesheet = async (req, res, next) => {
    let knex = null;
    try {
        const { emp_id, emp_name, clientId, client, serviceId, serviceName, date, totalMinutes, description } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Add Time-Sheet Request Received", {
            username: user_name,
            reqdetails: "task-addTimesheet",
        });

        if (!emp_id || !clientId || !serviceId || !totalMinutes) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "task-addTimesheet",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        knex = await createKnexInstance(dbname);

        const existingTS = await knex('time_sheets')
            .where(function () {
                this.where('employee_id', emp_id)
                    .andWhere('client_id', clientId)
                    .andWhere('service_id', serviceId)
                    .andWhere('date', date);
            })
            .where('status', '0')
            .first();

        if (existingTS) {
            logger.error("Duplicates in Time-Sheet Entry", {
                username: user_name,
                reqdetails: "task-addTimesheet",
            });
            return res.status(500).json({
                message: "Duplicates in Time-Sheet Entry for employee/client/service/date.",
                status: false,
            });
        }

        const insertTSResult = await knex('time_sheets').insert({
            employee_id: emp_id,
            employee: emp_name,
            client_id: clientId,
            client: client,
            service_id: serviceId,
            service: serviceName,
            date: date,
            total_minutes: totalMinutes,
            description: description
        });

        if (insertTSResult) {
            logger.info("Time-Sheet inserted successfully", {
                username: user_name,
                reqdetails: "task-addTimesheet",
            });
            return res.status(200).json({
                message: "Time-Sheet inserted successfully",
                status: true,
            });
        } else {
            logger.error("Failed to insert Time-Sheet", {
                username: user_name,
                reqdetails: "task-addTimesheet",
            });
            return res.status(500).json({
                message: "Failed to insert Time-Sheet",
                status: false,
            });
        }
    } catch (error) {
        console.error("Error inserting Time-Sheet:", error);
        next(error);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};

export const deleteTimesheet = async (req, res, next) => {
    let knex = null;
    try {
        const { id } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Delete Time-Sheet Status Request Received", {
            username: user_name,
            reqdetails: "task-deleteTimesheet",
        });

        if (!id) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "task-deleteTimesheet",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        knex = await createKnexInstance(dbname);

        const updateTicketResult = await knex('time_sheets').update({ "status": "1" }).where({ time_sheet_id: id });

        if (updateTicketResult) {
            logger.info("Time-Sheet Status deleted successfully", {
                username: user_name,
                reqdetails: "task-deleteTimesheet",
            });
            return res.status(200).json({
                message: "Time-Sheet Status deleted successfully",
                status: true,
            });
        } else {
            logger.error("Failed to delete Time-Sheet Status", {
                username: user_name,
                reqdetails: "task-deleteTimesheet",
            });
            return res.status(500).json({
                message: "Failed to delete Time-Sheet Status",
                status: false,
            });
        }
    } catch (error) {
        console.error("Error deleting Time-Sheet Status:", error);
        next(error);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};