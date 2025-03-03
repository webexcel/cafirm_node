ALTER TABLE ca_firm.employees 
ADD COLUMN role VARCHAR(5) 
AFTER phone;

ALTER TABLE ca_firm.employees MODIFY COLUMN status TINYINT(1) DEFAULT 0;

ALTER TABLE ca_firm.employees MODIFY COLUMN status ENUM('0', '1') DEFAULT '0';
