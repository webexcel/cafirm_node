import express, { json } from "express";
import cors from "cors";
import compression from 'compression';
import mainRoutes from "./src/routes/mainRoute.js";
import { logger } from "./configs/winston.js";
import { HttpError } from "./src/models/http-error.js";
import path from 'path';
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 3000;

const profilesDir = path.resolve(process.env.Folder_Path + "\\profiles");

const app = express();

// const allowedOrigins = [
//   'http://cafirm.webexcel.in',
//   'https://cafirm.webexcel.in',
// 'http://localhost:5173',
// ];

//profile images
app.use('/profiles', express.static(profilesDir));

app.use(cors("*"));

app.use(express.json({ limit: "4096mb", extended: true }));

app.use(compression({ level: 6 }));


app.get("/", (req, res) => {
  res.json({ message: "Project is running" });
});

app.use("/api", mainRoutes);

app.use((req, res, next) => {
  const error = new HttpError("Could not find this route.", 404);
  throw error;
});

app.use((error, req, res, next) => {
  if(process.env?.NODE_ENV?.toLowerCase() === 'development'){
     console.log(error);
  }
  res.status(error.code || 500);
  logger.error(error.message, { reqdetails: "Server" });
  res.json({
     message: error.message || "An unknown error occurred in the server!",
     stack: error.stack,
  });
});

app.listen(PORT, () => {
  console.log(`server running on the port -------------- ${PORT}`);
});
