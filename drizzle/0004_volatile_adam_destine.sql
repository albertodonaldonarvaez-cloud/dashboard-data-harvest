CREATE TABLE `kobo_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`apiUrl` varchar(255) NOT NULL DEFAULT 'https://kf.smart-harvest.tecti-cloud.com',
	`assetId` varchar(100) NOT NULL,
	`apiToken` text NOT NULL,
	`lastSyncTime` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kobo_config_id` PRIMARY KEY(`id`)
);
