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

ALTER TABLE `ca_firm`.`employees` 
CHANGE COLUMN `password_hash` `password_hash` VARCHAR(255) NULL DEFAULT NULL ;

ALTER TABLE tasks 
DROP COLUMN assigned_to;

ALTER TABLE `ca_firm`.`employees` 
CHANGE COLUMN `password_hash` `password_hash` VARCHAR(255) NULL DEFAULT NULL ;

ALTER TABLE `ca_firm`.`clients` 
CHANGE COLUMN `pincode` `pincode` VARCHAR(20) NULL DEFAULT NULL ,
CHANGE COLUMN `gst_number` `gst_number` VARCHAR(100) NULL DEFAULT NULL ,
CHANGE COLUMN `pan_number` `pan_number` VARCHAR(100) NULL DEFAULT NULL ,
CHANGE COLUMN `tan_number` `tan_number` VARCHAR(100) NULL DEFAULT NULL ;

ALTER TABLE ca_firm.employees ADD COLUMN photo LONGTEXT AFTER status;

ALTER TABLE `ca_firm`.`time_sheets` 
DROP FOREIGN KEY `time_sheets_ibfk_2`;
ALTER TABLE `ca_firm`.`time_sheets` 
CHANGE COLUMN `client_id` `client_id` INT NULL DEFAULT NULL ;
ALTER TABLE `ca_firm`.`time_sheets` 
ADD CONSTRAINT `time_sheets_ibfk_2`
  FOREIGN KEY (`client_id`)
  REFERENCES `ca_firm`.`clients` (`client_id`)
  ON DELETE CASCADE;

ALTER TABLE ca_firm.clients 
ADD COLUMN display_name VARCHAR(100) AFTER client_name;

ALTER TABLE ca_firm.clients ADD COLUMN photo LONGTEXT AFTER status;

ALTER TABLE `ca_firm`.`attendance` 
CHANGE COLUMN `status` `status` ENUM('0', '1') NULL DEFAULT '0' ;

ALTER TABLE attendance 
CHANGE COLUMN date login_date DATE NOT NULL,
ADD COLUMN logout_date DATE DEFAULT NULL AFTER login_time,
CHANGE COLUMN total_hours total_minutes INT DEFAULT NULL,
CHANGE COLUMN status status ENUM('0','1') NOT NULL DEFAULT '0',
MODIFY COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE ca_firm.services 
ADD COLUMN service_short_name VARCHAR(20) NULL AFTER service_name;

ALTER TABLE `ca_firm`.`attendance` 
DROP FOREIGN KEY `attendance_ibfk_1`;

ALTER TABLE `ca_firm`.`attendance` 
DROP INDEX `employee_id` ;

CREATE TABLE calendar (
    cal_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('0', '1') NOT NULL DEFAULT '0',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ca_firm.attendance ADD COLUMN total_time TIME AFTER total_minutes;

-------------Permissions-----------------


CREATE TABLE tbl_menus (
    menu_id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT DEFAULT NULL,
    menu_name VARCHAR(100) NOT NULL,
    sequence_number INT DEFAULT 0,
    created_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES tbl_menus(menu_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES employees(employee_id) ON DELETE SET NULL
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
    FOREIGN KEY (created_by) REFERENCES employees(employee_id) ON DELETE SET NULL
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
    FOREIGN KEY (granted_by) REFERENCES employees(employee_id) ON DELETE CASCADE
);


INSERT INTO tbl_menus (menu_id, parent_id, menu_name, created_by, created_at,sequence_number)
VALUES (1, NULL, 'Dashboard', NULL, NOW(),1);

INSERT INTO tbl_menus (menu_id, parent_id, menu_name, created_by, created_at,sequence_number)
VALUES (2, NULL, 'Calender', NULL, NOW(),2);

-- Insert Parent Menu
INSERT INTO tbl_menus (menu_id, parent_id, menu_name, created_by, created_at,sequence_number)
VALUES (3, NULL, 'Employee Management', NULL, NOW(),3);

-- Insert Submenus
INSERT INTO tbl_menus (menu_id, parent_id, menu_name, created_by, created_at,sequence_number)
VALUES 
(4, 3, 'Create Employee', NULL, NOW(),1),
(5, 3, 'View / Edit Profile', NULL, NOW(),2);




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
(1, 5);

-------------------end----------
ALTER TABLE ca_firm.calendar ADD COLUMN color VARCHAR(20) AFTER title;

ALTER TABLE ca_firm.time_sheets ADD COLUMN total_time VARCHAR(10) AFTER total_minutes;

ALTER TABLE `ca_firm`.`time_sheets` 
DROP FOREIGN KEY `time_sheets_ibfk_2`,
DROP FOREIGN KEY `time_sheets_ibfk_1`;

ALTER TABLE `ca_firm`.`time_sheets` 
DROP INDEX `time_sheets_ibfk_2` ,
DROP INDEX `employee_id` ;

ALTER TABLE `ca_firm`.`time_sheets`
ADD COLUMN `week_id` INT AFTER `task_id`;

ALTER TABLE `ca_firm`.`tbl_permissions` 
ADD COLUMN `status` INT NULL DEFAULT 1 AFTER `created_at`;

ALTER TABLE `ca_firm`.`employees` 
CHANGE COLUMN `role` `role` INT NULL DEFAULT 3 ;

ALTER TABLE tbl_menus ADD COLUMN status ENUM('0', '1') NOT NULL DEFAULT '0';

CREATE TABLE tbl_leave_requests (
    leave_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    leave_type ENUM('Casual', 'Sick', 'Annual', 'Unpaid') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    status ENUM('Pending', 'Approved', 'Rejected', 'Deleted') DEFAULT 'Pending',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by INT NULL,
    approved_at TIMESTAMP NULL DEFAULT NULL
);

ALTER TABLE `ca_firm`.`employees` 
ADD COLUMN `permission_id` INT NULL DEFAULT NULL AFTER `updated_at`,
ADD COLUMN `granted_by` INT NULL DEFAULT NULL AFTER `permission_id`,
ADD COLUMN `granted_at` TIMESTAMP NULL DEFAULT NULL AFTER `granted_by`;

ALTER TABLE `ca_firm`.`tbl_permissions` 
AUTO_INCREMENT = 3 ;

ALTER TABLE `ca_firm`.`tbl_menus` 
ADD COLUMN `mob_path` VARCHAR(255) NULL DEFAULT '' AFTER `menu_name`;

ALTER TABLE `ca_firm`.`attendance` 
ADD COLUMN `login_latitude` VARCHAR(45) NULL DEFAULT NULL AFTER `total_time`,
ADD COLUMN `login_longitude` VARCHAR(45) NULL DEFAULT NULL AFTER `login_latitude`,
ADD COLUMN `logout_latitude` VARCHAR(45) NULL DEFAULT NULL AFTER `login_longitude`,
ADD COLUMN `logout_longitude` VARCHAR(45) NULL DEFAULT NULL AFTER `logout_latitude`;


----------------------10-06-2025----------------------
CREATE TABLE ca_firm.documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    doc_url VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('0', '1') DEFAULT '0'
);

ALTER TABLE `ca_firm`.`documents` 
ADD COLUMN `type` VARCHAR(100) NOT NULL AFTER `client_id`;

INSERT INTO documents (client_id, type, doc_url, description) VALUES
(1, 'personal', 'https://example.com/docs/contract_101.pdf', 'Signed contract for client 101'),
(2, 'office', 'https://example.com/docs/invoice_102.pdf', 'Invoice for March'),
(3, 'personal', 'https://example.com/docs/report_103.pdf', 'Annual report for client 103'),
(1, 'official', 'https://example.com/docs/nda_101.pdf', 'NDA agreement - client 101'),
(4, 'personal', 'https://example.com/docs/specs_104.pdf', 'Product specifications - client 104'),
(2, 'office', 'https://example.com/docs/specs_104.pdf', 'example'),
(1, 'official', 'https://example.com/docs/specs_104.pdf', 'fvcdvfdg fvevdvsd');

CREATE TABLE `ca_firm`.`document_type` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `type_name` VARCHAR(100) NOT NULL,
  `status` ENUM('0', '1') NOT NULL DEFAULT '0',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`));
