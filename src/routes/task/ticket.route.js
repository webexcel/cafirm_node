import express from "express";
import { authenticateJWT } from "../../middleware/verifyToken.js";
import { getTicketsByType, addTicket, editTicket, ticketStatusUpdate, deleteTicket } from "../../controller/task/ticket.controller.js";

const ticketRoutes = express.Router();

ticketRoutes.use(authenticateJWT);

ticketRoutes.post("/getTicketsByType", getTicketsByType);

ticketRoutes.post("/addTicket", addTicket);

ticketRoutes.post("/editTicket", editTicket);

ticketRoutes.post("/ticketStatusUpdate", ticketStatusUpdate);

ticketRoutes.post("/deleteTicket", deleteTicket);

export default ticketRoutes;