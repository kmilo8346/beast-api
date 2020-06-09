import winston, { Logger } from 'winston';

function createLogger(): Logger {
  const simplePrettyPrint = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.metadata(),
    winston.format.json(),
    winston.format.printf((info) => {
      const { level, message, metadata } = info;
      const { timestamp, ...otherProps } = metadata;

      return `${timestamp} ${level}: ${message} ${
        Object.keys(otherProps).length
          ? JSON.stringify(otherProps, null, 2)
          : ''
      }`;
    }),
  );
  return winston.createLogger({
    level: 'debug',
    format: simplePrettyPrint,
    transports: [new winston.transports.Console()],
  });
}

export default createLogger();
