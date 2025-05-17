import createKnexInstance from "../../../configs/db.js";
import { logger } from "../../../configs/winston.js";

export const getTasksByType = async (req, res, next) => {
    let knex = null;
    try {
        const { showType, client_id, employee_id } = req.body;
        const { dbname, user_name } = req.user;

        const statusMap = {
            "all": null,
            "pending": '0',
            "inprocess": '1',
            "completed": '2'
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
            .select('tasks.*', knex.raw("DATE_FORMAT(assigned_date, '%Y-%m-%d') as assigned_date"), knex.raw("DATE_FORMAT(duedate, '%Y-%m-%d') as due_date"))
            .orderByRaw("FIELD(tasks.priority, 'Critical', 'High', 'Medium', 'Low')");

        if (statusMap[showType] !== null && statusMap[showType] !== undefined) {
            query = query.where('tasks.status', statusMap[showType]);
        } else {
            query = query.whereIn('tasks.status', ['0', '1', '2']);
        }

        if (client_id && client_id.toString().toLowerCase() != "all") {
            query = query.where('tasks.client_id', client_id);
        }

        if (employee_id && employee_id.toString().toLowerCase() != "all") {
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

            task["assigned_to"] = await Promise.all(
                mappedData.map(async (data) => {
                    const employee = await knex("employees")
                        .select("name", "photo")
                        .where({ employee_id: data.employee_id })
                        .first();

                    return { emp_id: data.employee_id, emp_name: employee?.name, photo: employee?.photo || null };
                })
            );

            const client = await knex("clients")
                .select("client_name")
                .where({ client_id: task.client_id }).first();
            task["client_name"] = client?.client_name || null;
            const service = await knex("services")
                .select("service_name")
                .where({ service_id: task.service }).first();
            task["service_name"] = service?.service_name || null;

            task["status_name"] = task.status == "0" ? "Pending" : task.status == "1" ? "In-progress" : "Completed";
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

export const getTasksByPriority = async (req, res, next) => {
    let knex = null;
    try {
        const { dbname, user_name } = req.user;

        logger.info("Get Task List Request Received", {
            username: user_name,
            reqdetails: "task-getTasks",
        });

        knex = await createKnexInstance(dbname);

        let getTaskRes = await knex('tasks')
            .select('*', knex.raw("DATE_FORMAT(assigned_date, '%Y-%m-%d') as assigned_date"), knex.raw("DATE_FORMAT(due_date, '%Y-%m-%d') as due_date"))
            // .where('due_date', '>', new Date())
            .whereRaw("DATE(CONVERT_TZ(due_date, '+00:00', '+05:30')) >= DATE(CONVERT_TZ(NOW(), '+00:00', '+00:00'))")
            .orderByRaw("FIELD(priority, 'Critical', 'High', 'Medium', 'Low')")
            .orderBy('due_date', 'asc')
            .limit(5);

        for (const task of getTaskRes) {
            const mappedData = await knex("employee_task_mapping")
                .select("employee_id")
                .where({ task_id: task.task_id });

            task["assigned_to"] = await Promise.all(
                mappedData.map(async (data) => {
                    const employee = await knex("employees")
                        .select("name", "photo")
                        .where({ employee_id: data.employee_id })
                        .first();

                    return { emp_id: data.employee_id, emp_name: employee?.name, photo: employee?.photo || null };
                })
            );

            const client = await knex("clients")
                .select("client_name")
                .where({ client_id: task.client_id }).first();
            task["client_name"] = client?.client_name || null;
            const service = await knex("services")
                .select("service_name")
                .where({ service_id: task.service }).first();
            task["service_name"] = service?.service_name || null;

            task["status_name"] = task.status == "0" ? "Pending" : task.status == "1" ? "In-progress" : "Completed";

            const tsData = await knex("time_sheets").select("*").where({ "task_id": task.task_id });
            let totalMinutes = 0;
            tsData.map(data => {
                totalMinutes += data.total_minutes;
            });
            task["total_minutes"] = totalMinutes;
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

export const getServicesForTask = async (req, res, next) => {
    let knex = null;
    try {
        const { client_id } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Get Services List Request Received", {
            username: user_name,
            reqdetails: "task-getServicesForTask",
        });

        if (!client_id) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "task-getServicesForTask",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        knex = await createKnexInstance(dbname);

        const getServiceResult = await knex('services')
            .select('service_id', 'service_name', 'service_short_name')
            .where('status', '0')
            .whereNotExists(function () {
                this.select('*')
                    .from('tasks')
                    .whereRaw('tasks.service = services.service_id')
                    .where('tasks.client_id', client_id)
                    .whereNotIn('tasks.status', ['2', '3']);
            });

        if (getServiceResult) {
            logger.info("Services List retrieved successfully", {
                username: user_name,
                reqdetails: "task-getServicesForTask",
            });
            return res.status(200).json({
                message: "Services List retrieved successfully",
                data: getServiceResult,
                status: true,
            });
        } else {
            logger.warn("No Services Details found", {
                username: user_name,
                reqdetails: "task-getServicesForTask",
            });
            return res.status(404).json({
                message: "No Services Details found",
                status: false,
            });
        }
    } catch (err) {
        logger.error("Error fetching Services List", {
            error: err.message,
            username: req.user?.user_name,
            reqdetails: "task-getServicesForTask",
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
        const { client, name, service, assignTo, assignDate, dueDate, priority, description } = req.body;
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

        const existingTask = await knex('tasks')
            .where(function () {
                this.where('client_id', client)
                    .andWhere('service', service)
            })
            .andWhere('status', '0')
            .first();

        if (existingTask) {
            logger.error("Duplicates in Task Entry", {
                username: user_name,
                reqdetails: "task-addTask",
            });
            return res.status(500).json({
                message: "Duplicates in Task Entry",
                status: false,
            });
        }

        let startDate = assignDate.includes("T") ? assignDate.split("T")[0] : assignDate;
        let endDate = dueDate.includes("T") ? dueDate.split("T")[0] : dueDate;

        const insertTaskResult = await knex('tasks').insert({
            client_id: client,
            task_name: name,
            service: service,
            assigned_date: startDate,
            due_date: endDate,
            priority: priority,
            description: description
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
        const { task_id, task_name, assignTo, assignDate, dueDate, priority, description, status } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Update Task Request Received", {
            username: user_name,
            reqdetails: "task-editTask",
        });

        if (!task_id) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "task-editTask",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        let startDate = assignDate.includes("T") ? assignDate.split("T")[0] : assignDate;
        let endDate = dueDate.includes("T") ? dueDate.split("T")[0] : dueDate;

        knex = await createKnexInstance(dbname);
        const updateTaskResult = await knex('tasks').update({
            task_name: task_name,
            assigned_date: startDate,
            due_date: endDate,
            priority: priority,
            description: description,
            status: status
        }).where({ task_id: task_id });

        const existingMappings = await knex("employee_task_mapping")
            .select("employee_id")
            .where({ task_id: task_id, status: "0" });

        const existingEmployeeIds = existingMappings.map(row => row.employee_id);

        const employeesToInsert = assignTo.filter(empId => !existingEmployeeIds.includes(empId));

        const employeesToUpdate = existingEmployeeIds.filter(empId => !assignTo.includes(empId));

        if (employeesToInsert.length > 0) {
            const insertData = employeesToInsert.map(empId => ({
                task_id: task_id,
                employee_id: empId,
            }));

            await knex("employee_task_mapping").insert(insertData);
        }

        if (employeesToUpdate.length > 0) {
            await knex("employee_task_mapping")
                .where({ task_id: task_id })
                .whereIn("employee_id", employeesToUpdate)
                .update({ status: "1" });
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

export const getViewTasks = async (req, res, next) => {
    let knex = null;
    try {
        const { client_id, service_id, emp_id, priority, status } = req.body;
        const { dbname, user_name } = req.user;

        const statusMap = {
            "all": null,
            "pending": '0',
            "inprocess": '1',
            "completed": '2'
        };

        logger.info("Get View Task List Request Received", {
            username: user_name,
            reqdetails: "task-getViewTasks",
        });

        knex = await createKnexInstance(dbname);

        let query = knex('tasks').select("*", knex.raw("DATE_FORMAT(assigned_date, '%Y-%m-%d') as assigned_date"), knex.raw("DATE_FORMAT(due_date, '%Y-%m-%d') as due_date"));

        if (client_id && client_id.toString().toLowerCase() != "all") {
            query = query.where('tasks.client_id', client_id);
        }

        if (service_id && service_id.toString().toLowerCase() != "all") {
            query = query.where('tasks.service', service_id);
        }

        if (priority && priority.toString().toLowerCase() != "all") {
            query = query.where('tasks.priority', priority);
        }

        if (statusMap[status] !== null && statusMap[status] !== undefined) {
            query = query.where('tasks.status', statusMap[status]);
        } else {
            query = query.whereIn('tasks.status', ['0', '1', '2']);
        }

        let viewTaskResult = await query;

        if (emp_id && emp_id.toString().toLowerCase() != "all") {
            let filteredTasks = [];

            for (const task of viewTaskResult) {
                const mappedData = await knex("employee_task_mapping")
                    .select("employee_id")
                    .where({ task_id: task.task_id });

                const mappedEmployeeIds = mappedData.map(data => (data.employee_id).toString());

                if (mappedEmployeeIds.includes((emp_id).toString())) {
                    task["assignTo"] = await Promise.all(
                        mappedData.map(async (data) => {
                            const employee = await knex("employees")
                                .select("name", "photo")
                                .where({ employee_id: emp_id })
                                .first();
    
                            return { emp_id: emp_id, emp_name: employee?.name, photo: employee?.photo || null };
                        })
                    );
                    filteredTasks.push(task);
                }
            }

            viewTaskResult = filteredTasks;
        } else {
            for (const task of viewTaskResult) {
                const mappedData = await knex("employee_task_mapping")
                    .select("employee_id")
                    .where({ task_id: task.task_id });

                task["assignTo"] = await Promise.all(
                    mappedData.map(async (data) => {
                        const employee = await knex("employees")
                            .select("name", "photo")
                            .where({ employee_id: data.employee_id })
                            .first();

                        return { emp_id: data.employee_id, emp_name: employee?.name, photo: employee?.photo || null };
                    })
                );
            }
        }

        for (const task of viewTaskResult) {
            if (emp_id && emp_id.toString().toLowerCase() != "all") {
                const employee = await knex("employees")
                    .select("name")
                    .where({ employee_id: task.assignTo[0]["emp_id"] }).first();
                task["assignTo"][0]["emp_name"] = employee?.name || null;
            }
            const client = await knex("clients")
                .select("client_name")
                .where({ client_id: task.client_id }).first();
            task["client_name"] = client?.client_name || null;
            const service = await knex("services")
                .select("service_name")
                .where({ service_id: task.service }).first();
            task["service_name"] = service?.service_name || null;

            task["status_name"] = task.status == "0" ? "Pending" : task.status == "1" ? "In-progress" : "Completed";

            const tsData = await knex("time_sheets")
                .select(
                    knex.raw("SUM(total_minutes) as total_minutes"),
                    knex.raw("SEC_TO_TIME(SUM(TIME_TO_SEC(total_time))) as total_time") // Sum of total_time
                )
                .where({ "task_id": task.task_id })
                .first();

            task["total_minutes"] = tsData.total_minutes || 0;
            task["total_time"] = tsData.total_time || "00:00:00";
        }

        if (viewTaskResult) {
            logger.info("View Task List Fetched Successfully", {
                username: user_name,
                reqdetails: "task-getViewTasks",
            });
            return res.status(200).json({
                message: "View Task List Fetched Successfully",
                status: true,
                data: viewTaskResult
            });
        } else {
            logger.error("Failed to fetch View Task List", {
                username: user_name,
                reqdetails: "task-getViewTasks",
            });
            return res.status(500).json({
                message: "Failed to fetch View Task List",
                status: false,
            });
        }
    } catch (error) {
        console.error("Error fetching View Task List:", error);
        next(error);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};

export const getLatestTasks = async (req, res, next) => {
    let knex = null;
    try {
        const { dbname, user_name } = req.user;

        logger.info("Get Task List Request Received", {
            username: user_name,
            reqdetails: "task-getLatestTasks",
        });

        knex = await createKnexInstance(dbname);

        let getTaskRes = await knex('tasks')
            .select('*', knex.raw("DATE_FORMAT(assigned_date, '%Y-%m-%d') as assigned_date"), knex.raw("DATE_FORMAT(due_date, '%Y-%m-%d') as due_date"))
            .orderBy('created_at', 'desc')
            .limit(5);

        for (const task of getTaskRes) {
            const mappedData = await knex("employee_task_mapping")
                .select("employee_id")
                .where({ task_id: task.task_id });

            task["assigned_to"] = await Promise.all(
                mappedData.map(async (data) => {
                    const employee = await knex("employees")
                        .select("name", "photo")
                        .where({ employee_id: data.employee_id })
                        .first();

                    return { emp_id: data.employee_id, emp_name: employee?.name, photo: employee?.photo || null };
                })
            );

            const client = await knex("clients")
                .select("client_name")
                .where({ client_id: task.client_id }).first();
            task["client_name"] = client?.client_name || null;
            const service = await knex("services")
                .select("service_name")
                .where({ service_id: task.service }).first();
            task["service_name"] = service?.service_name || null;

            task["status_name"] = task.status == "0" ? "Pending" : task.status == "1" ? "In-progress" : "Completed";

            const tsData = await knex("time_sheets").select("*").where({ "task_id": task.task_id });
            let totalMinutes = 0;
            tsData.map(data => {
                totalMinutes += data.total_minutes;
            });
            task["total_minutes"] = totalMinutes;
        }
        if (getTaskRes) {
            logger.info("Tasks List retrieved successfully", {
                username: user_name,
                reqdetails: "task-getLatestTasks",
            });
            return res.status(200).json({
                message: "Tasks List retrieved successfully",
                data: getTaskRes,
                status: true,
            });
        } else {
            logger.warn("No Tasks Details found", {
                username: user_name,
                reqdetails: "task-getLatestTasks",
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
            reqdetails: "task-getLatestTasks",
        });
        next(err);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};