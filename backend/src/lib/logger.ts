import winston from 'winston';
import { config } from '../config';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `[${info.timestamp}] [${info.level.toUpperCase()}]: ${info.message}`,
  ),
);

const developmentFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  logFormat,
);

const productionFormat = winston.format.combine(
  winston.format.uncolorize(),
  winston.format.json(),
);

const transports = [
  new winston.transports.Console({
    format: config.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  }),
];

export const logger = winston.createLogger({
  level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  levels,
  transports,
});
