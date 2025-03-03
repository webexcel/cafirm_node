import express from "express";
import { authenticateJWT } from "../../middleware/verifyToken.js";
import { getEmployees, addEmployee, editEmployee, deleteEmployee, getEmployeeDetails } from "../../controller/employee/employee.controller.js";

const employeeRoutes = express.Router();

employeeRoutes.use(authenticateJWT);

employeeRoutes.get("/getEmployees", getEmployees);

employeeRoutes.post("/addEmployee", addEmployee);

employeeRoutes.post("/editEmployee", editEmployee);

employeeRoutes.post("/deleteEmployee", deleteEmployee);

employeeRoutes.post("/getEmployeeDetails", getEmployeeDetails);

export default employeeRoutes;
