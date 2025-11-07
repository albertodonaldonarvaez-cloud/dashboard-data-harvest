CREATE TABLE `activity_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(100) NOT NULL,
	`resourceType` varchar(50),
	`resourceId` int,
	`details` text,
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `harvest_attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`harvestId` int NOT NULL,
	`filename` varchar(255) NOT NULL,
	`mimetype` varchar(100),
	`originalUrl` text,
	`largeUrl` text,
	`mediumUrl` text,
	`smallUrl` text,
	`localLargePath` varchar(500),
	`localSmallPath` varchar(500),
	`uid` varchar(100),
	`isDeleted` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `harvest_attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `harvests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalId` int,
	`formhubUuid` varchar(100),
	`startTime` timestamp,
	`endTime` timestamp,
	`parcela` varchar(100),
	`pesoCaja` int,
	`fotoCaja` varchar(255),
	`numeroCortadora` varchar(50),
	`numeroCaja` varchar(50),
	`tipoHigo` varchar(50),
	`latitud` varchar(20),
	`longitud` varchar(20),
	`status` varchar(50),
	`submissionTime` timestamp,
	`submittedBy` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `harvests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`permissionType` varchar(50) NOT NULL,
	`resourceFilter` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_permissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','editor','viewer') NOT NULL DEFAULT 'viewer';