CREATE TABLE `paymentTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`recipientName` varchar(160) NOT NULL,
	`upiId` varchar(160) NOT NULL,
	`amountInr` int NOT NULL,
	`riskScore` int NOT NULL,
	`riskLevel` enum('low','medium','high') NOT NULL,
	`status` enum('completed','cancelled','frozen') NOT NULL,
	`paymentMode` enum('pin','fingerprint','voice') NOT NULL,
	`isDuplicate` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `paymentTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trustedContacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`phone` varchar(32) NOT NULL,
	`relationship` varchar(80) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trustedContacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`language` enum('English','Tamil') NOT NULL DEFAULT 'English',
	`largeText` boolean NOT NULL DEFAULT false,
	`voiceEnabled` boolean NOT NULL DEFAULT true,
	`hapticsEnabled` boolean NOT NULL DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `userPreferences_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
ALTER TABLE `paymentTransactions` ADD CONSTRAINT `paymentTransactions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trustedContacts` ADD CONSTRAINT `trustedContacts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userPreferences` ADD CONSTRAINT `userPreferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `paymentTransactions_user_createdAt_idx` ON `paymentTransactions` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `trustedContacts_user_idx` ON `trustedContacts` (`userId`);