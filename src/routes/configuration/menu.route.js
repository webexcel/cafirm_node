import express from "express";
import { authenticateJWT } from "../../middleware/verifyToken.js";
import { getMenuList, addMenu, addMenuOperations, getOperationList, getOperationMappedList, updateMenu, deleteMenu } from "../../controller/configuration/menu.controller.js";

const menuRoutes = express.Router();

menuRoutes.use(authenticateJWT);

menuRoutes.get("/getMenuList", getMenuList);

menuRoutes.post("/addMenu", addMenu);

menuRoutes.post("/addMenuOperations", addMenuOperations);

menuRoutes.post("/getOperationList", getOperationList);

menuRoutes.get("/getOperationMappedList", getOperationMappedList);

menuRoutes.post("/updateMenu", updateMenu);

menuRoutes.post("/deleteMenu", deleteMenu);

export default menuRoutes;