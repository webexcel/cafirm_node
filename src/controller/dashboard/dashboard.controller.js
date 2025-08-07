import createKnexInstance from "../../../configs/db.js";
import { logger } from "../../../configs/winston.js";

export const getDashboardData = async (req, res, next) => {
    let knex = null;
    try {
        const { dbname, user_name } = req.user;

        logger.info("Get Dashboard Data Request Received", {
            username: user_name,
            reqdetails: "dashboard-getDashboardData",
        });

        knex = await createKnexInstance(dbname);

        const clients = await knex('clients').count('* as total').where("status", "0");
        let clientCount = 0;
        if (clients[0] && clients[0].total) {
            clientCount = clients[0].total;
        }

        const employees = await knex('employees').count('* as total').where("status", "0");
        let employeeCount = 0;
        if (employees[0] && employees[0].total) {
            employeeCount = employees[0].total;
        }

        const service = await knex('services').count('* as total').where("status", "0");
        let serviceCount = 0;
        if (service[0] && service[0].total) {
            serviceCount = service[0].total;
        }

        const getDashResult = await knex('tasks')
            .select(
                knex.raw("COUNT(CASE WHEN status = '0' THEN 1 END) as status_0"),
                knex.raw("COUNT(CASE WHEN status = '1' THEN 1 END) as status_1"),
                knex.raw("COUNT(CASE WHEN status = '2' THEN 1 END) as status_2")
            );

        const getTotalCount = await knex('attendance')
            .countDistinct('employee_id as total_count')
            .whereRaw("DATE(created_at) = CURDATE()").where("status", "0");

        const result = {
            "client_count": clientCount,
            "employee_count": employeeCount,
            "service_count": serviceCount,
            "task_pending": getDashResult[0].status_0,
            "task_inprogress": getDashResult[0].status_1,
            "task_completed": getDashResult[0].status_2,
            "today_attendance": getTotalCount[0].total_count
        };

        if (result) {
            logger.info("Dashboard Data retrieved successfully", {
                username: user_name,
                reqdetails: "dashboard-getDashboardData",
            });
            return res.status(200).json({
                message: "Dashboard Data retrieved successfully",
                data: result,
                status: true,
            });
        } else {
            logger.warn("No Dashboard Data found", {
                username: user_name,
                reqdetails: "dashboard-getDashboardData",
            });
            return res.status(404).json({
                message: "No Dashboard Data found",
                status: false,
            });
        }
    } catch (err) {
        logger.error("Error fetching Dashboard Data", {
            error: err.message,
            username: req.user?.user_name,
            reqdetails: "dashboard-getDashboardData",
        });
        next(err);
    } finally {
        if (knex) {
            await knex.destroy();
        }
    }
};