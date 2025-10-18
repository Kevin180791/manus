CREATE TABLE `comments` (
	`id` varchar(64) NOT NULL,
	`findingId` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `findings` (
	`id` varchar(64) NOT NULL,
	`inspectionId` varchar(64) NOT NULL,
	`roomId` varchar(64),
	`category` varchar(100) NOT NULL,
	`subcategory` varchar(100),
	`title` varchar(255) NOT NULL,
	`description` text,
	`priority` enum('critical','high','medium','low') NOT NULL DEFAULT 'medium',
	`status` enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
	`positionX` decimal(10,4),
	`positionY` decimal(10,4),
	`viewDirection` decimal(5,2),
	`responsible` varchar(255),
	`deadline` timestamp,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `findings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `floorPlans` (
	`id` varchar(64) NOT NULL,
	`projectId` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`filePath` varchar(512) NOT NULL,
	`fileType` varchar(50),
	`analyzed` boolean DEFAULT false,
	`analysisData` json,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `floorPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inspections` (
	`id` varchar(64) NOT NULL,
	`projectId` varchar(64) NOT NULL,
	`floorPlanId` varchar(64),
	`inspectorId` varchar(64) NOT NULL,
	`inspectionDate` timestamp,
	`status` enum('draft','in_progress','completed','reviewed') NOT NULL DEFAULT 'draft',
	`mode` enum('guided','quick_capture') NOT NULL DEFAULT 'guided',
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inspections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `offlineQueue` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`actionType` varchar(100) NOT NULL,
	`payload` json NOT NULL,
	`synced` boolean DEFAULT false,
	`createdAt` timestamp DEFAULT (now()),
	`syncedAt` timestamp,
	CONSTRAINT `offlineQueue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `photos` (
	`id` varchar(64) NOT NULL,
	`findingId` varchar(64) NOT NULL,
	`filePath` varchar(512) NOT NULL,
	`thumbnailPath` varchar(512),
	`caption` text,
	`takenAt` timestamp,
	`metadata` json,
	`aiAnalysis` json,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `photos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`location` varchar(255),
	`client` varchar(255),
	`status` enum('preparation','in_progress','review','completed') NOT NULL DEFAULT 'preparation',
	`startDate` timestamp,
	`endDate` timestamp,
	`createdBy` varchar(64) NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recommendations` (
	`id` varchar(64) NOT NULL,
	`findingId` varchar(64) NOT NULL,
	`type` enum('measure','responsibility','deadline','cost_estimate') NOT NULL,
	`content` text NOT NULL,
	`aiGenerated` boolean DEFAULT false,
	`approved` boolean DEFAULT false,
	`createdBy` varchar(64),
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `recommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` varchar(64) NOT NULL,
	`projectId` varchar(64) NOT NULL,
	`inspectionId` varchar(64),
	`type` enum('word','pdf','presentation','web') NOT NULL,
	`filePath` varchar(512),
	`generatedAt` timestamp DEFAULT (now()),
	`generatedBy` varchar(64) NOT NULL,
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` varchar(64) NOT NULL,
	`floorPlanId` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(100),
	`coordinates` json,
	`area` decimal(10,2),
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `rooms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `templates` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(100),
	`type` enum('finding','checklist','report') NOT NULL,
	`content` json NOT NULL,
	`isDefault` boolean DEFAULT false,
	`createdBy` varchar(64) NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','project_manager','site_manager','planner') NOT NULL DEFAULT 'user';