import express from "express";
import { authenticateJWT } from "../../middleware/verifyToken.js";
import { getLeaveList, addLeave, updateLeave, deleteLeave, updateLeaveStatus } from "../../controller/leaveRequest/leaveRequest.controller.js";

const leaveRequestRoutes = express.Router();

leaveRequestRoutes.use(authenticateJWT);

leaveRequestRoutes.get("/getLeaveList", getLeaveList);

leaveRequestRoutes.post("/addLeave", addLeave);

leaveRequestRoutes.post("/updateLeave", updateLeave);

leaveRequestRoutes.post("/deleteLeave", deleteLeave);

leaveRequestRoutes.post("/updateLeaveStatus", updateLeaveStatus);

export default leaveRequestRoutes;