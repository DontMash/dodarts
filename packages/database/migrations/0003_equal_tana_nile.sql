CREATE TABLE `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ended_at` integer,
	`updated_at` integer NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
ALTER TABLE `tosses` ADD `session_id` integer NOT NULL;
