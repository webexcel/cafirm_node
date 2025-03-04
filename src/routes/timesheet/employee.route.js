import express from "express";
import { authenticateJWT } from "../../middleware/verifyToken.js";
import { getEmployeeTimesheet, searchEmployeeTimesheet } from "../../controller/timesheet/employee.controller.js";

const empTSRoutes = express.Router();

empTSRoutes.use(authenticateJWT);

empTSRoutes.get("/getEmployeeTimesheet", getEmployeeTimesheet);

empTSRoutes.post("/searchEmployeeTimesheet", searchEmployeeTimesheet);

export default empTSRoutes;