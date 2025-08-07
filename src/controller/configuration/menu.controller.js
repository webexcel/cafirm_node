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

        const getResult = await knex('tbl_menus as m')
            .leftJoin('tbl_menus as parent', 'm.parent_id', 'parent.menu_id')
            .where('m.status', '0')
            .whereNotNull('m.parent_id')
            .orWhere('m.parent_id', null)
            .whereNotExists(function () {
                this.select('*')
                    .from('tbl_menus as sub')
                    .whereRaw('sub.parent_id = m.menu_id');
            })
            .select('m.*', 'parent.menu_name as parent_name');

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
            await knex.destroy();
        }
    }
};

export const getParentMenuList = async (req, res, next) => {
    let knex = null;
    try {
        const { dbname, user_name } = req.user;

        logger.info("Get Menus List Request Received", {
            username: user_name,
            reqdetails: "menu-getParentMenuList",
        });

        knex = await createKnexInstance(dbname);

        const getResult = await knex('tbl_menus')
            .select('*').where('status', '0').whereNull("parent_id");

        if (getResult) {
            logger.info("Menus List retrieved successfully", {
                username: user_name,
                reqdetails: "menu-getParentMenuList",
            });
            return res.status(200).json({
                message: "Menus List retrieved successfully",
                data: getResult,
                status: true,
            });
        } else {
            logger.warn("No Menus Details found", {
                username: user_name,
                reqdetails: "menu-getParentMenuList",
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
            reqdetails: "menu-getParentMenuList",
        });
        next(err);
    } finally {
        if (knex) {
            await knex.destroy();
        }
    }
};

export const getOperationList = async (req, res, next) => {
    let knex = null;
    try {
        const { menu_id } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Get Operations List Request Received", {
            username: user_name,
            reqdetails: "menu-getOperationList",
        });

        knex = await createKnexInstance(dbname);

        const getResult = await knex('tbl_operations')
            .leftJoin('tbl_menu_operations', function () {
                this.on('tbl_operations.operation_id', '=', 'tbl_menu_operations.operation_id')
                    .andOn('tbl_menu_operations.menu_id', '=', knex.raw('?', [menu_id]));
            })
            .whereNull('tbl_menu_operations.operation_id')
            .select('tbl_operations.*');

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
            await knex.destroy();
        }
    }
};

export const getOperationMappedList = async (req, res, next) => {
    let knex = null;
    try {
        const { dbname, user_name } = req.user;

        logger.info("Get Operations Mapped List Request Received", {
            username: user_name,
            reqdetails: "menu-getOperationMappedList",
        });

        knex = await createKnexInstance(dbname);

        const getResult = await knex('tbl_menus')
            .leftJoin('tbl_menu_operations', 'tbl_menus.menu_id', 'tbl_menu_operations.menu_id')
            .leftJoin('tbl_operations', 'tbl_menu_operations.operation_id', 'tbl_operations.operation_id')
            .select(
                'tbl_menus.menu_id as menu_id',
                'tbl_menus.menu_name as menu_name',
                knex.raw('GROUP_CONCAT(tbl_operations.operation_name) as operations')
            ).where("tbl_menus.status", "0")
            .groupBy('tbl_menus.menu_id', 'tbl_menus.menu_name');

        if (getResult.length > 0) {
            getResult.forEach((item) => {
                item.operations = item.operations ? item.operations.split(',') : [];
            });
        }

        if (getResult) {
            logger.info("Operations Mapped List retrieved successfully", {
                username: user_name,
                reqdetails: "menu-getOperationMappedList",
            });
            return res.status(200).json({
                message: "Operations Mapped List retrieved successfully",
                data: getResult,
                status: true,
            });
        } else {
            logger.warn("No Operations Mapped Details found", {
                username: user_name,
                reqdetails: "menu-getOperationMappedList",
            });
            return res.status(404).json({
                message: "No Operations Details found",
                status: false,
            });
        }
    } catch (err) {
        logger.error("Error fetching Operations Mapped List", {
            error: err.message,
            username: req.user?.user_name,
            reqdetails: "menu-getOperationMappedList",
        });
        next(err);
    } finally {
        if (knex) {
            await knex.destroy();
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
                this.where('menu_name', menu_name).andWhere('status', '0');
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
            const permissions = await knex("tbl_menu_operations")
                .select("menu_operation_id")
                .where("menu_id", parent_id);

            if (permissions.length > 0) {
                const menuOperationIds = permissions.map(p => p.menu_operation_id);

                await knex("tbl_permission_operations")
                    .whereIn("menu_operation_id", menuOperationIds)
                    .del();

                await knex("tbl_menu_operations")
                    .whereIn("menu_operation_id", menuOperationIds)
                    .del();
            }

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
            await knex.destroy();
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
            await knex.destroy();
        }
    }
};

export const updateMenu = async (req, res, next) => {
    let knex = null;
    try {
        const { menu_id, type, parent_id, menu_name } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Update Menu Request Received", {
            username: user_name,
            reqdetails: "menu-updateMenu",
        });

        if (!menu_id || !menu_name) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "menu-updateMenu",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        knex = await createKnexInstance(dbname);

        let updateResult = await knex('tbl_menus').update({ "menu_name": menu_name }).where("menu_id", menu_id);

        // if (type == "0") {
        //     const parentMenus = await knex('tbl_menus').select('*').whereNull('parent_id');
        //     const existingRecord = await knex('tbl_menus').select("*").where("menu_id", menu_id).first();
        //     if (existingRecord.parent_id == null) {
        //         updateResult = await knex('tbl_menus').update({
        //             menu_name: menu_name
        //         }).where("menu_id", menu_id);
        //     } else {
        //         updateResult = await knex('tbl_menus').update({
        //             parent_id: null,
        //             menu_name: menu_name,
        //             sequence_number: parentMenus.length + 1
        //         }).where("menu_id", menu_id);
        //     }
        // } else if (type == "1") {
        //     const subMenus = await knex('tbl_menus').select('*').where('parent_id', parent_id);
        //     const existingRecord = await knex('tbl_menus').select("*").where("menu_id", menu_id).first();
        //     if (existingRecord.parent_id == null || existingRecord.parent_id != parent_id) {
        //         updateResult = await knex('tbl_menus').update({
        //             parent_id: parent_id,
        //             menu_name: menu_name,
        //             sequence_number: subMenus.length + 1
        //         }).where("menu_id", menu_id);
        //     } else {
        //         updateResult = await knex('tbl_menus').update({
        //             menu_name: menu_name
        //         }).where("menu_id", menu_id);
        //     }
        // }

        if (updateResult) {
            logger.info("Menu Updated successfully", {
                username: user_name,
                reqdetails: "menu-updateMenu",
            });
            return res.status(200).json({
                message: "Menu Updated successfully",
                status: true,
            });
        } else {
            logger.error("Failed to Update Menu", {
                username: user_name,
                reqdetails: "menu-updateMenu",
            });
            return res.status(500).json({
                message: "Failed to Update Menu",
                status: false,
            });
        }
    } catch (error) {
        console.error("Error Updating Menu:", error);
        next(error);
    } finally {
        if (knex) {
            await knex.destroy();
        }
    }
};

export const deleteMenu = async (req, res, next) => {
    let knex = null;
    try {
        const { menu_id } = req.body;
        const { dbname, user_name } = req.user;

        logger.info("Delete Menu Request Received", {
            username: user_name,
            reqdetails: "menu-deleteMenu",
        });

        if (!menu_id) {
            logger.error("Mandatory fields are missing", {
                username: user_name,
                reqdetails: "menu-deleteMenu",
            });
            return res.status(400).json({
                message: "Mandatory fields are missing",
                status: false,
            });
        }

        knex = await createKnexInstance(dbname);

        const deleteResult = await knex('tbl_menus').update("status", "1").where("menu_id", menu_id);

        if (deleteResult) {
            logger.info("Menu Deleted successfully", {
                username: user_name,
                reqdetails: "menu-deleteMenu",
            });
            return res.status(200).json({
                message: "Menu Deleted successfully",
                status: true,
            });
        } else {
            logger.error("Failed to Delete Menu", {
                username: user_name,
                reqdetails: "menu-deleteMenu",
            });
            return res.status(500).json({
                message: "Failed to Delete Menu",
                status: false,
            });
        }
    } catch (error) {
        console.error("Error Deleting Menu:", error);
        next(error);
    } finally {
        if (knex) {
            await knex.destroy();
        }
    }
};