import express from "express";
import authRoutes from "./authentication/auth.route.js";

const mainRoutes = express.Router();

mainRoutes.use("/auth", authRoutes);

export default mainRoutes;
