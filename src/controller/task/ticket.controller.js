import createKnexInstance from "../../../configs/db.js";
import { logger } from "../../../configs/winston.js";

export const getTicketsByType = async (req, res, next) => {
    let knex = null;
    try {
        const { showType } = req.body;
        const { dbname, user_name } = req.user;

        const statusMap = {
            'ALL': null,
            'PENDING': '0',
            'INPROCESS': '1',
            'COMPLETED': '2'
        };

        logger.info("Get Tickets List Request Received", {
            username: user_name,
            reqdetails: "task-getTickets",
        });

        if (!showType) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "task-getTickets",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        knex = await createKnexInstance(dbname);

        let query = knex('tickets').select('*');

        if (statusMap[showType] !== null) {
            query = query.where('status', statusMap[showType]);
        } else {
            query = query.whereIn('status', ['0', '1', '2']);
        }

        const getTaskRes = await query;

        if (getTaskRes) {
            logger.info("Tickets List retrieved successfully", {
                username: user_name,
                reqdetails: "task-getTickets",
            });
            return res.status(200).json({
                message: "Tickets List retrieved successfully",
                data: getTaskRes,
                status: true,
            });
        } else {
            logger.warn("No Tickets Details found", {
                username: user_name,
                reqdetails: "task-getTickets",
            });
            return res.status(404).json({
                message: "No Tickets Details found",
                status: false,
            });
        }
    } catch (err) {
        logger.error("Error fetching Tickets List", {
            error: err.message,
            username: req.user?.user_name,
            reqdetails: "task-getTickets",
        });
        next(err);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};

export const addTicket = async (req, res, next) => {
    let knex = null;
    try {
        const { name, service, assignTo, assignDate, dueDate, priority } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Add Ticket Request Received", {
            username: user_name,
            reqdetails: "task-addTicket",
        });

        if (!name || !priority || !assignTo) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "task-addTicket",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        knex = await createKnexInstance(dbname);

        const existingTicket = await knex('tickets')
            .where(function () {
                this.where('ticket_name', name)
                    .orWhere('assigned_to', assignTo);
            })
            .whereIn('status', ['0', '1', '2'])
            .first();

        if (existingTicket) {
            logger.error("Duplicates in Ticket Entry", {
                username: user_name,
                reqdetails: "task-addTicket",
            });
            return res.status(500).json({
                message: "Duplicates in Ticket Entry for Ticket Name/Assigned To.",
                status: false,
            });
        }

        const insertTicketResult = await await knex('tickets').insert({
            ticket_name: name,
            service: service,
            assigned_to: assignTo,
            assigned_date: assignDate,
            due_date: dueDate,
            priority: priority
        });

        if (insertTicketResult) {
            logger.info("Ticket inserted successfully", {
                username: user_name,
                reqdetails: "task-addTicket",
            });
            return res.status(200).json({
                message: "Ticket inserted successfully",
                status: true,
            });
        } else {
            logger.error("Failed to insert Ticket", {
                username: user_name,
                reqdetails: "task-addTicket",
            });
            return res.status(500).json({
                message: "Failed to insert Ticket",
                status: false,
            });
        }
    } catch (error) {
        console.error("Error inserting Ticket:", error);
        next(error);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};

export const editTicket = async (req, res, next) => {
    let knex = null;
    try {
        const { key, value, id } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Update Ticket Request Received", {
            username: user_name,
            reqdetails: "task-editTicket",
        });

        if (!id || !key || !value) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "task-editTicket",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        knex = await createKnexInstance(dbname);

        const updateTicketResult = await await knex('tickets').update({ [key]: value }).where({ ticket_id: id });

        if (updateTicketResult) {
            logger.info("Ticket updated successfully", {
                username: user_name,
                reqdetails: "task-editTicket",
            });
            return res.status(200).json({
                message: "Ticket updated successfully",
                status: true,
            });
        } else {
            logger.error("Failed to update Ticket", {
                username: user_name,
                reqdetails: "task-editTicket",
            });
            return res.status(500).json({
                message: "Failed to update Ticket",
                status: false,
            });
        }
    } catch (error) {
        console.error("Error updating Ticket:", error);
        next(error);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};

export const ticketStatusUpdate = async (req, res, next) => {
    let knex = null;
    try {
        const { id, status } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Update Ticket Status Request Received", {
            username: user_name,
            reqdetails: "task-updateTicketStatus",
        });

        if (!id || !status) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "task-updateTicketStatus",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        knex = await createKnexInstance(dbname);

        const updateTicketResult = await await knex('tickets').update({ "status": status }).where({ ticket_id: id });

        if (updateTicketResult) {
            logger.info("Ticket Status updated successfully", {
                username: user_name,
                reqdetails: "task-updateTicketStatus",
            });
            return res.status(200).json({
                message: "Ticket Status updated successfully",
                status: true,
            });
        } else {
            logger.error("Failed to update Ticket Status", {
                username: user_name,
                reqdetails: "task-updateTicketStatus",
            });
            return res.status(500).json({
                message: "Failed to update Ticket Status",
                status: false,
            });
        }
    } catch (error) {
        console.error("Error updating Ticket Status:", error);
        next(error);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};

export const deleteTicket = async (req, res, next) => {
    let knex = null;
    try {
        const { id } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Delete Ticket Status Request Received", {
            username: user_name,
            reqdetails: "task-deleteTicket",
        });

        if (!id) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "task-deleteTicket",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        knex = await createKnexInstance(dbname);

        const updateTicketResult = await await knex('tickets').update({ "status": "3" }).where({ ticket_id: id });

        if (updateTicketResult) {
            logger.info("Ticket Status deleted successfully", {
                username: user_name,
                reqdetails: "task-deleteTicket",
            });
            return res.status(200).json({
                message: "Ticket Status deleted successfully",
                status: true,
            });
        } else {
            logger.error("Failed to delete Ticket Status", {
                username: user_name,
                reqdetails: "task-deleteTicket",
            });
            return res.status(500).json({
                message: "Failed to delete Ticket Status",
                status: false,
            });
        }
    } catch (error) {
        console.error("Error deleting Ticket Status:", error);
        next(error);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};