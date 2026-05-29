PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`ended_at` integer,
	`updated_at` integer NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_sessions`("id", "ended_at", "updated_at", "created_at", "deleted_at") SELECT "id", "ended_at", "updated_at", "created_at", "deleted_at" FROM `sessions`;--> statement-breakpoint
DROP TABLE `sessions`;--> statement-breakpoint
ALTER TABLE `__new_sessions` RENAME TO `sessions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_tosses` (
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
--> statement-breakpoint
INSERT INTO `__new_tosses`("id", "session_id", "name", "segment", "value", "multiplier", "coords_x", "coords_y", "updated_at", "created_at", "deleted_at") SELECT "id", "session_id", "name", "segment", "value", "multiplier", "coords_x", "coords_y", "updated_at", "created_at", "deleted_at" FROM `tosses`;--> statement-breakpoint
DROP TABLE `tosses`;--> statement-breakpoint
ALTER TABLE `__new_tosses` RENAME TO `tosses`;