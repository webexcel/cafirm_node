import createKnexInstance from "../../../configs/db.js";
import { logger } from "../../../configs/winston.js";

export const getAllEmployeeRecords = async (req, res, next) => {
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

        logger.info("Get Records List Request Received", {
            username: user_name,
            reqdetails: "task-getAllEmployeeRecords",
        });

        if (!showType) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "task-getAllEmployeeRecords",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        knex = await createKnexInstance(dbname);

        let query = knex('employee_monitor').select('*');

        if (statusMap[showType] !== null) {
            query = query.where('status', statusMap[showType]);
        } else {
            query = query.whereIn('status', ['0', '1', '2']);
        }

        const getTaskRes = await query;
        getTaskRes.forEach(task => {
            if (typeof task.assigned_to === 'string') {
                try {
                    task.assigned_to = JSON.parse(task.assigned_to);
                } catch (error) {
                    console.error("Invalid JSON:", task.assigned_to);
                }
            }
        });

        if (getTaskRes) {
            logger.info("Records List retrieved successfully", {
                username: user_name,
                reqdetails: "task-getAllEmployeeRecords",
            });
            return res.status(200).json({
                message: "Records List retrieved successfully",
                data: getTaskRes,
                status: true,
            });
        } else {
            logger.warn("No Records Details found", {
                username: user_name,
                reqdetails: "task-getAllEmployeeRecords",
            });
            return res.status(404).json({
                message: "No Records Details found",
                status: false,
            });
        }
    } catch (err) {
        logger.error("Error fetching Records List", {
            error: err.message,
            username: req.user?.user_name,
            reqdetails: "task-getAllEmployeeRecords",
        });
        next(err);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};

export const addRecord = async (req, res, next) => {
    let knex = null;
    try {
        const { task_name, emp_id, emp_name, client_id, client_name, service_id, service_name, description, assignTo, assignDate, dueDate, priority } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Add Record Request Received", {
            username: user_name,
            reqdetails: "task-addRecord",
        });

        if (!task_name || task_name.trim() === "" || !emp_id || !client_id || !service_id || !priority || !assignTo) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "task-addRecord",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        knex = await createKnexInstance(dbname);

        const insertData = assignTo.map(assign => ({
            task_name: task_name,
            employee_id: emp_id,
            employee_name: emp_name,
            client_id: client_id,
            client_name: client_name,
            service_id: service_id,
            service_name: service_name,
            description: description,
            assigned_to: assign,
            assigned_date: assignDate,
            due_date: dueDate,
            priority: priority
        }));

        const insertTaskResult = await knex('employee_monitor').insert(insertData);

        if (insertTaskResult) {
            logger.info("Record inserted successfully", {
                username: user_name,
                reqdetails: "task-addRecord",
            });
            return res.status(200).json({
                message: "Record inserted successfully",
                status: true,
            });
        } else {
            logger.error("Failed to insert Record", {
                username: user_name,
                reqdetails: "task-addRecord",
            });
            return res.status(500).json({
                message: "Failed to insert Record",
                status: false,
            });
        }
    } catch (error) {
        console.error("Error inserting Record:", error);
        next(error);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};

export const statusUpdate = async (req, res, next) => {
    let knex = null;
    try {
        const { id, status } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Update Record Status Request Received", {
            username: user_name,
            reqdetails: "task-statusUpdate",
        });

        if (!id || !status) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "task-statusUpdate",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        knex = await createKnexInstance(dbname);

        const updateTaskResult = await knex('employee_monitor').update({ "status": status }).where({ monitor_id: id });

        if (updateTaskResult) {
            logger.info("Record Status updated successfully", {
                username: user_name,
                reqdetails: "task-statusUpdate",
            });
            return res.status(200).json({
                message: "Record Status updated successfully",
                status: true,
            });
        } else {
            logger.error("Failed to update Record Status", {
                username: user_name,
                reqdetails: "task-statusUpdate",
            });
            return res.status(500).json({
                message: "Failed to update Record Status",
                status: false,
            });
        }
    } catch (error) {
        console.error("Error updating Record Status:", error);
        next(error);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};

export const deleteRecord = async (req, res, next) => {
    let knex = null;
    try {
        const { id } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Delete Record Request Received", {
            username: user_name,
            reqdetails: "task-deleteRecord",
        });

        if (!id) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "task-deleteRecord",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        knex = await createKnexInstance(dbname);

        const updateTaskResult = await knex('employee_monitor').update({ "status": "3" }).where({ monitor_id: id });

        if (updateTaskResult) {
            logger.info("Record deleted successfully", {
                username: user_name,
                reqdetails: "task-deleteRecord",
            });
            return res.status(200).json({
                message: "Record deleted successfully",
                status: true,
            });
        } else {
            logger.error("Failed to delete Record", {
                username: user_name,
                reqdetails: "task-deleteRecord",
            });
            return res.status(500).json({
                message: "Failed to delete Record",
                status: false,
            });
        }
    } catch (error) {
        console.error("Error deleting Record:", error);
        next(error);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};