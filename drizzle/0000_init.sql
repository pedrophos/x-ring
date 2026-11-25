CREATE TABLE `archers` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`name` text NOT NULL,
	`nickname` text,
	`is_me` integer DEFAULT false NOT NULL,
	`arrow_diameter_mm` real DEFAULT 5 NOT NULL,
	`last_seen_at` integer
);
--> statement-breakpoint
CREATE TABLE `arrows` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`end_id` text NOT NULL,
	`arrow_number` integer NOT NULL,
	`x_mm` real,
	`y_mm` real,
	`spot_index` integer DEFAULT 0 NOT NULL,
	`is_miss` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`end_id`) REFERENCES `ends`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `arrows_end_idx` ON `arrows` (`end_id`);--> statement-breakpoint
CREATE TABLE `ends` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`participant_id` text NOT NULL,
	`end_number` integer NOT NULL,
	`shot_at` integer NOT NULL,
	FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `ends_participant_idx` ON `ends` (`participant_id`);--> statement-breakpoint
CREATE TABLE `participants` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`session_id` text NOT NULL,
	`archer_id` text NOT NULL,
	`distance_m` real NOT NULL,
	`target_face_id` text NOT NULL,
	`arrow_diameter_mm` real NOT NULL,
	`handicap_points` integer DEFAULT 0 NOT NULL,
	`final_rank` integer,
	`final_score` integer,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`archer_id`) REFERENCES `archers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`target_face_id`) REFERENCES `target_faces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `participants_session_idx` ON `participants` (`session_id`);--> statement-breakpoint
CREATE INDEX `participants_archer_idx` ON `participants` (`archer_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`mode` text NOT NULL,
	`ends_planned` integer,
	`arrows_per_end` integer DEFAULT 6 NOT NULL,
	`handicap_type` text DEFAULT 'none' NOT NULL,
	`count_for_stats` integer NOT NULL,
	`notes` text
);
--> statement-breakpoint
CREATE INDEX `sessions_started_at_idx` ON `sessions` (`started_at`);--> statement-breakpoint
CREATE TABLE `target_faces` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`name` text NOT NULL,
	`builtin_key` text,
	`rings` text NOT NULL,
	`centers` text NOT NULL,
	`is_builtin` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `target_faces_builtin_key_unique` ON `target_faces` (`builtin_key`);--> statement-breakpoint
CREATE TABLE `technique_focus` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`archer_id` text NOT NULL,
	`week_start` text NOT NULL,
	`element` text NOT NULL,
	`video_uri` text,
	`notes` text,
	FOREIGN KEY (`archer_id`) REFERENCES `archers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `technique_focus_week_idx` ON `technique_focus` (`archer_id`,`week_start`);--> statement-breakpoint
CREATE TABLE `weekly_plan` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`archer_id` text NOT NULL,
	`week_start` text NOT NULL,
	`technical_done` integer DEFAULT false NOT NULL,
	`scoring_done` integer DEFAULT false NOT NULL,
	`spt_days` text DEFAULT '[]' NOT NULL,
	FOREIGN KEY (`archer_id`) REFERENCES `archers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `weekly_plan_week_idx` ON `weekly_plan` (`archer_id`,`week_start`);