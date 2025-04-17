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

export const getYearlyReport = async (req, res, next) => {
    let knex = null;
    try {
        const { emp_id, year } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Get Year Report Data Request Received", {
            username: user_name,
            reqdetails: "charts-getYearlyReport",
        });

        if (!emp_id || !year) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "charts-getYearlyReport",
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
            logger.info("Year Report Data retrieved successfully", {
                username: user_name,
                reqdetails: "charts-getYearlyReport",
            });
            return res.status(200).json({
                message: "Year Report Data retrieved successfully",
                data: response,
                status: true,
            });
        } else {
            logger.warn("No Year Report Data found", {
                username: user_name,
                reqdetails: "charts-getYearlyReport",
            });
            return res.status(404).json({
                message: "No Year Report Data found",
                status: false,
            });
        }
    } catch (err) {
        logger.error("Error fetching Year Report Data", {
            error: err.message,
            username: req.user?.user_name,
            reqdetails: "charts-getYearlyReport",
        });
        next(err);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};

export const getMonthlyReport = async (req, res, next) => {
    let knex = null;
    try {
        const { emp_id, client_id, month, year } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Get Monthly Report Data Request Received", {
            username: user_name,
            reqdetails: "charts-getMonthlyReport",
        });

        if (!emp_id || !client_id || !month || !year) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "charts-getMonthlyReport",
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
            .andWhere('t.client_id', client_id)
            .andWhere('t.status', '2')
            .andWhereRaw('MONTH(t.assigned_date) = ?', [month])
            .andWhereRaw('YEAR(t.assigned_date) = ?', [year])
            .groupBy('t.task_id', 't.task_name', 't.client_id', 't.service');

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
            logger.info("Monthly Report Data retrieved successfully", {
                username: user_name,
                reqdetails: "charts-getMonthlyReport",
            });
            return res.status(200).json({
                message: "Monthly Report Data retrieved successfully",
                data: response,
                status: true,
            });
        } else {
            logger.warn("No Monthly Report Data found", {
                username: user_name,
                reqdetails: "charts-getMonthlyReport",
            });
            return res.status(404).json({
                message: "No Monthly Report Data found",
                status: false,
            });
        }
    } catch (err) {
        logger.error("Error fetching Monthly Report Data", {
            error: err.message,
            username: req.user?.user_name,
            reqdetails: "charts-getMonthlyReport",
        });
        next(err);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};

export const getWeeklyReport = async (req, res, next) => {
    let knex = null;
    try {
        const { emp_id, week_start, week_end, year } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Get Weekly Report Data Request Received", {
            username: user_name,
            reqdetails: "charts-getWeeklyReport",
        });

        if (!emp_id || !week_start || !week_end || !year) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "charts-getWeeklyReport",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        knex = await createKnexInstance(dbname);

        const result = await knex('employee_task_mapping as etm')
            .join('tasks as t', 'etm.task_id', 't.task_id')
            .leftJoin('time_sheets as ts', function () {
                this.on('etm.task_id', '=', 'ts.task_id')
                    .andOn('etm.employee_id', '=', 'ts.employee_id')
                    .andOn(knex.raw('ts.date BETWEEN ? AND ?', [week_start, week_end]))
                    .andOn(knex.raw('YEAR(ts.date) = ?', [year]));
            })
            .select(
                't.client_id',
                't.service',
                'etm.employee_id',
                't.task_id',
                't.task_name',
                knex.raw('SUM(CAST(ts.total_minutes AS UNSIGNED)) as total_minutes')
            )
            .where('etm.employee_id', emp_id)
            .groupBy('t.client_id', 't.service', 'etm.employee_id', 't.task_id', 't.task_name');

        const filteredResult = result.filter(row => row.total_minutes != null);

        const clientIds = [...new Set(filteredResult.map(row => row.client_id))];

        const clients = await knex("clients")
            .select("client_id", "client_name")
            .whereIn("client_id", clientIds);

        const clientMap = clients.reduce((map, client) => {
            map[client.client_id] = client.client_name;
            return map;
        }, {});

        const totalMinutes = filteredResult.reduce(
            (sum, row) => sum + (parseInt(row.total_minutes) || 0),
            0
        );

        const clientSummaryMap = {};

        filteredResult.forEach(row => {
            const clientId = row.client_id;
            const minutes = parseInt(row.total_minutes);

            if (!clientSummaryMap[clientId]) {
                clientSummaryMap[clientId] = {
                    client_id: clientId,
                    client_name: clientMap[clientId] || null,
                    total_minutes: 0
                };
            }

            clientSummaryMap[clientId].total_minutes += minutes;
        });

        const clientSummary = Object.values(clientSummaryMap).map(client => ({
            ...client,
            hours: (client.total_minutes / 60).toFixed(2),
            percentage: ((client.total_minutes / totalMinutes) * 100).toFixed(2)
        }));

        let data = {
            clientSummary,
            total_minutes: totalMinutes,
            total_hours: (totalMinutes / 60).toFixed(2)
        };

        if (data) {
            logger.info("Weekly Report Data retrieved successfully", {
                username: user_name,
                reqdetails: "charts-getWeeklyReport",
            });
            return res.status(200).json({
                message: "Weekly Report Data retrieved successfully",
                data: data,
                status: true,
            });
        } else {
            logger.warn("No Weekly Report Data found", {
                username: user_name,
                reqdetails: "charts-getWeeklyReport",
            });
            return res.status(404).json({
                message: "No Weekly Report Data found",
                status: false,
            });
        }

    } catch (err) {
        logger.error("Error fetching Weekly Report Data", {
            error: err.message,
            username: req.user?.user_name,
            reqdetails: "charts-getWeeklyReport",
        });
        next(err);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};
