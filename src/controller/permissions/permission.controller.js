import createKnexInstance from "../../..//configs/db.js";
import { logger } from "../../../configs/winston.js";


export const addPermission = async (req, res, next) => {
  let knex = null;
  try {
    const { permission_name, description, operations } = req.body;
    const { dbname, UserId } = req.user;

    // Validate required fields
    if (!permission_name || !operations || operations.length === 0) {
      return res.status(400).json({
        message: "Permission name and operations are required.",
        status: false,
      });
    }

    // Create a Knex instance for database interaction
    knex = await createKnexInstance(dbname);

    // Check if permission already exists
    const existingPermission = await knex("tbl_permissions")
      .where({ permission_name })
      .first();

    if (existingPermission) {
      return res.status(400).json({
        message: "Permission set with this name already exists.",
        status: false,
      });
    }

    // Insert the new permission set
    const [permission_id] = await knex("tbl_permissions").insert({
      permission_name,
      description,
      created_by:UserId
    });

    // Insert operations mapped to this permission set
    const operationsData = operations.map((operation_id) => ({
      permission_id,
      menu_operation_id: operation_id,
    }));

    await knex("tbl_permission_operations").insert(operationsData);

    // Respond with success
    res.status(201).json({
      message: "Permission set added successfully.",
      status: true,
      data: { permission_id },
    });
  } catch (error) {
    logger.error("Error adding permission set:", error);
    next(error);
  } finally {
    if (knex) {
      knex.destroy();
    }
  }
};

export const assignPermission = async (req, res, next) => {
  let knex = null;
  try {
    const { employee_id, permission_id } = req.body;
    const { dbname, name } = req.user;
    // Validate required fields
    if (!employee_id || !permission_id) {
      return res.status(400).json({
        message: "employee_id, permission_id are required fields.",
        status: false,
      });
    }

    // Create a Knex instance for database interaction
    knex = await createKnexInstance(dbname);

    // Check if the user exists
    const userExists = await knex("employees")
      .where({ employee_id: employee_id })
      .first();
    if (!userExists) {
      return res.status(404).json({
        message: "User not found.",
        status: false,
      });
    }

    // Check if the permission exists
    const permissionExists = await knex("tbl_permissions")
      .where({ permission_id })
      .first();
    if (!permissionExists) {
      return res.status(404).json({
        message: "Permission not found.",
        status: false,
      });
    }

    // Insert the user permission assignment
    await knex("tbl_user_permissions").insert({
      user_id: employee_id,
      permission_id,
      granted_by: employee_id,
    });

    // Log and respond
    logger.info(
      `Permission ${permission_id} assigned to User ${name}`
    );
    res.status(201).json({
      message: "Permission assigned successfully.",
      status: true,
    });
  } catch (error) {
    logger.error("Error assigning permission:", error);
    next(error);
  } finally {
    if (knex) {
      knex.destroy();
    }
  }
};

export const getUserPermissions = async (req, res, next) => {
  let knex = null;
  try {
    const { user_id } = req.params;
    const { dbname } = req.user;
    // Validate required fields
    if (!user_id) {
      return res.status(400).json({
        message: "User ID is required.",
        status: false,
      });
    }

    // Create a Knex instance for database interaction
    knex = await createKnexInstance(dbname);

    // Fetch user permissions with parent menu
    const userPermissions = await knex("tbl_user_permissions as up")
      .join("tbl_permissions as p", "up.permission_id", "p.permission_id")
      .join(
        "tbl_permission_operations as po",
        "p.permission_id",
        "po.permission_id"
      )
      .join(
        "tbl_menu_operations as mo",
        "po.menu_operation_id",
        "mo.menu_operation_id"
      )
      .join("tbl_menus as m", "mo.menu_id", "m.menu_id")
      .leftJoin("tbl_menus as parent_m", "m.parent_id", "parent_m.menu_id")
      .join("tbl_operations as o", "mo.operation_id", "o.operation_id")
      .select(
        "parent_m.menu_id as parent_menu_id",
        "parent_m.menu_name as parent_menu",
        "parent_m.parent_id as parent_id",
        "parent_m.sequence_number as parent_sequence",
        "m.menu_id as submenu_id",
        "m.menu_name as submenu",
        "m.sequence_number as submenu_sequence",
        "o.operation_name",
        "up.granted_at"
      )
      .orderBy([
        { column: "parent_sequence", order: "asc" },
        { column: "submenu_sequence", order: "asc" },
      ]);

    if (!userPermissions || userPermissions.length === 0) {
      return res.status(404).json({
        message: "No permissions found for this user.",
        status: false,
      });
    }

    const groupedPermissions = userPermissions.reduce((acc, curr) => {
      if (curr.parent_menu_id === null) {
        // If parent_id is NULL, create a top-level menu without submenus
        if (!acc[curr.submenu_id]) {
          acc[curr.submenu_id] = {
            parent_menu: curr.submenu,
            sequence_number: curr.submenu_sequence,
            operations: [],
          };
        }
        acc[curr.submenu_id].operations.push({
          operation: curr.operation_name,
          granted_at: curr.granted_at,
        });
      } else {
        // If it has a parent_id, group under that parent as a submenu
        if (!acc[curr.parent_menu_id]) {
          acc[curr.parent_menu_id] = {
            parent_menu: curr.parent_menu,
            sequence_number: curr.parent_sequence,
            submenus: {},
          };
        }
        if (!acc[curr.parent_menu_id].submenus[curr.submenu_id]) {
          acc[curr.parent_menu_id].submenus[curr.submenu_id] = {
            submenu: curr.submenu,
            sequence_number: curr.submenu_sequence,
            operations: [],
          };
        }
        acc[curr.parent_menu_id].submenus[curr.submenu_id].operations.push({
          operation: curr.operation_name,
          granted_at: curr.granted_at,
        });
      }
      return acc;
    }, {});

    // **Sorting parent menus and submenus**
    const sortedPermissionsArray = Object.entries(groupedPermissions)
      .map(([id, value]) => ({
        parent_menu_id: Number(id),
        ...value,
        submenus: value.submenus
          ? Object.values(value.submenus).sort(
              (a, b) =>
                (a.sequence_number ?? 9999) - (b.sequence_number ?? 9999)
            )
          : null,
      }))
      .sort(
        (a, b) => (a.sequence_number ?? 9999) - (b.sequence_number ?? 9999)
      );

    res.status(200).json({
      message: "User permissions retrieved successfully.",
      status: true,
      data: sortedPermissionsArray,
    });
  } catch (error) {
    logger.error("Error fetching user permissions:", error);
    next(error);
  } finally {
    if (knex) {
      knex.destroy();
    }
  }
};

export const updatePermission = async (req, res, next) => {
    let knex = null;
    try {
      const { permission_id } = req.params;
      const { permission_name, description, operations } = req.body;
      const { dbname } = req.user;
  
      // Validate required fields
      if (!permission_id || !permission_name || !operations || operations.length === 0) {
        return res.status(400).json({
          message: 'permission_id, permission_name, and operations are required fields.',
          status: false,
        });
      }
  
      // Create a Knex instance for database interaction
      knex = await createKnexInstance(dbname);
  
      // Check if the permission exists
      const existingPermission = await knex('tbl_permissions')
        .where({ permission_id })
        .first();
  
      if (!existingPermission) {
        return res.status(404).json({
          message: 'Permission not found.',
          status: false,
        });
      }
  
      // Update the permission details
      await knex('tbl_permissions')
        .where({ permission_id })
        .update({
          permission_name,
          description,
        });
  
      // Remove existing operations for the permission
      await knex('tbl_permission_operations')
        .where({ permission_id })
        .del();
  
      // Insert updated operations
      const operationsData = operations.map((operation_id) => ({
        permission_id,
        menu_operation_id: operation_id,
      }));
  
      await knex('tbl_permission_operations').insert(operationsData);
  
      // Log and respond
      logger.info(`Permission ${permission_id} updated successfully.`);
      res.status(200).json({
        message: 'Permission updated successfully.',
        status: true,
      });
    } catch (error) {
      logger.error('Error updating permission:', error);
      next(error);
    } finally {
      if (knex) {
        knex.destroy();
      }
    }
};

export const getMenuOperations = async (req, res, next) => {
  let knex = null;
  try {
    // Create a Knex instance for database interaction
    knex = await createKnexInstance();

    // Fetch menu-operation mappings
    const menuOperations = await knex("tbl_menu_operations as mo")
      .join("tbl_menus as m", "mo.menu_id", "m.menu_id")
      .leftJoin("tbl_menus as parent_m", "m.parent_id", "parent_m.menu_id")
      .join("tbl_operations as o", "mo.operation_id", "o.operation_id")
      .select(
        "mo.menu_operation_id",
        "parent_m.menu_name as parent_menu",
        "m.menu_name as submenu",
        "o.operation_name"
      );

    const sortedmenuOperations = processMenuOperations(menuOperations);
    console.log(sortedmenuOperations, "--menuOperations");

    // Respond with the structured data
    res.status(200).json({
      message: "Menu operations retrieved successfully.",
      status: true,
      data: sortedmenuOperations,
    });
  } catch (error) {
    logger.error("Error fetching menu operations:", error);
    next(error);
  } finally {
    if (knex) {
      knex.destroy();
    }
  }
};

const processMenuOperations = (menuOperations) => {
  return menuOperations.map(({ menu_operation_id, parent_menu, submenu, operation_name }) => {
    if (parent_menu === null) {
      return {
        menu_operation_id,
        parent_menu: submenu, // Set submenu as parent_menu
        operation_name,
      };
    }
    return {
      menu_operation_id,
      parent_menu,
      submenu,
      operation_name,
    };
  });
};


export const getPermissionsList = async (req, res, next) => {
  let knex = null;
  try {
    // Create a Knex instance for database interaction
    knex = await createKnexInstance();

    // Fetch all permission sets
    const permissions = await knex("tbl_permissions").select(
      "permission_id",
      "permission_name",
      "description",
      "created_at"
    );

    // Fetch menu-operation mappings for each permission set
    const permissionOperations = await knex("tbl_permission_operations as po")
      .join(
        "tbl_menu_operations as mo",
        "po.menu_operation_id",
        "mo.menu_operation_id"
      )
      .join("tbl_menus as m", "mo.menu_id", "m.menu_id")
      .leftJoin("tbl_menus as parent_m", "m.parent_id", "parent_m.menu_id")
      .join("tbl_operations as o", "mo.operation_id", "o.operation_id")
      .select(
        "po.permission_id",
        "parent_m.menu_name as parent_menu",
        "m.menu_name as submenu",
        "o.operation_name"
      );

    // Group menu-operation mappings by permission ID
    const permissionDetails = permissionOperations.reduce((acc, curr) => {
      if (!acc[curr.permission_id]) {
        acc[curr.permission_id] = {};
      }

      // If parent_menu is null, use submenu as parent
      const parentMenu = curr.parent_menu || curr.submenu;

      if (!curr.parent_menu) {
        // If no parent menu, store operations as an array directly
        if (!acc[curr.permission_id][parentMenu]) {
          acc[curr.permission_id][parentMenu] = [];
        }
        acc[curr.permission_id][parentMenu].push(curr.operation_name);
      } else {
        // If parent exists, store operations inside submenu
        if (!acc[curr.permission_id][parentMenu]) {
          acc[curr.permission_id][parentMenu] = {};
        }
        if (!acc[curr.permission_id][parentMenu][curr.submenu]) {
          acc[curr.permission_id][parentMenu][curr.submenu] = [];
        }
        acc[curr.permission_id][parentMenu][curr.submenu].push(curr.operation_name);
      }

      return acc;
    }, {});

    // Combine permission sets with their corresponding operations
    const combinedPermissions = permissions.map((perm) => ({
      permission_id: perm.permission_id,
      permission_name: perm.permission_name,
      description: perm.description,
      created_at: perm.created_at,
      operations: permissionDetails[perm.permission_id] || {},
    }));

    // Respond with the structured data
    res.status(200).json({
      message: "Permissions list retrieved successfully.",
      status: true,
      data: combinedPermissions,
    });
  } catch (error) {
    logger.error("Error fetching permissions list:", error);
    next(error);
  } finally {
    if (knex) {
      knex.destroy();
    }
  }
};

export const getAllUserList = async (req, res, next) => {
  let knex = null;
  try {
    // Create a Knex instance for database interaction
    knex = await createKnexInstance();

    // Fetch all users sets
    const usersList = await knex("employees").select(
      "employee_id",
      "name",
      "email"
    );
    
    // Respond with the structured data
    res.status(200).json({
      message: "Users list retrieved successfully.",
      status: true,
      data: usersList,
    });
  } catch (error) {
    logger.error("Error fetching Users list:", error);
    next(error);
  } finally {
    if (knex) {
      knex.destroy();
    }
  }
};