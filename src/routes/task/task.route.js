import express from "express";
import { authenticateJWT } from "../../middleware/verifyToken.js";
import { getTasksByType, getTasksByPriority, getServicesForTask, addTask, editTask, taskStatusUpdate, deleteTask, 
    getViewTasks, getLatestTasks, getPartners } from "../../controller/task/task.controller.js";

const taskRoutes = express.Router();

taskRoutes.use(authenticateJWT);

taskRoutes.post("/getTasksByType", getTasksByType);

taskRoutes.get("/getTasksByPriority", getTasksByPriority);

taskRoutes.post("/getServicesForTask", getServicesForTask);

taskRoutes.post("/addTask", addTask);

taskRoutes.post("/editTask", editTask);

taskRoutes.post("/taskStatusUpdate", taskStatusUpdate);

taskRoutes.post("/deleteTask", deleteTask);

taskRoutes.post("/getViewTasks", getViewTasks);

taskRoutes.get("/getLatestTasks", getLatestTasks);

taskRoutes.get("/getPartners", getPartners);

export default taskRoutes;