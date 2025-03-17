import express from "express";
import { authenticateJWT } from "../../middleware/verifyToken.js";
import { getDashboardData } from "../../controller/dashboard/dashboard.controller.js";

const dashboardRoutes = express.Router();

dashboardRoutes.use(authenticateJWT);

dashboardRoutes.get("/getDashboardData", getDashboardData);

export default dashboardRoutes;
