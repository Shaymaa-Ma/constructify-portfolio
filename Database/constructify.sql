-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Aug 18, 2026 at 05:32 AM
-- Server version: 8.4.7
-- PHP Version: 8.3.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `constructify`
--

-- --------------------------------------------------------

--
-- Table structure for table `about_features`
--

DROP TABLE IF EXISTS `about_features`;
CREATE TABLE IF NOT EXISTS `about_features` (
  `id` int NOT NULL AUTO_INCREMENT,
  `icon` varchar(50) DEFAULT NULL,
  `title` varchar(150) DEFAULT NULL,
  `description` text,
  `display_order` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `about_features`
--

INSERT INTO `about_features` (`id`, `icon`, `title`, `description`, `display_order`) VALUES
(1, 'bi-shield-check', 'Licensed & Insured', 'Fully certified with comprehensive coverage for every project we undertake.', 1),
(2, 'bi-clock-history', 'On-Time Delivery', 'Proven track record of completing projects within schedule and budget.', 2),
(3, 'bi-people', 'Expert Workforce', 'Over 120 skilled professionals across all construction disciplines.', 3),
(4, 'bi-award', 'Award Winning', 'Recognized with 35+ industry awards for quality and innovation.', 4);

-- --------------------------------------------------------

--
-- Table structure for table `about_section`
--

DROP TABLE IF EXISTS `about_section`;
CREATE TABLE IF NOT EXISTS `about_section` (
  `id` int NOT NULL AUTO_INCREMENT,
  `badge_text` varchar(150) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` text,
  `overlay_badge_text` varchar(100) DEFAULT NULL,
  `image_primary` varchar(255) DEFAULT NULL,
  `image_secondary` varchar(255) DEFAULT NULL,
  `primary_btn_text` varchar(100) DEFAULT NULL,
  `primary_btn_link` varchar(255) DEFAULT NULL,
  `secondary_btn_text` varchar(100) DEFAULT NULL,
  `secondary_btn_link` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `about_section`
--

INSERT INTO `about_section` (`id`, `badge_text`, `title`, `description`, `overlay_badge_text`, `image_primary`, `image_secondary`, `primary_btn_text`, `primary_btn_link`, `secondary_btn_text`, `secondary_btn_link`) VALUES
(1, 'About Constructify', 'We Build With Precision, Passion & Purpose', 'Since 1998, we have been delivering world class construction services across residential, commercial, and infrastructure sectors. Our commitment to quality craftsmanship and client satisfaction drives everything we do.', '25+ Years of Experience', 'about-primary.jpg', 'about-secondary.jpg', 'Start Your Project', '#', 'View Our Work', '#projects');

-- --------------------------------------------------------

--
-- Table structure for table `counters`
--

DROP TABLE IF EXISTS `counters`;
CREATE TABLE IF NOT EXISTS `counters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `section_key` varchar(50) NOT NULL,
  `icon` varchar(50) DEFAULT NULL,
  `value` varchar(20) NOT NULL,
  `label` varchar(100) NOT NULL,
  `display_order` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `counters`
--

INSERT INTO `counters` (`id`, `section_key`, `icon`, `value`, `label`, `display_order`) VALUES
(1, 'hero', 'bi-award', '25+', 'Years Experience', 1),
(2, 'hero', 'bi-building', '850+', 'Projects Completed', 2),
(3, 'hero', 'bi-people', '120+', 'Team Experts', 3),
(4, 'hero', 'bi-trophy', '35+', 'Industry Awards', 4),
(5, 'services', 'bi-bar-chart', '850+', 'Projects Delivered', 1),
(6, 'services', 'bi-emoji-smile', '620+', 'Satisfied Clients', 2),
(7, 'services', 'bi-people', '120+', 'Skilled Workers', 3),
(8, 'services', 'bi-trophy', '35+', 'Industry Awards', 4);

-- --------------------------------------------------------

--
-- Table structure for table `hero_section`
--

DROP TABLE IF EXISTS `hero_section`;
CREATE TABLE IF NOT EXISTS `hero_section` (
  `id` int NOT NULL AUTO_INCREMENT,
  `badge_text` varchar(150) DEFAULT NULL,
  `title_text` varchar(255) DEFAULT NULL,
  `title_highlight` varchar(100) DEFAULT NULL,
  `subtitle` text,
  `primary_btn_text` varchar(100) DEFAULT NULL,
  `primary_btn_link` varchar(255) DEFAULT NULL,
  `secondary_btn_text` varchar(100) DEFAULT NULL,
  `secondary_btn_link` varchar(255) DEFAULT NULL,
  `background_image` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `hero_section`
--

INSERT INTO `hero_section` (`id`, `badge_text`, `title_text`, `title_highlight`, `subtitle`, `primary_btn_text`, `primary_btn_link`, `secondary_btn_text`, `secondary_btn_link`, `background_image`) VALUES
(1, 'Trusted Construction Partner Since 1998', 'Building Tomorrow\'s Infrastructure', 'Today', 'Voluptatem accusantium doloremque laudantium totam rem aperiam eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae.', 'Explore Our Projects', '#projects', 'Request a Quote', '#', 'hero-bg.jpg');

-- --------------------------------------------------------

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
CREATE TABLE IF NOT EXISTS `projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL,
  `title` varchar(150) NOT NULL,
  `description` text,
  `image` varchar(255) DEFAULT NULL,
  `display_order` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_projects_category` (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `projects`
--

INSERT INTO `projects` (`id`, `category_id`, `title`, `description`, `image`, `display_order`) VALUES
(1, 1, 'Sunset Ridge Villa', 'Premium residential complex with contemporary architecture', 'project-sunset-ridge-villa.jpg', 1),
(2, 2, 'Metro Business Hub', 'State-of-the-art office complex in the city center', 'project-metro-business-hub.jpg', 2),
(3, 3, 'Riverside Highway Bridge', 'Major bridge connecting the northern corridor', 'project-riverside-highway-bridge.jpg', 3),
(4, 1, 'Lakeview Apartments', 'Modern lakeside living with panoramic views', 'project-lakeview-apartments.jpg', 4),
(5, 2, 'Central Shopping Plaza', 'Multi-level retail destination with modern amenities', 'project-central-shopping-plaza.jpg', 5),
(6, 3, 'Northern Rail Terminal', 'Multi-modal transportation hub for the metro area', 'project-northern-rail-terminal.jpg', 6);

-- --------------------------------------------------------

--
-- Table structure for table `projects_section`
--

DROP TABLE IF EXISTS `projects_section`;
CREATE TABLE IF NOT EXISTS `projects_section` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `subtitle` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `projects_section`
--

INSERT INTO `projects_section` (`id`, `title`, `subtitle`) VALUES
(1, 'Our Projects', 'Excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum');

-- --------------------------------------------------------

--
-- Table structure for table `project_categories`
--

DROP TABLE IF EXISTS `project_categories`;
CREATE TABLE IF NOT EXISTS `project_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `display_order` int DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `project_categories`
--

INSERT INTO `project_categories` (`id`, `name`, `slug`, `display_order`) VALUES
(1, 'Residential', 'residential', 1),
(2, 'Commercial', 'commercial', 2),
(3, 'Infrastructure', 'infrastructure', 3);

-- --------------------------------------------------------

--
-- Table structure for table `services`
--

DROP TABLE IF EXISTS `services`;
CREATE TABLE IF NOT EXISTS `services` (
  `id` int NOT NULL AUTO_INCREMENT,
  `icon` varchar(50) DEFAULT NULL,
  `title` varchar(150) DEFAULT NULL,
  `description` text,
  `display_order` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `services`
--

INSERT INTO `services` (`id`, `icon`, `title`, `description`, `display_order`) VALUES
(1, 'bi-house', 'Residential Building', 'Neque porro quisquam est qui dolorem ipsum quia dolor sit amet consectetur adipisci velit.', 1),
(2, 'bi-building', 'Commercial Projects', 'Ut enim ad minima veniam quis nostrum exercitationem ullam corporis suscipit laboriosam.', 2),
(3, 'bi-hammer', 'Renovation & Remodeling', 'Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae.', 3),
(4, 'bi-signpost-split', 'Road & Infrastructure', 'Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet.', 4),
(5, 'bi-bar-chart', 'Project Management', 'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit sed quia.', 5),
(6, 'bi-rulers', 'Architecture & Design', 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium.', 6);

-- --------------------------------------------------------

--
-- Table structure for table `services_section`
--

DROP TABLE IF EXISTS `services_section`;
CREATE TABLE IF NOT EXISTS `services_section` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `subtitle` text,
  `panel_image` varchar(255) DEFAULT NULL,
  `panel_title` varchar(255) DEFAULT NULL,
  `panel_btn_text` varchar(100) DEFAULT NULL,
  `panel_btn_link` varchar(255) DEFAULT NULL,
  `stats_badge_text` varchar(150) DEFAULT NULL,
  `stats_title` varchar(255) DEFAULT NULL,
  `stats_description` text,
  `stats_btn_text` varchar(100) DEFAULT NULL,
  `stats_btn_link` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `services_section`
--

INSERT INTO `services_section` (`id`, `title`, `subtitle`, `panel_image`, `panel_title`, `panel_btn_text`, `panel_btn_link`, `stats_badge_text`, `stats_title`, `stats_description`, `stats_btn_text`, `stats_btn_link`) VALUES
(1, 'Our Services', 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur', 'services-panel.jpg', 'We Deliver Excellence in Every Project', 'Get a Free Consultation', '#', 'OUR TRACK RECORD', 'Numbers That Speak for Our Commitment', 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium totam rem aperiam eaque ipsa quae ab illo inventore.', 'View Our Projects', '#projects');

-- --------------------------------------------------------

--
-- Table structure for table `site_settings`
--

DROP TABLE IF EXISTS `site_settings`;
CREATE TABLE IF NOT EXISTS `site_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_name` varchar(100) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `logo_icon` varchar(50) DEFAULT NULL,
  `cta_text` varchar(100) DEFAULT NULL,
  `cta_link` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `site_settings`
--

INSERT INTO `site_settings` (`id`, `company_name`, `phone`, `email`, `logo_icon`, `cta_text`, `cta_link`) VALUES
(1, 'Constructify', '+1 (555) 234-6789', 'info@constructify.com', 'bi-buildings', 'Get Estimate', '#');

--
-- Constraints for dumped tables
--

--
-- Constraints for table `projects`
--
ALTER TABLE `projects`
  ADD CONSTRAINT `fk_projects_category` FOREIGN KEY (`category_id`) REFERENCES `project_categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
