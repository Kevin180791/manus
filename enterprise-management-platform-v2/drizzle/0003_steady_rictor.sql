ALTER TABLE `projectTasks` MODIFY COLUMN `status` enum('pending','in_progress','completed','blocked','answered','closed') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `projectTasks` ADD `taskType` enum('task','rfi','defect','question') DEFAULT 'task' NOT NULL;--> statement-breakpoint
ALTER TABLE `projectTasks` ADD `taskNumber` varchar(50);--> statement-breakpoint
ALTER TABLE `projectTasks` ADD `requestedBy` varchar(64);--> statement-breakpoint
ALTER TABLE `projectTasks` ADD `responseDate` timestamp;--> statement-breakpoint
ALTER TABLE `projectTasks` ADD `response` text;--> statement-breakpoint
CREATE INDEX `task_type_idx` ON `projectTasks` (`taskType`);