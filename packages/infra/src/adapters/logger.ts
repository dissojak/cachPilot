import { Logger } from "@cashpilot/application";

export class ConsoleLogger implements Logger {
  info(message: string, context?: Record<string, unknown>) { console.log(message, context ?? {}); }
  warn(message: string, context?: Record<string, unknown>) { console.warn(message, context ?? {}); }
  error(message: string, context?: Record<string, unknown>) { console.error(message, context ?? {}); }
}
