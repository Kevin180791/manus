CREATE TABLE `capacityPlanning` (
	`id` varchar(64) NOT NULL,
	`employeeId` varchar(64) NOT NULL,
	`projectId` varchar(64),
	`weekStartDate` timestamp NOT NULL,
	`allocatedHours` int NOT NULL,
	`availableHours` int NOT NULL,
	`notes` text,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdBy` varchar(64),
	CONSTRAINT `capacityPlanning_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` varchar(64) NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`email` varchar(320),
	`phone` varchar(50),
	`position` varchar(100),
	`department` varchar(100),
	`employeeNumber` varchar(50),
	`status` enum('active','inactive','on_leave') NOT NULL DEFAULT 'active',
	`hireDate` timestamp,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdBy` varchar(64),
	CONSTRAINT `employees_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventoryAssignments` (
	`id` varchar(64) NOT NULL,
	`itemId` varchar(64) NOT NULL,
	`employeeId` varchar(64) NOT NULL,
	`assignedDate` timestamp NOT NULL DEFAULT (now()),
	`returnedDate` timestamp,
	`notes` text,
	`createdAt` timestamp DEFAULT (now()),
	`createdBy` varchar(64),
	CONSTRAINT `inventoryAssignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventoryItems` (
	`id` varchar(64) NOT NULL,
	`name` varchar(200) NOT NULL,
	`category` enum('tool','it_equipment','vehicle','other') NOT NULL,
	`serialNumber` varchar(100),
	`manufacturer` varchar(100),
	`model` varchar(100),
	`purchaseDate` timestamp,
	`purchasePrice` int,
	`status` enum('available','assigned','maintenance','retired') NOT NULL DEFAULT 'available',
	`condition` enum('excellent','good','fair','poor') NOT NULL DEFAULT 'good',
	`location` varchar(200),
	`notes` text,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdBy` varchar(64),
	CONSTRAINT `inventoryItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `measurements` (
	`id` varchar(64) NOT NULL,
	`projectId` varchar(64) NOT NULL,
	`title` varchar(300) NOT NULL,
	`description` text,
	`location` varchar(300),
	`measurementDate` timestamp NOT NULL,
	`measuredBy` varchar(64),
	`quantity` int,
	`unit` varchar(50),
	`notes` text,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdBy` varchar(64),
	CONSTRAINT `measurements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`type` enum('employee_added','inventory_assigned','project_created','task_assigned','rfi_created','document_uploaded','progress_report','system') NOT NULL,
	`title` varchar(300) NOT NULL,
	`message` text,
	`relatedEntityType` varchar(50),
	`relatedEntityId` varchar(64),
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `progressReports` (
	`id` varchar(64) NOT NULL,
	`projectId` varchar(64) NOT NULL,
	`title` varchar(300) NOT NULL,
	`reportDate` timestamp NOT NULL,
	`overallProgress` int NOT NULL,
	`summary` text,
	`achievements` text,
	`issues` text,
	`nextSteps` text,
	`createdAt` timestamp DEFAULT (now()),
	`createdBy` varchar(64),
	CONSTRAINT `progressReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectDocuments` (
	`id` varchar(64) NOT NULL,
	`projectId` varchar(64) NOT NULL,
	`title` varchar(300) NOT NULL,
	`description` text,
	`category` enum('plan','contract','rfi','measurement','progress_report','other') NOT NULL,
	`fileUrl` varchar(500) NOT NULL,
	`fileSize` int,
	`mimeType` varchar(100),
	`version` varchar(50),
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`uploadedBy` varchar(64),
	CONSTRAINT `projectDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectTasks` (
	`id` varchar(64) NOT NULL,
	`projectId` varchar(64) NOT NULL,
	`title` varchar(300) NOT NULL,
	`description` text,
	`status` enum('pending','in_progress','completed','blocked') NOT NULL DEFAULT 'pending',
	`priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`assignedTo` varchar(64),
	`startDate` timestamp,
	`dueDate` timestamp,
	`completedDate` timestamp,
	`estimatedHours` int,
	`actualHours` int,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdBy` varchar(64),
	CONSTRAINT `projectTasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectTeamMembers` (
	`id` varchar(64) NOT NULL,
	`projectId` varchar(64) NOT NULL,
	`employeeId` varchar(64) NOT NULL,
	`role` varchar(100),
	`assignedDate` timestamp NOT NULL DEFAULT (now()),
	`removedDate` timestamp,
	`createdAt` timestamp DEFAULT (now()),
	`createdBy` varchar(64),
	CONSTRAINT `projectTeamMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` varchar(64) NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`projectNumber` varchar(50),
	`client` varchar(200),
	`status` enum('planning','active','on_hold','completed','cancelled') NOT NULL DEFAULT 'planning',
	`priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`startDate` timestamp,
	`endDate` timestamp,
	`budget` int,
	`location` varchar(300),
	`projectManagerId` varchar(64),
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdBy` varchar(64),
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rfis` (
	`id` varchar(64) NOT NULL,
	`projectId` varchar(64) NOT NULL,
	`rfiNumber` varchar(50) NOT NULL,
	`subject` varchar(300) NOT NULL,
	`description` text NOT NULL,
	`status` enum('open','in_review','answered','closed') NOT NULL DEFAULT 'open',
	`priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`requestedBy` varchar(64),
	`assignedTo` varchar(64),
	`requestDate` timestamp NOT NULL DEFAULT (now()),
	`dueDate` timestamp,
	`responseDate` timestamp,
	`response` text,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rfis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `employee_idx` ON `capacityPlanning` (`employeeId`);--> statement-breakpoint
CREATE INDEX `project_idx` ON `capacityPlanning` (`projectId`);--> statement-breakpoint
CREATE INDEX `week_idx` ON `capacityPlanning` (`weekStartDate`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `employees` (`email`);--> statement-breakpoint
CREATE INDEX `employee_number_idx` ON `employees` (`employeeNumber`);--> statement-breakpoint
CREATE INDEX `item_idx` ON `inventoryAssignments` (`itemId`);--> statement-breakpoint
CREATE INDEX `employee_idx` ON `inventoryAssignments` (`employeeId`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `inventoryItems` (`category`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `inventoryItems` (`status`);--> statement-breakpoint
CREATE INDEX `serial_number_idx` ON `inventoryItems` (`serialNumber`);--> statement-breakpoint
CREATE INDEX `project_idx` ON `measurements` (`projectId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `is_read_idx` ON `notifications` (`isRead`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `notifications` (`type`);--> statement-breakpoint
CREATE INDEX `project_idx` ON `progressReports` (`projectId`);--> statement-breakpoint
CREATE INDEX `project_idx` ON `projectDocuments` (`projectId`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `projectDocuments` (`category`);--> statement-breakpoint
CREATE INDEX `project_idx` ON `projectTasks` (`projectId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `projectTasks` (`status`);--> statement-breakpoint
CREATE INDEX `assigned_to_idx` ON `projectTasks` (`assignedTo`);--> statement-breakpoint
CREATE INDEX `project_idx` ON `projectTeamMembers` (`projectId`);--> statement-breakpoint
CREATE INDEX `employee_idx` ON `projectTeamMembers` (`employeeId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `projects` (`status`);--> statement-breakpoint
CREATE INDEX `project_number_idx` ON `projects` (`projectNumber`);--> statement-breakpoint
CREATE INDEX `project_manager_idx` ON `projects` (`projectManagerId`);--> statement-breakpoint
CREATE INDEX `project_idx` ON `rfis` (`projectId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `rfis` (`status`);--> statement-breakpoint
CREATE INDEX `rfi_number_idx` ON `rfis` (`rfiNumber`);