import createKnexInstance from "../../../configs/db.js";
import { logger } from "../../../configs/winston.js";
import mime from "mime-types";
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

export const getDocuments = async (req, res, next) => {
    let knex = null;
    try {
        const { dbname, user_name } = req.user;

        logger.info("Get Document List Request Received", {
            username: user_name,
            reqdetails: "documentManagement-getDocuments",
        });

        knex = await createKnexInstance(dbname);

        const getDocRes = await knex('documents')
            .select('*')
            .where('status', '0')
            .orderBy('created_at', 'desc');

        const clientIds = [...new Set(getDocRes.map(doc => doc.client_id))];
        const taskIds = [...new Set(getDocRes.map(doc => doc.task_id))];

        const clients = await knex('clients')
            .select('client_id', 'client_name')
            .whereIn('client_id', clientIds);

        const documentTasks = await knex('tasks')
            .select('task_id', 'task_name')
            .whereIn('task_id', taskIds);

        const clientMap = {};
        clients.forEach(client => {
            clientMap[client.client_id] = client.client_name;
        });

        const taskMap = {};
        documentTasks.forEach(type => {
            taskMap[type.task_id] = type.task_name;
        });

        const groupedByClient = {};

        getDocRes.forEach(doc => {
            const { id, doc_name, client_id, task_id, doc_url, description } = doc;

            if (!groupedByClient[client_id]) {
                groupedByClient[client_id] = {
                    id: client_id,
                    client_id: client_id,
                    client_name: clientMap[client_id] || null,
                    childs: []
                };
            }

            let taskGroup = groupedByClient[client_id].childs.find(child => child.task_id === task_id);
            if (!taskGroup) {
                taskGroup = {
                    task_id: task_id,
                    task_name: taskMap[task_id] || null,
                    documents: []
                };
                groupedByClient[client_id].childs.push(taskGroup);
            }

            taskGroup.documents.push({ id, doc_name, doc_url, description });
        });

        const finalResult = Object.values(groupedByClient);

        if (finalResult) {
            logger.info("Document List retrieved successfully", {
                username: user_name,
                reqdetails: "documentManagement-getDocuments",
            });
            return res.status(200).json({
                message: "Document List retrieved successfully",
                data: finalResult,
                status: true,
            });
        } else {
            logger.warn("No Document Data found", {
                username: user_name,
                reqdetails: "documentManagement-getDocuments",
            });
            return res.status(404).json({
                message: "No Document Data found",
                status: false,
            });
        }
    } catch (err) {
        logger.error("Error fetching Document List", {
            error: err.message,
            username: req.user?.user_name,
            reqdetails: "documentManagement-getDocuments",
        });
        next(err);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};

export const addDocument = async (req, res, next) => {
    let knex = null;
    try {
        const { client_id, description, doc_base, task_id, doc_name } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Add Document Request Received", {
            username: user_name,
            reqdetails: "documentManagement-addDocument",
        });

        if (!client_id || !doc_base || !task_id) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "documentManagement-addDocument",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        const s3 = new S3Client({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        });

        knex = await createKnexInstance(dbname);

        const matches = doc_base.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) {
            throw new Error("Invalid base64 format");
        }

        const mimeType = matches[1];
        const base64Data = matches[2];

        const allowedMimeTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain'
        ];

        if (!allowedMimeTypes.includes(mimeType)) {
            logger.info("Unsupported MIME type", {
                username: user_name,
                reqdetails: "documentManagement-addDocument",
            });
            return res.status(500).json({
                message: "Unsupported MIME type",
                error: `Unsupported MIME type: ${mimeType}`,
                status: false,
            });
        }

        const clients = await knex('clients')
            .select('client_name')
            .where('client_id', client_id)
            .first();

        const clientFolder = clients.client_name.replaceAll(' ', '');

        const fileExt = mime.extension(mimeType); // use mime-types package
        const fileName = doc_name || `${task_id}_${Date.now()}.${fileExt}`;
        const s3Key = `cafirm/documents/${clientFolder}/${task_id}/${fileName}`;

        const buffer = Buffer.from(base64Data, 'base64');

        const uploadParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: s3Key,
            Body: buffer,
            ContentType: mimeType,
            // ACL: 'public-read'
        };

        await s3.send(new PutObjectCommand(uploadParams));

        const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

        const insertDocRes = await knex('documents').insert({
            client_id: client_id,
            description: description,
            doc_url: fileUrl,
            task_id: task_id,
            doc_name: fileName
        });

        if (insertDocRes) {
            logger.info("Document Inserted Successfully", {
                username: user_name,
                reqdetails: "documentManagement-addDocument",
            });
            return res.status(200).json({
                message: "Document Inserted Successfully",
                status: true,
            });
        } else {
            logger.error("Failed to Insert Document", {
                username: user_name,
                reqdetails: "documentManagement-addDocument",
            });
            return res.status(500).json({
                message: "Failed to Insert Document",
                status: false,
            });
        }

    } catch (error) {
        console.error("Error Inserting Document:", error);
        next(error);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};

export const deleteDocument = async (req, res, next) => {
    let knex = null;
    try {
        const { document_id } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Get Document List Request Received", {
            username: user_name,
            reqdetails: "documentManagement-deleteDocument",
        });

        if (!document_id) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "documentManagement-deleteDocument",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        knex = await createKnexInstance(dbname);

        const delDocRes = await knex('documents').update({ 'status': '1' }).where('id', document_id);

        if (delDocRes) {
            logger.info("Document Deleted Successfully", {
                username: user_name,
                reqdetails: "documentManagement-deleteDocument",
            });
            return res.status(200).json({
                message: "Document Deleted Successfully",
                status: true,
            });
        } else {
            logger.error("Document Delete Failed", {
                username: user_name,
                reqdetails: "documentManagement-deleteDocument",
            });
            return res.status(404).json({
                message: "Document Delete Failed",
                status: false,
            });
        }
    } catch (err) {
        logger.error("Error While Deleting Document", {
            error: err.message,
            username: req.user?.user_name,
            reqdetails: "documentManagement-deleteDocument",
        });
        console.error("Error While Deleting Document:", err);
        next(err);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};

export const downloadDocument = async (req, res, next) => {
    let knex = null;
    try {
        const { document_id } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Get Document Data Request Received", {
            username: user_name,
            reqdetails: "documentManagement-downloadDocument",
        });

        if (!document_id) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "documentManagement-downloadDocument",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        knex = await createKnexInstance(dbname);

        const getDocRes = await knex('documents')
            .where({ status: '0', id: document_id })
            .select('*')
            .first();

        if (!getDocRes) {
            logger.error("Document Not Found", {
                username: user_name,
                reqdetails: "documentManagement-downloadDocument",
            });
            return res.status(404).json({
                message: "Document Not Found",
                status: false,
            });
        }

        const streamToBuffer = async (stream) => {
            return new Promise((resolve, reject) => {
                const chunks = [];
                stream.on('data', (chunk) => chunks.push(chunk));
                stream.on('end', () => resolve(Buffer.concat(chunks)));
                stream.on('error', reject);
            });
        };

        // Parse S3 key from doc_url
        const s3Url = new URL(getDocRes.doc_url);
        const s3Key = decodeURIComponent(s3Url.pathname.substring(1)); // remove leading `/`

        const s3 = new S3Client({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
        });

        const s3Command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: s3Key,
        });

        const s3Response = await s3.send(s3Command);
        const stream = s3Response.Body;

        const fileBuffer = await streamToBuffer(stream);

        if (!fileBuffer || fileBuffer.length === 0) {
            logger.error("File is empty or not readable", {
                username: user_name,
                reqdetails: "documentManagement-downloadDocument",
            });
            return res.status(500).json({
                message: "File is empty or not readable",
                status: false,
            });
        }

        const mimeType = mime.lookup(getDocRes.doc_name) || 'application/octet-stream';
        const base64Data = fileBuffer.toString('base64');
        const base64WithMime = `data:${mimeType};base64,${base64Data}`;

        res.setHeader('Content-Disposition', `attachment; filename="${getDocRes.doc_name}"`);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Length', fileBuffer.length);

        logger.info("Document Fetched Successfully", {
            username: user_name,
            reqdetails: "documentManagement-downloadDocument",
        });

        return res.status(200).json({
            message: "Document Data Fetched Successfully",
            status: true,
            file_name: getDocRes.doc_name,
            file_url: getDocRes.doc_url,
            file_base64: base64WithMime,
        });
    } catch (err) {
        logger.error("Error While Fetching Document", {
            error: err.message,
            username: req.user?.user_name,
            reqdetails: "documentManagement-downloadDocument",
        });
        console.error("Error While Fetching Document:", err);
        next(err);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};