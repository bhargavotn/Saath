CREATE TABLE `contexts` (
	`owner_id` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`share_mode` text DEFAULT 'private' NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`target_id` text NOT NULL,
	`reason` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `reports_owner_idx` ON `reports` (`owner_id`);--> statement-breakpoint
CREATE TABLE `session_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`provider_name` text NOT NULL,
	`topic` text NOT NULL,
	`shared_context` text NOT NULL,
	`mode` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `requests_owner_idx` ON `session_requests` (`owner_id`);