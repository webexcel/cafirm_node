import express from "express";
import { authenticateJWT } from "../../middleware/verifyToken.js";
import { getTimesheet, addTimesheet, deleteTimesheet } from "../../controller/task/timesheet.controller.js";

const tsRoutes = express.Router();

tsRoutes.use(authenticateJWT);

tsRoutes.get("/getTimesheet", getTimesheet);

tsRoutes.post("/addTimesheet", addTimesheet);

tsRoutes.post("/deleteTimesheet", deleteTimesheet);

export default tsRoutes;