import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import type { ParsedRecipe, ExtractedRecipeRaw } from '../types/index.js';

const client = new Anthropic({
  apiKey: process.env['ANTHROPIC_API_KEY'],
});

const RecipeStepSchema = z.object({
  order: z.number(),
  description: z.string(),
});

const ExtractedRecipeRawSchema = z.object({
  title: z.string(),
  description: z.string(),
  author: z.string(),
  ingredients: z.array(z.string()),
  steps: z.array(RecipeStepSchema),
  imageUrl: z.string().optional(),
});

const extractTool: Anthropic.Tool = {
  name: 'extract_recipe',
  description: 'Extract structured recipe data from page text',
  input_schema: {
    type: 'object' as const,
    properties: {
      title: { type: 'string', description: 'Recipe title' },
      description: { type: 'string', description: 'Short description of the dish' },
      author: { type: 'string', description: 'Author or site name, empty string if unknown' },
      ingredients: {
        type: 'array',
        description: 'Each ingredient as a single string, e.g. "200g chicken breast" or "2 cloves garlic"',
        items: { type: 'string' },
      },
      steps: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            order: { type: 'number' },
            description: { type: 'string' },
          },
          required: ['order', 'description'],
        },
      },
      imageUrl: { type: 'string', description: 'Main image URL if present' },
    },
    required: ['title', 'description', 'author', 'ingredients', 'steps'],
  },
};

export async function parseRecipePage(
  pageText: string,
  pageUrl: string,
): Promise<ParsedRecipe | null> {
  if (pageText.length < 200) return null;

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      tools: [extractTool],
      tool_choice: { type: 'any' },
      messages: [
        {
          role: 'user',
          content: `Extract the recipe from this page. Ingredients must be plain strings like "200g pasta" or "3 eggs". If this page does not contain a recipe, still call extract_recipe but return an empty ingredients array.\n\nURL: ${pageUrl}\n\n${pageText.slice(0, 6000)}`,
        },
      ],
    });

    const toolUse = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
    if (!toolUse) return null;

    const parsed = ExtractedRecipeRawSchema.safeParse(toolUse.input);
    if (!parsed.success) return null;

    const raw: ExtractedRecipeRaw = parsed.data;
    if (raw.ingredients.length === 0 || raw.steps.length === 0) return null;

    return {
      title: raw.title,
      description: raw.description,
      author: raw.author,
      ingredients: raw.ingredients,
      steps: raw.steps.map((s) => s.description),
      imageUrl: raw.imageUrl,
    };
  } catch {
    return null;
  }
}

const translateTool: Anthropic.Tool = {
  name: 'translate_recipe',
  description: 'Translate recipe fields to target language',
  input_schema: {
    type: 'object' as const,
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      ingredients: {
        type: 'array',
        description: 'Each ingredient as a plain string',
        items: { type: 'string' },
      },
      steps: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    required: ['title', 'description', 'ingredients', 'steps'],
  },
};

const TranslatedRecipeSchema = z.object({
  title: z.string(),
  description: z.string(),
  ingredients: z.array(z.string()),
  steps: z.array(z.string()),
});

export async function translateRecipe(
  recipe: ParsedRecipe,
  targetLang: 'en' | 'pl',
): Promise<ParsedRecipe> {
  const langName = targetLang === 'en' ? 'English' : 'Polish';

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      tools: [translateTool],
      tool_choice: { type: 'any' },
      messages: [
        {
          role: 'user',
          content: `Translate this recipe to ${langName}. Keep ingredient amounts as-is; translate names and text only.\n\n${JSON.stringify({ title: recipe.title, description: recipe.description, ingredients: recipe.ingredients, steps: recipe.steps })}`,
        },
      ],
    });

    const toolUse = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
    if (!toolUse) return recipe;

    const parsed = TranslatedRecipeSchema.safeParse(toolUse.input);
    if (!parsed.success) return recipe;

    return {
      ...recipe,
      title: parsed.data.title,
      description: parsed.data.description,
      ingredients: parsed.data.ingredients,
      steps: parsed.data.steps,
    };
  } catch {
    return recipe;
  }
}
