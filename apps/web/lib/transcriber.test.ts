import assert from "node:assert/strict";
import test from "node:test";

import {
  buildTranscriptMetadata,
  chunkTranscriptionItems,
  DEFAULT_TRANSCRIBER_MAX_SECONDS,
  isInstagramMediaEligibleForTranscription,
  normalizeTranscriberMaxSeconds,
} from "@/lib/transcriber";

test("normalizeTranscriberMaxSeconds falls back for missing and invalid values", () => {
  assert.equal(
    normalizeTranscriberMaxSeconds(undefined),
    DEFAULT_TRANSCRIBER_MAX_SECONDS,
  );
  assert.equal(
    normalizeTranscriberMaxSeconds("not-a-number"),
    DEFAULT_TRANSCRIBER_MAX_SECONDS,
  );
  assert.equal(
    normalizeTranscriberMaxSeconds("-5"),
    DEFAULT_TRANSCRIBER_MAX_SECONDS,
  );
});

test("normalizeTranscriberMaxSeconds accepts positive integers", () => {
  assert.equal(normalizeTranscriberMaxSeconds("45"), 45);
});

test("isInstagramMediaEligibleForTranscription only accepts unfinished video rows", () => {
  assert.equal(
    isInstagramMediaEligibleForTranscription({
      id: "video-1",
      mediaType: "VIDEO",
      mediaUrl: "https://example.com/video.mp4",
      transcriptStatus: null,
    }),
    true,
  );

  assert.equal(
    isInstagramMediaEligibleForTranscription({
      id: "image-1",
      mediaType: "IMAGE",
      mediaUrl: "https://example.com/image.jpg",
      transcriptStatus: null,
    }),
    false,
  );

  assert.equal(
    isInstagramMediaEligibleForTranscription({
      id: "video-2",
      mediaType: "VIDEO",
      mediaUrl: "https://example.com/video.mp4",
      transcriptStatus: "completed",
    }),
    false,
  );
});

test("chunkTranscriptionItems creates bounded concurrency batches", () => {
  assert.deepEqual(chunkTranscriptionItems([1, 2, 3, 4, 5], 2), [
    [1, 2],
    [3, 4],
    [5],
  ]);
});

test("buildTranscriptMetadata captures the persisted response details", () => {
  assert.deepEqual(
    buildTranscriptMetadata({
      mediaUrl: "https://example.com/video.mp4",
      requestedMaxSeconds: 30,
      response: {
        clipSeconds: 27,
        truncated: false,
        status: "completed",
      },
    }),
    {
      mediaUrl: "https://example.com/video.mp4",
      requestedMaxSeconds: 30,
      clipSeconds: 27,
      truncated: false,
      serviceStatus: "completed",
    },
  );
});
