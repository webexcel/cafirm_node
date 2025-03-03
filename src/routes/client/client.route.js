import express from "express";
import { authenticateJWT } from "../../middleware/verifyToken.js";
import { getClients, addClient, editClient, deleteClient, getClientDetails } from "../../controller/client/client.controller.js";

const clientRoutes = express.Router();

clientRoutes.use(authenticateJWT);

clientRoutes.get("/getClients", getClients);

clientRoutes.post("/addClient", addClient);

clientRoutes.post("/editClient", editClient);

clientRoutes.post("/deleteClient", deleteClient);

clientRoutes.post("/getClientDetails", getClientDetails);

export default clientRoutes;
