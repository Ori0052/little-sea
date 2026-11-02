CREATE TABLE `island_potatoes` (
	`visitor` text PRIMARY KEY NOT NULL,
	`ready_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `island_campfire` ADD `wood_until` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `island_campfire` ADD `aurora_until` integer DEFAULT 0 NOT NULL;