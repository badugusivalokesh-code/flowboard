import express, { Application } from 'express';
import cors, { type CorsOptions } from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes';
import { notFound } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';

export function createApp(): Application {
  const app = express();
  const configuredClientUrl = process.env.CLIENT_URL;
  const corsOrigin: CorsOptions['origin'] = configuredClientUrl
    ? (requestOrigin, callback) => {
        callback(null, requestOrigin === configuredClientUrl ? configuredClientUrl : false);
      }
    : false;

  // Trust Render's proxy so `secure` cookies work correctly in production.
  app.set('trust proxy', 1);

  app.use(
    cors({
      origin: corsOrigin,
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
