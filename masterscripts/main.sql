ALTER TABLE ca_firm.employees 
ADD COLUMN role VARCHAR(5) 
AFTER phone;

ALTER TABLE ca_firm.employees MODIFY COLUMN status TINYINT(1) DEFAULT 0;

ALTER TABLE ca_firm.employees MODIFY COLUMN status ENUM('0', '1') DEFAULT '0';

ALTER TABLE `ca_firm`.`clients` 
CHANGE COLUMN `compliance_status` `status` TINYINT(1) NULL DEFAULT 0;

ALTER TABLE `ca_firm`.`clients` 
CHANGE COLUMN `compliance_status` `status` ENUM('0', '1') NULL DEFAULT '0';

ALTER TABLE tasks 
ADD COLUMN service VARCHAR(255) NULL,
ADD COLUMN assigned_to INT NULL,
ADD COLUMN assigned_date DATE NULL,
ADD COLUMN due_date DATE NULL,
ADD COLUMN priority ENUM('Low', 'Medium', 'High', 'Critical') NULL,
ADD COLUMN status ENUM('0', '1', '2', '3') NOT NULL DEFAULT '0';

CREATE TABLE tickets (
    ticket_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    ticket_name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    service VARCHAR(255) NULL,
    assigned_to INT NULL,
    assigned_date DATE NULL,
    due_date DATE NULL,
    priority ENUM('Low', 'Medium', 'High', 'Critical') NULL,
    status ENUM('0', '1', '2', '3') NOT NULL DEFAULT '0'
);

ALTER TABLE `ca_firm`.`clients` 
DROP INDEX `tan_number` ,
DROP INDEX `pan_number` ,
DROP INDEX `gst_number` ,
DROP INDEX `phone` ,
DROP INDEX `email` ;

ALTER TABLE `ca_firm`.`employees` 
DROP INDEX `email` ;

ALTER TABLE `ca_firm`.`time_sheets` 
CHANGE COLUMN `notes` `description` TEXT NULL DEFAULT NULL ;

ALTER TABLE time_sheets 
ADD COLUMN status ENUM('0', '1') NOT NULL DEFAULT '0';

ALTER TABLE time_sheets 
MODIFY COLUMN total_hours DECIMAL(5,2);

ALTER TABLE time_sheets 
DROP COLUMN start_time, 
DROP COLUMN end_time;

ALTER TABLE time_sheets 
MODIFY COLUMN total_hours INT;

ALTER TABLE time_sheets CHANGE COLUMN total_hours total_minutes INT;
ALTER TABLE time_sheets CHANGE COLUMN task_id service_id INT;

ALTER TABLE tasks MODIFY COLUMN assigned_to JSON;
ALTER TABLE tickets MODIFY COLUMN assigned_to JSON;

ALTER TABLE ca_firm.time_sheets DROP FOREIGN KEY time_sheets_ibfk_3;

ALTER TABLE `ca_firm`.`time_sheets`
ADD COLUMN `employee` VARCHAR(200) AFTER `employee_id`,
ADD COLUMN `client` VARCHAR(200) AFTER `client_id`,
ADD COLUMN `service` VARCHAR(200) AFTER `service_id`;

ALTER TABLE ca_firm.services
DROP COLUMN service_fee,
DROP COLUMN gst_rate,
ADD COLUMN status ENUM('0', '1') NOT NULL DEFAULT '0';

ALTER TABLE `ca_firm`.`tasks`
ADD COLUMN `client_id` INT AFTER `task_id`;

ALTER TABLE `ca_firm`.`tasks` 
CHANGE COLUMN `service` `service` INT NULL DEFAULT NULL ;

CREATE TABLE employee_task_mapping (
mapping_id INT AUTO_INCREMENT PRIMARY KEY,
employee_id INT NOT NULL,
task_id INT NOT NULL,
status ENUM('0', '1') DEFAULT '0',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);

ALTER TABLE `ca_firm`.`time_sheets`
ADD COLUMN `task_id` INT AFTER `service_id`;

ALTER TABLE time_sheets 
DROP COLUMN employee,
DROP COLUMN client,
DROP COLUMN service;
------ Permission Table Changes -----------------------

CREATE TABLE tbl_menus (
    menu_id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT DEFAULT NULL,
    menu_name VARCHAR(100) NOT NULL,
    sequence_number INT DEFAULT 0,
    created_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES tbl_menus(menu_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES um_users(UserId) ON DELETE SET NULL
);

CREATE TABLE tbl_operations (
    operation_id INT AUTO_INCREMENT PRIMARY KEY,
    operation_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

CREATE TABLE tbl_menu_operations (
    menu_operation_id INT AUTO_INCREMENT PRIMARY KEY,
    menu_id INT NOT NULL,
    operation_id INT NOT NULL,
    FOREIGN KEY (menu_id) REFERENCES tbl_menus(menu_id) ON DELETE CASCADE,
    FOREIGN KEY (operation_id) REFERENCES tbl_operations(operation_id) ON DELETE CASCADE
);

CREATE TABLE tbl_permissions (
    permission_id INT AUTO_INCREMENT PRIMARY KEY,
    permission_name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES um_users(UserId) ON DELETE SET NULL
);

CREATE TABLE tbl_permission_operations (
    permission_operation_id INT AUTO_INCREMENT PRIMARY KEY,
    permission_id INT NOT NULL,
    menu_operation_id INT NOT NULL,
    FOREIGN KEY (permission_id) REFERENCES tbl_permissions(permission_id) ON DELETE CASCADE,
    FOREIGN KEY (menu_operation_id) REFERENCES tbl_menu_operations(menu_operation_id) ON DELETE CASCADE
);

CREATE TABLE tbl_user_permissions (
    user_permission_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    permission_id INT NOT NULL,
    granted_by INT NOT NULL,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (permission_id) REFERENCES tbl_permissions(permission_id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES um_users(UserId) ON DELETE CASCADE
);


INSERT INTO tbl_menus (menu_id, parent_id, menu_name, created_by, created_at,sequence_number)
VALUES (1, NULL, 'Dashboard', NULL, NOW(),1);

INSERT INTO tbl_menus (menu_id, parent_id, menu_name, created_by, created_at,sequence_number)
VALUES (2, NULL, 'Calender', NULL, NOW(),2);

-- Insert Parent Menu
INSERT INTO tbl_menus (menu_id, parent_id, menu_name, created_by, created_at,sequence_number)
VALUES (3, NULL, 'Master Class', NULL, NOW(),3);

-- Insert Submenus
INSERT INTO tbl_menus (menu_id, parent_id, menu_name, created_by, created_at,sequence_number)
VALUES 
(4, 1, 'Add Year', NULL, NOW(),1),
(5, 1, 'Add Serial Code', NULL, NOW(),2);




-- Insert Operations
INSERT INTO tbl_operations (operation_id, operation_name, description)
VALUES 
(1, 'CREATE', 'Create a new record'),
(2, 'READ', 'Read existing records'),
(3, 'UPDATE', 'Update existing records'),
(4, 'DELETE', 'Delete a record'),
(5, 'LIST', 'List all records');

-- Mapping Operations to Add Year Submenu (menu_id = 2)
INSERT INTO tbl_menu_operations (menu_id, operation_id)
VALUES 
(4, 1),  -- CREATE
(4, 2),  -- READ
(4, 5);  -- LIST

-- Mapping Operations to Add Serial Code Submenu (menu_id = 3)
INSERT INTO tbl_menu_operations (menu_id, operation_id)
VALUES 
(5, 1),  -- CREATE
(5, 2),  -- READ
(5, 3),  -- UPDATE
(5, 4),  -- DELETE
(5, 5);  -- LIST

INSERT INTO tbl_menu_operations (menu_id, operation_id)
VALUES 
(2, 1),  -- CREATE
(2, 3), -- READ
(2, 5);

INSERT INTO tbl_menu_operations (menu_id, operation_id)
VALUES 
(1, 1),  -- CREATE
(1, 3), -- READ
(1, 5)

------end----