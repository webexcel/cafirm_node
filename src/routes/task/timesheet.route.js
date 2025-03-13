import express from "express";
import { authenticateJWT } from "../../middleware/verifyToken.js";
import { getTimesheet, getService, getemployee, getTaskList, addTimesheet, deleteTimesheet, viewTimesheet } from "../../controller/task/timesheet.controller.js";

const tsRoutes = express.Router();

tsRoutes.use(authenticateJWT);

tsRoutes.get("/getTimesheet", getTimesheet);

tsRoutes.post("/getService", getService);

tsRoutes.post("/getemployee", getemployee);

tsRoutes.post("/getTaskList", getTaskList);

tsRoutes.post("/addTimesheet", addTimesheet);

tsRoutes.post("/deleteTimesheet", deleteTimesheet);

tsRoutes.post("/viewTimesheet", viewTimesheet);

export default tsRoutes;