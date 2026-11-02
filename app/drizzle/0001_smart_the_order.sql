CREATE TABLE `ai_usage` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`window_start` text NOT NULL,
	`calls` integer DEFAULT 0 NOT NULL
);
