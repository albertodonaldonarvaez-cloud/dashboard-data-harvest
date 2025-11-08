CREATE TABLE `cortadora_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`numeroCortadora` varchar(50) NOT NULL,
	`customName` varchar(100),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cortadora_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `cortadora_config_numeroCortadora_unique` UNIQUE(`numeroCortadora`)
);
