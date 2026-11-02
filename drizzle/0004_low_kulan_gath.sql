CREATE TABLE `island_fire_seats` (
	`seat` integer PRIMARY KEY NOT NULL,
	`visitor` text NOT NULL,
	`session` text NOT NULL,
	`seen` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `island_fire_seats_visitor_unique` ON `island_fire_seats` (`visitor`);--> statement-breakpoint
CREATE INDEX `island_fire_seats_seen_idx` ON `island_fire_seats` (`seen`);