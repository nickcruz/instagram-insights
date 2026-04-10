export function printJson(data: unknown) {
  console.log(JSON.stringify(data, null, 2));
}

export function printText(text: string) {
  console.log(text);
}

export function fail(message: string, details?: Record<string, unknown>): never {
  const payload = {
    error: message,
    ...(details ?? {}),
  };

  console.error(JSON.stringify(payload, null, 2));
  process.exit(1);
}

