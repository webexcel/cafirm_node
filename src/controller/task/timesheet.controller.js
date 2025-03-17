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

        const getTSRes = await knex('time_sheets').select('*').where('status', '0');

        for (const task of getTSRes) {
            const employee = await knex("employees")
                .select("name")
                .where({ employee_id: task.employee_id }).first();
            task["employee_name"] = employee?.name || null;
            const client = await knex("clients")
                .select("client_name")
                .where({ client_id: task.client_id }).first();
            task["client_name"] = client?.client_name || null;
            const service = await knex("services")
                .select("service_name")
                .where({ service_id: task.service_id }).first();
            task["service_name"] = service?.service_name || null;
            const taskName = await knex("tasks")
                .select("task_name")
                .where({ task_id: task.task_id }).first();
            task["task_name"] = taskName?.task_name || null;
        }

        if (getTSRes) {
            logger.info("Time-Sheet List retrieved successfully", {
                username: user_name,
                reqdetails: "task-getTimesheet",
            });
            return res.status(200).json({
                message: "Time-Sheet List retrieved successfully",
                data: getTSRes,
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

export const getTimesheetLimited = async (req, res, next) => {
    let knex = null;
    try {
        const { dbname, user_name } = req.user;

        logger.info("Get Time-Sheet List Request Received", {
            username: user_name,
            reqdetails: "task-getTimesheetLimited",
        });

        knex = await createKnexInstance(dbname);

        const getTSRes = await knex('time_sheets').select('*').where('status', '0').orderBy('created_at', 'desc').limit(5);

        for (const task of getTSRes) {
            const employee = await knex("employees")
                .select("name")
                .where({ employee_id: task.employee_id }).first();
            task["employee_name"] = employee?.name || null;
            const client = await knex("clients")
                .select("client_name")
                .where({ client_id: task.client_id }).first();
            task["client_name"] = client?.client_name || null;
            const service = await knex("services")
                .select("service_name")
                .where({ service_id: task.service_id }).first();
            task["service_name"] = service?.service_name || null;
        }

        if (getTSRes) {
            logger.info("Time-Sheet List retrieved successfully", {
                username: user_name,
                reqdetails: "task-getTimesheetLimited",
            });
            return res.status(200).json({
                message: "Time-Sheet List retrieved successfully",
                data: getTSRes,
                status: true,
            });
        } else {
            logger.warn("No Time-Sheet Details found", {
                username: user_name,
                reqdetails: "task-getTimesheetLimited",
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
            reqdetails: "task-getTimesheetLimited",
        });
        next(err);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};

export const getService = async (req, res, next) => {
    let knex = null;
    try {
        const { dbname, user_name } = req.user;
        const { client_id } = req.body;

        logger.info("Get Time-Sheet Service List Request Received", {
            username: user_name,
            reqdetails: "task-getService",
        });

        knex = await createKnexInstance(dbname);

        let getTaskRes;

        if (client_id) {
            getTaskRes = await knex('tasks').select('*').where({ 'status': '0', 'client_id': client_id });
        } else {
            getTaskRes = await knex('tasks').select('*').where({ 'status': '0' });
        }

        const uniqueServices = [...new Set(getTaskRes.map(task => task.service))];

        const getTSRes = await knex('services').select('service_id', 'service_name', 'service_short_name').where({ 'status': '0' }).whereIn("service_id", uniqueServices);

        if (getTSRes) {
            logger.info("Time-Sheet Service List retrieved successfully", {
                username: user_name,
                reqdetails: "task-getService",
            });
            return res.status(200).json({
                message: "Time-Sheet Service List retrieved successfully",
                data: getTSRes,
                status: true,
            });
        } else {
            logger.warn("No Time-Sheet Service Details found", {
                username: user_name,
                reqdetails: "task-getService",
            });
            return res.status(404).json({
                message: "No Time-Sheet Service Details found",
                status: false,
            });
        }
    } catch (err) {
        logger.error("Error fetching Time-Sheet Service List", {
            error: err.message,
            username: req.user?.user_name,
            reqdetails: "task-getService",
        });
        next(err);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};

export const getemployee = async (req, res, next) => {
    let knex = null;
    try {
        const { dbname, user_name } = req.user;
        const { client_id, service_id } = req.body;

        logger.info("Get Time-Sheet Employee List Request Received", {
            username: user_name,
            reqdetails: "task-getemployee",
        });

        knex = await createKnexInstance(dbname);

        let query = knex('tasks').select('task_id', 'task_name').where({ 'status': '0' });

        if (client_id) {
            query = query.where({ 'client_id': client_id });
        }

        if (service_id) {
            query = query.where({ 'service': service_id });
        }

        const getTaskRes = await query;

        let allEmployeeIds = new Set();
        for (const task of getTaskRes) {
            const mappedEmployees = await knex("employee_task_mapping")
                .select("employee_id")
                .where({ task_id: task.task_id });

            mappedEmployees.forEach(emp => allEmployeeIds.add(emp.employee_id));
        }

        const empListRes = await knex("employees").select("employee_id", "name").whereIn("employee_id", Array.from(allEmployeeIds))

        if (empListRes) {
            logger.info("Time-Sheet Employee List retrieved successfully", {
                username: user_name,
                reqdetails: "task-getemployee",
            });
            return res.status(200).json({
                message: "Time-Sheet Employee List retrieved successfully",
                data: empListRes,
                status: true,
            });
        } else {
            logger.warn("No Time-Sheet Employee Details found", {
                username: user_name,
                reqdetails: "task-getemployee",
            });
            return res.status(404).json({
                message: "No Time-Sheet Employee Details found",
                status: false,
            });
        }
    } catch (err) {
        logger.error("Error fetching Time-Sheet Employee List", {
            error: err.message,
            username: req.user?.user_name,
            reqdetails: "task-getemployee",
        });
        next(err);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};

export const getTaskList = async (req, res, next) => {
    let knex = null;
    try {
        const { dbname, user_name } = req.user;
        const { client_id, service_id, emp_id } = req.body;

        logger.info("Get Time-Sheet Employee List Request Received", {
            username: user_name,
            reqdetails: "task-getemployee",
        });

        knex = await createKnexInstance(dbname);

        let query = knex('tasks').select('task_id', 'task_name').where({ 'status': '0' });

        if (client_id) {
            query = query.where({ 'client_id': client_id });
        }

        if (service_id) {
            query = query.where({ 'service': service_id });
        }

        const getTaskRes = await query;

        let allEmployeeIds = new Set();
        let filteredTasks = [];

        for (const task of getTaskRes) {
            const mappedEmployees = await knex("employee_task_mapping")
                .select("employee_id")
                .where({ task_id: task.task_id, status: '0' });

            const employeeIds = mappedEmployees.map(emp => emp.employee_id);
            if (employeeIds.includes(emp_id)) {
                filteredTasks.push(task);
            } else if (!emp_id) {
                filteredTasks.push(task);
            }

            employeeIds.forEach(id => allEmployeeIds.add(id));
        }

        if (filteredTasks) {
            logger.info("Time-Sheet Employee List retrieved successfully", {
                username: user_name,
                reqdetails: "task-getemployee",
            });
            return res.status(200).json({
                message: "Time-Sheet Employee List retrieved successfully",
                data: filteredTasks,
                status: true,
            });
        } else {
            logger.warn("No Time-Sheet Employee Details found", {
                username: user_name,
                reqdetails: "task-getemployee",
            });
            return res.status(404).json({
                message: "No Time-Sheet Employee Details found",
                status: false,
            });
        }
    } catch (err) {
        logger.error("Error fetching Time-Sheet Employee List", {
            error: err.message,
            username: req.user?.user_name,
            reqdetails: "task-getemployee",
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
        const { emp_id, task_id, date, totalMinutes, description } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Add Time-Sheet Request Received", {
            username: user_name,
            reqdetails: "task-addTimesheet",
        });

        if (!emp_id || !totalMinutes) {
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
                    // .andWhere('client_id', clientId)
                    // .andWhere('service_id', serviceId)
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
            // client_id: clientId,
            // service_id: serviceId,
            task_id: task_id,
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

export const editTimesheet = async (req, res, next) => {
    let knex = null;
    try {
        const { ts_id, date, totalMinutes, description } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Update Time-Sheet Request Received", {
            username: user_name,
            reqdetails: "task-editTimesheet",
        });

        if (!ts_id || !date || !totalMinutes) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "task-editTimesheet",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        knex = await createKnexInstance(dbname);

        const updateTSResult = await knex('time_sheets').update({
            date: date,
            total_minutes: totalMinutes,
            description: description
        }).where({ time_sheet_id: ts_id });

        if (updateTSResult) {
            logger.info("Time-Sheet updated successfully", {
                username: user_name,
                reqdetails: "task-editTimesheet",
            });
            return res.status(200).json({
                message: "Time-Sheet updated successfully",
                status: true,
            });
        } else {
            logger.error("Failed to update Time-Sheet", {
                username: user_name,
                reqdetails: "task-editTimesheet",
            });
            return res.status(500).json({
                message: "Failed to update Time-Sheet",
                status: false,
            });
        }
    } catch (error) {
        console.error("Error updating Time-Sheet:", error);
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

export const viewTimesheet = async (req, res, next) => {
    let knex = null;
    try {
        const { dbname, user_name } = req.user;
        const { emp_id, client_id, service_id, startdate, enddate } = req.body;

        logger.info("Get Time-Sheet List Request Received", {
            username: user_name,
            reqdetails: "task-getTimesheet",
        });

        knex = await createKnexInstance(dbname);

        let query = knex('time_sheets').select('*').where('status', '0').whereBetween('date', [startdate, enddate]);

        if (client_id && client_id != "All") {
            query = query.where('time_sheets.client_id', client_id);
        }

        if (service_id && service_id != "All") {
            query = query.where('time_sheets.service_id', service_id);
        }

        if (emp_id && emp_id != "All") {
            query = query.where('time_sheets.employee_id', emp_id);
        }

        const getTSRes = await query;

        for (const task of getTSRes) {
            const employee = await knex("employees")
                .select("name")
                .where({ employee_id: task.employee_id }).first();
            task["employee_name"] = employee?.name || null;
            const client = await knex("clients")
                .select("client_name")
                .where({ client_id: task.client_id }).first();
            task["client_name"] = client?.client_name || null;
            const service = await knex("services")
                .select("service_name")
                .where({ service_id: task.service_id }).first();
            task["service_name"] = service?.service_name || null;
            const taskName = await knex("tasks")
                .select("task_name")
                .where({ task_id: task.task_id }).first();
            task["task_name"] = taskName?.task_name || null;
        }

        if (getTSRes) {
            logger.info("Time-Sheet List retrieved successfully", {
                username: user_name,
                reqdetails: "task-getTimesheet",
            });
            return res.status(200).json({
                message: "Time-Sheet List retrieved successfully",
                data: getTSRes,
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