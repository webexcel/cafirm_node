import express from "express";
import { authenticateJWT } from "../../middleware/verifyToken.js";
import { getYearlyReport, getMonthlyReport, getWeeklyReport } from "../../controller/report/charts.controller.js";

const chartRoutes = express.Router();

chartRoutes.use(authenticateJWT);

chartRoutes.post("/getYearlyReport", getYearlyReport);

chartRoutes.post("/getMonthlyReport", getMonthlyReport);

chartRoutes.post("/getWeeklyReport", getWeeklyReport);

export default chartRoutes;