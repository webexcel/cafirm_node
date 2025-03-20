import express from "express";
import { authenticateJWT } from "../../middleware/verifyToken.js";
import { getCalendarDetails, addEvent, editEvent, deleteEvent } from "../../controller/calendar/calendar.controller.js";

const calendarRoutes = express.Router();

calendarRoutes.use(authenticateJWT);

calendarRoutes.get("/getCalendarDetails", getCalendarDetails);

calendarRoutes.post("/addEvent", addEvent);

calendarRoutes.post("/editEvent", editEvent);

calendarRoutes.post("/deleteEvent", deleteEvent);

export default calendarRoutes;
