ALTER TABLE "instagram_media_item" ADD COLUMN "transcriptStatus" text;--> statement-breakpoint
ALTER TABLE "instagram_media_item" ADD COLUMN "transcriptText" text;--> statement-breakpoint
ALTER TABLE "instagram_media_item" ADD COLUMN "transcriptLanguage" text;--> statement-breakpoint
ALTER TABLE "instagram_media_item" ADD COLUMN "transcriptModel" text;--> statement-breakpoint
ALTER TABLE "instagram_media_item" ADD COLUMN "transcriptClipSeconds" integer;--> statement-breakpoint
ALTER TABLE "instagram_media_item" ADD COLUMN "transcriptError" text;--> statement-breakpoint
ALTER TABLE "instagram_media_item" ADD COLUMN "transcriptMetadata" jsonb;--> statement-breakpoint
ALTER TABLE "instagram_media_item" ADD COLUMN "transcriptUpdatedAt" timestamp;