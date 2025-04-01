import createKnexInstance from "../../../configs/db.js";
import { logger } from "../../../configs/winston.js";
import moment from 'moment';

export const getLeaveList = async (req, res, next) => {
    let knex = null;
    try {
        const { dbname, user_name } = req.user;

        logger.info("Get Leave Requests List Request Received", {
            username: user_name,
            reqdetails: "leaveRequest-getLeaveList",
        });

        knex = await createKnexInstance(dbname);

        const getResult = await knex('leave_requests').select("*", knex.raw("DATE_FORMAT(start_date, '%Y-%m-%d') as start_date"), knex.raw("DATE_FORMAT(end_date, '%Y-%m-%d') as end_date")).whereNot("status", "Deleted");

        if (getResult) {
            logger.info("Leave Requests List retrieved successfully", {
                username: user_name,
                reqdetails: "leaveRequest-getLeaveList",
            });
            return res.status(200).json({
                message: "Leave Requests List retrieved successfully",
                data: getResult,
                status: true,
            });
        } else {
            logger.warn("No Leave Requests Details found", {
                username: user_name,
                reqdetails: "leaveRequest-getLeaveList",
            });
            return res.status(404).json({
                message: "No Leave Requests Details found",
                status: false,
            });
        }
    } catch (err) {
        logger.error("Error fetching Leave Requests List", {
            error: err.message,
            username: req.user?.user_name,
            reqdetails: "leaveRequest-getLeaveList",
        });
        next(err);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};

export const addLeave = async (req, res, next) => {
    let knex = null;
    try {
        const { emp_id, leave_type, start_date, end_date, reason } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Add Leave Request Request Received", {
            username: user_name,
            reqdetails: "leaveRequest-addLeave",
        });

        if (!emp_id || !leave_type || !start_date || !end_date || !reason || reason.trim() == "") {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "leaveRequest-addLeave",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        knex = await createKnexInstance(dbname);

        const existingRequest = await knex('leave_requests')
            .where(function () {
                this.where('employee_id', emp_id)
                    .andWhere('leave_type', leave_type)
                    .andWhere('start_date', start_date)
                    .andWhere('end_date', end_date);
            })
            .first();

        if (existingRequest) {
            logger.error("Duplicates in Leave Request Entry", {
                username: user_name,
                reqdetails: "leaveRequest-addLeave",
            });
            return res.status(500).json({
                message: "Duplicates in Leave Request Entry",
                status: false,
            });
        }

        const startDate = moment("2025-04-06", "YYYY-MM-DD");
        const endDate = moment("2025-04-10", "YYYY-MM-DD");

        const leaveDays = endDate.diff(startDate, 'days') + 1;

        const insertResult = await knex('leave_requests').insert({
            employee_id: emp_id,
            leave_type: leave_type,
            start_date: start_date,
            end_date: end_date,
            total_days: leaveDays,
            reason: reason
        });

        if (insertResult) {
            logger.info("Leave Request inserted successfully", {
                username: user_name,
                reqdetails: "leaveRequest-addLeave",
            });
            return res.status(200).json({
                message: "Leave Request inserted successfully",
                status: true,
            });
        } else {
            logger.error("Failed to insert Leave Request", {
                username: user_name,
                reqdetails: "leaveRequest-addLeave",
            });
            return res.status(500).json({
                message: "Failed to insert Leave Request",
                status: false,
            });
        }
    } catch (error) {
        console.error("Error inserting Leave Request:", error);
        next(error);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};

export const updateLeave = async (req, res, next) => {
    let knex = null;
    try {
        const { leave_id, leave_type, start_date, end_date, reason } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Update Leave Request Received", {
            username: user_name,
            reqdetails: "leaveRequest-updateLeave",
        });

        if (!leave_id || !leave_type || !start_date || !end_date || !reason || reason.trim() == "") {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "leaveRequest-updateLeave",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        knex = await createKnexInstance(dbname);

        const startDate = new Date("2025-04-06");
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date("2025-04-10");
        endDate.setHours(0, 0, 0, 0);

        const leaveDays = (endDate - startDate) / (1000 * 60 * 60 * 24) + 1;

        const updateResult = await knex("leave_requests").update({
            leave_type: leave_type,
            start_date: start_date,
            end_date: end_date,
            total_days: leaveDays,
            reason: reason
        }).where("leave_id", leave_id);

        if (updateResult) {
            logger.info("Leave Request Updated successfully", {
                username: user_name,
                reqdetails: "leaveRequest-updateLeave",
            });
            return res.status(200).json({
                message: "Leave Request Updated successfully",
                status: true,
            });
        } else {
            logger.error("Failed to Update Leave Request", {
                username: user_name,
                reqdetails: "leaveRequest-updateLeave",
            });
            return res.status(500).json({
                message: "Failed to Update Leave Request",
                status: false,
            });
        }
    } catch (error) {
        console.error("Error Updating Leave Request:", error);
        next(error);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};

export const deleteLeave = async (req, res, next) => {
    let knex = null;
    try {
        const { leave_id } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Delete Leave Request Received", {
            username: user_name,
            reqdetails: "leaveRequest-deleteLeave",
        });

        if (!leave_id) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "leaveRequest-deleteLeave",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        knex = await createKnexInstance(dbname);

        const deleteResult = await knex('leave_requests').update("status", "Deleted").where("leave_id", leave_id);

        if (deleteResult) {
            logger.info("Leave Request Deleted successfully", {
                username: user_name,
                reqdetails: "leaveRequest-deleteLeave",
            });
            return res.status(200).json({
                message: "Leave Request Deleted successfully",
                status: true,
            });
        } else {
            logger.error("Failed to Delete Leave Request", {
                username: user_name,
                reqdetails: "leaveRequest-deleteLeave",
            });
            return res.status(500).json({
                message: "Failed to Delete Leave Request",
                status: false,
            });
        }
    } catch (error) {
        console.error("Error Deleting Leave Request:", error);
        next(error);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};

export const updateLeaveStatus = async (req, res, next) => {
    let knex = null;
    try {
        const { leave_id, status, emp_id } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Update Leave Status Request Received", {
            username: user_name,
            reqdetails: "leaveRequest-updateLeaveStatus",
        });

        if (!leave_id || !status || !['Approved', 'Rejected'].includes(status) || !emp_id) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "leaveRequest-updateLeaveStatus",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        knex = await createKnexInstance(dbname);

        const updateResult = await knex("leave_requests").update({
            status: status,
            approved_by: emp_id,
            approved_at: knex.fn.now()
        }).where("leave_id", leave_id);

        if (updateResult) {
            logger.info("Leave Request Status Updated successfully", {
                username: user_name,
                reqdetails: "leaveRequest-updateLeaveStatus",
            });
            return res.status(200).json({
                message: "Leave Request Status Updated successfully",
                status: true,
            });
        } else {
            logger.error("Failed to Update Leave Request Status", {
                username: user_name,
                reqdetails: "leaveRequest-updateLeaveStatus",
            });
            return res.status(500).json({
                message: "Failed to Update Leave Request Status",
                status: false,
            });
        }
    } catch (error) {
        console.error("Error Updating Leave Request Status:", error);
        next(error);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};