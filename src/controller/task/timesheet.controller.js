import createKnexInstance from "../../../configs/db.js";
import { logger } from "../../../configs/winston.js";
import moment from 'moment';

export const getTimesheet = async (req, res, next) => {
    let knex = null;
    try {
        const { dbname, user_name } = req.user;

        logger.info("Get Time-Sheet List Request Received", {
            username: user_name,
            reqdetails: "timesheet-getTimesheet",
        });

        knex = await createKnexInstance(dbname);

        const getTSRes = await knex('time_sheets').select('*', knex.raw("DATE_FORMAT(date, '%Y-%m-%d') as date")).where('status', '0');

        for (const task of getTSRes) {
            const taskName = await knex("tasks")
                .select("*")
                .where({ task_id: task.task_id }).first();
            if (taskName) {
                task["task_name"] = taskName?.task_name || null;
                const client = await knex("clients")
                    .select("client_name")
                    .where({ client_id: taskName.client_id }).first();
                task["client_name"] = client?.client_name || null;
                const service = await knex("services")
                    .select("service_name")
                    .where({ service_id: taskName.service }).first();
                task["service_name"] = service?.service_name || null;
                const year = await knex("year")
                    .select("year")
                    .where({ id: taskName.year_id }).first();
                task["year_name"] = year?.year || null;
            } else {
                task["task_name"] = null;
                task["employee_name"] = null;
                task["client_name"] = null;
                task["service_name"] = null;
                task["year_name"] = null;
            }
            const employee = await knex("employees")
                .select("name")
                .where({ employee_id: task.employee_id }).first();
            task["employee_name"] = employee?.name || null;
        }

        if (getTSRes) {
            logger.info("Time-Sheet List retrieved successfully", {
                username: user_name,
                reqdetails: "timesheet-getTimesheet",
            });
            return res.status(200).json({
                message: "Time-Sheet List retrieved successfully",
                data: getTSRes,
                status: true,
            });
        } else {
            logger.warn("No Time-Sheet Details found", {
                username: user_name,
                reqdetails: "timesheet-getTimesheet",
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
            reqdetails: "timesheet-getTimesheet",
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
            reqdetails: "timesheet-getTimesheetLimited",
        });

        knex = await createKnexInstance(dbname);

        const getTSRes = await knex('time_sheets').select('*', knex.raw("DATE_FORMAT(date, '%Y-%m-%d') as date")).where('status', '0').orderBy('created_at', 'desc').limit(5);

        for (const task of getTSRes) {
            const taskName = await knex("tasks")
                .select("*")
                .where({ task_id: task.task_id }).first();
            if (taskName) {
                task["task_name"] = taskName?.task_name || null;
                task["task_description"] = taskName?.description || null;
                const year = await knex("year")
                    .select("year")
                    .where({ id: taskName.year_id }).first();
                task["year_name"] = year?.year || null;
            } else {
                task["task_name"] = null;
                task["task_description"] = null;
                task["year_name"] = null;
            }
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
            const year = await knex("year")
                .select("year")
                .where({ id: task.year_id }).first();
            task["year_name"] = year?.year || null;
        }

        if (getTSRes) {
            logger.info("Time-Sheet List retrieved successfully", {
                username: user_name,
                reqdetails: "timesheet-getTimesheetLimited",
            });
            return res.status(200).json({
                message: "Time-Sheet List retrieved successfully",
                data: getTSRes,
                status: true,
            });
        } else {
            logger.warn("No Time-Sheet Details found", {
                username: user_name,
                reqdetails: "timesheet-getTimesheetLimited",
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
            reqdetails: "timesheet-getTimesheetLimited",
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
            reqdetails: "timesheet-getService",
        });

        knex = await createKnexInstance(dbname);

        let getTaskRes;

        if (client_id && client_id.toString().toLowerCase() != "all") {
            getTaskRes = await knex('tasks').select('*').where({ 'client_id': client_id }).whereNotIn('tasks.status', ['3']);
        } else {
            getTaskRes = await knex('tasks').select('*').whereNotIn('tasks.status', ['3']);
        }

        const uniqueServices = [...new Set(getTaskRes.map(task => task.service))];

        const getTSRes = await knex('services').select('service_id', 'service_name', 'service_short_name').where({ 'status': '0' }).whereIn("service_id", uniqueServices);

        if (getTSRes) {
            logger.info("Time-Sheet Service List retrieved successfully", {
                username: user_name,
                reqdetails: "timesheet-getService",
            });
            return res.status(200).json({
                message: "Time-Sheet Service List retrieved successfully",
                data: getTSRes,
                status: true,
            });
        } else {
            logger.warn("No Time-Sheet Service Details found", {
                username: user_name,
                reqdetails: "timesheet-getService",
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
            reqdetails: "timesheet-getService",
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
            reqdetails: "timesheet-getemployee",
        });

        knex = await createKnexInstance(dbname);

        let query = knex('tasks').select('task_id', 'task_name').where({ 'status': '0' });

        if (client_id && client_id.toString().toLowerCase() != "all") {
            query = query.where({ 'client_id': client_id });
        }

        if (service_id && service_id.toString().toLowerCase() != "all") {
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
                reqdetails: "timesheet-getemployee",
            });
            return res.status(200).json({
                message: "Time-Sheet Employee List retrieved successfully",
                data: empListRes,
                status: true,
            });
        } else {
            logger.warn("No Time-Sheet Employee Details found", {
                username: user_name,
                reqdetails: "timesheet-getemployee",
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
            reqdetails: "timesheet-getemployee",
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
            reqdetails: "timesheet-getemployee",
        });

        knex = await createKnexInstance(dbname);

        const today = knex.raw('DATE(?)', [knex.fn.now()]);

        let query = knex('tasks').select('tasks.task_id', 'tasks.task_name', knex.raw("DATE_FORMAT(tasks.assigned_date, '%Y-%m-%d') as assigned_date"), knex.raw("DATE_FORMAT(tasks.due_date, '%Y-%m-%d') as due_date"), 'partners.name as partner_name')
            .leftJoin('partners', function () {
                this.on('tasks.partner_id', '=', 'partners.id')
                    .andOnNotNull('tasks.partner_id');
            })
            .andWhereNot('tasks.status', '3')
            .andWhere(function () {
                this.where('tasks.assigned_date', '<=', today)
                    .andWhere('tasks.due_date', '>=', today);
            });

        if (client_id && client_id.toString().toLowerCase() != "all") {
            query = query.where({ 'tasks.client_id': client_id });
        }

        if (service_id && service_id.toString().toLowerCase() != "all") {
            query = query.where({ 'tasks.service': service_id });
        }

        const getTaskRes = await query;

        let allEmployeeIds = new Set();
        let filteredTasks = [];

        for (const task of getTaskRes) {
            const year = await knex("year")
                .select("year")
                .where({ id: task.year_id }).first();
            task["year_name"] = year?.year || null;
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
                reqdetails: "timesheet-getemployee",
            });
            return res.status(200).json({
                message: "Time-Sheet Employee List retrieved successfully",
                data: filteredTasks,
                status: true,
            });
        } else {
            logger.warn("No Time-Sheet Employee Details found", {
                username: user_name,
                reqdetails: "timesheet-getemployee",
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
            reqdetails: "timesheet-getemployee",
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
        const { emp_id, task_id, date, time, description } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Add Time-Sheet Request Received", {
            username: user_name,
            reqdetails: "timesheet-addTimesheet",
        });

        if (!emp_id || !time) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "timesheet-addTimesheet",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        const [hours, minutes] = time.split(":").map(Number);
        const tot_minutes = hours * 60 + minutes;

        knex = await createKnexInstance(dbname);

        const existingTS = await knex('time_sheets')
            .where(function () {
                this.where('employee_id', emp_id)
                    .andWhere('task_id', task_id)
                    .andWhere('date', date);
            })
            .where('status', '0')
            .first();

        if (existingTS) {
            logger.error("Duplicates in Time-Sheet Entry", {
                username: user_name,
                reqdetails: "timesheet-addTimesheet",
            });
            return res.status(500).json({
                message: "Duplicates in Time-Sheet Entry for this task.",
                status: false,
            });
        }

        const insertTSResult = await knex('time_sheets').insert({
            employee_id: emp_id,
            // client_id: clientId,
            // service_id: serviceId,
            task_id: task_id,
            date: date,
            total_minutes: tot_minutes,
            total_time: time,
            description: description
        });

        if (insertTSResult) {
            logger.info("Time-Sheet inserted successfully", {
                username: user_name,
                reqdetails: "timesheet-addTimesheet",
            });
            return res.status(200).json({
                message: "Time-Sheet inserted successfully",
                status: true,
            });
        } else {
            logger.error("Failed to insert Time-Sheet", {
                username: user_name,
                reqdetails: "timesheet-addTimesheet",
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
        const { ts_id, date, time, description } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Update Time-Sheet Request Received", {
            username: user_name,
            reqdetails: "timesheet-editTimesheet",
        });

        if (!ts_id || !date || !time) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "timesheet-editTimesheet",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        const [hours, minutes] = time.split(":").map(Number);
        const tot_minutes = hours * 60 + minutes;

        knex = await createKnexInstance(dbname);

        const updateTSResult = await knex('time_sheets').update({
            date: date,
            total_minutes: tot_minutes,
            total_time: time,
            description: description
        }).where({ time_sheet_id: ts_id });

        if (updateTSResult) {
            logger.info("Time-Sheet updated successfully", {
                username: user_name,
                reqdetails: "timesheet-editTimesheet",
            });
            return res.status(200).json({
                message: "Time-Sheet updated successfully",
                status: true,
            });
        } else {
            logger.error("Failed to update Time-Sheet", {
                username: user_name,
                reqdetails: "timesheet-editTimesheet",
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
            reqdetails: "timesheet-deleteTimesheet",
        });

        if (!id) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "timesheet-deleteTimesheet",
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
                reqdetails: "timesheet-deleteTimesheet",
            });
            return res.status(200).json({
                message: "Time-Sheet Status deleted successfully",
                status: true,
            });
        } else {
            logger.error("Failed to delete Time-Sheet Status", {
                username: user_name,
                reqdetails: "timesheet-deleteTimesheet",
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
            reqdetails: "timesheet-viewTimesheet",
        });

        knex = await createKnexInstance(dbname);

        let query = knex('time_sheets').select('*', knex.raw("DATE_FORMAT(date, '%Y-%m-%d') as date")).where('status', '0').whereBetween('date', [startdate, enddate]);

        if (client_id && client_id.toString().toLowerCase() != "all") {
            query = query.where('time_sheets.client_id', client_id);
        }

        if (service_id && service_id.toString().toLowerCase() != "all") {
            query = query.where('time_sheets.service_id', service_id);
        }

        if (emp_id && emp_id.toString().toLowerCase() != "all") {
            query = query.where('time_sheets.employee_id', emp_id);
        }

        const getTSRes = await query;

        for (const task of getTSRes) {
            const taskName = await knex("tasks")
                .select("*")
                .where({ task_id: task.task_id }).first();
            if (taskName) {
                task["task_name"] = taskName?.task_name || null;
                const client = await knex("clients")
                    .select("client_name")
                    .where({ client_id: taskName.client_id }).first();
                task["client_name"] = client?.client_name || null;
                const service = await knex("services")
                    .select("service_name")
                    .where({ service_id: taskName.service }).first();
                task["service_name"] = service?.service_name || null;
                const year = await knex("year")
                    .select("year")
                    .where({ id: taskName.year_id }).first();
                task["year_name"] = year?.year || null;
            } else {
                task["task_name"] = null;
                task["client_name"] = null;
                task["service_name"] = null;
                task["year_name"] = null;
            }
            const employee = await knex("employees")
                .select("name")
                .where({ employee_id: task.employee_id }).first();
            task["employee_name"] = employee?.name || null;
        }

        if (getTSRes) {
            logger.info("Time-Sheet List retrieved successfully", {
                username: user_name,
                reqdetails: "timesheet-viewTimesheet",
            });
            return res.status(200).json({
                message: "Time-Sheet List retrieved successfully",
                data: getTSRes,
                status: true,
            });
        } else {
            logger.warn("No Time-Sheet Details found", {
                username: user_name,
                reqdetails: "timesheet-viewTimesheet",
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
            reqdetails: "timesheet-viewTimesheet",
        });
        next(err);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};

export const viewWeeklyTimesheet = async (req, res, next) => {
    let knex = null;
    try {
        const { dbname, user_name } = req.user;
        const { emp_id, week_id, year } = req.body;

        logger.info("Get Time-Sheet Weekly List Request Received", {
            username: user_name,
            reqdetails: "timesheet-viewWeeklyTimesheet",
        });

        if (!emp_id || !week_id) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "timesheet-viewWeeklyTimesheet",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        knex = await createKnexInstance(dbname);

        const week_start = moment().year(year).isoWeek(week_id).startOf('isoWeek').format('YYYY-MM-DD');
        const week_end = moment().year(year).isoWeek(week_id).endOf('isoWeek').format('YYYY-MM-DD');

        const tasks = await knex('tasks')
            .distinct('tasks.task_id')
            .select(
                'tasks.task_id',
                'tasks.task_name',
                'tasks.client_id',
                'tasks.description',
                'tasks.service',
                knex.raw("DATE_FORMAT(tasks.assigned_date, '%Y-%m-%d') as assigned_date"),
                knex.raw("DATE_FORMAT(tasks.due_date, '%Y-%m-%d') as due_date"),
                'partners.name as partner_name'
            )
            .join('employee_task_mapping', 'tasks.task_id', 'employee_task_mapping.task_id')
            .leftJoin('partners', function () {
                this.on('tasks.partner_id', '=', 'partners.id')
                    .andOnNotNull('tasks.partner_id');
            })
            .where(function () {
                // this.whereRaw("WEEK(tasks.assigned_date, 0) = WEEK(CURDATE(), 0)")
                //     .orWhereRaw("WEEK(tasks.due_date, 0) = WEEK(CURDATE(), 0)")
                //     .orWhereRaw("(tasks.assigned_date <= CURDATE() AND tasks.due_date >= CURDATE())");
                this.whereRaw("WEEK(tasks.assigned_date, 0) = WEEK(?, 0)", [week_start])
                    .orWhereRaw("WEEK(tasks.due_date, 0) = WEEK(?, 0)", [week_start])
                    .orWhereRaw("(tasks.assigned_date <= ? AND tasks.due_date >= ?)", [week_end, week_start]);
            })
            .andWhere({ 'employee_task_mapping.employee_id': emp_id, 'employee_task_mapping.status': '0' })
            .andWhereNot('tasks.status', '3');


        for (let task of tasks) {
            const timesheets = await knex('time_sheets')
                .select('time_sheet_id', 'employee_id', 'task_id', knex.raw("DATE_FORMAT(date, '%Y-%m-%d') as date"), 'total_minutes', 'total_time', 'status')
                .where({ 'task_id': task.task_id, 'employee_id': emp_id, 'status': "0" }).whereRaw("YEARWEEK(date, 0) = YEARWEEK(NOW(), 0)");
            task["timesheet"] = timesheets.length > 0 ? timesheets : [];
        }

        for (const taskList of tasks) {
            const taskName = await knex("tasks")
                .select("*")
                .where({ task_id: taskList.task_id }).first();
            if (taskName) {
                taskList["task_name"] = taskName?.task_name || null;
                const client = await knex("clients")
                    .select("client_name", "display_name")
                    .where({ client_id: taskName.client_id }).first();
                taskList["client_id"] = taskName.client_id;
                taskList["client_name"] = client?.client_name || null;
                taskList["display_name"] = client?.display_name || null;
                const service = await knex("services")
                    .select("service_name", "service_short_name")
                    .where({ service_id: taskName.service }).first();
                taskList["service_name"] = service?.service_name || null;
                taskList["service_short_name"] = service?.service_short_name || null;
                const year = await knex("year")
                    .select("year")
                    .where({ id: taskName.year_id }).first();
                taskList["year_name"] = year?.year || null;
            } else {
                taskList["task_name"] = null;
                taskList["client_id"] = null;
                taskList["client_name"] = null;
                taskList["display_name"] = null;
                taskList["service_name"] = null;
                taskList["service_short_name"] = null;
                taskList["year_name"] = null;
            }
        }

        if (tasks) {
            logger.info("Time-Sheet Weekly List retrieved successfully", {
                username: user_name,
                reqdetails: "timesheet-viewWeeklyTimesheet",
            });
            return res.status(200).json({
                message: "Time-Sheet Weekly List retrieved successfully",
                data: tasks,
                status: true,
            });
        } else {
            logger.warn("No Time-Sheet Weekly Details found", {
                username: user_name,
                reqdetails: "timesheet-viewWeeklyTimesheet",
            });
            return res.status(404).json({
                message: "No Time-Sheet Weekly Details found",
                status: false,
            });
        }
    } catch (err) {
        logger.error("Error fetching Time-Sheet Weekly List", {
            error: err.message,
            username: req.user?.user_name,
            reqdetails: "timesheet-viewWeeklyTimesheet",
        });
        next(err);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};

export const updateWeeklyTimesheet = async (req, res, next) => {
    let knex = null;
    try {
        const { data } = req.body;
        const { task_id, emp_id, timesheets } = data;
        const { dbname, user_name } = req.user;

        logger.info("Update Weekly Time-Sheet Request Received", {
            username: user_name,
            reqdetails: "timesheet-updateWeeklyTimesheet",
        });

        if (!task_id || !emp_id || !timesheets || timesheets.length == 0) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "timesheet-updateWeeklyTimesheet",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing or empty",
                status: false,
            });
        }

        knex = await createKnexInstance(dbname);

        let TSResult = [];

        for (const ts of timesheets) {
            if (ts.ts_id && ts.time != null) {
                const [hours, minutes] = ts.time.split(":").map(Number);
                const tot_minutes = hours * 60 + minutes;
                TSResult = await knex('time_sheets')
                    .where({ time_sheet_id: ts.ts_id })
                    .update({
                        total_time: ts.time,
                        total_minutes: tot_minutes
                    });
            } else if (!ts.ts_id && ts.time != null && ts.time !== "00:00") {
                const [hours, minutes] = ts.time.split(":").map(Number);
                const tot_minutes = hours * 60 + minutes;
                TSResult = await knex('time_sheets')
                    .where({ employee_id: emp_id, task_id: task_id, date: ts.ts_date })
                    .first()
                    .then(async (existingRecord) => {
                        if (!existingRecord) {
                            return await knex('time_sheets').insert({
                                task_id,
                                employee_id: emp_id,
                                date: ts.ts_date,
                                total_time: ts.time,
                                total_minutes: tot_minutes
                            });
                        } else {
                            return await knex('time_sheets').update({
                                total_time: ts.time,
                                total_minutes: tot_minutes
                            }).where("time_sheet_id", existingRecord.time_sheet_id);
                        }
                    });
            }
        }

        if (TSResult) {
            logger.info("Weekly Time-Sheet updated successfully", {
                username: user_name,
                reqdetails: "timesheet-updateWeeklyTimesheet",
            });
            return res.status(200).json({
                message: "Weekly Time-Sheet updated successfully",
                status: true,
            });
        } else {
            logger.error("Failed to update Weekly Time-Sheet", {
                username: user_name,
                reqdetails: "timesheet-updateWeeklyTimesheet",
            });
            return res.status(500).json({
                message: "Failed to update Weekly Time-Sheet",
                status: false,
            });
        }
    } catch (error) {
        console.error("Error updating Weekly Time-Sheet:", error);
        next(error);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};

export const editTaskDescription = async (req, res, next) => {
    let knex = null;
    try {
        const { task_id, description } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Update Task Description Request Received", {
            username: user_name,
            reqdetails: "timesheet-editTaskDescription",
        });

        if (!task_id) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "timesheet-editTaskDescription",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        knex = await createKnexInstance(dbname);

        const updateTaskResult = await knex('tasks').update({
            description: description
        }).where({ task_id: task_id });

        if (updateTaskResult) {
            logger.info("Task description updated successfully", {
                username: user_name,
                reqdetails: "timesheet-editTaskDescription",
            });
            return res.status(200).json({
                message: "Task description updated successfully",
                status: true,
            });
        } else {
            logger.error("Failed to update Task description", {
                username: user_name,
                reqdetails: "timesheet-editTaskDescription",
            });
            return res.status(500).json({
                message: "Failed to update Task description",
                status: false,
            });
        }
    } catch (error) {
        console.error("Error updating Task description:", error);
        next(error);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};