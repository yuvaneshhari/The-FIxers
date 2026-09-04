ALTER TABLE `users` ADD `accountLabel` varchar(80) DEFAULT 'Primary account' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `maskedAccount` varchar(32) DEFAULT '•• 4820' NOT NULL;