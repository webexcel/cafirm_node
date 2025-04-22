import express from "express";
import { authenticateJWT } from "../../middleware/verifyToken.js";
import { getClients, getYearlyEmployeeReport, getMonthlyEmployeeReport, getWeeklyEmployeeReport, 
    getYearlyClientReport, getMonthlyClientReport, getWeeklyClientReport } from "../../controller/report/charts.controller.js";

const chartRoutes = express.Router();

chartRoutes.use(authenticateJWT);

chartRoutes.post("/getClients", getClients);

chartRoutes.post("/getYearlyEmployeeReport", getYearlyEmployeeReport);

chartRoutes.post("/getMonthlyEmployeeReport", getMonthlyEmployeeReport);

chartRoutes.post("/getWeeklyEmployeeReport", getWeeklyEmployeeReport);

chartRoutes.post("/getYearlyClientReport", getYearlyClientReport);

chartRoutes.post("/getMonthlyClientReport", getMonthlyClientReport);

chartRoutes.post("/getWeeklyClientReport", getWeeklyClientReport);

export default chartRoutes;