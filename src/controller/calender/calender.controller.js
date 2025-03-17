import createKnexInstance from "../../../configs/db.js";
import { logger } from "../../../configs/winston.js";

export const getCalenderDetails = async (req, res, next) => {
  let knex = null;
  try {
    const { dbname, user_name } = req.user;

    logger.info("Get Events List Request Received", {
      username: user_name,
      reqdetails: "calender-getCalenderDetails",
    });

    knex = await createKnexInstance(dbname);

    const getCalenderResult = await knex('calendar').select('*').where("status", "0");

    if (getCalenderResult) {
      logger.info("Events List retrieved successfully", {
        username: user_name,
        reqdetails: "calender-getCalenderDetails",
      });
      return res.status(200).json({
        message: "Events List retrieved successfully",
        data: getCalenderResult,
        status: true,
      });
    } else {
      logger.warn("No Events Details found", {
        username: user_name,
        reqdetails: "calender-getCalenderDetails",
      });
      return res.status(404).json({
        message: "No Events Details found",
        status: false,
      });
    }
  } catch (err) {
    logger.error("Error fetching Events List", {
      error: err.message,
      username: req.user?.user_name,
      reqdetails: "calender-getCalenderDetails",
    });
    next(err);
  } finally {
    if (knex) {
      knex.destroy();
    }
  }
};

export const addEvent = async (req, res, next) => {
  let knex = null;
  try {
    const { title, description, start_date, end_date } = req.body;
    const { dbname, user_name } = req.user;

    logger.info("Add Event Request Received", {
      username: user_name,
      reqdetails: "calender-addEvent",
    });

    if (!title || title.trim() === "" || !start_date || !end_date) {
      logger.error("Mandatory fields are missing", {
        username: user_name,
        reqdetails: "calender-addEvent",
      });
      return res.status(400).json({
        message: "Mandatory fields are missing",
        status: false,
      });
    }

    knex = await createKnexInstance(dbname);

    const existingEvent = await knex('calendar')
      .where(function () {
        this.where('title', title)
          .andWhere('start_date', start_date)
          .andWhere('end_date', end_date);
      })
      .andWhere('status', '0')
      .first();

    if (existingEvent) {
      logger.error("Duplicates in Event Entry", {
        username: user_name,
        reqdetails: "calender-addEvent",
      });
      return res.status(500).json({
        message: "Duplicates in Event Entry for Title",
        status: false,
      });
    }

    const insertEventRes = await knex('calendar')
      .insert({
        title: title,
        description: description,
        start_date: start_date,
        end_date: end_date
      });

    if (insertEventRes) {
      logger.info("Event inserted successfully", {
        username: user_name,
        reqdetails: "calender-addEvent",
      });
      return res.status(200).json({
        message: "Event inserted successfully",
        status: true,
      });
    } else {
      logger.error("Failed to insert Event", {
        username: user_name,
        reqdetails: "calender-addEvent",
      });
      return res.status(500).json({
        message: "Failed to insert Event",
        status: false,
      });
    }
  } catch (error) {
    console.error("Error inserting Event:", error);
    next(error);
  } finally {
    if (knex) {
      knex.destroy();
    }
  }
};

export const editEvent = async (req, res, next) => {
  let knex = null;
  try {
    const { evt_id, title, description, start_date, end_date } = req.body;
    const { dbname, user_name } = req.user;

    logger.info("Edit Event Request Received", {
      username: user_name,
      reqdetails: "calender-editEvent",
    });

    if (!evt_id || !title || !start_date || !end_date) {
      logger.error("Mandatory fields are missing for Edit Event", {
        username: user_name,
        reqdetails: "calender-editEvent",
      });
      return res.status(400).json({
        message: "Mandatory fields are missing",
        status: false,
      });
    }

    knex = await createKnexInstance(dbname);

    const updateResult = await knex("calendar").update({ title: title, description: description, start_date: start_date, end_date: end_date }).where({ cal_id: evt_id });

    if (updateResult) {
      logger.info("Event updated successfully", {
        username: user_name,
        reqdetails: "calender-editEvent",
      });
      return res.status(200).json({
        message: "Event updated successfully",
        status: true,
      });
    } else {
      logger.error("Event update failed", {
        username: user_name,
        reqdetails: "calender-editEvent",
      });
      return res.status(404).json({
        message: "Event update failed",
        status: false,
      });
    }
  } catch (error) {
    console.error("Error updating Event:", error);
    next(error);
  } finally {
    if (knex) {
      knex.destroy();
    }
  }
};

export const deleteEvent = async (req, res, next) => {
  let knex = null;
  try {
    const { evt_id } = req.body;
    const { dbname, user_name } = req.user;

    logger.info("Delete Event Request Received", {
      username: user_name,
      reqdetails: "calender-deleteEvent",
    });

    if (!evt_id) {
      logger.error("Mandatory fields are missing", {
        username: user_name,
        reqdetails: "calender-deleteEvent",
      });
      return res.status(400).json({
        message: "Mandatory fields are missing",
        status: false,
      });
    }

    knex = await createKnexInstance(dbname);

    const deleteEventRes = await knex("calendar").update({ status: "1" }).where({ cal_id: evt_id });

    if (deleteEventRes) {
      logger.info("Event deleted successfully", {
        username: user_name,
        reqdetails: "calender-deleteEvent",
      });
      return res.status(200).json({
        message: "Event deleted successfully",
        status: true,
      });
    } else {
      logger.error("Event delete failed", {
        username: user_name,
        reqdetails: "calender-deleteEvent",
      });
      return res.status(404).json({
        message: "Event delete failed",
        status: false,
      });
    }
  } catch (err) {
    console.error("Error Deleting Event:", err);
    next(err);
  } finally {
    if (knex) {
      knex.destroy();
    }
  }
};