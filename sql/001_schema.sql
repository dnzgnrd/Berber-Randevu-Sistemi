-- Hedef: mysql://127.0.0.1:3306/bre_berber (XAMPP MySQL, local)
-- Bre Berber — şema

CREATE DATABASE IF NOT EXISTS bre_berber
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_turkish_ci;

USE bre_berber;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

CREATE TABLE IF NOT EXISTS services (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  duration_min SMALLINT UNSIGNED NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

CREATE TABLE IF NOT EXISTS working_hours (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  weekday TINYINT UNSIGNED NOT NULL COMMENT '0=Pazar … 6=Cumartesi',
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  is_closed TINYINT(1) NOT NULL DEFAULT 0,
  UNIQUE KEY uq_working_weekday (weekday)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

CREATE TABLE IF NOT EXISTS days_off (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  off_date DATE NOT NULL,
  note VARCHAR(255) NULL,
  UNIQUE KEY uq_days_off_date (off_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

CREATE TABLE IF NOT EXISTS appointments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  service_id INT UNSIGNED NOT NULL,
  appt_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- İptal/red sonrası slot serbest kalsın diye: sadece pending|approved için dolu anahtar
  slot_key VARCHAR(32) GENERATED ALWAYS AS (
    IF(status IN ('pending', 'approved'), CONCAT(appt_date, ' ', start_time), NULL)
  ) STORED,
  CONSTRAINT fk_appt_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_appt_service FOREIGN KEY (service_id) REFERENCES services (id),
  UNIQUE KEY uq_appt_slot_key (slot_key),
  KEY idx_appt_date (appt_date),
  KEY idx_appt_user (user_id),
  KEY idx_appt_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

CREATE TABLE IF NOT EXISTS gallery (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  file_path VARCHAR(255) NOT NULL,
  alt_text VARCHAR(255) NOT NULL DEFAULT '',
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

CREATE TABLE IF NOT EXISTS login_attempts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  attempted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_login_email_time (email, attempted_at),
  KEY idx_login_ip_time (ip_address, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

CREATE TABLE IF NOT EXISTS shop_settings (
  setting_key VARCHAR(64) PRIMARY KEY,
  setting_value TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;
