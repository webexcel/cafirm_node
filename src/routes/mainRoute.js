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
import PermissionRoutes from "./permission/permission.routes.js";
import attendanceRoutes from "./attendance/attendance.route.js";
import dashboardRoutes from "./dashboard/dashboard.route.js";
import calendarRoutes from "./calendar/calendar.route.js";
import menuRoutes from "./configuration/menu.route.js";
import leaveRequestRoutes from "./leaveRequest/leaveRequest.route.js";
import chartRoutes from "./report/charts.route.js";
import documentManagementRoutes from "./documentManagement/documentManagement.route.js";
import docTypeRoutes from "./master/docType.route.js";

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

mainRoutes.use("/permissions", PermissionRoutes);

mainRoutes.use("/attendance", attendanceRoutes);

mainRoutes.use("/dashboard", dashboardRoutes);

mainRoutes.use("/calendar", calendarRoutes);

mainRoutes.use("/menu", menuRoutes);

mainRoutes.use("/leaverequest", leaveRequestRoutes);

mainRoutes.use("/charts", chartRoutes);

mainRoutes.use("/document", documentManagementRoutes);

mainRoutes.use("/master/documenttype", docTypeRoutes);

export default mainRoutes;
