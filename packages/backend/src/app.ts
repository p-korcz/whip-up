import express from 'express';
import cors from 'cors';
import ingredientsRouter from './routes/ingredients.js';
import recipesRouter from './routes/recipes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp(): express.Application {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/ingredients', ingredientsRouter);
  app.use('/api/recipes', recipesRouter);

  app.use(errorHandler);

  return app;
}
