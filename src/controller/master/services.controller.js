import createKnexInstance from "../../../configs/db.js";
import { logger } from "../../../configs/winston.js";

export const getServices = async (req, res, next) => {
  let knex = null;
  try {
    const { dbname, user_name } = req.user;

    logger.info("Get Services List Request Received", {
      username: user_name,
      reqdetails: "master-getServices",
    });

    knex = await createKnexInstance(dbname);

    const getServiceResult = await knex('services').select('service_id', 'service_name', 'service_short_name').where("status", "0");

    if (getServiceResult) {
      logger.info("Services List retrieved successfully", {
        username: user_name,
        reqdetails: "master-getServices",
      });
      return res.status(200).json({
        message: "Services List retrieved successfully",
        data: getServiceResult,
        status: true,
      });
    } else {
      logger.warn("No Services Details found", {
        username: user_name,
        reqdetails: "master-getServices",
      });
      return res.status(404).json({
        message: "No Services Details found",
        status: false,
      });
    }
  } catch (err) {
    logger.error("Error fetching Services List", {
      error: err.message,
      username: req.user?.user_name,
      reqdetails: "master-getServices",
    });
    next(err);
  } finally {
    if (knex) {
      knex.destroy();
    }
  }
};

export const addService = async (req, res, next) => {
  let knex = null;
  try {
    const { service_name, short_name } = req.body;
    const { dbname, user_name } = req.user;

    logger.info("Add Service Request Received", {
      username: user_name,
      reqdetails: "master-addService",
    });

    if (!service_name || service_name.trim() === "" || !short_name || short_name.trim() === "") {
      logger.error("Mandatory fields are missing", {
        username: user_name,
        reqdetails: "master-addService",
      });
      return res.status(400).json({
        message: "Mandatory fields are missing",
        status: false,
      });
    }

    knex = await createKnexInstance(dbname);

    const existingService = await knex('services')
      .where(function () {
        this.where('service_name', service_name)
      })
      .andWhere('status', '0')
      .first();

    if (existingService) {
      logger.error("Duplicates in Service Entry", {
        username: user_name,
        reqdetails: "client-addClient",
      });
      return res.status(500).json({
        message: "Duplicates in Service Entry for Service_Name",
        status: false,
      });
    }

    const insertServiceRes = await knex('services')
      .insert({
        service_name: service_name,
        service_short_name: short_name
      });

    if (insertServiceRes) {
      logger.info("Service inserted successfully", {
        username: user_name,
        reqdetails: "master-addService",
      });
      return res.status(200).json({
        message: "Service inserted successfully",
        status: true,
      });
    } else {
      logger.error("Failed to insert Service", {
        username: user_name,
        reqdetails: "master-addService",
      });
      return res.status(500).json({
        message: "Failed to insert Service",
        status: false,
      });
    }
  } catch (error) {
    console.error("Error inserting Service:", error);
    next(error);
  } finally {
    if (knex) {
      knex.destroy();
    }
  }
};

export const editService = async (req, res, next) => {
  let knex = null;
  try {
    const { id, service_name, short_name } = req.body;
    const { dbname, user_name } = req.user;

    logger.info("Edit Service Request Received", {
      username: user_name,
      reqdetails: "master-editService",
    });

    if (!id || !service_name || !short_name) {
      logger.error("Mandatory fields are missing for Edit Employee", {
        username: user_name,
        reqdetails: "master-editService",
      });
      return res.status(400).json({
        message: "Mandatory fields are missing",
        status: false,
      });
    }

    knex = await createKnexInstance(dbname);

    const updateResult = await knex("services").update({ service_name: service_name, service_short_name: short_name }).where({ service_id: id });

    if (updateResult) {
      logger.info("Service updated successfully", {
        username: user_name,
        reqdetails: "master-editService",
      });
      return res.status(200).json({
        message: "Service updated successfully",
        status: true,
      });
    } else {
      logger.error("Service update failed", {
        username: user_name,
        reqdetails: "master-editService",
      });
      return res.status(404).json({
        message: "Service update failed",
        status: false,
      });
    }
  } catch (error) {
    console.error("Error updating Service:", error);
    next(error);
  } finally {
    if (knex) {
      knex.destroy();
    }
  }
};

export const deleteService = async (req, res, next) => {
  let knex = null;
  try {
    const { id } = req.body;
    const { dbname, user_name } = req.user;

    logger.info("Delete Service Request Received", {
      username: user_name,
      reqdetails: "master-deleteService",
    });

    if (!id) {
      logger.error("Mandatory fields are missing", {
        username: user_name,
        reqdetails: "master-deleteService",
      });
      return res.status(400).json({
        message: "Mandatory fields are missing",
        status: false,
      });
    }

    knex = await createKnexInstance(dbname);

    const deleteServiceRes = await knex("services").update({ status: "1" }).where({ service_id: id });

    if (deleteServiceRes) {
      logger.info("Service deleted successfully", {
        username: user_name,
        reqdetails: "master-deleteService",
      });
      return res.status(200).json({
        message: "Service deleted successfully",
        status: true,
      });
    } else {
      logger.error("Service delete failed", {
        username: user_name,
        reqdetails: "master-deleteService",
      });
      return res.status(404).json({
        message: "Service delete failed",
        status: false,
      });
    }
  } catch (err) {
    console.error("Error Deleting Service:", err);
    next(err);
  } finally {
    if (knex) {
      knex.destroy();
    }
  }
};