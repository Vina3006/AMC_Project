-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: amc_db
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `assets`
--

DROP TABLE IF EXISTS `assets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL,
  `asset_type` varchar(50) NOT NULL,
  `brand` varchar(80) DEFAULT NULL,
  `model` varchar(100) DEFAULT NULL,
  `serial_number` varchar(100) DEFAULT NULL,
  `location` varchar(150) DEFAULT NULL,
  `purchase_date` date DEFAULT NULL,
  `status` enum('active','under_repair','retired') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `serial_number` (`serial_number`),
  KEY `client_id` (`client_id`),
  CONSTRAINT `assets_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assets`
--

LOCK TABLES `assets` WRITE;
/*!40000 ALTER TABLE `assets` DISABLE KEYS */;
INSERT INTO `assets` VALUES (1,1,'Desktop','Dell','OptiPlex 3080','DL-1001','Front office',NULL,'active','2026-10-11 04:26:09'),(2,1,'Laptop','HP','ProBook 450','HP-2002','Manager cabin',NULL,'active','2026-10-11 04:26:09'),(3,1,'Printer','Canon','LBP6030','CN-3003','Reception',NULL,'active','2026-10-11 07:27:28'),(6,2,'Network device','ER-20','ER-12','VSD-123','Zero place','2026-10-13','active','2026-10-13 09:06:03');
/*!40000 ALTER TABLE `assets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clients`
--

DROP TABLE IF EXISTS `clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `contact_person` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `address` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `clients_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clients`
--

LOCK TABLES `clients` WRITE;
/*!40000 ALTER TABLE `clients` DISABLE KEYS */;
INSERT INTO `clients` VALUES (1,5,'Sharma Traders','Rahul Sharma','9876543210','rahul@sharmatraders.com','Main Road, Ahilyanagar','2026-10-11 04:26:09'),(2,9,'Patil Computers','Amit Patil','9123456789','amit@patil.com','Station Road, Sangli','2026-10-11 07:53:28');
/*!40000 ALTER TABLE `clients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contract_assets`
--

DROP TABLE IF EXISTS `contract_assets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contract_assets` (
  `contract_id` int NOT NULL,
  `asset_id` int NOT NULL,
  PRIMARY KEY (`contract_id`,`asset_id`),
  KEY `asset_id` (`asset_id`),
  CONSTRAINT `contract_assets_ibfk_1` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `contract_assets_ibfk_2` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contract_assets`
--

LOCK TABLES `contract_assets` WRITE;
/*!40000 ALTER TABLE `contract_assets` DISABLE KEYS */;
INSERT INTO `contract_assets` VALUES (1,1),(2,1),(1,2),(2,2),(3,6);
/*!40000 ALTER TABLE `contract_assets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contracts`
--

DROP TABLE IF EXISTS `contracts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contracts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL,
  `plan_name` varchar(100) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `visit_frequency_months` int DEFAULT '3',
  `status` enum('active','expired','cancelled') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `client_id` (`client_id`),
  CONSTRAINT `contracts_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contracts`
--

LOCK TABLES `contracts` WRITE;
/*!40000 ALTER TABLE `contracts` DISABLE KEYS */;
INSERT INTO `contracts` VALUES (1,1,'Annual Maintenance - Desktop','2026-10-01','2027-09-30',2000.00,3,'active','2026-10-11 04:26:09'),(2,1,'Comprehensive AMC','2026-11-01','2027-10-31',5000.00,3,'active','2026-10-12 04:35:30'),(3,2,'Annual Maintain all computer','2026-10-13','2026-12-13',1000.00,1,'active','2026-10-13 09:07:02');
/*!40000 ALTER TABLE `contracts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `client_id` int DEFAULT NULL,
  `service_id` int DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('unpaid','paid') DEFAULT 'unpaid',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `contract_id` int DEFAULT NULL,
  `ticket_id` int DEFAULT NULL,
  `invoice_type` enum('service','contract','ticket') NOT NULL DEFAULT 'service',
  `description` varchar(255) DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `service_id` (`service_id`),
  KEY `client_id` (`client_id`),
  KEY `contract_id` (`contract_id`),
  KEY `ticket_id` (`ticket_id`),
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `invoices_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`),
  CONSTRAINT `invoices_ibfk_3` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`),
  CONSTRAINT `invoices_ibfk_4` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`),
  CONSTRAINT `invoices_ibfk_5` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
INSERT INTO `invoices` VALUES (1,4,NULL,1,2000.00,'paid','2026-10-08 03:00:05',NULL,NULL,'service',NULL,NULL,NULL),(2,5,1,1,2000.00,'paid','2026-10-11 03:54:54',NULL,NULL,'service',NULL,NULL,NULL),(3,7,NULL,1,2000.00,'paid','2026-10-11 08:27:32',NULL,NULL,'service',NULL,NULL,NULL),(4,9,2,2,2500.00,'paid','2026-10-12 04:11:20',NULL,NULL,'service',NULL,NULL,NULL);
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_id` int NOT NULL,
  `transaction_ref` varchar(50) NOT NULL,
  `method` varchar(30) DEFAULT 'mock',
  `status` enum('success','failed') DEFAULT 'success',
  `paid_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `invoice_id` (`invoice_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,1,'MOCK-A900411F','mock','success','2026-10-08 03:00:05'),(2,2,'MOCK-6B62B684','mock','success','2026-10-11 03:54:54'),(3,3,'MOCK-074A6F06','mock','success','2026-10-11 08:27:32'),(4,4,'MOCK-DDB3C1E4','mock','success','2026-10-12 04:11:20');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `services`
--

DROP TABLE IF EXISTS `services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `services` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `services`
--

LOCK TABLES `services` WRITE;
/*!40000 ALTER TABLE `services` DISABLE KEYS */;
INSERT INTO `services` VALUES (1,'Annual Maintenance - Desktop','Yearly AMC for desktop computers',2000.00,1,'2026-10-07 08:50:01'),(2,'Annual Maintenance - Laptop','Yearly AMC for laptops',2500.00,1,'2026-10-07 08:50:01'),(3,'Network Support','Router, switch and LAN troubleshooting',3500.00,1,'2026-10-07 08:50:01');
/*!40000 ALTER TABLE `services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_history`
--

DROP TABLE IF EXISTS `ticket_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ticket_id` int NOT NULL,
  `changed_by` int DEFAULT NULL,
  `action` varchar(40) NOT NULL,
  `old_status` varchar(20) DEFAULT NULL,
  `new_status` varchar(20) DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ticket_id` (`ticket_id`),
  KEY `changed_by` (`changed_by`),
  CONSTRAINT `ticket_history_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ticket_history_ibfk_2` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_history`
--

LOCK TABLES `ticket_history` WRITE;
/*!40000 ALTER TABLE `ticket_history` DISABLE KEYS */;
INSERT INTO `ticket_history` VALUES (1,3,5,'created',NULL,'open','Priority: medium','2026-10-12 13:34:18'),(2,3,6,'assigned','open','assigned','Technician id 10','2026-10-12 14:05:45'),(3,3,6,'visit_scheduled',NULL,NULL,'Visit on 2026-10-15 11:00:00','2026-10-12 14:10:14'),(4,3,10,'visit_completed',NULL,NULL,'Replaced the keyboard and tested all keys','2026-10-12 14:15:34'),(5,3,10,'status_changed','assigned','resolved','Resolved after visit','2026-10-12 14:15:34'),(6,4,5,'created',NULL,'open','Priority: high','2026-10-13 04:57:10'),(7,4,6,'assigned','open','assigned','Technician id 10','2026-10-13 04:59:31'),(8,4,6,'visit_scheduled',NULL,NULL,'Visit on 2026-10-13 10:35:00','2026-10-13 05:00:29'),(9,4,6,'visit_scheduled',NULL,NULL,'Visit on 2026-10-13 10:30:00','2026-10-13 05:00:39'),(10,4,10,'status_changed','assigned','in_progress',NULL,'2026-10-13 05:01:59'),(11,4,10,'visit_completed',NULL,NULL,'done','2026-10-13 05:02:19'),(12,4,10,'status_changed','in_progress','resolved','Resolved after visit','2026-10-13 05:02:19'),(13,4,10,'visit_completed',NULL,NULL,'fine done','2026-10-13 05:02:36'),(14,4,5,'status_changed','resolved','closed',NULL,'2026-10-13 05:03:23'),(15,2,6,'status_changed','open','closed',NULL,'2026-10-13 13:32:27');
/*!40000 ALTER TABLE `ticket_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tickets`
--

DROP TABLE IF EXISTS `tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tickets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL,
  `asset_id` int NOT NULL,
  `contract_id` int NOT NULL,
  `raised_by` int NOT NULL,
  `assigned_to` int DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `description` text,
  `priority` enum('high','medium','low') NOT NULL DEFAULT 'medium',
  `status` enum('open','assigned','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
  `due_at` datetime NOT NULL,
  `resolved_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `client_id` (`client_id`),
  KEY `asset_id` (`asset_id`),
  KEY `contract_id` (`contract_id`),
  KEY `raised_by` (`raised_by`),
  KEY `assigned_to` (`assigned_to`),
  CONSTRAINT `tickets_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`),
  CONSTRAINT `tickets_ibfk_2` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`),
  CONSTRAINT `tickets_ibfk_3` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`),
  CONSTRAINT `tickets_ibfk_4` FOREIGN KEY (`raised_by`) REFERENCES `users` (`id`),
  CONSTRAINT `tickets_ibfk_5` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tickets`
--

LOCK TABLES `tickets` WRITE;
/*!40000 ALTER TABLE `tickets` DISABLE KEYS */;
INSERT INTO `tickets` VALUES (1,1,1,1,5,10,'Computer not starting','Shows black screen after power on','high','closed','2026-10-12 20:07:00','2026-10-12 17:39:56','2026-10-12 10:37:00','2026-10-12 12:13:43'),(2,1,1,1,5,NULL,'Printer not printing','Paper jam error','medium','closed','2026-10-13 16:38:06',NULL,'2026-10-12 11:08:06','2026-10-13 13:32:27'),(3,1,1,1,5,10,'Keyboard not working','Keys do not respond','medium','resolved','2026-10-13 19:04:18','2026-10-12 19:45:34','2026-10-12 13:34:18','2026-10-12 14:15:34'),(4,1,1,1,5,10,'Computer not starting',NULL,'high','closed','2026-10-13 14:27:10','2026-10-13 10:32:19','2026-10-13 04:57:10','2026-10-13 05:03:23');
/*!40000 ALTER TABLE `tickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','staff','technician','customer') NOT NULL DEFAULT 'customer',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Test User','test@example.com','$2b$10$6onrEdjI/B1JaMj5cePO5OE27PUH1Qp1Fvcm9lC6IRnSXC2WRxA5O','staff','2026-10-07 04:37:37'),(2,'Customer One','customer1@example.com','$2b$10$/CM8iKUejrKvbYZ3iaUkouQcQYmPLaJ4AU94gZGSiFyUBubilEmkq','customer','2026-10-07 07:36:00'),(3,'Customer One','customer@example.com','$2b$10$/skUouOYSuM.WC4aVOMkbecACKKcEoHVtihrdPAEMbrw7Qkk3CADe','customer','2026-10-08 01:57:19'),(4,'Customer two','customer2@example.com','$2b$10$9/CcTwOiBhy8JuesXb4bp.upC3WNswaDYUDIwLbEeNYe2f0g5Ext6','customer','2026-10-08 02:51:44'),(5,'Sagar Shinde','sagar11@gmail.com','$2b$10$btGHT6WNaZLnJwoSpBT/reoletW7W3qUcw2wbnR1xxlR5n2fox3Ia','customer','2026-10-11 02:57:17'),(6,'System Admin','admin@test.com','$2b$10$G5r.meehzcrpvZ7zNeF.hevCXkQ4MdffpwZWgBfuiW9KyXjy3ADj.','admin','2026-10-11 07:18:56'),(7,'Komal Ghodeswar','komi@test.com','$2b$10$DtvXdIpstvhHsLbS7plo/uMfxrDOFwFZp0oKg/xJDXFbOnSwGFR7W','staff','2026-10-11 08:26:55'),(8,'pooja patil','abc@123456.com','$2b$10$Vj4poik3fKzgSJwCZhic2e4uJ56fDWHyqtHYRFO2ngdj5TbazzRo.','customer','2026-10-12 04:10:09'),(9,'priya patil','priya09@gmail.com','$2b$10$PzcCq5OUgSCTVQxQyVLH7.msA4cgI0VrynSNLzMUOfiMI/hj5/Yjm','customer','2026-10-12 04:10:59'),(10,'technician wala','tech@test.com','$2b$10$Ii4/s2G6OxDzlIhIL7vl7uKWWmaGojCpC1aKFcuspKWD4hTdjousW','technician','2026-10-12 09:55:02'),(11,'guru','guru@test.com','$2b$10$ncRf3W95RVvoco1995VQtO3BJXMdls64VsVh4PU1p17vQAE.3rVb6','technician','2026-10-12 17:49:08'),(12,'anuradha','anu@patil.com','$2b$10$CunD4rH62yZKzHAi8lUik.AQSgw58k5tOkPPhMTIghmeaktioVZP6','customer','2026-10-13 05:08:24'),(13,'Mayur Yadav','mayur@gmail.com','$2b$10$aOJehNOuHa2/KqrUbxS49O0sjCfjShamlUTa0gRpYUkjzkPyytcxC','technician','2026-10-13 06:25:54'),(14,'Nirmala Shinde','nimu@shinde.com','$2b$10$RrSOppRMD8Rmu.VNGBiZSur9JHiIDj2K4pAxQaAb8lzm7kWXcVxWC','staff','2026-10-13 09:14:56'),(15,'Vishakha shinde','vishu11@gmail.com','$2b$10$BQLdvGWzMqtYvvsO5HvGBODBnq5jVRn8jiMAarVYr6mkQGDFj59SK','customer','2026-10-14 11:03:38');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `visits`
--

DROP TABLE IF EXISTS `visits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `visits` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ticket_id` int NOT NULL,
  `technician_id` int NOT NULL,
  `scheduled_at` datetime NOT NULL,
  `completed_at` datetime DEFAULT NULL,
  `work_done` text,
  `notes` text,
  `status` enum('scheduled','completed','cancelled') NOT NULL DEFAULT 'scheduled',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ticket_id` (`ticket_id`),
  KEY `technician_id` (`technician_id`),
  CONSTRAINT `visits_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `visits_ibfk_2` FOREIGN KEY (`technician_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `visits`
--

LOCK TABLES `visits` WRITE;
/*!40000 ALTER TABLE `visits` DISABLE KEYS */;
INSERT INTO `visits` VALUES (1,3,10,'2026-10-15 11:00:00','2026-10-12 19:45:34','Replaced the keyboard and tested all keys','Customer informed','completed','2026-10-12 14:10:14','2026-10-12 14:15:34'),(2,4,10,'2026-10-13 10:35:00','2026-10-13 10:32:19','done',NULL,'completed','2026-10-13 05:00:29','2026-10-13 05:02:19'),(3,4,10,'2026-10-13 10:30:00','2026-10-13 10:32:36','fine done',NULL,'completed','2026-10-13 05:00:39','2026-10-13 05:02:36');
/*!40000 ALTER TABLE `visits` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-14 16:49:57
