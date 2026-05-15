import { Router, type IRouter } from 'express';
import { z } from 'zod';
import { searchRecipes, getRecipeById } from '../services/qdrant.js';

const router: IRouter = Router();

const searchSchema = z.object({
  ingredients: z.array(z.string().min(1).max(100)).min(1).max(50),
  lang: z.enum(['en', 'pl']),
});

const detailSchema = z.object({
  lang: z.enum(['en', 'pl']).default('en'),
});

router.post('/search', async (req, res, next) => {
  try {
    const { ingredients, lang } = searchSchema.parse(req.body);
    const recipes = await searchRecipes(ingredients, lang);
    res.json({ recipes });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lang } = detailSchema.parse(req.query);
    const recipe = await getRecipeById(id, lang);
    if (!recipe) {
      res.status(404).json({ error: 'Recipe not found' });
      return;
    }
    res.json(recipe);
  } catch (err) {
    next(err);
  }
});

export default router;
