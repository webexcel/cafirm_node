import express from "express";
import { authenticateJWT } from "../../middleware/verifyToken.js";
import { getClientTimesheet, searchClientTimesheet } from "../../controller/timesheet/client.controller.js";

const clientTSRoutes = express.Router();

clientTSRoutes.use(authenticateJWT);

clientTSRoutes.get("/getClientTimesheet", getClientTimesheet);

clientTSRoutes.post("/searchClientTimesheet", searchClientTimesheet);

export default clientTSRoutes;