import createKnexInstance from "../../../configs/db.js";
import { logger } from "../../../configs/winston.js";
import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

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
    const { name, dis_name, type, cont_person, mail, phone, address, city, state, country, pin, gst_num, pan_num, tan_num, incop_date, fin_start, fin_end, it_password } = req.body;
    const { dbname, user_name } = req.user;

    logger.info("Add Client Request Received", {
      username: user_name,
      reqdetails: "client-addClient",
    });

    if (!name || !dis_name || !type || !cont_person || !mail || !phone) {
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

    const existingClient = await knex('clients')
      .where(function () {
        this.where('email', mail)
          .andWhere('phone', phone)
          .andWhere('gst_number', gst_num)
          .andWhere('pan_number', pan_num)
          .andWhere('tan_number', tan_num);
      })
      .andWhere('status', '0')
      .first();

    if (existingClient) {
      logger.error("Duplicates in client Entry", {
        username: user_name,
        reqdetails: "client-addClient",
      });
      return res.status(500).json({
        message: "Duplicates in client Entry for Email/Phone/GST Number/PAN Number/TAN Number",
        status: false,
      });
    }

    const insertClientResult = await knex('clients').insert({
      client_name: name,
      display_name: dis_name,
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
      financial_year_end: fin_end,
      it_password: it_password,
    });

    if (insertClientResult) {
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

    logger.info("Edit Client Request Received", {
      username: user_name,
      reqdetails: "client-editClient",
    });

    if (!id || !key || !value) {
      logger.error("Mandatory fields are missing for Edit Client", {
        username: user_name,
        reqdetails: "client-editClient",
      });
      return res.status(400).json({
        message: "Mandatory fields are missing",
        status: false,
      });
    }

    knex = await createKnexInstance(dbname);

    let updateResult;

    if (key == "photo" && value.startsWith('data:image/')) {
      // const uploadDir = process.env.Folder_Path + "\\profiles";
      // if (!fs.existsSync(uploadDir)) {
      //   fs.mkdirSync(uploadDir, { recursive: true });
      // }

      // const fileName = `client_${id}_${Date.now()}.png`;
      // const filePath = path.join(uploadDir, fileName);

      // const base64Data = value.replace(/^data:image\/\w+;base64,/, "");

      // const buffer = Buffer.from(base64Data, 'base64');
      // fs.writeFileSync(filePath, buffer);

      // const fileUrl = process.env.File_Path + `/profiles/${fileName}`;

      const s3 = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
      });

      const base64Data = value.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');

      const matches = value.match(/^data:(image\/\w+);base64,/);
      const mimeType = matches ? matches[1] : null;

      let extension = 'png';
      if (mimeType) {
        extension = mimeType.split('/')[1];
      }

      const fileName = `client_${id}_${Date.now()}.${extension}`;
      const s3Key = `cafirm/profiles/${fileName}`;

      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: s3Key,
        Body: buffer,
        ContentEncoding: 'base64',
        ContentType: `image/${extension}`,
        ACL: 'public-read'
      };

      await s3.send(new PutObjectCommand(uploadParams));

      const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

      updateResult = await knex("clients").update({ [key]: fileUrl }).where({ client_id: id });
    } else {
      updateResult = await knex("clients").update({ [key]: value }).where({ client_id: id });
    }

    if (updateResult) {
      logger.info("Client updated successfully", {
        username: user_name,
        reqdetails: "client-editClient",
      });
      return res.status(200).json({
        message: "Client updated successfully",
        status: true,
      });
    } else {
      logger.error("Client update failed", {
        username: user_name,
        reqdetails: "client-editClient",
      });
      return res.status(404).json({
        message: "Client update failed",
        status: false,
      });
    }
  } catch (error) {
    console.error("Error updating Client:", error);
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

    const deleteClientRes = await knex('clients').update({ status: "1" }).where({ client_id: id });

    if (deleteClientRes) {
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

export const getClientDetails = async (req, res, next) => {
  let knex = null;
  try {
    const { id } = req.body;
    const { dbname, user_name } = req.user;

    logger.info("Get Client Details Request Received", {
      username: user_name,
      reqdetails: "employee-getClientDetails",
    });

    if (!id) {
      logger.error("Mandatory fields are missing", {
        username: user_name,
        reqdetails: "employee-getClientDetails",
      });
      return res.status(400).json({
        message: "Mandatory fields are missing",
        status: false,
      });
    }

    knex = await createKnexInstance(dbname);

    const getclientResult = await knex('clients').select('*').where({ "status": "0", "client_id": id });

    if (getclientResult) {
      logger.info("Client Details retrieved successfully", {
        username: user_name,
        reqdetails: "employee-getClientDetails",
      });
      return res.status(200).json({
        message: "Client Details retrieved successfully",
        data: getclientResult,
        status: true,
      });
    } else {
      logger.warn("No Client Details found", {
        username: user_name,
        reqdetails: "employee-getClientDetails",
      });
      return res.status(404).json({
        message: "No Client Details found",
        status: false,
      });
    }
  } catch (err) {
    logger.error("Error fetching Client Details", {
      error: err.message,
      username: req.user?.user_name,
      reqdetails: "employee-getClientDetails",
    });
    next(err);
  } finally {
    if (knex) {
      knex.destroy();
    }
  }
};