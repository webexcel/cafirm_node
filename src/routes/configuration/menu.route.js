import express from "express";
import { authenticateJWT } from "../../middleware/verifyToken.js";
import { getMenuList, addMenu, addMenuOperations } from "../../controller/configuration/menu.controller.js";

const menuRoutes = express.Router();

menuRoutes.use(authenticateJWT);

menuRoutes.get("/getMenuList", getMenuList);

menuRoutes.post("/addMenu", addMenu);

menuRoutes.post("/addMenuOperations", addMenuOperations);

export default menuRoutes;