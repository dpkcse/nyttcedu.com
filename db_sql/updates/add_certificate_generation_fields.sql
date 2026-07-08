-- Safe additive update for generated certificate PDF/QR tracking.
-- Run once before using the admin PDF generator.
ALTER TABLE `new_old_nyttc_certificates`
  ADD COLUMN `certificate_pdf_path` varchar(255) DEFAULT NULL AFTER `is_received`,
  ADD COLUMN `qr_code_path` varchar(255) DEFAULT NULL AFTER `certificate_pdf_path`,
  ADD COLUMN `generated_at` timestamp NULL DEFAULT NULL AFTER `qr_code_path`,
  ADD COLUMN `generated_by` smallint(6) DEFAULT NULL AFTER `generated_at`,
  ADD COLUMN `is_generated` tinyint(1) NOT NULL DEFAULT 0 AFTER `generated_by`,
  ADD COLUMN `issue_date` date DEFAULT NULL AFTER `is_generated`,
  ADD COLUMN `reg_no` varchar(50) DEFAULT NULL AFTER `issue_date`,
  ADD COLUMN `passport_no` varchar(50) DEFAULT NULL AFTER `reg_no`,
  ADD COLUMN `roll_no` varchar(50) DEFAULT NULL AFTER `passport_no`,
  ADD COLUMN `course_duration` varchar(100) DEFAULT NULL AFTER `roll_no`,
  ADD COLUMN `exam_month` varchar(50) DEFAULT NULL AFTER `course_duration`,
  ADD COLUMN `institute_name` varchar(150) DEFAULT NULL AFTER `exam_month`;
