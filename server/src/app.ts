import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes';
import { notFound } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';

export function createApp(): Application {
  const app = express();

  // Trust Render's proxy so `secure` cookies work correctly in production.
  app.set('trust proxy', 1);

  app.use(
    cors({
      origin: process.env.CLIENT_URL, // never a wildcard — credentials require an explicit origin
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
