import express from "express";
import authRoutes from "./authentication/auth.route.js";
import employeeRoutes from "./employee/employee.route.js";
import clientRoutes from "./client/client.route.js";
import taskRoutes from "./task/task.route.js";
import ticketRoutes from "./task/ticket.route.js";
import tsRoutes from "./task/timesheet.route.js";
import empTSRoutes from "./timesheet/employee.route.js";
import clientTSRoutes from "./timesheet/client.route.js";
import servicesRoutes from "./master/services.route.js";

const mainRoutes = express.Router();

mainRoutes.use("/auth", authRoutes);

mainRoutes.use("/employee", employeeRoutes);

mainRoutes.use("/client", clientRoutes);

mainRoutes.use("/task", taskRoutes);

mainRoutes.use("/ticket", ticketRoutes);

mainRoutes.use("/timesheet", tsRoutes);

mainRoutes.use("/empTS", empTSRoutes);

mainRoutes.use("/clientTS", clientTSRoutes);

mainRoutes.use("/master/services", servicesRoutes);

export default mainRoutes;
