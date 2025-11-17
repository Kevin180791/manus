CREATE TABLE `dailyReports` (
	`id` varchar(64) NOT NULL,
	`projectId` varchar(64) NOT NULL,
	`reportDate` timestamp NOT NULL,
	`weather` varchar(100),
	`temperature` varchar(50),
	`workDescription` text,
	`specialOccurrences` text,
	`attendees` text,
	`workHours` int,
	`equipmentUsed` text,
	`materialsDelivered` text,
	`visitorsContractors` text,
	`safetyIncidents` text,
	`photos` text,
	`createdAt` timestamp DEFAULT (now()),
	`createdBy` varchar(64),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dailyReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `defectProtocols` (
	`id` varchar(64) NOT NULL,
	`projectId` varchar(64) NOT NULL,
	`defectNumber` varchar(50) NOT NULL,
	`title` varchar(300) NOT NULL,
	`description` text NOT NULL,
	`location` varchar(200),
	`trade` varchar(100),
	`category` varchar(100),
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`status` enum('open','in_progress','resolved','verified','closed') NOT NULL DEFAULT 'open',
	`responsibleParty` varchar(200),
	`responsibleContact` varchar(200),
	`detectedDate` timestamp NOT NULL,
	`dueDate` timestamp,
	`resolvedDate` timestamp,
	`verifiedDate` timestamp,
	`detectionPhotos` text,
	`resolutionPhotos` text,
	`detectedBy` varchar(64),
	`assignedTo` varchar(64),
	`resolutionNotes` text,
	`verificationNotes` text,
	`createdAt` timestamp DEFAULT (now()),
	`createdBy` varchar(64),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `defectProtocols_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inspectionProtocols` (
	`id` varchar(64) NOT NULL,
	`projectId` varchar(64) NOT NULL,
	`inspectionDate` timestamp NOT NULL,
	`inspectionType` enum('regular','special','final','acceptance') NOT NULL,
	`participants` text,
	`areas` text,
	`findings` text,
	`generalNotes` text,
	`nextSteps` text,
	`status` enum('draft','completed','approved') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp DEFAULT (now()),
	`createdBy` varchar(64),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inspectionProtocols_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `project_idx` ON `dailyReports` (`projectId`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `dailyReports` (`reportDate`);--> statement-breakpoint
CREATE INDEX `project_idx` ON `defectProtocols` (`projectId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `defectProtocols` (`status`);--> statement-breakpoint
CREATE INDEX `severity_idx` ON `defectProtocols` (`severity`);--> statement-breakpoint
CREATE INDEX `defect_number_idx` ON `defectProtocols` (`defectNumber`);--> statement-breakpoint
CREATE INDEX `project_idx` ON `inspectionProtocols` (`projectId`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `inspectionProtocols` (`inspectionDate`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `inspectionProtocols` (`status`);