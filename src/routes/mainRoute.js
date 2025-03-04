import express from "express";
import authRoutes from "./authentication/auth.route.js";
import employeeRoutes from "./employee/employee.route.js";
import clientRoutes from "./client/client.route.js";
import taskRoutes from "./task/task.route.js";
import ticketRoutes from "./task/ticket.route.js";

const mainRoutes = express.Router();

mainRoutes.use("/auth", authRoutes);

mainRoutes.use("/employee", employeeRoutes);

mainRoutes.use("/client", clientRoutes);

mainRoutes.use("/task", taskRoutes);

mainRoutes.use("/ticket", ticketRoutes);

export default mainRoutes;
