ALTER TABLE `findings` MODIFY COLUMN `inspectionId` varchar(64);--> statement-breakpoint
ALTER TABLE `findings` MODIFY COLUMN `deadline` varchar(100);--> statement-breakpoint
ALTER TABLE `findings` ADD `projectId` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `findings` ADD `location` varchar(255);--> statement-breakpoint
ALTER TABLE `findings` ADD `recommendation` text;--> statement-breakpoint
ALTER TABLE `findings` ADD `responsibility` varchar(255);--> statement-breakpoint
ALTER TABLE `findings` DROP COLUMN `responsible`;