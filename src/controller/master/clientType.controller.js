import createKnexInstance from "../../../configs/db.js";
import { logger } from "../../../configs/winston.js";

export const getClientType = async (req, res, next) => {
  let knex = null;
  try {
    const { dbname, user_name } = req.user;

    logger.info("Get Client Type List Request Received", {
      username: user_name,
      reqdetails: "master-getClientType",
    });

    knex = await createKnexInstance(dbname);

    const getDTResult = await knex('client_type').select('id', 'type_name').where("status", "0");

    if (getDTResult) {
      logger.info("Client Type List retrieved successfully", {
        username: user_name,
        reqdetails: "master-getClientType",
      });
      return res.status(200).json({
        message: "Client Type List retrieved successfully",
        data: getDTResult,
        status: true,
      });
    } else {
      logger.warn("No Client Type Details found", {
        username: user_name,
        reqdetails: "master-getClientType",
      });
      return res.status(404).json({
        message: "No Client Type Details found",
        status: false,
      });
    }
  } catch (err) {
    logger.error("Error fetching Client Type List", {
      error: err.message,
      username: req.user?.user_name,
      reqdetails: "master-getClientType",
    });
    next(err);
  } finally {
    if (knex) {
      await knex.destroy();
    }
  }
};

export const addClientType = async (req, res, next) => {
  let knex = null;
  try {
    const { client_type_name } = req.body;
    const { dbname, user_name } = req.user;

    logger.info("Add Client Type Request Received", {
      username: user_name,
      reqdetails: "master-addClientType",
    });

    if (!client_type_name || client_type_name.trim() === "") {
      logger.error("Mandatory fields are missing", {
        username: user_name,
        reqdetails: "master-addClientType",
      });
      return res.status(400).json({
        message: "Mandatory fields are missing",
        status: false,
      });
    }

    knex = await createKnexInstance(dbname);

    const existingDocType = await knex('client_type')
      .where(function () {
        this.where('type_name', client_type_name)
      })
      .andWhere('status', '0')
      .first();

    if (existingDocType) {
      logger.error("Duplicates in Client Type Entry", {
        username: user_name,
        reqdetails: "master-addClient",
      });
      return res.status(500).json({
        message: "Duplicates in Client Type Entry",
        status: false,
      });
    }

    const insertDocTypeRes = await knex('client_type')
      .insert({
        type_name: client_type_name
      });

    if (insertDocTypeRes) {
      logger.info("Client Type inserted successfully", {
        username: user_name,
        reqdetails: "master-addClientType",
      });
      return res.status(200).json({
        message: "Client Type inserted successfully",
        status: true,
      });
    } else {
      logger.error("Failed to insert Client Type", {
        username: user_name,
        reqdetails: "master-addClientType",
      });
      return res.status(500).json({
        message: "Failed to insert Client Type",
        status: false,
      });
    }
  } catch (error) {
    console.error("Error inserting Client Type:", error);
    next(error);
  } finally {
    if (knex) {
      await knex.destroy();
    }
  }
};

export const editClientType = async (req, res, next) => {
  let knex = null;
  try {
    const { id, client_type_name } = req.body;
    const { dbname, user_name } = req.user;

    logger.info("Edit Client Type Request Received", {
      username: user_name,
      reqdetails: "master-editClientType",
    });

    if (!id || !client_type_name || client_type_name.trim() === "") {
      logger.error("Mandatory fields are missing for Edit Client Type", {
        username: user_name,
        reqdetails: "master-editClientType",
      });
      return res.status(400).json({
        message: "Mandatory fields are missing",
        status: false,
      });
    }

    knex = await createKnexInstance(dbname);

    const updateResult = await knex("client_type").update({ type_name: client_type_name }).where({ id: id });

    if (updateResult) {
      logger.info("Client Type updated successfully", {
        username: user_name,
        reqdetails: "master-editClientType",
      });
      return res.status(200).json({
        message: "Client Type updated successfully",
        status: true,
      });
    } else {
      logger.error("Client Type update failed", {
        username: user_name,
        reqdetails: "master-editClientType",
      });
      return res.status(404).json({
        message: "Client Type update failed",
        status: false,
      });
    }
  } catch (error) {
    console.error("Error updating Client Type:", error);
    next(error);
  } finally {
    if (knex) {
      await knex.destroy();
    }
  }
};

export const deleteClientType = async (req, res, next) => {
  let knex = null;
  try {
    const { id } = req.body;
    const { dbname, user_name } = req.user;

    logger.info("Delete Client Type Request Received", {
      username: user_name,
      reqdetails: "master-deleteClientType",
    });

    if (!id) {
      logger.error("Mandatory fields are missing", {
        username: user_name,
        reqdetails: "master-deleteClientType",
      });
      return res.status(400).json({
        message: "Mandatory fields are missing",
        status: false,
      });
    }

    knex = await createKnexInstance(dbname);

    const deleteClientTypeRes = await knex("client_type").update({ status: "1" }).where({ id: id });

    if (deleteClientTypeRes) {
      logger.info("Client Type deleted successfully", {
        username: user_name,
        reqdetails: "master-deleteClientType",
      });
      return res.status(200).json({
        message: "Client Type deleted successfully",
        status: true,
      });
    } else {
      logger.error("Client Type delete failed", {
        username: user_name,
        reqdetails: "master-deleteClientType",
      });
      return res.status(404).json({
        message: "Client Type delete failed",
        status: false,
      });
    }
  } catch (err) {
    console.error("Error Deleting Client Type:", err);
    next(err);
  } finally {
    if (knex) {
      await knex.destroy();
    }
  }
};