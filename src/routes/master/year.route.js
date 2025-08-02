import express from "express";
import { authenticateJWT } from "../../middleware/verifyToken.js";
import { getYearList, addYear, editYear, deleteYear } from "../../controller/master/year.controller.js";

const yearRoutes = express.Router();

yearRoutes.use(authenticateJWT);

yearRoutes.get("/getYearList", getYearList);

yearRoutes.post("/addYear", addYear);

yearRoutes.post("/editYear", editYear);

yearRoutes.post("/deleteYear", deleteYear);

export default yearRoutes;
