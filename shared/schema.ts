import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Recipe type enum
export const recipeTypeEnum = z.enum(["cocktail", "slushi"]);
export type RecipeType = z.infer<typeof recipeTypeEnum>;

// SLUSHi constraints
export const SLUSHI_MIN_VOLUME = 475;
export const SLUSHI_MAX_VOLUME = 1890;

// Cocktail ingredient schema (flexible text)
export const cocktailIngredientSchema = z.object({
  text: z.string().min(1, "Ingredient text is required"),
});
export type CocktailIngredient = z.infer<typeof cocktailIngredientSchema>;

// SLUSHi ingredient schema (structured with ml)
export const slushiIngredientSchema = z.object({
  name: z.string().min(1, "Ingredient name is required"),
  amount_ml: z.number().min(1, "Amount must be at least 1ml"),
});
export type SlushiIngredient = z.infer<typeof slushiIngredientSchema>;

// Tags table
export const tags = pgTable("tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
});

export const tagsRelations = relations(tags, ({ many }) => ({
  recipeTags: many(recipeTags),
}));

// Recipes table
export const recipes = pgTable("recipes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull().$type<RecipeType>(),
  imagePath: text("image_path"),
  ingredients: jsonb("ingredients").notNull().$type<CocktailIngredient[] | SlushiIngredient[]>(),
  method: text("method").array().notNull(),
  notes: text("notes"),
  baseVolumeMl: integer("base_volume_ml"),
  mode: text("mode"),
  favourite: boolean("favourite").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const recipesRelations = relations(recipes, ({ many }) => ({
  recipeTags: many(recipeTags),
}));

// Recipe-Tags junction table
export const recipeTags = pgTable("recipe_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipeId: varchar("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  tagId: varchar("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
});

export const recipeTagsRelations = relations(recipeTags, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeTags.recipeId],
    references: [recipes.id],
  }),
  tag: one(tags, {
    fields: [recipeTags.tagId],
    references: [tags.id],
  }),
}));

// Users table for simple auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Insert schemas
export const insertTagSchema = createInsertSchema(tags).omit({ id: true });
export type InsertTag = z.infer<typeof insertTagSchema>;
export type Tag = typeof tags.$inferSelect;

export const insertRecipeSchema = createInsertSchema(recipes).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
}).extend({
  type: recipeTypeEnum,
  ingredients: z.union([
    z.array(cocktailIngredientSchema),
    z.array(slushiIngredientSchema),
  ]),
  method: z.array(z.string().min(1)),
  tagNames: z.array(z.string()).optional(),
});

export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type Recipe = typeof recipes.$inferSelect;

// Recipe with tags type
export type RecipeWithTags = Recipe & {
  tags: Tag[];
};

// API payload schema for GPT Actions
export const apiRecipePayloadSchema = z.object({
  name: z.string().min(1, "Recipe name is required"),
  type: recipeTypeEnum,
  tags: z.array(z.string()).optional().default([]),
  ingredients: z.union([
    z.array(cocktailIngredientSchema),
    z.array(slushiIngredientSchema),
  ]),
  method: z.array(z.string().min(1, "Method step cannot be empty")),
  notes: z.string().optional(),
  base_volume_ml: z.number().optional(),
  mode: z.string().optional(),
}).refine((data) => {
  if (data.type === "slushi") {
    // For SLUSHi, calculate base volume from ingredients
    const ingredients = data.ingredients as SlushiIngredient[];
    const totalVolume = ingredients.reduce((sum, ing) => sum + (ing.amount_ml || 0), 0);
    const baseVolume = data.base_volume_ml || totalVolume;
    return baseVolume >= SLUSHI_MIN_VOLUME && baseVolume <= SLUSHI_MAX_VOLUME;
  }
  return true;
}, {
  message: `SLUSHi recipes must have a base volume between ${SLUSHI_MIN_VOLUME}ml and ${SLUSHI_MAX_VOLUME}ml`,
});

export type ApiRecipePayload = z.infer<typeof apiRecipePayloadSchema>;

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
