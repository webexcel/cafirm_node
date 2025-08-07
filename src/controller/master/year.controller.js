import createKnexInstance from "../../../configs/db.js";
import { logger } from "../../../configs/winston.js";

export const getYearList = async (req, res, next) => {
  let knex = null;
  try {
    const { dbname, user_name } = req.user;

    logger.info("Get Year List Request Received", {
      username: user_name,
      reqdetails: "master-getYearList",
    });

    knex = await createKnexInstance(dbname);

    const getYearResult = await knex('year').select('*').where("status", "0");

    if (getYearResult) {
      logger.info("Year List retrieved successfully", {
        username: user_name,
        reqdetails: "master-getYearList",
      });
      return res.status(200).json({
        message: "Year List retrieved successfully",
        data: getYearResult,
        status: true,
      });
    } else {
      logger.warn("No Year Details found", {
        username: user_name,
        reqdetails: "master-getYearList",
      });
      return res.status(404).json({
        message: "No Year Details found",
        status: false,
      });
    }
  } catch (err) {
    logger.error("Error fetching Year List", {
      error: err.message,
      username: req.user?.user_name,
      reqdetails: "master-getYearList",
    });
    next(err);
  } finally {
    if (knex) {
      await knex.destroy();
    }
  }
};

export const addYear = async (req, res, next) => {
  let knex = null;
  try {
    const { year } = req.body;
    const { dbname, user_name } = req.user;

    logger.info("Add Year Request Received", {
      username: user_name,
      reqdetails: "master-addYear",
    });

    if (!year || year.trim() === "") {
      logger.error("Mandatory fields are missing", {
        username: user_name,
        reqdetails: "master-addYear",
      });
      return res.status(400).json({
        message: "Mandatory fields are missing",
        status: false,
      });
    }

    knex = await createKnexInstance(dbname);

    const existingYear = await knex('year')
      .where(function () {
        this.where('year', year)
      })
      .andWhere('status', '0')
      .first();

    if (existingYear) {
      logger.error("Duplicates in Year Entry", {
        username: user_name,
        reqdetails: "master-addClient",
      });
      return res.status(500).json({
        message: "Duplicates in Year Entry for Year: " + year,
        status: false,
      });
    }

    const insertYearRes = await knex('year')
      .insert({
        year: year,
      });

    if (insertYearRes) {
      logger.info("Year inserted successfully", {
        username: user_name,
        reqdetails: "master-addYear",
      });
      return res.status(200).json({
        message: "Year inserted successfully",
        status: true,
      });
    } else {
      logger.error("Failed to insert Year", {
        username: user_name,
        reqdetails: "master-addYear",
      });
      return res.status(500).json({
        message: "Failed to insert Year",
        status: false,
      });
    }
  } catch (error) {
    console.error("Error inserting Year:", error);
    next(error);
  } finally {
    if (knex) {
      await knex.destroy();
    }
  }
};

export const editYear = async (req, res, next) => {
  let knex = null;
  try {
    const { id, year } = req.body;
    const { dbname, user_name } = req.user;

    logger.info("Edit Year Request Received", {
      username: user_name,
      reqdetails: "master-editYear",
    });

    if (!id || !year || year.trim() === "") {
      logger.error("Mandatory fields are missing for Edit Year", {
        username: user_name,
        reqdetails: "master-editYear",
      });
      return res.status(400).json({
        message: "Mandatory fields are missing",
        status: false,
      });
    }

    knex = await createKnexInstance(dbname);

    const updateResult = await knex("year").update({ year: year }).where({ id: id });

    if (updateResult) {
      logger.info("Year updated successfully", {
        username: user_name,
        reqdetails: "master-editYear",
      });
      return res.status(200).json({
        message: "Year updated successfully",
        status: true,
      });
    } else {
      logger.error("Year update failed", {
        username: user_name,
        reqdetails: "master-editYear",
      });
      return res.status(404).json({
        message: "Year update failed",
        status: false,
      });
    }
  } catch (error) {
    console.error("Error updating Year:", error);
    next(error);
  } finally {
    if (knex) {
      await knex.destroy();
    }
  }
};

export const deleteYear = async (req, res, next) => {
  let knex = null;
  try {
    const { id } = req.body;
    const { dbname, user_name } = req.user;

    logger.info("Delete Year Request Received", {
      username: user_name,
      reqdetails: "master-deleteYear",
    });

    if (!id) {
      logger.error("Mandatory fields are missing", {
        username: user_name,
        reqdetails: "master-deleteYear",
      });
      return res.status(400).json({
        message: "Mandatory fields are missing",
        status: false,
      });
    }

    knex = await createKnexInstance(dbname);

    const deleteYearRes = await knex("year").update({ status: "1" }).where({ id: id });

    if (deleteYearRes) {
      logger.info("Year deleted successfully", {
        username: user_name,
        reqdetails: "master-deleteYear",
      });
      return res.status(200).json({
        message: "Year deleted successfully",
        status: true,
      });
    } else {
      logger.error("Year delete failed", {
        username: user_name,
        reqdetails: "master-deleteYear",
      });
      return res.status(404).json({
        message: "Year delete failed",
        status: false,
      });
    }
  } catch (err) {
    console.error("Error Deleting Year:", err);
    next(err);
  } finally {
    if (knex) {
      await knex.destroy();
    }
  }
};