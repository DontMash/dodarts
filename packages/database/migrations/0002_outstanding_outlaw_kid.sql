PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_tosses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`segment` text NOT NULL,
	`value` integer NOT NULL,
	`multiplier` integer NOT NULL,
	`coords_x` real,
	`coords_y` real,
	`updated_at` integer NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_tosses`("id", "name", "segment", "value", "multiplier", "coords_x", "coords_y", "updated_at", "created_at", "deleted_at") SELECT "id", "name", "segment", "value", "multiplier", "coords_x", "coords_y", "updated_at", "created_at", "deleted_at" FROM `tosses`;--> statement-breakpoint
DROP TABLE `tosses`;--> statement-breakpoint
ALTER TABLE `__new_tosses` RENAME TO `tosses`;--> statement-breakpoint
PRAGMA foreign_keys=ON;