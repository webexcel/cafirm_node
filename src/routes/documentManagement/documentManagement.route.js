import express from "express";
import { authenticateJWT } from "../../middleware/verifyToken.js";
import { getDocuments, addDocument, deleteDocument, downloadDocument } from "../../controller/documentManagement/documentManagement.controller.js";

const documentManagementRoutes = express.Router();

documentManagementRoutes.use(authenticateJWT);

documentManagementRoutes.get("/getDocuments", getDocuments);

documentManagementRoutes.post("/addDocument", addDocument);

documentManagementRoutes.post("/deleteDocument", deleteDocument);

documentManagementRoutes.post("/downloadDocument", downloadDocument);

export default documentManagementRoutes;