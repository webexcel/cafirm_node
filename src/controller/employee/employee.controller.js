import createKnexInstance from "../../../configs/db.js";
import { logger } from "../../../configs/winston.js";

export const getEmployees = async (req, res, next) => {
  let knex = null;
  try {
    const { dbname, user_name } = req.user;
  
    logger.info("Get Employees List Request Received", {
      username: user_name,
      reqdetails: "employee-getEmployees",
    });
  
    knex = await createKnexInstance(dbname);
  
    const getEmpResult = await knex('employees').select('employee_id', 'name', 'email', 'phone', 'role').where("status", "0");
  
    if (getEmpResult) {
      logger.info("Employees List retrieved successfully", {
        username: user_name,
        reqdetails: "employee-getEmployees",
      });
      return res.status(200).json({
        message: "Employees List retrieved successfully",
        data: getEmpResult,
        status: true,
      });
    } else {
      logger.warn("No Employees Details found", {
        username: user_name,
        reqdetails: "employee-getEmployees",
      });
      return res.status(404).json({
        message: "No Employees Details found",
        status: false,
      });
    }
  } catch (err) {
    logger.error("Error fetching Employees List", {
      error: err.message,
      username: req.user?.user_name,
      reqdetails: "employee-getEmployees",
    });
    next(err);
  } finally {
    if (knex) {
      knex.destroy();
    }
  }  
};

export const addEmployee = async (req, res, next) => {
    let knex = null;
    try {
      const { name, email, password, phone, role } = req.body;
      const { dbname, user_name } = req.user;
  
      logger.info("Add Employee Request Received", {
        username: user_name,
        reqdetails: "employee-addEmployee",
      });
  
      if (!name || !email || !password || !phone || !role) {
        logger.error("Mandatory fields are missing", {
          username: user_name,
          reqdetails: "employee-addEmployee",
        });
        return res.status(400).json({
          message: "Mandatory fields are missing",
          status: false,
        });
      }
  
      knex = await createKnexInstance(dbname);
  
      const insertEmpResult = await knex('employees')
        .insert({
            name : name,
            email : email,
            password_hash: password,
            phone: phone,
            role: role
        });
  
      if (insertEmpResult) {
        logger.info("Employee inserted successfully", {
          username: user_name,
          reqdetails: "employee-addEmployee",
        });
        return res.status(200).json({
          message: "Employee inserted successfully",
          status: true,
        });
      } else {
        logger.error("Failed to insert Employee", {
          username: user_name,
          reqdetails: "employee-addEmployee",
        });
        return res.status(500).json({
          message: "Failed to insert Employee",
          status: false,
        });
      }
    } catch (error) {
      console.error("Error inserting Employee:", error);
      next(error);
    } finally {
      if (knex) {
        knex.destroy();
      }
    }
  };

export const editEmployee = async (req, res, next) => {
    let knex = null;
    try {
      const { key, value, id } = req.body;
      const { dbname, user_name } = req.user;
  
      logger.info("Edit Employee Request Received", {
        username: user_name,
        reqdetails: "employee-editEmployee",
      });
  
      if (!id || !key || !value) {
        logger.error("Mandatory fields are missing for Edit Employee", {
          username: user_name,
          reqdetails: "employee-editEmployee",
        });
        return res.status(400).json({
          message: "Mandatory fields are missing",
          status: false,
        });
      }
  
      knex = await createKnexInstance(dbname);
      console.log(key, value);
      const updateResult = await knex("employees").update({ [key]: value }).where({ employee_id : id });

      if (updateResult) {
        logger.info("Employee updated successfully", {
          username: user_name,
          reqdetails: "employee-editEmployee",
        });
        return res.status(200).json({
          message: "Employee updated successfully",
          status: true,
        });
      } else {
        logger.error("Employee update failed", {
          username: user_name,
          reqdetails: "employee-editEmployee",
        });
        return res.status(404).json({
          message: "Employee update failed",
          status: false,
        });
      }
    } catch (error) {
      console.error("Error updating Employee:", error);
      next(error);
    } finally {
      if (knex) {
        knex.destroy();
      }
    }
};

export const deleteEmployee = async (req, res, next) => {
    let knex = null;
    try {
      const { id } = req.body;
      const { dbname, user_name } = req.user;
  
      logger.info("Delete Employee Request Received", {
        username: user_name,
        reqdetails: "employee-deleteEmployee",
      });
  
      if (!id) {
        logger.error("Mandatory fields are missing", {
          username: user_name,
          reqdetails: "employee-deleteEmployee",
        });
        return res.status(400).json({
          message: "Mandatory fields are missing",
          status: false,
        });
      }
  
      knex = await createKnexInstance(dbname);
  
      const deleteEmpRes = await knex("employees").update({ status: "1" }).where({ employee_id : id });
  
      if (deleteEmpRes) {
        logger.info("Employee deleted successfully", {
          username: user_name,
          reqdetails: "employee-deleteEmployee",
        });
        return res.status(200).json({
          message: "Employee deleted successfully",
          status: true,
        });
      } else {
        logger.error("Employee delete failed", {
          username: user_name,
          reqdetails: "employee-deleteEmployee",
        });
        return res.status(404).json({
          message: "Employee delete failed",
          status: false,
        });
      }
    } catch (err) {
      console.error("Error Deleting Employee:", err);
      next(err);
    } finally {
      if (knex) {
        knex.destroy();
      }
    }
};

export const getEmployeeDetails = async (req, res, next) => {
  let knex = null;
  try {
    const { id } = req.body;
    const { dbname, user_name } = req.user;
  
    logger.info("Get Employees Details Request Received", {
      username: user_name,
      reqdetails: "employee-getEmployeeDetails",
    });

    if (!id) {
      logger.error("Mandatory fields are missing", {
        username: user_name,
        reqdetails: "employee-getEmployeeDetails",
      });
      return res.status(400).json({
        message: "Mandatory fields are missing",
        status: false,
      });
    }
  
    knex = await createKnexInstance(dbname);
  
    const getEmpResult = await knex('employees').select('*').where({"status": "0", "employee_id": id});
  
    if (getEmpResult) {
      logger.info("Employees Details retrieved successfully", {
        username: user_name,
        reqdetails: "employee-getEmployeeDetails",
      });
      return res.status(200).json({
        message: "Employees Details retrieved successfully",
        data: getEmpResult,
        status: true,
      });
    } else {
      logger.warn("No Employees Details found", {
        username: user_name,
        reqdetails: "employee-getEmployeeDetails",
      });
      return res.status(404).json({
        message: "No Employees Details found",
        status: false,
      });
    }
  } catch (err) {
    logger.error("Error fetching Employees Details", {
      error: err.message,
      username: req.user?.user_name,
      reqdetails: "employee-getEmployeeDetails",
    });
    next(err);
  } finally {
    if (knex) {
      knex.destroy();
    }
  }  
};