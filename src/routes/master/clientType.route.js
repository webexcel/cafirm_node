import express from "express";
import { authenticateJWT } from "../../middleware/verifyToken.js";
import { getClientType, addClientType, editClientType, deleteClientType } from "../../controller/master/clientType.controller.js";

const clientTypeRoutes = express.Router();

clientTypeRoutes.use(authenticateJWT);

clientTypeRoutes.get("/getClientType", getClientType);

clientTypeRoutes.post("/addClientType", addClientType);

clientTypeRoutes.post("/editClientType", editClientType);

clientTypeRoutes.post("/deleteClientType", deleteClientType);

export default clientTypeRoutes;