CREATE TABLE "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "authenticator" (
	"credentialID" text NOT NULL,
	"userId" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"credentialPublicKey" text NOT NULL,
	"counter" integer NOT NULL,
	"credentialDeviceType" text NOT NULL,
	"credentialBackedUp" boolean NOT NULL,
	"transports" text,
	CONSTRAINT "authenticator_userId_credentialID_pk" PRIMARY KEY("userId","credentialID"),
	CONSTRAINT "authenticator_credentialID_unique" UNIQUE("credentialID")
);
--> statement-breakpoint
CREATE TABLE "developer_api_key" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"name" text NOT NULL,
	"keyPrefix" text NOT NULL,
	"secretHash" text NOT NULL,
	"lastUsedAt" timestamp,
	"expiresAt" timestamp,
	"revokedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instagram_account_snapshot" (
	"syncRunId" text PRIMARY KEY NOT NULL,
	"instagramAccountId" text NOT NULL,
	"account" jsonb NOT NULL,
	"accountInsights" jsonb NOT NULL,
	"analysisFacts" jsonb NOT NULL,
	"highlights" jsonb NOT NULL,
	"warnings" jsonb NOT NULL,
	"fetchManifest" jsonb NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instagram_account" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"instagramUserId" text NOT NULL,
	"username" text,
	"accessToken" text NOT NULL,
	"graphApiVersion" text NOT NULL,
	"authAppUrl" text,
	"tokenIssuedAt" timestamp,
	"linkedAt" timestamp DEFAULT now() NOT NULL,
	"lastSyncedAt" timestamp,
	"rawProfile" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instagram_media_item" (
	"rowId" text PRIMARY KEY NOT NULL,
	"instagramMediaId" text NOT NULL,
	"instagramAccountId" text NOT NULL,
	"userId" text NOT NULL,
	"lastSyncRunId" text,
	"caption" text,
	"commentsCount" integer,
	"likeCount" integer,
	"mediaProductType" text,
	"mediaType" text,
	"mediaUrl" text,
	"thumbnailUrl" text,
	"previewUrl" text,
	"permalink" text,
	"shortcode" text,
	"postedAt" timestamp,
	"username" text,
	"isCommentEnabled" boolean,
	"transcriptStatus" text,
	"transcriptText" text,
	"transcriptLanguage" text,
	"transcriptModel" text,
	"transcriptClipSeconds" integer,
	"transcriptError" text,
	"transcriptMetadata" jsonb,
	"transcriptUpdatedAt" timestamp,
	"topComments" jsonb,
	"insights" jsonb,
	"warnings" jsonb,
	"errors" jsonb,
	"raw" jsonb,
	"syncedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instagram_sync_run" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"instagramAccountId" text NOT NULL,
	"status" text NOT NULL,
	"triggerType" text,
	"workflowRunId" text,
	"currentStep" text,
	"progressPercent" integer,
	"lastHeartbeatAt" timestamp,
	"statusMessage" text,
	"progress" jsonb,
	"startedAt" timestamp NOT NULL,
	"completedAt" timestamp,
	"durationSeconds" double precision,
	"mediaCount" integer,
	"warningCount" integer,
	"error" text,
	"summary" jsonb,
	"report" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp_oauth_access_token" (
	"id" text PRIMARY KEY NOT NULL,
	"tokenHash" text NOT NULL,
	"clientId" text NOT NULL,
	"userId" text NOT NULL,
	"scope" text,
	"resource" text,
	"expiresAt" timestamp NOT NULL,
	"revokedAt" timestamp,
	"lastUsedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp_oauth_authorization_code" (
	"id" text PRIMARY KEY NOT NULL,
	"codeHash" text NOT NULL,
	"clientId" text NOT NULL,
	"userId" text NOT NULL,
	"redirectUri" text NOT NULL,
	"scope" text,
	"resource" text,
	"codeChallenge" text NOT NULL,
	"codeChallengeMethod" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"consumedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp_oauth_client" (
	"id" text PRIMARY KEY NOT NULL,
	"clientId" text NOT NULL,
	"clientSecretHash" text,
	"clientName" text,
	"redirectUris" jsonb NOT NULL,
	"tokenEndpointAuthMethod" text NOT NULL,
	"grantTypes" jsonb NOT NULL,
	"responseTypes" jsonb NOT NULL,
	"scope" text,
	"metadata" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp_oauth_refresh_token" (
	"id" text PRIMARY KEY NOT NULL,
	"tokenHash" text NOT NULL,
	"clientId" text NOT NULL,
	"userId" text NOT NULL,
	"scope" text,
	"resource" text,
	"expiresAt" timestamp NOT NULL,
	"revokedAt" timestamp,
	"replacedByTokenId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" timestamp,
	"image" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authenticator" ADD CONSTRAINT "authenticator_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "developer_api_key" ADD CONSTRAINT "developer_api_key_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_account_snapshot" ADD CONSTRAINT "instagram_account_snapshot_syncRunId_instagram_sync_run_id_fk" FOREIGN KEY ("syncRunId") REFERENCES "public"."instagram_sync_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_account_snapshot" ADD CONSTRAINT "instagram_account_snapshot_instagramAccountId_instagram_account_id_fk" FOREIGN KEY ("instagramAccountId") REFERENCES "public"."instagram_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_account" ADD CONSTRAINT "instagram_account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_media_item" ADD CONSTRAINT "instagram_media_item_instagramAccountId_instagram_account_id_fk" FOREIGN KEY ("instagramAccountId") REFERENCES "public"."instagram_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_media_item" ADD CONSTRAINT "instagram_media_item_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_media_item" ADD CONSTRAINT "instagram_media_item_lastSyncRunId_instagram_sync_run_id_fk" FOREIGN KEY ("lastSyncRunId") REFERENCES "public"."instagram_sync_run"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_sync_run" ADD CONSTRAINT "instagram_sync_run_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_sync_run" ADD CONSTRAINT "instagram_sync_run_instagramAccountId_instagram_account_id_fk" FOREIGN KEY ("instagramAccountId") REFERENCES "public"."instagram_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_oauth_access_token" ADD CONSTRAINT "mcp_oauth_access_token_clientId_mcp_oauth_client_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."mcp_oauth_client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_oauth_access_token" ADD CONSTRAINT "mcp_oauth_access_token_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_oauth_authorization_code" ADD CONSTRAINT "mcp_oauth_authorization_code_clientId_mcp_oauth_client_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."mcp_oauth_client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_oauth_authorization_code" ADD CONSTRAINT "mcp_oauth_authorization_code_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_oauth_refresh_token" ADD CONSTRAINT "mcp_oauth_refresh_token_clientId_mcp_oauth_client_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."mcp_oauth_client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_oauth_refresh_token" ADD CONSTRAINT "mcp_oauth_refresh_token_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "developer_api_key_key_prefix_idx" ON "developer_api_key" USING btree ("keyPrefix");--> statement-breakpoint
CREATE INDEX "developer_api_key_user_id_idx" ON "developer_api_key" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "instagram_account_user_id_idx" ON "instagram_account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "instagram_account_instagram_user_id_idx" ON "instagram_account" USING btree ("instagramUserId");--> statement-breakpoint
CREATE UNIQUE INDEX "instagram_media_item_account_media_idx" ON "instagram_media_item" USING btree ("instagramAccountId","instagramMediaId");--> statement-breakpoint
CREATE INDEX "instagram_media_item_user_id_idx" ON "instagram_media_item" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "instagram_media_item_account_id_idx" ON "instagram_media_item" USING btree ("instagramAccountId");--> statement-breakpoint
CREATE UNIQUE INDEX "mcp_oauth_access_token_hash_idx" ON "mcp_oauth_access_token" USING btree ("tokenHash");--> statement-breakpoint
CREATE INDEX "mcp_oauth_access_token_client_id_idx" ON "mcp_oauth_access_token" USING btree ("clientId");--> statement-breakpoint
CREATE INDEX "mcp_oauth_access_token_user_id_idx" ON "mcp_oauth_access_token" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "mcp_oauth_authorization_code_hash_idx" ON "mcp_oauth_authorization_code" USING btree ("codeHash");--> statement-breakpoint
CREATE INDEX "mcp_oauth_authorization_code_client_id_idx" ON "mcp_oauth_authorization_code" USING btree ("clientId");--> statement-breakpoint
CREATE INDEX "mcp_oauth_authorization_code_user_id_idx" ON "mcp_oauth_authorization_code" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "mcp_oauth_client_client_id_idx" ON "mcp_oauth_client" USING btree ("clientId");--> statement-breakpoint
CREATE UNIQUE INDEX "mcp_oauth_refresh_token_hash_idx" ON "mcp_oauth_refresh_token" USING btree ("tokenHash");--> statement-breakpoint
CREATE INDEX "mcp_oauth_refresh_token_client_id_idx" ON "mcp_oauth_refresh_token" USING btree ("clientId");--> statement-breakpoint
CREATE INDEX "mcp_oauth_refresh_token_user_id_idx" ON "mcp_oauth_refresh_token" USING btree ("userId");