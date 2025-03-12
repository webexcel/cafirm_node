import express from "express";
import { authenticateJWT } from "../../middleware/verifyToken.js";
import { getServices, addService, editService, deleteService } from "../../controller/master/services.controller.js";

const servicesRoutes = express.Router();

servicesRoutes.use(authenticateJWT);

servicesRoutes.get("/getServices", getServices);

servicesRoutes.post("/addService", addService);

servicesRoutes.post("/editService", editService);

servicesRoutes.post("/deleteService", deleteService);

export default servicesRoutes;
