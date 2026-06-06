import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { errorMiddleware } from './middleware/error.middleware';
import apiRouter from './routes';
import { logger } from './lib/logger';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './config/swagger.json';

const app = express();

// Enable Helmet for setting security-related HTTP headers
app.use(helmet());

// Enable Cross-Origin Resource Sharing
app.use(cors());

// Configure Rate Limiter to guard against Brute Force/DDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
});
app.use(limiter);

// Built-in body parsers for JSON and URL-encoded queries
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP Request Logger
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// Swagger Documentation UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API Routes entrypoint
app.use('/api/v1', apiRouter);

// Fallback for unmatched API routes (404)
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
  });
});

// Global Error Handler
app.use(errorMiddleware);

export default app;
