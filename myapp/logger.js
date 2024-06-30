// Use winston to log info and errors to console and file
// In app replace all logger.infos with logger.info and logger.errors with logger.error.
// This will allow you to log to console and file with winston.

const { createLogger, format, transports } = require("winston");
const path = require("path");
const fs = require("fs");

const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.printf(
      ({ timestamp, level, message }) =>
        `${timestamp} [${level.toUpperCase()}]: ${message}`,
    ),
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: path.join(logsDir, "combined.log") }),
  ],
});

module.exports = logger;
