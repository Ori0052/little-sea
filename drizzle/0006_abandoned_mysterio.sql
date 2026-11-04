CREATE TABLE `island_anglers` (
	`visitor` text PRIMARY KEY NOT NULL,
	`fish_count` integer DEFAULT 0 NOT NULL,
	`cast_ready_at` integer,
	`cast_x` real,
	`cast_z` real,
	`fish_ready_at` integer
);
--> statement-breakpoint
DELETE FROM beach_seats WHERE seat >= 80;
