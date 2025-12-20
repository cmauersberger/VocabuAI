type Level = "debug" | "info" | "warn" | "error";

function write(level: Level, message: string, meta?: unknown) {
  const prefix = `[VocabuAI:${level}]`;

  switch (level) {
    case "debug":
      console.debug(prefix, message, meta ?? "");
      break;
    case "info":
      console.info(prefix, message, meta ?? "");
      break;
    case "warn":
      console.warn(prefix, message, meta ?? "");
      break;
    case "error":
      console.error(prefix, message, meta ?? "");
      break;
  }
}

export const logger = {
  debug: (message: string, meta?: unknown) => write("debug", message, meta),
  info: (message: string, meta?: unknown) => write("info", message, meta),
  warn: (message: string, meta?: unknown) => write("warn", message, meta),
  error: (message: string, meta?: unknown) => write("error", message, meta)
};

