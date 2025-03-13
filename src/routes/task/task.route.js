import express from "express";
import { authenticateJWT } from "../../middleware/verifyToken.js";
import { getTasksByType, getTasksByPriority, addTask, editTask, taskStatusUpdate, deleteTask } from "../../controller/task/task.controller.js";

const taskRoutes = express.Router();

taskRoutes.use(authenticateJWT);

taskRoutes.post("/getTasksByType", getTasksByType);
// Get Tash By Type and Employee order by Priority asc
// Get Task By Type and Client order by Priority asc
// Get Task by Type only -- Default order by Priority asc

taskRoutes.get("/getTasksByPriority", getTasksByPriority);

taskRoutes.post("/addTask", addTask);
// Add client Id, Service
// Employees in seperate Table

taskRoutes.post("/editTask", editTask);

taskRoutes.post("/taskStatusUpdate", taskStatusUpdate);

taskRoutes.post("/deleteTask", deleteTask);

export default taskRoutes;