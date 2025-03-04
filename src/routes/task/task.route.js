import express from "express";
import { authenticateJWT } from "../../middleware/verifyToken.js";
import { getTasksByType, addTask, editTask, taskStatusUpdate, deleteTask } from "../../controller/task/task.controller.js";

const taskRoutes = express.Router();

taskRoutes.use(authenticateJWT);

taskRoutes.post("/getTasksByType", getTasksByType);

taskRoutes.post("/addTask", addTask);

taskRoutes.post("/editTask", editTask);

taskRoutes.post("/taskStatusUpdate", taskStatusUpdate);

taskRoutes.post("/deleteTask", deleteTask);

export default taskRoutes;