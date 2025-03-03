import createKnexInstance from "../../../configs/db.js";
import { logger } from "../../../configs/winston.js";

export const getClients = async (req, res, next) => {
  let knex = null;
  try {
    const { dbname, user_name } = req.user;
  
    logger.info("Get Clients List Request Received", {
      username: user_name,
      reqdetails: "client-getClients",
    });
  
    knex = await createKnexInstance(dbname);
  
    const getClientRes = await knex('clients').select('*').where("status", "0");
  
    if (getClientRes) {
      logger.info("Clients List retrieved successfully", {
        username: user_name,
        reqdetails: "client-getClients",
      });
      return res.status(200).json({
        message: "Clients List retrieved successfully",
        data: getClientRes,
        status: true,
      });
    } else {
      logger.warn("No Clients Details found", {
        username: user_name,
        reqdetails: "client-getClients",
      });
      return res.status(404).json({
        message: "No Clients Details found",
        status: false,
      });
    }
  } catch (err) {
    logger.error("Error fetching Clients List", {
      error: err.message,
      username: req.user?.user_name,
      reqdetails: "client-getClients",
    });
    next(err);
  } finally {
    if (knex) {
      knex.destroy();
    }
  }  
};

export const addClient = async (req, res, next) => {
    let knex = null;
    try {
      const { name, type, cont_person, mail, phone, address, city, state, country, pin, gst_num, pan_num, tan_num, incop_date, fin_start, fin_end } = req.body;
      const { dbname, user_name } = req.user;
  
      logger.info("Add Client Request Received", {
        username: user_name,
        reqdetails: "client-addClient",
      });
  
      if (!name || !type || !cont_person || !mail || !phone) {
        logger.error("Mandatory fields are missing", {
          username: user_name,
          reqdetails: "client-addClient",
        });
        return res.status(400).json({
          message: "Mandatory fields are missing",
          status: false,
        });
      }
  
      knex = await createKnexInstance(dbname);
  
      const insertEmpResult = await await knex('clients').insert({
          client_name: name,
          client_type: type,
          contact_person: cont_person,
          email: mail,
          phone: phone,
          address: address,
          city: city,
          state: state,
          country: country,
          pincode: pin,
          gst_number: gst_num,
          pan_number: pan_num,
          tan_number: tan_num,
          incorporation_date: incop_date,
          financial_year_start: fin_start,
          financial_year_end: fin_end
        });
  
      if (insertEmpResult) {
        logger.info("Client inserted successfully", {
          username: user_name,
          reqdetails: "client-addClient",
        });
        return res.status(200).json({
          message: "Client inserted successfully",
          status: true,
        });
      } else {
        logger.error("Failed to insert Client", {
          username: user_name,
          reqdetails: "client-addClient",
        });
        return res.status(500).json({
          message: "Failed to insert Client",
          status: false,
        });
      }
    } catch (error) {
      console.error("Error inserting Client:", error);
      next(error);
    } finally {
      if (knex) {
        knex.destroy();
      }
    }
  };

export const editClient = async (req, res, next) => {
    let knex = null;
    try {
      const { key, value, id } = req.body;
      const { dbname, user_name } = req.user;
  
      logger.info("Edit Employee Request Received", {
        username: user_name,
        reqdetails: "client-editEmployee",
      });
  
      if (!id || !key || !value) {
        logger.error("Mandatory fields are missing for Edit Employee", {
          username: user_name,
          reqdetails: "client-editEmployee",
        });
        return res.status(400).json({
          message: "Mandatory fields are missing",
          status: false,
        });
      }
  
      knex = await createKnexInstance(dbname);
      console.log(key, value);
      const updateResult = await knex('clients').update({ [key]: value }).where({ employee_id : id });

      if (updateResult) {
        logger.info("Employee updated successfully", {
          username: user_name,
          reqdetails: "client-editEmployee",
        });
        return res.status(200).json({
          message: "Employee updated successfully",
          status: true,
        });
      } else {
        logger.error("Employee update failed", {
          username: user_name,
          reqdetails: "client-editEmployee",
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

export const deleteClient = async (req, res, next) => {
    let knex = null;
    try {
      const { id } = req.body;
      const { dbname, user_name } = req.user;
  
      logger.info("Delete Client Request Received", {
        username: user_name,
        reqdetails: "client-deleteClient",
      });
  
      if (!id) {
        logger.error("Mandatory fields are missing", {
          username: user_name,
          reqdetails: "client-deleteClient",
        });
        return res.status(400).json({
          message: "Mandatory fields are missing",
          status: false,
        });
      }
  
      knex = await createKnexInstance(dbname);
  
      const deleteEmpRes = await knex('clients').update({ status: "1" }).where({ client_id : id });
  
      if (deleteEmpRes) {
        logger.info("Client deleted successfully", {
          username: user_name,
          reqdetails: "client-deleteClient",
        });
        return res.status(200).json({
          message: "Client deleted successfully",
          status: true,
        });
      } else {
        logger.error("Client delete failed", {
          username: user_name,
          reqdetails: "client-deleteClient",
        });
        return res.status(404).json({
          message: "Client delete failed",
          status: false,
        });
      }
    } catch (err) {
      console.error("Error Deleting Client:", err);
      next(err);
    } finally {
      if (knex) {
        knex.destroy();
      }
    }
};