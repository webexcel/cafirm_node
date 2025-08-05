import express from "express";
import { authenticateJWT } from "../../middleware/verifyToken.js";
import { login, forgotPassword, resetPassword, getUserDetails } from "../../controller/authentication/auth.controller.js";

const authRoutes = express.Router();

authRoutes.post("/login", login);

authRoutes.post("/forgot_password", forgotPassword);

authRoutes.post("/reset_password", resetPassword);

authRoutes.get("/getUserDetails", authenticateJWT, getUserDetails);

export default authRoutes;
