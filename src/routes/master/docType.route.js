import express from "express";
import { authenticateJWT } from "../../middleware/verifyToken.js";
import { getDocumentType, addDocumentType, editDocumentType, deleteDocumentType } from "../../controller/master/docType.controller.js";

const docTypeRoutes = express.Router();

docTypeRoutes.use(authenticateJWT);

docTypeRoutes.get("/getDocumentType", getDocumentType);

docTypeRoutes.post("/addDocumentType", addDocumentType);

docTypeRoutes.post("/editDocumentType", editDocumentType);

docTypeRoutes.post("/deleteDocumentType", deleteDocumentType);

export default docTypeRoutes;