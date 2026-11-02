CREATE TABLE `chair_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`host_id` text NOT NULL,
	`guest_id` text,
	`host_name` text NOT NULL,
	`guest_name` text,
	`mode` text NOT NULL,
	`status` text DEFAULT 'waiting' NOT NULL,
	`stage` text DEFAULT 'agree' NOT NULL,
	`paused` integer DEFAULT 0 NOT NULL,
	`guest_joined` integer DEFAULT 0 NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`ai_reply` text DEFAULT '' NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `chairs_code_idx` ON `chair_sessions` (`code`);
--> statement-breakpoint
CREATE INDEX `chairs_host_idx` ON `chair_sessions` (`host_id`);
--> statement-breakpoint
CREATE INDEX `chairs_guest_idx` ON `chair_sessions` (`guest_id`);
