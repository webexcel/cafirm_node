import express from "express";
import { authenticateJWT } from "../../middleware/verifyToken.js";
import { getAttendance, loginAttendance, logoutAttendance, getAttendanceByDate, checkTodayAttendance } from "../../controller/attendance/attendance.controller.js";

const attendanceRoutes = express.Router();

attendanceRoutes.use(authenticateJWT);

attendanceRoutes.post("/getAttendance", getAttendance);

attendanceRoutes.post("/loginAttendance", loginAttendance);

attendanceRoutes.post("/logoutAttendance", logoutAttendance);

attendanceRoutes.post("/getAttendanceByDate", getAttendanceByDate);

attendanceRoutes.post("/checkTodayAttendance", checkTodayAttendance);

export default attendanceRoutes;
