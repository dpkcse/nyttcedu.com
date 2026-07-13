-- Student Photo Management safe schema update.
-- Re-runnable on MySQL/MariaDB: adds only missing columns/indexes/table.

SET @db_name := DATABASE();

SET @sql := IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=@db_name AND TABLE_NAME='new_old_nyttc_certificates' AND COLUMN_NAME='photo_path') = 0,
  'ALTER TABLE `new_old_nyttc_certificates` ADD COLUMN `photo_path` varchar(255) NULL DEFAULT NULL AFTER `updated_by`',
  'SELECT "photo_path already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=@db_name AND TABLE_NAME='new_old_nyttc_certificates' AND COLUMN_NAME='photo_updated_at') = 0,
  'ALTER TABLE `new_old_nyttc_certificates` ADD COLUMN `photo_updated_at` timestamp NULL DEFAULT NULL AFTER `photo_path`',
  'SELECT "photo_updated_at already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=@db_name AND TABLE_NAME='new_old_nyttc_certificates' AND COLUMN_NAME='photo_updated_by') = 0,
  'ALTER TABLE `new_old_nyttc_certificates` ADD COLUMN `photo_updated_by` int(11) NULL DEFAULT NULL AFTER `photo_updated_at`',
  'SELECT "photo_updated_by already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=@db_name AND TABLE_NAME='new_old_nyttc_certificates' AND INDEX_NAME='idx_new_old_cert_serial_photo') = 0,
  'CREATE INDEX `idx_new_old_cert_serial_photo` ON `new_old_nyttc_certificates` (`serial_no`)',
  'SELECT "serial_no photo index already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=@db_name AND TABLE_NAME='new_old_nyttc_certificates' AND INDEX_NAME='idx_new_old_cert_s_name_photo') = 0,
  'CREATE INDEX `idx_new_old_cert_s_name_photo` ON `new_old_nyttc_certificates` (`s_name`)',
  'SELECT "s_name photo index already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `student_photo_activity_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `serial_no` varchar(20) NOT NULL,
  `action_type` varchar(40) NOT NULL,
  `old_photo_path` varchar(255) DEFAULT NULL,
  `new_photo_path` varchar(255) DEFAULT NULL,
  `updated_by` int(11) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_student_photo_logs_student_id` (`student_id`),
  KEY `idx_student_photo_logs_action_type` (`action_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- Rollback (manual):
-- DROP TABLE IF EXISTS `student_photo_activity_logs`;
-- DROP INDEX `idx_new_old_cert_serial_photo` ON `new_old_nyttc_certificates`;
-- DROP INDEX `idx_new_old_cert_s_name_photo` ON `new_old_nyttc_certificates`;
-- ALTER TABLE `new_old_nyttc_certificates` DROP COLUMN `photo_updated_by`, DROP COLUMN `photo_updated_at`, DROP COLUMN `photo_path`;
