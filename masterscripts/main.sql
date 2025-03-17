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