-- Hedef: mysql://127.0.0.1:3306/bre_berber (XAMPP MySQL, local)
-- Bre Berber — başlangıç verisi (admin hariç; admin scripts/create_admin.php ile)

USE bre_berber;

INSERT INTO services (name, duration_min, price, is_active, sort_order)
SELECT v.name, v.duration_min, v.price, v.is_active, v.sort_order
FROM (
  SELECT 'Saç kesimi' AS name, 30 AS duration_min, 350.00 AS price, 1 AS is_active, 1 AS sort_order
  UNION ALL SELECT 'Sakal tıraşı', 30, 200.00, 1, 2
  UNION ALL SELECT 'Saç + sakal', 60, 500.00, 1, 3
) AS v
WHERE NOT EXISTS (SELECT 1 FROM services LIMIT 1);

-- weekday: 0=Pazar … 6=Cumartesi
INSERT INTO working_hours (weekday, open_time, close_time, is_closed) VALUES
  (0, '09:00:00', '19:00:00', 1),
  (1, '09:00:00', '19:00:00', 0),
  (2, '09:00:00', '19:00:00', 0),
  (3, '09:00:00', '19:00:00', 0),
  (4, '09:00:00', '19:00:00', 0),
  (5, '09:00:00', '19:00:00', 0),
  (6, '09:00:00', '19:00:00', 0)
ON DUPLICATE KEY UPDATE
  open_time = VALUES(open_time),
  close_time = VALUES(close_time),
  is_closed = VALUES(is_closed);

INSERT INTO shop_settings (setting_key, setting_value) VALUES
  ('shop_name', 'Bre Berber'),
  ('address', 'Atatürk Mah. 13. Cad. (Tunceli–Elazığ Yolu), Ender Yapı No: 4, Merkez / Tunceli'),
  ('phone', '0541 213 62 62'),
  ('whatsapp', '05412136262'),
  ('email', 'tangobaymurat@hotmail.com'),
  ('maps_query', 'Atatürk Mah. 13. Cad. Ender Yapı No: 4 Merkez Tunceli'),
  ('intro', 'Bre Berber. Tunceli Atatürk Mahallesi’nde, düzgün kesim ve sakal için uğrayabileceğin bir yer.\nRandevunu buradan al; gelince sıra beklemeden otur.'),
  ('slot_minutes', '30'),
  ('cancel_hours_before', '2')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
