CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`ended_at` integer,
	`updated_at` integer NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `tosses` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`name` text NOT NULL,
	`segment` text NOT NULL,
	`value` integer NOT NULL,
	`multiplier` integer NOT NULL,
	`coords_x` real,
	`coords_y` real,
	`updated_at` integer NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
