CREATE TABLE `sea_rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`window_start` integer NOT NULL,
	`count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sea_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`visitor` text NOT NULL,
	`token_hash` text NOT NULL,
	`network` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sea_sessions_visitor_idx` ON `sea_sessions` (`visitor`);--> statement-breakpoint
CREATE INDEX `sea_sessions_expiry_idx` ON `sea_sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `sea_visitors` (
	`visitor` text PRIMARY KEY NOT NULL,
	`proof_hash` text NOT NULL,
	`created_at` integer NOT NULL
);
