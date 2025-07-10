import express from "express";
import { authenticateJWT } from "../../middleware/verifyToken.js";
import { getClients, getYearlyEmployeeReport, getMonthlyEmployeeReport, getWeeklyEmployeeReport, getEmployeeReport,
    getYearlyClientReport, getMonthlyClientReport, getWeeklyClientReport, getClientReport, getTaskByEmployeeId, getTaskByTaskId } from "../../controller/report/charts.controller.js";

const chartRoutes = express.Router();

chartRoutes.use(authenticateJWT);

chartRoutes.post("/getClients", getClients);

chartRoutes.post("/getYearlyEmployeeReport", getYearlyEmployeeReport);

chartRoutes.post("/getMonthlyEmployeeReport", getMonthlyEmployeeReport);

chartRoutes.post("/getWeeklyEmployeeReport", getWeeklyEmployeeReport);

chartRoutes.post("/getEmployeeReport", getEmployeeReport);

chartRoutes.post("/getYearlyClientReport", getYearlyClientReport);

chartRoutes.post("/getMonthlyClientReport", getMonthlyClientReport);

chartRoutes.post("/getWeeklyClientReport", getWeeklyClientReport);

chartRoutes.post("/getClientReport", getClientReport);

chartRoutes.post("/getTaskByEmployeeId", getTaskByEmployeeId);

chartRoutes.post("/getTaskByTaskId", getTaskByTaskId);

export default chartRoutes;