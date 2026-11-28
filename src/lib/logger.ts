type LogLevel = "info" | "warn" | "error";

/**
 * Structured server logs. Vercel's log drain can ingest these JSON lines
 * without exposing credentials or stack traces to API clients.
 */
function write(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  const entry = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    message,
    ...(context ? { context } : {}),
  });

  if (level === "error") console.error(entry);
  else if (level === "warn") console.warn(entry);
  else console.log(entry);
}

export function logInfo(message: string, context?: Record<string, unknown>): void {
  write("info", message, context);
}

export function logWarn(message: string, context?: Record<string, unknown>): void {
  write("warn", message, context);
}

export function logError(message: string, error?: unknown, context?: Record<string, unknown>): void {
  const details =
    error === undefined
      ? undefined
      : error instanceof Error
        ? { name: error.name, message: error.message }
        : { message: String(error) };

  write("error", message, { ...context, ...(details ? { error: details } : {}) });
}
