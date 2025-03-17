import express from "express";
import { authenticateJWT } from "../../middleware/verifyToken.js";
import { getCalenderDetails, addEvent, editEvent, deleteEvent } from "../../controller/calender/calender.controller.js";

const calenderRoutes = express.Router();

calenderRoutes.use(authenticateJWT);

calenderRoutes.get("/getCalenderDetails", getCalenderDetails);

calenderRoutes.post("/addEvent", addEvent);

calenderRoutes.post("/editEvent", editEvent);

calenderRoutes.post("/deleteEvent", deleteEvent);

export default calenderRoutes;
