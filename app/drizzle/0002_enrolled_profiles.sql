CREATE TABLE `profiles` (
	`owner_id` text PRIMARY KEY NOT NULL,
	`display_name` text DEFAULT '' NOT NULL,
	`client_enrolled` integer DEFAULT 0 NOT NULL,
	`listener_enrolled` integer DEFAULT 0 NOT NULL,
	`active_role` text DEFAULT 'client' NOT NULL,
	`pairing_code` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_pairing_idx` ON `profiles` (`pairing_code`);
--> statement-breakpoint
CREATE INDEX `requests_provider_idx` ON `session_requests` (`provider_id`);
