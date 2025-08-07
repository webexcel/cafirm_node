import express from "express";
import { authenticateJWT } from "../../middleware/verifyToken.js";
import {
    getEmployees, getEmployeesByPermission, addEmployee, editEmployee, deleteEmployee, getEmployeeDetails,
    updatePassword, resetPassword, addUserAccount, getEmployeesNotPassword, getUserAccounts
} from "../../controller/employee/employee.controller.js";

const employeeRoutes = express.Router();

employeeRoutes.use(authenticateJWT);

employeeRoutes.get("/getEmployees", getEmployees);

employeeRoutes.post("/getEmployeesByPermission", getEmployeesByPermission);

employeeRoutes.post("/addEmployee", addEmployee);

employeeRoutes.post("/editEmployee", editEmployee);

employeeRoutes.post("/deleteEmployee", deleteEmployee);

employeeRoutes.post("/getEmployeeDetails", getEmployeeDetails);

employeeRoutes.post("/updatePassword", updatePassword);

employeeRoutes.post("/resetPassword", resetPassword);

employeeRoutes.post("/addUserAccount", addUserAccount);

employeeRoutes.get("/getEmployeesNotPassword", getEmployeesNotPassword);

employeeRoutes.get("/getUserAccounts", getUserAccounts);

export default employeeRoutes;
