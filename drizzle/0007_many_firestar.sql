CREATE TABLE `boat_passengers` (
	`seat` integer PRIMARY KEY NOT NULL,
	`visitor` text NOT NULL,
	`session` text NOT NULL,
	`seen` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `boat_passengers_visitor_unique` ON `boat_passengers` (`visitor`);--> statement-breakpoint
CREATE INDEX `boat_passengers_seen_idx` ON `boat_passengers` (`seen`);--> statement-breakpoint
CREATE TABLE `sea_boat` (
	`id` integer PRIMARY KEY NOT NULL,
	`x` real DEFAULT 0 NOT NULL,
	`z` real DEFAULT 8.5 NOT NULL,
	`heading` real DEFAULT 0 NOT NULL,
	`target_x` real,
	`target_z` real,
	`departed` integer DEFAULT 0 NOT NULL,
	`captain` text
);

--> statement-breakpoint
INSERT INTO sea_boat(id,x,z,heading,departed) VALUES(1,0,8.5,0,0);
