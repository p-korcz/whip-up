import { Router, type IRouter } from 'express';
import { z } from 'zod';
import { autocompleteIngredients } from '../services/elasticsearch.js';

const router: IRouter = Router();

const autocompleteSchema = z.object({
  q: z.string().min(1).max(100),
  lang: z.enum(['en', 'pl']).default('en'),
});

router.get('/autocomplete', async (req, res, next) => {
  try {
    const { q, lang } = autocompleteSchema.parse(req.query);
    const ingredients = await autocompleteIngredients(q, lang);
    res.json({ ingredients });
  } catch (err) {
    next(err);
  }
});

export default router;
