CREATE TABLE `time_entries` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`projectId` varchar(64) NOT NULL,
	`workPackageId` varchar(64),
	`startTime` timestamp NOT NULL,
	`endTime` timestamp NOT NULL,
	`pauseDuration` int NOT NULL DEFAULT 0,
	`totalDuration` int NOT NULL,
	`description` text,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `time_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `time_sessions` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`projectId` varchar(64) NOT NULL,
	`startTime` timestamp NOT NULL,
	`lastPauseStart` timestamp,
	`totalPauseDuration` int NOT NULL DEFAULT 0,
	`status` enum('running','paused') NOT NULL DEFAULT 'running',
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `time_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `work_packages` (
	`id` varchar(64) NOT NULL,
	`projectId` varchar(64) NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp DEFAULT (now()),
	`createdBy` varchar(64),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `work_packages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `te_user_idx` ON `time_entries` (`userId`);--> statement-breakpoint
CREATE INDEX `te_project_idx` ON `time_entries` (`projectId`);--> statement-breakpoint
CREATE INDEX `te_date_idx` ON `time_entries` (`startTime`);--> statement-breakpoint
CREATE INDEX `ts_user_idx` ON `time_sessions` (`userId`);--> statement-breakpoint
CREATE INDEX `ts_status_idx` ON `time_sessions` (`status`);--> statement-breakpoint
CREATE INDEX `wp_project_idx` ON `work_packages` (`projectId`);