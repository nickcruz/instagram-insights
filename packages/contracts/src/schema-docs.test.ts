import assert from "node:assert/strict";
import test from "node:test";

import {
  getInstagramSchemaTableDoc,
  instagramSchemaOverview,
  instagramSchemaTableNames,
  instagramSchemaTables,
} from "./schema-docs";

test("schema overview and table list stay in sync", () => {
  assert.equal(instagramSchemaOverview.tables.length, instagramSchemaTables.length);
  assert.deepEqual(
    instagramSchemaTableNames,
    instagramSchemaTables.map((table) => table.name),
  );
});

test("instagram_account documents the protected access token column", () => {
  const table = getInstagramSchemaTableDoc("instagram_account");

  assert.ok(table);
  assert.equal(
    table?.columns.find((column) => column.name === "accessToken")?.visibility,
    "protected",
  );
});

test("unknown table lookups return null", () => {
  assert.equal(getInstagramSchemaTableDoc("not_a_table"), null);
});
