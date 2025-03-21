import express from "express";
import { login, forgotPassword, resetPassword} from "../../controller/authentication/auth.controller.js";
const authRoutes = express.Router();

authRoutes.post("/login", login);

authRoutes.post("/forgot_password", forgotPassword);

authRoutes.post("/reset_password", resetPassword);

export default authRoutes;
