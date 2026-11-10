import type { Logger } from "@cashpilot/application";

/**
 * Structured logs: one JSON line per event on stdout/stderr, which Vercel
 * collects and makes searchable (course s.55).
 */
export class JsonLogger implements Logger {
  info(message: string, context?: Record<string, unknown>) { this.write("info", message, context); }
  warn(message: string, context?: Record<string, unknown>) { this.write("warn", message, context); }
  error(message: string, context?: Record<string, unknown>) { this.write("error", message, context); }

  private write(level: "info" | "warn" | "error", message: string, context?: Record<string, unknown>) {
    const line = JSON.stringify({ level, message, time: new Date().toISOString(), ...context });
    if (level === "info") process.stdout.write(`${line}\n`);
    else process.stderr.write(`${line}\n`);
  }
}
