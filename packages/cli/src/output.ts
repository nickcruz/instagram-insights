function hasDetails(details?: Record<string, unknown>) {
  return Boolean(details && Object.keys(details).length > 0);
}

function printJsonLine(data: Record<string, unknown>) {
  console.error(JSON.stringify(data));
}

export function printJson(data: unknown) {
  console.log(JSON.stringify(data, null, 2));
}

export function printText(text: string) {
  console.log(text);
}

export function logRuntime(message: string, details?: Record<string, unknown>) {
  printJsonLine({
    event: "runtime_log",
    message,
    ...(details ?? {}),
  });
}

export async function runWithRuntimeLogging<T>(
  message: string,
  task: () => Promise<T>,
) {
  logRuntime(`${message}...`);

  try {
    const result = await task();
    logRuntime(`${message} complete.`);
    return result;
  } catch (error) {
    logRuntime(`${message} failed.`);
    throw error;
  }
}

export function fail(message: string, details?: Record<string, unknown>): never {
  printJsonLine({
    event: "error",
    error: message,
    ...(details ?? {}),
  });

  process.exit(1);
}
