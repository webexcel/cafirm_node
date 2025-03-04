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