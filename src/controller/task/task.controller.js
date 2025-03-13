import createKnexInstance from "../../../configs/db.js";
import { logger } from "../../../configs/winston.js";

export const getTasksByType = async (req, res, next) => {
    let knex = null;
    try {
        const { showType, client_id, employee_id } = req.body;
        const { dbname, user_name } = req.user;

        const statusMap = {
            'ALL': null,
            'PENDING': '0',
            'INPROCESS': '1',
            'COMPLETED': '2'
        };

        logger.info("Get Task List Request Received", {
            username: user_name,
            reqdetails: "task-getTasks",
        });

        if (!showType) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "task-getTasks",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        knex = await createKnexInstance(dbname);

        let query = knex('tasks')
            .select('tasks.*')
            .orderByRaw("FIELD(tasks.priority, 'Critical', 'High', 'Medium', 'Low')");

        if (statusMap[showType] !== null && statusMap[showType] !== undefined) {
            query = query.where('tasks.status', statusMap[showType]);
        } else {
            query = query.whereIn('tasks.status', ['0', '1', '2']);
        }

        if (client_id) {
            query = query.where('tasks.client_id', client_id);
        }

        if (employee_id) {
            query = query
                .join('employee_task_mapping', 'tasks.task_id', 'employee_task_mapping.task_id')
                .where('employee_task_mapping.employee_id', employee_id)
                .distinct('tasks.task_id');
        }

        const getTaskRes = await query;


        for (const task of getTaskRes) {
            const mappedData = await knex("employee_task_mapping")
                .select("employee_id")
                .where({ task_id: task.task_id });

            task["assigned_to"] = mappedData.map(data => data.employee_id);
        }

        if (getTaskRes) {
            logger.info("Tasks List retrieved successfully", {
                username: user_name,
                reqdetails: "task-getTasks",
            });
            return res.status(200).json({
                message: "Tasks List retrieved successfully",
                data: getTaskRes,
                status: true,
            });
        } else {
            logger.warn("No Tasks Details found", {
                username: user_name,
                reqdetails: "task-getTasks",
            });
            return res.status(404).json({
                message: "No Tasks Details found",
                status: false,
            });
        }
    } catch (err) {
        logger.error("Error fetching Tasks List", {
            error: err.message,
            username: req.user?.user_name,
            reqdetails: "task-getTasks",
        });
        next(err);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};

export const addTask = async (req, res, next) => {
    let knex = null;
    try {
        const { client, name, service, assignTo, assignDate, dueDate, priority } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Add Task Request Received", {
            username: user_name,
            reqdetails: "task-addTask",
        });

        if (!client || !name || !priority || !assignTo) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "task-addTask",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        knex = await createKnexInstance(dbname);

        const insertTaskResult = await knex('tasks').insert({
            client_id: client,
            task_name: name,
            service: service,
            assigned_date: assignDate,
            due_date: dueDate,
            priority: priority
        });

        if (insertTaskResult) {
            logger.info("Task inserted successfully", {
                username: user_name,
                reqdetails: "task-addTask",
            });

            const insertMapData = assignTo.map(data => ({
                employee_id: data,
                task_id: insertTaskResult[0]
            }));

            const mapRes = await knex("employee_task_mapping").insert(insertMapData);
            if (mapRes) {
                logger.info("Task inserted successfully", {
                    username: user_name,
                    reqdetails: "task-addTask",
                });
                return res.status(200).json({
                    message: "Task inserted successfully",
                    status: true,
                });
            } else {
                logger.error("Failed to insert Task Mapping", {
                    username: user_name,
                    reqdetails: "task-addTask",
                });
                return res.status(500).json({
                    message: "Failed to insert Task Mapping",
                    status: false,
                });
            }
        } else {
            logger.error("Failed to insert Task", {
                username: user_name,
                reqdetails: "task-addTask",
            });
            return res.status(500).json({
                message: "Failed to insert Task",
                status: false,
            });
        }
    } catch (error) {
        console.error("Error inserting Task:", error);
        next(error);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};

export const editTask = async (req, res, next) => {
    let knex = null;
    try {
        const { key, value, id } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Update Task Request Received", {
            username: user_name,
            reqdetails: "task-editTask",
        });

        if (!id || !key || !value) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "task-editTask",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        knex = await createKnexInstance(dbname);
        let updateTaskResult;

        if (key == "assigned_to") {
            //need to change
            // updateTaskResult = await knex('tasks').update({ [key]: knex.raw('?', [JSON.stringify(value)]) }).where({ task_id: id });
            const existingMappings = await knex("employee_task_mapping")
                .select("employee_id")
                .where({ task_id: id });

            const existingEmployeeIds = existingMappings.map(row => row.employee_id);

            const employeesToInsert = value.filter(empId => !existingEmployeeIds.includes(empId));

            const employeesToUpdate = existingEmployeeIds.filter(empId => !value.includes(empId));

            if (employeesToInsert.length > 0) {
                const insertData = employeesToInsert.map(empId => ({
                    task_id: id,
                    employee_id: empId,
                }));

                await knex("employee_task_mapping").insert(insertData);
            }

            if (employeesToUpdate.length > 0) {
                await knex("employee_task_mapping")
                    .where({ task_id: id })
                    .whereIn("employee_id", employeesToUpdate)
                    .update({ status: "1" });
            }
            updateTaskResult = [];
        } else {
            updateTaskResult = await knex('tasks').update({ [key]: value }).where({ task_id: id });
        }

        if (updateTaskResult) {
            logger.info("Task updated successfully", {
                username: user_name,
                reqdetails: "task-editTask",
            });
            return res.status(200).json({
                message: "Task updated successfully",
                status: true,
            });
        } else {
            logger.error("Failed to update Task", {
                username: user_name,
                reqdetails: "task-editTask",
            });
            return res.status(500).json({
                message: "Failed to update Task",
                status: false,
            });
        }
    } catch (error) {
        console.error("Error updating Task:", error);
        next(error);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};

export const taskStatusUpdate = async (req, res, next) => {
    let knex = null;
    try {
        const { id, status } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Update Task Status Request Received", {
            username: user_name,
            reqdetails: "task-updateTaskStatus",
        });

        if (!id || !status) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "task-updateTaskStatus",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        knex = await createKnexInstance(dbname);

        const updateTaskResult = await knex('tasks').update({ "status": status }).where({ task_id: id });

        if (updateTaskResult) {
            logger.info("Task Status updated successfully", {
                username: user_name,
                reqdetails: "task-updateTaskStatus",
            });
            return res.status(200).json({
                message: "Task Status updated successfully",
                status: true,
            });
        } else {
            logger.error("Failed to update Task Status", {
                username: user_name,
                reqdetails: "task-updateTaskStatus",
            });
            return res.status(500).json({
                message: "Failed to update Task Status",
                status: false,
            });
        }
    } catch (error) {
        console.error("Error updating Task Status:", error);
        next(error);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};

export const deleteTask = async (req, res, next) => {
    let knex = null;
    try {
        const { id } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Delete Task Status Request Received", {
            username: user_name,
            reqdetails: "task-deleteTask",
        });

        if (!id) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "task-deleteTask",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        knex = await createKnexInstance(dbname);

        const updateTaskResult = await knex('tasks').update({ "status": "3" }).where({ task_id: id });

        if (updateTaskResult) {
            logger.info("Task Status deleted successfully", {
                username: user_name,
                reqdetails: "task-deleteTask",
            });
            return res.status(200).json({
                message: "Task Status deleted successfully",
                status: true,
            });
        } else {
            logger.error("Failed to delete Task Status", {
                username: user_name,
                reqdetails: "task-deleteTask",
            });
            return res.status(500).json({
                message: "Failed to delete Task Status",
                status: false,
            });
        }
    } catch (error) {
        console.error("Error deleting Task Status:", error);
        next(error);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};