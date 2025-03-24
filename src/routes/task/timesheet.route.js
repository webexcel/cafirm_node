import express from "express";
import { authenticateJWT } from "../../middleware/verifyToken.js";
import { getTimesheet, getTimesheetLimited, getService, getemployee, getTaskList, addTimesheet, editTimesheet, 
    deleteTimesheet, viewTimesheet, viewWeeklyTimesheet, updateWeeklyTimesheet } from "../../controller/task/timesheet.controller.js";

const tsRoutes = express.Router();

tsRoutes.use(authenticateJWT);

tsRoutes.get("/getTimesheet", getTimesheet);

tsRoutes.get("/getTimesheetLimited", getTimesheetLimited);

tsRoutes.post("/getService", getService);

tsRoutes.post("/getemployee", getemployee);

tsRoutes.post("/getTaskList", getTaskList);

tsRoutes.post("/addTimesheet", addTimesheet);

tsRoutes.post("/editTimesheet", editTimesheet);

tsRoutes.post("/deleteTimesheet", deleteTimesheet);

tsRoutes.post("/viewTimesheet", viewTimesheet);

tsRoutes.get("/viewWeeklyTimesheet", viewWeeklyTimesheet);

tsRoutes.post("/updateWeeklyTimesheet", updateWeeklyTimesheet);

export default tsRoutes;