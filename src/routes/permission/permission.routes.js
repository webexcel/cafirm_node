import express from "express";
import { authenticateJWT } from "../../middleware/verifyToken.js";
import { addPermission, assignPermission, getMenuOperations, getPermissionsList, getUserPermissions, updatePermission, getAllUserList } from "../../controller/permissions/permission.controller.js";

const PermissionRoutes = express.Router();

PermissionRoutes.use(authenticateJWT)

PermissionRoutes.post('/add', addPermission);

PermissionRoutes.post('/assign', assignPermission);

PermissionRoutes.get('/user/:user_id', getUserPermissions);

PermissionRoutes.put('/update/:permission_id', updatePermission);

PermissionRoutes.get('/menu-operations', getMenuOperations);

PermissionRoutes.get('/permissions', getPermissionsList);

PermissionRoutes.get('/allusers', getAllUserList);



export default PermissionRoutes;