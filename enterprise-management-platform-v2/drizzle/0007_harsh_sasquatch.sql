CREATE TABLE `measurementPositions` (
	`id` varchar(64) NOT NULL,
	`measurementId` varchar(64) NOT NULL,
	`position` int NOT NULL,
	`description` varchar(500) NOT NULL,
	`quantity` decimal(10,2) NOT NULL,
	`unit` varchar(50) NOT NULL,
	`unitPrice` decimal(10,2),
	`totalPrice` decimal(10,2),
	`notes` text,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `measurementPositions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `measurement_idx` ON `measurementPositions` (`measurementId`);