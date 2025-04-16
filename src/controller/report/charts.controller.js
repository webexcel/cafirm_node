import createKnexInstance from "../../../configs/db.js";
import { logger } from "../../../configs/winston.js";

export const getYearlyReport = async (req, res, next) => {
    let knex = null;
    try {
        const { emp_id } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Get Year Report Data Request Received", {
            username: user_name,
            reqdetails: "charts-getYearlyReport",
        });

        if (!emp_id) {
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

        const getTaskRes = await knex('time_sheets')
            .select(
                knex.raw('MONTH(`date`) as month'),
                knex.raw('ROUND(SUM(`total_minutes`) / 60, 2) as hours')
            )
            .where('employee_id', emp_id)
            .andWhere('status', '0')
            .groupByRaw('MONTH(`date`)');

        const fullMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        const hours = new Array(12).fill(0);

        getTaskRes.forEach(row => {
            const monthIndex = row.month - 1;
            hours[monthIndex] = parseFloat(row.hours);
        });

        const response = {
            months: fullMonths,
            hours: hours
        };

        if (getTaskRes) {
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
        const { emp_id, month, year } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Get Monthly Report Data Request Received", {
            username: user_name,
            reqdetails: "charts-getMonthlyReport",
        });

        if (!emp_id || !month || !year) {
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
                    .andOn('etm.employee_id', '=', 'ts.employee_id')
                    .andOn(knex.raw('MONTH(ts.date) = ?', [month]))
                    .andOn(knex.raw('YEAR(ts.date) = ?', [year]));
            })
            .select(
                't.client_id',
                'etm.employee_id',
                't.task_id',
                't.task_name',
                't.status',
                't.service',
                knex.raw('SUM(ts.total_minutes) as task_minutes')
            )
            .where('etm.employee_id', emp_id)
            .andWhere('t.status', '2')
            .groupBy('t.client_id', 'etm.employee_id', 't.task_id', 't.task_name', 'etm.status', 't.service');

        const grouped = {};

        for (const row of rawResult) {
            const {
                client_id,
                employee_id,
                task_id,
                task_name,
                status,
                service,
                task_minutes
            } = row;

            const client = await knex("clients")
                .select("client_name")
                .where({ client_id: client_id }).first();

            if (!grouped[client_id]) {
                grouped[client_id] = {
                    client_id,
                    client_name: client?.client_name || null,
                    employee_id,
                    services: [],
                    total_time: 0
                };
            }

            const serviceName = await knex("services")
                .select("service_name")
                .where({ service_id: service }).first();

            grouped[client_id].services.push({
                task_id,
                task_name,
                status,
                service_id: service,
                service_name: serviceName?.service_name || null,
                total_minutes: task_minutes ? Number(task_minutes) : 0
            });

            if (task_minutes) {
                grouped[client_id].total_time += Number(task_minutes);
            }
        }

        const finalResult = Object.values(grouped).map(client => ({
            ...client,
            total_time: (client.total_time / 60).toFixed(2) // convert to hours
        }));



        if (rawResult) {
            logger.info("Monthly Report Data retrieved successfully", {
                username: user_name,
                reqdetails: "charts-getMonthlyReport",
            });
            return res.status(200).json({
                message: "Monthly Report Data retrieved successfully",
                data: finalResult,
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

        // Step 1: Filter valid records
        const filteredResult = result.filter(row => row.total_minutes != null);

        // Step 2: Extract unique client_ids
        const clientIds = [...new Set(filteredResult.map(row => row.client_id))];

        // Step 3: Fetch all client names in a single query
        const clients = await knex("clients")
            .select("client_id", "client_name")
            .whereIn("client_id", clientIds);

        // Step 4: Create a lookup map for client names
        const clientMap = clients.reduce((map, client) => {
            map[client.client_id] = client.client_name;
            return map;
        }, {});

        // Step 5: Calculate total time
        const total = filteredResult.reduce((sum, row) => sum + (parseInt(row.total_minutes) || 0), 0);

        // Step 6: Generate pie data
        const pieData = filteredResult.map(row => ({
            client_id: row.client_id,
            client_name: clientMap[row.client_id] || null,
            employee_id: row.employee_id,
            task_name: row.task_name,
            value: parseInt(row.total_minutes),
            percentage: ((parseInt(row.total_minutes) / total) * 100).toFixed(2)
        }));


        if (pieData) {
            logger.info("Weekly Report Data retrieved successfully", {
                username: user_name,
                reqdetails: "charts-getWeeklyReport",
            });
            return res.status(200).json({
                message: "Weekly Report Data retrieved successfully",
                data: pieData,
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
