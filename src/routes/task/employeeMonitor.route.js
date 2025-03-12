import express from "express";
import { authenticateJWT } from "../../middleware/verifyToken.js";
import { getAllEmployeeRecords, addRecord, statusUpdate, deleteRecord } from "../../controller/task/employeeMonitor.controller.js";

const employeeMonitorRoutes = express.Router();

employeeMonitorRoutes.use(authenticateJWT);

employeeMonitorRoutes.post("/getAllEmployeeRecords", getAllEmployeeRecords);

employeeMonitorRoutes.post("/addRecord", addRecord);

employeeMonitorRoutes.post("/statusUpdate", statusUpdate);

employeeMonitorRoutes.post("/deleteRecord", deleteRecord);

export default employeeMonitorRoutes;