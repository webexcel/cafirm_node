import createKnexInstance from "../../../configs/db.js";
import { logger } from "../../../configs/winston.js";

export const getMenuList = async (req, res, next) => {
    let knex = null;
    try {
        const { dbname, user_name } = req.user;

        logger.info("Get Menus List Request Received", {
            username: user_name,
            reqdetails: "menu-getMenuList",
        });

        knex = await createKnexInstance(dbname);

        const getResult = await knex('tbl_menus')
            .select('*');

        if (getResult) {
            logger.info("Menus List retrieved successfully", {
                username: user_name,
                reqdetails: "menu-getMenuList",
            });
            return res.status(200).json({
                message: "Menus List retrieved successfully",
                data: getResult,
                status: true,
            });
        } else {
            logger.warn("No Menus Details found", {
                username: user_name,
                reqdetails: "menu-getMenuList",
            });
            return res.status(404).json({
                message: "No Menus Details found",
                status: false,
            });
        }
    } catch (err) {
        logger.error("Error fetching Menus List", {
            error: err.message,
            username: req.user?.user_name,
            reqdetails: "menu-getMenuList",
        });
        next(err);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};

export const getOperationList = async (req, res, next) => {
    let knex = null;
    try {
        const { dbname, user_name } = req.user;

        logger.info("Get Operations List Request Received", {
            username: user_name,
            reqdetails: "menu-getOperationList",
        });

        knex = await createKnexInstance(dbname);

        const getResult = await knex('tbl_operations')
            .select('*');

        if (getResult) {
            logger.info("Operations List retrieved successfully", {
                username: user_name,
                reqdetails: "menu-getOperationList",
            });
            return res.status(200).json({
                message: "Operations List retrieved successfully",
                data: getResult,
                status: true,
            });
        } else {
            logger.warn("No Operations Details found", {
                username: user_name,
                reqdetails: "menu-getOperationList",
            });
            return res.status(404).json({
                message: "No Operations Details found",
                status: false,
            });
        }
    } catch (err) {
        logger.error("Error fetching Operations List", {
            error: err.message,
            username: req.user?.user_name,
            reqdetails: "menu-getOperationList",
        });
        next(err);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};

export const addMenu = async (req, res, next) => {
    let knex = null;
    try {
        const { type, parent_id, menu_name, user_id } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Add Menu Request Received", {
            username: user_name,
            reqdetails: "menu-addMenu",
        });

        if (!type || !menu_name) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "menu-addMenu",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        knex = await createKnexInstance(dbname);

        const existingMenu = await knex('tbl_menus')
            .where(function () {
                this.where('menu_name', menu_name);
            })
            .first();

        if (existingMenu) {
            logger.error("Duplicates in Menu Entry", {
                username: user_name,
                reqdetails: "menu-addMenu",
            });
            return res.status(500).json({
                message: "Duplicates in Menu Entry",
                status: false,
            });
        }

        let insertResult;

        if (type == "0") {
            const parentMenus = await knex('tbl_menus').select('*').whereNull('parent_id');
            insertResult = await knex('tbl_menus').insert({
                menu_name: menu_name,
                sequence_number: parentMenus.length + 1,
                created_by: user_id,
            });
        } else if (type == "1") {
            const subMenus = await knex('tbl_menus').select('*').where('parent_id', parent_id);
            insertResult = await knex('tbl_menus').insert({
                parent_id: parent_id,
                menu_name: menu_name,
                sequence_number: subMenus.length + 1,
                created_by: user_id,
            });
        }

        if (insertResult) {
            logger.info("Menu inserted successfully", {
                username: user_name,
                reqdetails: "menu-addMenu",
            });
            return res.status(200).json({
                message: "Menu inserted successfully",
                status: true,
            });
        } else {
            logger.error("Failed to insert Menu", {
                username: user_name,
                reqdetails: "menu-addMenu",
            });
            return res.status(500).json({
                message: "Failed to insert Menu",
                status: false,
            });
        }
    } catch (error) {
        console.error("Error inserting Menu:", error);
        next(error);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};

export const addMenuOperations = async (req, res, next) => {
    let knex = null;
    try {
        const { menu_id, operation_ids } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Add Menu Operations Request Received", {
            username: user_name,
            reqdetails: "menu-addMenuOperations",
        });

        if (!menu_id || !operation_ids || operation_ids.length === 0) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "menu-addMenuOperations",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        knex = await createKnexInstance(dbname);
        let insertResult;
        for (let item of operation_ids) {
            const existingMenu = await knex('tbl_menu_operations')
                .where(function () {
                    this.where('menu_id', menu_id).andWhere('operation_id', item);
                })
                .first();

            if (!existingMenu) {
                insertResult = await knex('tbl_menu_operations').insert({
                    menu_id: menu_id,
                    operation_id: item,
                });

                if (insertResult) {
                    continue;
                } else {
                    logger.error("Failed to insert Menu Operations", {
                        username: user_name,
                        reqdetails: "menu-addMenuOperations",
                    });
                    return res.status(500).json({
                        message: "Failed to insert Menu Operations",
                        status: false,
                    });
                }
            }
        }

        logger.info("Menu Operations inserted successfully", {
            username: user_name,
            reqdetails: "menu-addMenuOperations",
        });

        return res.status(200).json({
            message: "Menu Operations inserted successfully",
            status: true,
        });
    } catch (error) {
        console.error("Error inserting Menu Operations:", error);
        next(error);
    } finally {
        if (knex) {
            knex.destroy();
        }
    }
};