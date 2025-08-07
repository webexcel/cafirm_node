import createKnexInstance from "../../../configs/db.js";
import { logger } from "../../../configs/winston.js";

export const getDocumentType = async (req, res, next) => {
  let knex = null;
  try {
    const { dbname, user_name } = req.user;

    logger.info("Get Document Type List Request Received", {
      username: user_name,
      reqdetails: "master-getDocumentType",
    });

    knex = await createKnexInstance(dbname);

    const getDTResult = await knex('document_type').select('id', 'type_name').where("status", "0");

    if (getDTResult) {
      logger.info("Document Type List retrieved successfully", {
        username: user_name,
        reqdetails: "master-getDocumentType",
      });
      return res.status(200).json({
        message: "Document Type List retrieved successfully",
        data: getDTResult,
        status: true,
      });
    } else {
      logger.warn("No Document Type Details found", {
        username: user_name,
        reqdetails: "master-getDocumentType",
      });
      return res.status(404).json({
        message: "No Document Type Details found",
        status: false,
      });
    }
  } catch (err) {
    logger.error("Error fetching Document Type List", {
      error: err.message,
      username: req.user?.user_name,
      reqdetails: "master-getDocumentType",
    });
    next(err);
  } finally {
    if (knex) {
      await knex.destroy();
    }
  }
};

export const addDocumentType = async (req, res, next) => {
  let knex = null;
  try {
    const { document_type } = req.body;
    const { dbname, user_name } = req.user;

    logger.info("Add Document Type Request Received", {
      username: user_name,
      reqdetails: "master-addDocumentType",
    });

    if (!document_type || document_type.trim() === "") {
      logger.error("Mandatory fields are missing", {
        username: user_name,
        reqdetails: "master-addDocumentType",
      });
      return res.status(400).json({
        message: "Mandatory fields are missing",
        status: false,
      });
    }

    knex = await createKnexInstance(dbname);

    const existingDocType = await knex('document_type')
      .where(function () {
        this.where('type_name', document_type)
      })
      .andWhere('status', '0')
      .first();

    if (existingDocType) {
      logger.error("Duplicates in Document Type Entry", {
        username: user_name,
        reqdetails: "master-addClient",
      });
      return res.status(500).json({
        message: "Duplicates in Document Type Entry",
        status: false,
      });
    }

    const insertDocTypeRes = await knex('document_type')
      .insert({
        type_name: document_type
      });

    if (insertDocTypeRes) {
      logger.info("Document Type inserted successfully", {
        username: user_name,
        reqdetails: "master-addDocumentType",
      });
      return res.status(200).json({
        message: "Document Type inserted successfully",
        status: true,
      });
    } else {
      logger.error("Failed to insert Document Type", {
        username: user_name,
        reqdetails: "master-addDocumentType",
      });
      return res.status(500).json({
        message: "Failed to insert Document Type",
        status: false,
      });
    }
  } catch (error) {
    console.error("Error inserting Document Type:", error);
    next(error);
  } finally {
    if (knex) {
      await knex.destroy();
    }
  }
};

export const editDocumentType = async (req, res, next) => {
  let knex = null;
  try {
    const { id, document_type } = req.body;
    const { dbname, user_name } = req.user;

    logger.info("Edit Document Type Request Received", {
      username: user_name,
      reqdetails: "master-editDocumentType",
    });

    if (!id || !document_type || document_type.trim() === "") {
      logger.error("Mandatory fields are missing for Edit Document Type", {
        username: user_name,
        reqdetails: "master-editDocumentType",
      });
      return res.status(400).json({
        message: "Mandatory fields are missing",
        status: false,
      });
    }

    knex = await createKnexInstance(dbname);

    const updateResult = await knex("document_type").update({ type_name: document_type }).where({ id: id });

    if (updateResult) {
      logger.info("Document Type updated successfully", {
        username: user_name,
        reqdetails: "master-editDocumentType",
      });
      return res.status(200).json({
        message: "Document Type updated successfully",
        status: true,
      });
    } else {
      logger.error("Document Type update failed", {
        username: user_name,
        reqdetails: "master-editDocumentType",
      });
      return res.status(404).json({
        message: "Document Type update failed",
        status: false,
      });
    }
  } catch (error) {
    console.error("Error updating Document Type:", error);
    next(error);
  } finally {
    if (knex) {
      await knex.destroy();
    }
  }
};

export const deleteDocumentType = async (req, res, next) => {
  let knex = null;
  try {
    const { id } = req.body;
    const { dbname, user_name } = req.user;

    logger.info("Delete Document Type Request Received", {
      username: user_name,
      reqdetails: "master-deleteDocumentType",
    });

    if (!id) {
      logger.error("Mandatory fields are missing", {
        username: user_name,
        reqdetails: "master-deleteDocumentType",
      });
      return res.status(400).json({
        message: "Mandatory fields are missing",
        status: false,
      });
    }

    knex = await createKnexInstance(dbname);

    const deleteDocumentTypeRes = await knex("document_type").update({ status: "1" }).where({ id: id });

    if (deleteDocumentTypeRes) {
      logger.info("Document Type deleted successfully", {
        username: user_name,
        reqdetails: "master-deleteDocumentType",
      });
      return res.status(200).json({
        message: "Document Type deleted successfully",
        status: true,
      });
    } else {
      logger.error("Document Type delete failed", {
        username: user_name,
        reqdetails: "master-deleteDocumentType",
      });
      return res.status(404).json({
        message: "Document Type delete failed",
        status: false,
      });
    }
  } catch (err) {
    console.error("Error Deleting Document Type:", err);
    next(err);
  } finally {
    if (knex) {
      await knex.destroy();
    }
  }
};