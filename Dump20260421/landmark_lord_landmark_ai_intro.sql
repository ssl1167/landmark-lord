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
-- Table structure for table `landmark_ai_intro`
--

DROP TABLE IF EXISTS `landmark_ai_intro`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `landmark_ai_intro` (
  `id` varchar(64) NOT NULL,
  `landmark_id` varchar(64) NOT NULL,
  `language` varchar(8) NOT NULL,
  `intro_text` text NOT NULL,
  `audio_url` varchar(512) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ai_landmark_lang` (`landmark_id`,`language`),
  KEY `idx_ai_landmark` (`landmark_id`),
  CONSTRAINT `fk_ai_landmark` FOREIGN KEY (`landmark_id`) REFERENCES `landmarks` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `landmark_ai_intro`
--

LOCK TABLES `landmark_ai_intro` WRITE;
/*!40000 ALTER TABLE `landmark_ai_intro` DISABLE KEYS */;
INSERT INTO `landmark_ai_intro` VALUES ('id_1776771695809_c6v5vameg','cucx9kf7d2pz5bqy1','cn','# 中国传媒大学 · 定福庄的造梦者聚集地\n你是否曾为一条刷屏全网的短视频拍案叫绝？是否好奇过综艺里的神级舞台是如何诞生？或是想知道新闻主播手中的稿件背后藏着多少幕后心血？坐落在北京市朝阳区定福庄东街1号的中国传媒大学，就是这份“造梦能力”的源头之一。\n\n作为教育部直属的信息传播领域顶尖高校，中传从来不是刻板的“象牙塔”：这里有全国顶尖的播音主持、广播电视编导专业，曾走出过无数家喻户晓的主持人、纪录片导演；动画与数字艺术学院的学生用画笔和代码，把国风动画、元宇宙场景从想象搬进了现实；广告、新媒体专业的课堂上，你能看到最新的AI生成内容实验、爆款营销案例复盘；就连校园里的广播台、电视台，都是学生们提前练兵的“小职场”。\n\n走在中传的校园里，你会发现连梧桐道都带着“传媒基因”：路边的公告栏里贴着手写的话剧海报，食堂里总能偶遇扛着设备的同学捕捉镜头，甚至连外卖柜的取餐播报，都可能是播音系学生的练习作业。从这里走出的从业者，或许正握着你每天刷到的新闻素材，或许正在剪辑你追的综艺，或许正在用镜头讲好中国故事。\n\n如果你也想成为信息传播浪潮里的参与者，或是单纯好奇“媒体是如何炼成的”，不妨来定福庄这条街上走走——这里不止有书本知识，更有把热爱变成事业的无限可能。',NULL,'2026-04-21 19:41:35','2026-04-21 19:41:35');
/*!40000 ALTER TABLE `landmark_ai_intro` ENABLE KEYS */;
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
