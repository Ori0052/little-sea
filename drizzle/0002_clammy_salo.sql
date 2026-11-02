CREATE TABLE `beach_seats` (
	`seat` integer PRIMARY KEY NOT NULL,
	`visitor` text NOT NULL,
	`session` text NOT NULL,
	`seen` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `beach_seats_visitor_unique` ON `beach_seats` (`visitor`);--> statement-breakpoint
CREATE INDEX `beach_seats_seen_idx` ON `beach_seats` (`seen`);--> statement-breakpoint
ALTER TABLE `presence` ADD `visitor_id` text;