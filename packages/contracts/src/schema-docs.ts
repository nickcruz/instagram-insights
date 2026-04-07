export const instagramSchemaTableNames = [
  "instagram_account",
  "instagram_sync_run",
  "instagram_account_snapshot",
  "instagram_media_item",
] as const;

export type InstagramSchemaTableName =
  (typeof instagramSchemaTableNames)[number];

export type SchemaColumnDoc = {
  name: string;
  type: string;
  visibility: "public" | "protected" | "internal";
  description: string;
};

export type SchemaJoinDoc = {
  fromColumn: string;
  toTable: string;
  toColumn: string;
  description: string;
};

export type SchemaTableDoc = {
  name: InstagramSchemaTableName;
  title: string;
  description: string;
  primaryKey: string[];
  joins: SchemaJoinDoc[];
  notes: string[];
  columns: SchemaColumnDoc[];
};

export type SchemaOverviewDoc = {
  title: string;
  description: string;
  notes: string[];
  tables: Array<{
    name: InstagramSchemaTableName;
    title: string;
    description: string;
  }>;
};

export const instagramSchemaTables: SchemaTableDoc[] = [
  {
    name: "instagram_account",
    title: "Linked Instagram Accounts",
    description:
      "One linked Instagram professional account per signed-in app user, including the active Graph API token and basic profile metadata.",
    primaryKey: ["id"],
    joins: [
      {
        fromColumn: "id",
        toTable: "instagram_sync_run",
        toColumn: "instagramAccountId",
        description: "Each sync run belongs to one linked Instagram account.",
      },
      {
        fromColumn: "id",
        toTable: "instagram_account_snapshot",
        toColumn: "instagramAccountId",
        description: "Completed syncs persist an account-level snapshot for this account.",
      },
      {
        fromColumn: "id",
        toTable: "instagram_media_item",
        toColumn: "instagramAccountId",
        description: "Media items ingested for this account.",
      },
    ],
    notes: [
      "The `accessToken` column is protected and is never returned by the REST API or MCP tools.",
      "The current app model enforces one linked Instagram account per app user.",
    ],
    columns: [
      {
        name: "id",
        type: "text",
        visibility: "public",
        description: "App-level identifier for the linked Instagram account row.",
      },
      {
        name: "userId",
        type: "text",
        visibility: "internal",
        description: "Owning app user. Used for scoping; not exposed to external clients.",
      },
      {
        name: "instagramUserId",
        type: "text",
        visibility: "public",
        description: "Instagram professional account identifier returned by Meta.",
      },
      {
        name: "username",
        type: "text",
        visibility: "public",
        description: "Instagram username captured during OAuth or sync.",
      },
      {
        name: "accessToken",
        type: "text",
        visibility: "protected",
        description: "Live Instagram access token used for background ingestion.",
      },
      {
        name: "graphApiVersion",
        type: "text",
        visibility: "public",
        description: "Graph API version used for syncs.",
      },
      {
        name: "authAppUrl",
        type: "text",
        visibility: "internal",
        description: "Origin of the app that completed Instagram OAuth.",
      },
      {
        name: "tokenIssuedAt",
        type: "timestamp",
        visibility: "internal",
        description: "When the current Instagram token was issued.",
      },
      {
        name: "linkedAt",
        type: "timestamp",
        visibility: "public",
        description: "When this Instagram account was linked to the app user.",
      },
      {
        name: "lastSyncedAt",
        type: "timestamp",
        visibility: "public",
        description: "Most recent successful background sync time.",
      },
      {
        name: "rawProfile",
        type: "jsonb",
        visibility: "public",
        description: "Last fetched profile payload from Instagram.",
      },
      {
        name: "createdAt",
        type: "timestamp",
        visibility: "public",
        description: "Row creation time.",
      },
      {
        name: "updatedAt",
        type: "timestamp",
        visibility: "public",
        description: "Row update time.",
      },
    ],
  },
  {
    name: "instagram_sync_run",
    title: "Sync Run History",
    description:
      "Durable background ingestion runs with status, progress, summaries, and the final normalized report.",
    primaryKey: ["id"],
    joins: [
      {
        fromColumn: "instagramAccountId",
        toTable: "instagram_account",
        toColumn: "id",
        description: "The linked account the run ingested.",
      },
      {
        fromColumn: "id",
        toTable: "instagram_account_snapshot",
        toColumn: "syncRunId",
        description: "Completed runs produce one account snapshot.",
      },
      {
        fromColumn: "id",
        toTable: "instagram_media_item",
        toColumn: "lastSyncRunId",
        description: "Media items most recently updated by this run.",
      },
    ],
    notes: [
      "Use this table for operational visibility and freshness checks.",
      "The `report` column is the normalized report payload used by downstream analysis.",
    ],
    columns: [
      {
        name: "id",
        type: "text",
        visibility: "public",
        description: "App-level identifier for the sync run.",
      },
      {
        name: "userId",
        type: "text",
        visibility: "internal",
        description: "Owning app user for row-level access control.",
      },
      {
        name: "instagramAccountId",
        type: "text",
        visibility: "public",
        description: "Linked Instagram account that was synced.",
      },
      {
        name: "status",
        type: "text",
        visibility: "public",
        description: "Run state such as queued, running, completed, or failed.",
      },
      {
        name: "triggerType",
        type: "text",
        visibility: "public",
        description: "How the run started, for example manual or scheduled.",
      },
      {
        name: "workflowRunId",
        type: "text",
        visibility: "public",
        description: "Backing workflow engine run identifier.",
      },
      {
        name: "currentStep",
        type: "text",
        visibility: "public",
        description: "Current workflow step name.",
      },
      {
        name: "progressPercent",
        type: "integer",
        visibility: "public",
        description: "Approximate progress percentage.",
      },
      {
        name: "lastHeartbeatAt",
        type: "timestamp",
        visibility: "public",
        description: "Most recent workflow heartbeat time.",
      },
      {
        name: "statusMessage",
        type: "text",
        visibility: "public",
        description: "Human-readable run status message.",
      },
      {
        name: "progress",
        type: "jsonb",
        visibility: "public",
        description: "Structured progress details such as bundle counts.",
      },
      {
        name: "startedAt",
        type: "timestamp",
        visibility: "public",
        description: "Run start time.",
      },
      {
        name: "completedAt",
        type: "timestamp",
        visibility: "public",
        description: "Run completion time when available.",
      },
      {
        name: "durationSeconds",
        type: "double precision",
        visibility: "public",
        description: "Computed runtime duration for completed runs.",
      },
      {
        name: "mediaCount",
        type: "integer",
        visibility: "public",
        description: "Number of media items included in the normalized report.",
      },
      {
        name: "warningCount",
        type: "integer",
        visibility: "public",
        description: "Number of warnings captured during the run.",
      },
      {
        name: "error",
        type: "text",
        visibility: "public",
        description: "Terminal error when the run fails.",
      },
      {
        name: "summary",
        type: "jsonb",
        visibility: "public",
        description: "Compact summary for dashboard and agent use.",
      },
      {
        name: "report",
        type: "jsonb",
        visibility: "public",
        description: "Normalized report payload persisted at completion.",
      },
      {
        name: "createdAt",
        type: "timestamp",
        visibility: "public",
        description: "Row creation time.",
      },
      {
        name: "updatedAt",
        type: "timestamp",
        visibility: "public",
        description: "Row update time.",
      },
    ],
  },
  {
    name: "instagram_account_snapshot",
    title: "Latest Account Snapshots Per Run",
    description:
      "Account-level snapshot artifacts captured for a completed sync, including normalized insights and analysis inputs.",
    primaryKey: ["syncRunId"],
    joins: [
      {
        fromColumn: "syncRunId",
        toTable: "instagram_sync_run",
        toColumn: "id",
        description: "Snapshot for the completed sync run.",
      },
      {
        fromColumn: "instagramAccountId",
        toTable: "instagram_account",
        toColumn: "id",
        description: "Linked account this snapshot belongs to.",
      },
    ],
    notes: [
      "This table is the easiest place to fetch the latest normalized account snapshot.",
      "The JSON fields mirror the normalized report format used by the reporting skill.",
    ],
    columns: [
      {
        name: "syncRunId",
        type: "text",
        visibility: "public",
        description: "Completed sync run identifier and primary key for the snapshot.",
      },
      {
        name: "instagramAccountId",
        type: "text",
        visibility: "public",
        description: "Linked Instagram account this snapshot belongs to.",
      },
      {
        name: "account",
        type: "jsonb",
        visibility: "public",
        description: "Normalized account profile payload.",
      },
      {
        name: "accountInsights",
        type: "jsonb",
        visibility: "public",
        description: "Normalized account-level insight metrics and breakdowns.",
      },
      {
        name: "analysisFacts",
        type: "jsonb",
        visibility: "public",
        description: "Derived facts used for downstream narrative/report generation.",
      },
      {
        name: "highlights",
        type: "jsonb",
        visibility: "public",
        description: "Curated highlights extracted from the sync.",
      },
      {
        name: "warnings",
        type: "jsonb",
        visibility: "public",
        description: "Warnings collected during fetch or normalization.",
      },
      {
        name: "fetchManifest",
        type: "jsonb",
        visibility: "public",
        description: "Manifest describing API coverage, skips, and request counts.",
      },
      {
        name: "createdAt",
        type: "timestamp",
        visibility: "public",
        description: "Snapshot creation time.",
      },
    ],
  },
  {
    name: "instagram_media_item",
    title: "Ingested Media Items",
    description:
      "Recent Instagram media persisted from sync runs, including post metadata, insights, comments, and raw payloads.",
    primaryKey: ["id"],
    joins: [
      {
        fromColumn: "instagramAccountId",
        toTable: "instagram_account",
        toColumn: "id",
        description: "Linked account that owns the media item.",
      },
      {
        fromColumn: "lastSyncRunId",
        toTable: "instagram_sync_run",
        toColumn: "id",
        description: "Most recent sync run that updated the media record.",
      },
    ],
    notes: [
      "This table is suitable for agent prompts like 'show my latest reels with the highest reach'.",
      "The `raw` column preserves the normalized per-media payload; `insights` is the easiest field for metrics.",
    ],
    columns: [
      {
        name: "id",
        type: "text",
        visibility: "public",
        description: "Instagram media identifier.",
      },
      {
        name: "instagramAccountId",
        type: "text",
        visibility: "public",
        description: "Linked account that owns the media.",
      },
      {
        name: "userId",
        type: "text",
        visibility: "internal",
        description: "Owning app user for row-level access control.",
      },
      {
        name: "lastSyncRunId",
        type: "text",
        visibility: "public",
        description: "Most recent sync run that updated this row.",
      },
      {
        name: "caption",
        type: "text",
        visibility: "public",
        description: "Post caption when available.",
      },
      {
        name: "commentsCount",
        type: "integer",
        visibility: "public",
        description: "Comment count captured by the API.",
      },
      {
        name: "likeCount",
        type: "integer",
        visibility: "public",
        description: "Like count captured by the API.",
      },
      {
        name: "mediaProductType",
        type: "text",
        visibility: "public",
        description: "High-level media product type such as FEED, REELS, or STORY.",
      },
      {
        name: "mediaType",
        type: "text",
        visibility: "public",
        description: "Media asset type such as IMAGE, VIDEO, or CAROUSEL_ALBUM.",
      },
      {
        name: "mediaUrl",
        type: "text",
        visibility: "public",
        description: "Canonical media asset URL when available.",
      },
      {
        name: "thumbnailUrl",
        type: "text",
        visibility: "public",
        description: "Thumbnail URL for video or carousel media.",
      },
      {
        name: "previewUrl",
        type: "text",
        visibility: "public",
        description: "Preview asset URL if available.",
      },
      {
        name: "permalink",
        type: "text",
        visibility: "public",
        description: "Instagram permalink for the media.",
      },
      {
        name: "shortcode",
        type: "text",
        visibility: "public",
        description: "Instagram shortcode for the media.",
      },
      {
        name: "postedAt",
        type: "timestamp",
        visibility: "public",
        description: "Original Instagram publish time.",
      },
      {
        name: "username",
        type: "text",
        visibility: "public",
        description: "Username attached to the media payload.",
      },
      {
        name: "isCommentEnabled",
        type: "boolean",
        visibility: "public",
        description: "Whether comments are enabled for the media.",
      },
      {
        name: "topComments",
        type: "jsonb",
        visibility: "public",
        description: "Bounded top comments fetched for high-performing media.",
      },
      {
        name: "insights",
        type: "jsonb",
        visibility: "public",
        description: "Normalized media insights and breakdowns.",
      },
      {
        name: "warnings",
        type: "jsonb",
        visibility: "public",
        description: "Per-media warnings.",
      },
      {
        name: "errors",
        type: "jsonb",
        visibility: "public",
        description: "Per-media fetch or normalization errors.",
      },
      {
        name: "raw",
        type: "jsonb",
        visibility: "public",
        description: "Normalized raw media payload persisted for reference.",
      },
      {
        name: "syncedAt",
        type: "timestamp",
        visibility: "public",
        description: "When this row was last refreshed from Instagram.",
      },
      {
        name: "createdAt",
        type: "timestamp",
        visibility: "public",
        description: "Row creation time.",
      },
      {
        name: "updatedAt",
        type: "timestamp",
        visibility: "public",
        description: "Row update time.",
      },
    ],
  },
];

export const instagramSchemaOverview: SchemaOverviewDoc = {
  title: "Instagram Insights Analytics Schema",
  description:
    "Curated table documentation for the user-scoped Instagram analytics data exposed through the hosted REST API and MCP server.",
  notes: [
    "All REST and MCP reads are scoped to the authenticated API key owner.",
    "Auth/session tables are intentionally excluded from this schema surface.",
    "Protected columns are documented for context but never returned in API or MCP responses.",
  ],
  tables: instagramSchemaTables.map(({ name, title, description }) => ({
    name,
    title,
    description,
  })),
};

export function getInstagramSchemaTableDoc(
  tableName: string,
): SchemaTableDoc | null {
  return (
    instagramSchemaTables.find((table) => table.name === tableName) ?? null
  );
}
