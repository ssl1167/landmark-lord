-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: landmark_lord
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `landmark_influence`
--

DROP TABLE IF EXISTS `landmark_influence`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `landmark_influence` (
  `id` varchar(64) NOT NULL,
  `user_id` varchar(64) NOT NULL,
  `landmark_id` varchar(64) NOT NULL,
  `score` int NOT NULL DEFAULT '0',
  `level` int NOT NULL DEFAULT '1',
  `ranking` int NOT NULL DEFAULT '0',
  `is_guardian` tinyint(1) NOT NULL DEFAULT '0',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_influence_user_landmark` (`user_id`,`landmark_id`),
  KEY `idx_influence_landmark_score` (`landmark_id`,`score` DESC),
  KEY `idx_influence_user` (`user_id`),
  KEY `idx_influence_guardian` (`landmark_id`,`is_guardian`),
  CONSTRAINT `fk_influence_landmark` FOREIGN KEY (`landmark_id`) REFERENCES `landmarks` (`id`),
  CONSTRAINT `fk_influence_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `landmark_influence`
--

LOCK TABLES `landmark_influence` WRITE;
/*!40000 ALTER TABLE `landmark_influence` DISABLE KEYS */;
INSERT INTO `landmark_influence` VALUES ('id_1776771679003_57q8tf6db','id_1776756816894_tkwcg71mg','cucx9kf7d2pz5bqy1',50,1,1,1,'2026-04-21 19:41:19');
/*!40000 ALTER TABLE `landmark_influence` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-21 20:47:17
