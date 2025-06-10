import express from "express";
import { authenticateJWT } from "../../middleware/verifyToken.js";
import { getDocuments, addDocument, deleteDocument } from "../../controller/documentManagement/documentManagement.controller.js";

const documentManagementRoutes = express.Router();

documentManagementRoutes.use(authenticateJWT);

documentManagementRoutes.get("/getDocuments", getDocuments);

documentManagementRoutes.post("/addDocument", addDocument);

documentManagementRoutes.post("/deleteDocument", deleteDocument);

export default documentManagementRoutes;