import assert from "node:assert/strict";
import test from "node:test";

import { printJson, runWithRuntimeLogging } from "./output";

function captureConsole() {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const originalLog = console.log;
  const originalError = console.error;

  console.log = (...args: unknown[]) => {
    stdout.push(args.map(String).join(" "));
  };
  console.error = (...args: unknown[]) => {
    stderr.push(args.map(String).join(" "));
  };

  return {
    stdout,
    stderr,
    restore() {
      console.log = originalLog;
      console.error = originalError;
    },
  };
}

test("runtime logging writes JSON events to stderr while final JSON stays on stdout", async () => {
  const capture = captureConsole();

  try {
    await runWithRuntimeLogging("Fetching account overview", async () => {
      printJson({ ok: true });
    });
  } finally {
    capture.restore();
  }

  assert.equal(capture.stdout.length, 1);
  assert.match(capture.stdout[0], /"ok": true/);
  assert.equal(capture.stderr.length, 2);
  assert.deepEqual(JSON.parse(capture.stderr[0]), {
    event: "runtime_log",
    message: "Fetching account overview...",
  });
  assert.deepEqual(JSON.parse(capture.stderr[1]), {
    event: "runtime_log",
    message: "Fetching account overview complete.",
  });
});
