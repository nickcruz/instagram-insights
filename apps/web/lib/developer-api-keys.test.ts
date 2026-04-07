import assert from "node:assert/strict";
import test from "node:test";

import {
  generateDeveloperApiKey,
  getBearerToken,
  hashDeveloperApiKey,
  parseDeveloperApiKey,
} from "./developer-api-keys";

test("generateDeveloperApiKey creates a parseable prefixed token", () => {
  const generated = generateDeveloperApiKey();
  const parsed = parseDeveloperApiKey(generated.apiKey);

  assert.ok(parsed);
  assert.equal(parsed?.keyPrefix, generated.keyPrefix);
  assert.equal(generated.secretHash, hashDeveloperApiKey(generated.apiKey));
});

test("parseDeveloperApiKey rejects malformed values", () => {
  assert.equal(parseDeveloperApiKey(""), null);
  assert.equal(parseDeveloperApiKey("ii_onlyprefix"), null);
  assert.equal(parseDeveloperApiKey("nope.secret"), null);
});

test("getBearerToken extracts a bearer token from the authorization header", () => {
  const request = new Request("https://example.com", {
    headers: {
      Authorization: "Bearer example-token",
    },
  });

  assert.equal(getBearerToken(request), "example-token");
  assert.equal(getBearerToken(new Request("https://example.com")), null);
});
