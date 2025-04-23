import createKnexInstance from "../../../configs/db.js";
import { logger } from "../../../configs/winston.js";
import moment from "moment";

export const getClients = async (req, res, next) => {
    let knex = null;
    try {
        const { emp_id } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Get Clients List Request Received", {
            username: user_name,
            reqdetails: "charts-getClients",
        });

        if (!emp_id) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "charts-getClients",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        knex = await createKnexInstance(dbname);

        const getClientRes = await knex('employee_task_mapping as etm')
            .join('tasks as t', 'etm.task_id', 't.task_id')
            .join('clients as c', 't.client_id', 'c.client_id')
            .select('c.client_id', 'c.client_name', 'c.display_name')
            .where('etm.employee_id', emp_id)
            .groupBy('c.client_id', 'c.client_name', 'c.display_name');

        if (getClientRes) {
            logger.info("Clients List retrieved successfully", {
                username: user_name,
                reqdetails: "charts-getClients",
            });
            return res.status(200).json({
                message: "Clients List retrieved successfully",
                data: getClientRes,
                status: true,
            });
        } else {
            logger.warn("No Clients Details found", {
                username: user_name,
                reqdetails: "charts-getClients",
            });
            return res.status(404).json({
                message: "No Clients Details found",
                status: false,
            });
        }
    } catch (err) {
        logger.error("Error fetching Clients List", {
            error: err.message,
            username: req.user?.user_name,
            reqdetails: "charts-getClients",
        });
        next(err);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};

export const getYearlyEmployeeReport = async (req, res, next) => {
    let knex = null;
    try {
        const { emp_id, year } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Get Employee Year Report Data Request Received", {
            username: user_name,
            reqdetails: "charts-getYearlyEmployeeReport",
        });

        if (!emp_id || !year) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "charts-getYearlyEmployeeReport",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        knex = await createKnexInstance(dbname);

        const task = await knex('employee_task_mapping as etm')
            .join('tasks as t', 'etm.task_id', 't.task_id')
            .where('etm.employee_id', emp_id)
            .andWhere('t.status', '2')
            .andWhereRaw('YEAR(t.assigned_date) = ?', [year])
            .select(
                knex.raw('MONTH(t.assigned_date) as month'),
                knex.raw('COUNT(*) as task_count')
            )
            .groupByRaw('MONTH(t.assigned_date)');

        const taskStats = await knex('employee_task_mapping as etm')
            .join('tasks as t', 'etm.task_id', 't.task_id')
            .where('etm.employee_id', emp_id)
            .andWhereNot('t.status', '3')
            .andWhereRaw('YEAR(t.assigned_date) = ?', [year])
            .select([
                knex.raw('COUNT(*) as total_tasks'),
                knex.raw(`SUM(CASE WHEN t.status = '0' THEN 1 ELSE 0 END) as pending`),
                knex.raw(`SUM(CASE WHEN t.status = '1' THEN 1 ELSE 0 END) as inprocess`),
                knex.raw(`SUM(CASE WHEN t.status = '2' THEN 1 ELSE 0 END) as completed`)
            ])
            .first();

        const months = moment.monthsShort();

        const task_count_per_month = months.map((month, index) => {
            const found = task.find(row => row.month === index + 1);
            return {
                month,
                count: found ? found.task_count : 0
            };
        });

        const task_total = task_count_per_month.reduce((acc, curr) => acc + curr.count, 0);

        const response = {
            task_total,
            task_count_per_month
        };

        if (task) {
            logger.info("Employee Year Report Data retrieved successfully", {
                username: user_name,
                reqdetails: "charts-getYearlyEmployeeReport",
            });
            return res.status(200).json({
                message: "Employee Year Report Data retrieved successfully",
                data: response,
                count: taskStats,
                status: true,
            });
        } else {
            logger.warn("No Employee Year Report Data found", {
                username: user_name,
                reqdetails: "charts-getYearlyEmployeeReport",
            });
            return res.status(404).json({
                message: "No Year Report Data found",
                status: false,
            });
        }
    } catch (err) {
        logger.error("Error fetching Employee Year Report Data", {
            error: err.message,
            username: req.user?.user_name,
            reqdetails: "charts-getYearlyEmployeeReport",
        });
        next(err);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};

export const getMonthlyEmployeeReport = async (req, res, next) => {
    let knex = null;
    try {
        const { emp_id, month, year } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Get Employee Monthly Report Data Request Received", {
            username: user_name,
            reqdetails: "charts-getMonthlyEmployeeReport",
        });

        if (!emp_id || !month || !year) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "charts-getMonthlyEmployeeReport",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        knex = await createKnexInstance(dbname);

        const rawResult = await knex('employee_task_mapping as etm')
            .join('tasks as t', 'etm.task_id', 't.task_id')
            .leftJoin('time_sheets as ts', function () {
                this.on('etm.task_id', '=', 'ts.task_id')
                    .andOn('etm.employee_id', '=', 'ts.employee_id');
            })
            .select(
                't.task_id',
                't.task_name',
                't.client_id',
                't.service',
                knex.raw('SUM(ts.total_minutes) as total_minutes')
            )
            .where('etm.employee_id', emp_id)
            .andWhere('t.status', '2')
            .andWhereRaw('MONTH(t.assigned_date) = ?', [month])
            .andWhereRaw('YEAR(t.assigned_date) = ?', [year])
            .groupBy('t.task_id', 't.task_name', 't.client_id', 't.service');

        const taskStats = await knex('employee_task_mapping as etm')
            .join('tasks as t', 'etm.task_id', 't.task_id')
            .where('etm.employee_id', emp_id)
            .andWhereNot('t.status', '3')
            .andWhereRaw('MONTH(t.assigned_date) = ?', [month])
            .andWhereRaw('YEAR(t.assigned_date) = ?', [year])
            .select([
                knex.raw('COUNT(*) as total_tasks'),
                knex.raw(`SUM(CASE WHEN t.status = '0' THEN 1 ELSE 0 END) as pending`),
                knex.raw(`SUM(CASE WHEN t.status = '1' THEN 1 ELSE 0 END) as inprocess`),
                knex.raw(`SUM(CASE WHEN t.status = '2' THEN 1 ELSE 0 END) as completed`)
            ])
            .first();

        const response = [];

        for (const row of rawResult) {
            const client = await knex("clients")
                .select("client_name")
                .where({ client_id: row.client_id })
                .first();

            const service = await knex("services")
                .select("service_name")
                .where({ service_id: row.service })
                .first();

            response.push({
                task_id: row.task_id,
                task_name: row.task_name,
                client_id: row.client_id,
                client_name: client?.client_name || null,
                service_id: row.service,
                service_name: service?.service_name || null,
                total_minutes: row.total_minutes ? Number(row.total_minutes) : 0,
                total_hours: row.total_minutes ? (Number(row.total_minutes) / 60).toFixed(2) : "0.00"
            });
        }

        if (rawResult) {
            logger.info("Employee Monthly Report Data retrieved successfully", {
                username: user_name,
                reqdetails: "charts-getMonthlyEmployeeReport",
            });
            return res.status(200).json({
                message: "Employee Monthly Report Data retrieved successfully",
                data: response,
                count: taskStats,
                status: true,
            });
        } else {
            logger.warn("No Employee Monthly Report Data found", {
                username: user_name,
                reqdetails: "charts-getMonthlyEmployeeReport",
            });
            return res.status(404).json({
                message: "No Monthly Report Data found",
                status: false,
            });
        }
    } catch (err) {
        logger.error("Error fetching Employee Monthly Report Data", {
            error: err.message,
            username: req.user?.user_name,
            reqdetails: "charts-getMonthlyEmployeeReport",
        });
        next(err);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};

export const getWeeklyEmployeeReport = async (req, res, next) => {
    let knex = null;
    try {
        const { emp_id, id, year } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Get Employee Weekly Report Data Request Received", {
            username: user_name,
            reqdetails: "charts-getWeeklyEmployeeReport",
        });

        if (!emp_id || !id || !year) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "charts-getWeeklyEmployeeReport",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        const week_start = moment().year(year).isoWeek(id).startOf('isoWeek').format('YYYY-MM-DD');
        const week_end = moment().year(year).isoWeek(id).endOf('isoWeek').format('YYYY-MM-DD');

        console.log(week_start, week_end);

        knex = await createKnexInstance(dbname);

        const taskData = await knex('employee_task_mapping as etm')
            .join('tasks as t', 'etm.task_id', 't.task_id')
            .leftJoin('time_sheets as ts', function () {
                this.on('ts.task_id', '=', 't.task_id')
                    .andOn('ts.employee_id', '=', 'etm.employee_id')
            })
            .select(
                't.task_id',
                't.task_name',
                't.client_id',
                't.service',
                knex.raw('IFNULL(SUM(ts.total_minutes), 0) as total_time')
            )
            .where('etm.employee_id', emp_id)
            .andWhere('t.status', '2')
            .andWhereBetween('t.assigned_date', [week_start, week_end])
            // .andWhereRaw('YEAR(t.assigned_date) = ?', [year])
            .groupBy('t.task_id', 't.task_name');

        const taskStats = await knex('employee_task_mapping as etm')
            .join('tasks as t', 'etm.task_id', 't.task_id')
            .where('etm.employee_id', emp_id)
            .andWhereNot('t.status', '3')
            .andWhereBetween('t.assigned_date', [week_start, week_end])
            .select([
                knex.raw('COUNT(*) as total_tasks'),
                knex.raw(`SUM(CASE WHEN t.status = '0' THEN 1 ELSE 0 END) as pending`),
                knex.raw(`SUM(CASE WHEN t.status = '1' THEN 1 ELSE 0 END) as inprocess`),
                knex.raw(`SUM(CASE WHEN t.status = '2' THEN 1 ELSE 0 END) as completed`)
            ])
            .first();

        for (const row of taskData) {
            const client = await knex("clients")
                .select("client_name")
                .where({ client_id: row.client_id })
                .first();

            const service = await knex("services")
                .select("service_name")
                .where({ service_id: row.service })
                .first();


            row['client_name'] = client?.client_name || null;
            row['service_name'] = service?.service_name || null;
        }

        const totalTime = taskData.reduce((sum, row) => sum + Number(row.total_time), 0);

        const result = taskData.map(task => ({
            ...task,
            percentage: totalTime > 0 ? ((task.total_time / totalTime) * 100).toFixed(2) : '0.00'
        }));

        if (taskData) {
            logger.info("Employee Weekly Report Data retrieved successfully", {
                username: user_name,
                reqdetails: "charts-getWeeklyEmployeeReport",
            });
            return res.status(200).json({
                message: "Employee Weekly Report Data retrieved successfully",
                data: result,
                count: taskStats,
                status: true,
            });
        } else {
            logger.warn("No Employee Weekly Report Data found", {
                username: user_name,
                reqdetails: "charts-getWeeklyEmployeeReport",
            });
            return res.status(404).json({
                message: "No Employee Weekly Report Data found",
                status: false,
            });
        }

    } catch (err) {
        logger.error("Error fetching Employee Weekly Report Data", {
            error: err.message,
            username: req.user?.user_name,
            reqdetails: "charts-getWeeklyEmployeeReport",
        });
        next(err);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};

export const getYearlyClientReport = async (req, res, next) => {
    let knex = null;
    try {
        const { client_id, year } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Get Client Year Report Data Request Received", {
            username: user_name,
            reqdetails: "charts-getYearlyClientReport",
        });

        if (!client_id || !year) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "charts-getYearlyClientReport",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        knex = await createKnexInstance(dbname);

        const task = await knex('tasks as t')
            .where('t.client_id', client_id)
            .andWhere('t.status', '2')
            .andWhereRaw('YEAR(t.assigned_date) = ?', [year])
            .select(
                knex.raw('MONTH(t.assigned_date) as month'),
                knex.raw('COUNT(*) as task_count')
            )
            .groupByRaw('MONTH(t.assigned_date)');

        const taskStats = await knex('tasks as t')
            .where('t.client_id', client_id)
            .andWhereNot('t.status', '3')
            .andWhereRaw('YEAR(t.assigned_date) = ?', [year])
            .select([
                knex.raw('COUNT(*) as total_tasks'),
                knex.raw(`SUM(CASE WHEN t.status = '0' THEN 1 ELSE 0 END) as pending`),
                knex.raw(`SUM(CASE WHEN t.status = '1' THEN 1 ELSE 0 END) as inprocess`),
                knex.raw(`SUM(CASE WHEN t.status = '2' THEN 1 ELSE 0 END) as completed`)
            ])
            .first();

        const months = moment.monthsShort();

        const task_count_per_month = months.map((month, index) => {
            const found = task.find(row => row.month === index + 1);
            return {
                month,
                count: found ? found.task_count : 0
            };
        });

        const task_total = task_count_per_month.reduce((acc, curr) => acc + curr.count, 0);

        const response = {
            task_total,
            task_count_per_month
        };

        if (task) {
            logger.info("Client Year Report Data retrieved successfully", {
                username: user_name,
                reqdetails: "charts-getYearlyClientReport",
            });
            return res.status(200).json({
                message: "Client Year Report Data retrieved successfully",
                data: response,
                count: taskStats,
                status: true,
            });
        } else {
            logger.warn("No Client Year Report Data found", {
                username: user_name,
                reqdetails: "charts-getYearlyClientReport",
            });
            return res.status(404).json({
                message: "No Year Report Data found",
                status: false,
            });
        }
    } catch (err) {
        logger.error("Error fetching Client Year Report Data", {
            error: err.message,
            username: req.user?.user_name,
            reqdetails: "charts-getYearlyClientReport",
        });
        next(err);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};

export const getMonthlyClientReport = async (req, res, next) => {
    let knex = null;
    try {
        const { client_id, month, year } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Get Client Monthly Report Data Request Received", {
            username: user_name,
            reqdetails: "charts-getMonthlyClientReport",
        });

        if (!client_id || !month || !year) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "charts-getMonthlyClientReport",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        knex = await createKnexInstance(dbname);

        const rawResult = await knex('employee_task_mapping as etm')
            .join('tasks as t', 'etm.task_id', 't.task_id')
            .leftJoin('time_sheets as ts', function () {
                this.on('etm.task_id', '=', 'ts.task_id');
            })
            .select(
                't.task_id',
                't.task_name',
                't.client_id',
                't.service',
                knex.raw('SUM(ts.total_minutes) as total_minutes')
            )
            .andWhere('t.client_id', client_id)
            .andWhere('t.status', '2')
            .andWhereRaw('MONTH(t.assigned_date) = ?', [month])
            .andWhereRaw('YEAR(t.assigned_date) = ?', [year])
            .groupBy('t.task_id', 't.task_name', 't.client_id', 't.service');

        const taskStats = await knex('tasks as t')
            .where('t.client_id', client_id)
            .andWhereNot('t.status', '3')
            .andWhereRaw('MONTH(t.assigned_date) = ?', [month])
            .andWhereRaw('YEAR(t.assigned_date) = ?', [year])
            .select([
                knex.raw('COUNT(*) as total_tasks'),
                knex.raw(`SUM(CASE WHEN t.status = '0' THEN 1 ELSE 0 END) as pending`),
                knex.raw(`SUM(CASE WHEN t.status = '1' THEN 1 ELSE 0 END) as inprocess`),
                knex.raw(`SUM(CASE WHEN t.status = '2' THEN 1 ELSE 0 END) as completed`)
            ])
            .first();

        const response = [];

        for (const row of rawResult) {
            const client = await knex("clients")
                .select("client_name")
                .where({ client_id: row.client_id })
                .first();

            const service = await knex("services")
                .select("service_name")
                .where({ service_id: row.service })
                .first();

            response.push({
                task_id: row.task_id,
                task_name: row.task_name,
                client_id: row.client_id,
                client_name: client?.client_name || null,
                service_id: row.service,
                service_name: service?.service_name || null,
                total_minutes: row.total_minutes ? Number(row.total_minutes) : 0,
                total_hours: row.total_minutes ? (Number(row.total_minutes) / 60).toFixed(2) : "0.00"
            });
        }

        if (rawResult) {
            logger.info("Client Monthly Report Data retrieved successfully", {
                username: user_name,
                reqdetails: "charts-getMonthlyClientReport",
            });
            return res.status(200).json({
                message: "Client Monthly Report Data retrieved successfully",
                data: response,
                count: taskStats,
                status: true,
            });
        } else {
            logger.warn("No Client Monthly Report Data found", {
                username: user_name,
                reqdetails: "charts-getMonthlyClientReport",
            });
            return res.status(404).json({
                message: "No Client Monthly Report Data found",
                status: false,
            });
        }
    } catch (err) {
        logger.error("Error fetching Client Monthly Report Data", {
            error: err.message,
            username: req.user?.user_name,
            reqdetails: "charts-getMonthlyClientReport",
        });
        next(err);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};

export const getWeeklyClientReport = async (req, res, next) => {
    let knex = null;
    try {
        const { client_id, id, year } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Get Client Weekly Report Data Request Received", {
            username: user_name,
            reqdetails: "charts-getWeeklyClientReport",
        });

        if (!client_id || !id || !year) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "charts-getWeeklyClientReport",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        const week_start = moment().year(year).isoWeek(id).startOf('isoWeek').format('YYYY-MM-DD');
        const week_end = moment().year(year).isoWeek(id).endOf('isoWeek').format('YYYY-MM-DD');

        console.log(week_start, week_end);

        knex = await createKnexInstance(dbname);

        const taskData = await knex('tasks as t', 'etm.task_id', 't.task_id')
            .leftJoin('time_sheets as ts', function () {
                this.on('ts.task_id', '=', 't.task_id')
            })
            .select(
                't.task_id',
                't.task_name',
                't.client_id',
                't.service',
                knex.raw('IFNULL(SUM(ts.total_minutes), 0) as total_time')
            )
            .andWhere('t.status', '2')
            .andWhere('t.client_id', client_id)
            .andWhereBetween('t.assigned_date', [week_start, week_end])
            // .andWhereRaw('YEAR(t.assigned_date) = ?', [year])
            .groupBy('t.task_id', 't.task_name');

        const taskStats = await knex('tasks as t')
            .where('t.client_id', client_id)
            .andWhereNot('t.status', '3')
            .andWhereBetween('t.assigned_date', [week_start, week_end])
            .select([
                knex.raw('COUNT(*) as total_tasks'),
                knex.raw(`SUM(CASE WHEN t.status = '0' THEN 1 ELSE 0 END) as pending`),
                knex.raw(`SUM(CASE WHEN t.status = '1' THEN 1 ELSE 0 END) as inprocess`),
                knex.raw(`SUM(CASE WHEN t.status = '2' THEN 1 ELSE 0 END) as completed`)
            ])
            .first();

        for (const row of taskData) {
            const client = await knex("clients")
                .select("client_name")
                .where({ client_id: row.client_id })
                .first();

            const service = await knex("services")
                .select("service_name")
                .where({ service_id: row.service })
                .first();


            row['client_name'] = client?.client_name || null;
            row['service_name'] = service?.service_name || null;
        }

        const totalTime = taskData.reduce((sum, row) => sum + Number(row.total_time), 0);

        const result = taskData.map(task => ({
            ...task,
            percentage: totalTime > 0 ? ((task.total_time / totalTime) * 100).toFixed(2) : '0.00'
        }));

        if (taskData) {
            logger.info("Client Weekly Report Data retrieved successfully", {
                username: user_name,
                reqdetails: "charts-getWeeklyClientReport",
            });
            return res.status(200).json({
                message: "Client Weekly Report Data retrieved successfully",
                data: result,
                count: taskStats,
                status: true,
            });
        } else {
            logger.warn("No Client Weekly Report Data found", {
                username: user_name,
                reqdetails: "charts-getWeeklyClientReport",
            });
            return res.status(404).json({
                message: "No Client Weekly Report Data found",
                status: false,
            });
        }

    } catch (err) {
        logger.error("Error fetching Client Weekly Report Data", {
            error: err.message,
            username: req.user?.user_name,
            reqdetails: "charts-getWeeklyClientReport",
        });
        next(err);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};
