import {
  users, type User, type InsertUser,
  recipes, type Recipe, type RecipeWithTags,
  tags, type Tag, type InsertTag,
  recipeTags,
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, or, and, inArray, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Tags
  getAllTags(): Promise<Tag[]>;
  getTagByName(name: string): Promise<Tag | undefined>;
  createTag(tag: InsertTag): Promise<Tag>;
  getOrCreateTags(names: string[]): Promise<Tag[]>;
  
  // Recipes
  getAllRecipes(): Promise<RecipeWithTags[]>;
  getRecipeById(id: string): Promise<RecipeWithTags | undefined>;
  createRecipe(recipe: Omit<Recipe, "id" | "createdAt" | "updatedAt">, tagIds: string[]): Promise<Recipe>;
  updateRecipe(id: string, recipe: Partial<Recipe>, tagIds?: string[]): Promise<Recipe | undefined>;
  deleteRecipe(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Tags
  async getAllTags(): Promise<Tag[]> {
    return db.select().from(tags).orderBy(tags.name);
  }

  async getTagByName(name: string): Promise<Tag | undefined> {
    const [tag] = await db.select().from(tags).where(eq(tags.name, name));
    return tag || undefined;
  }

  async createTag(tag: InsertTag): Promise<Tag> {
    const [newTag] = await db.insert(tags).values(tag).returning();
    return newTag;
  }

  async getOrCreateTags(names: string[]): Promise<Tag[]> {
    if (names.length === 0) return [];
    
    const result: Tag[] = [];
    for (const name of names) {
      const trimmed = name.trim();
      if (!trimmed) continue;
      
      let tag = await this.getTagByName(trimmed);
      if (!tag) {
        tag = await this.createTag({ name: trimmed });
      }
      result.push(tag);
    }
    return result;
  }

  // Recipes
  async getAllRecipes(): Promise<RecipeWithTags[]> {
    const allRecipes = await db.select().from(recipes).orderBy(desc(recipes.createdAt));
    
    const recipesWithTags: RecipeWithTags[] = [];
    for (const recipe of allRecipes) {
      const tagRelations = await db
        .select({ tag: tags })
        .from(recipeTags)
        .innerJoin(tags, eq(recipeTags.tagId, tags.id))
        .where(eq(recipeTags.recipeId, recipe.id));
      
      recipesWithTags.push({
        ...recipe,
        tags: tagRelations.map((r) => r.tag),
      });
    }
    return recipesWithTags;
  }

  async getRecipeById(id: string): Promise<RecipeWithTags | undefined> {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id));
    if (!recipe) return undefined;
    
    const tagRelations = await db
      .select({ tag: tags })
      .from(recipeTags)
      .innerJoin(tags, eq(recipeTags.tagId, tags.id))
      .where(eq(recipeTags.recipeId, recipe.id));
    
    return {
      ...recipe,
      tags: tagRelations.map((r) => r.tag),
    };
  }

  async createRecipe(
    recipeData: Omit<Recipe, "id" | "createdAt" | "updatedAt">,
    tagIds: string[]
  ): Promise<Recipe> {
    const [recipe] = await db
      .insert(recipes)
      .values({
        ...recipeData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    if (tagIds.length > 0) {
      await db.insert(recipeTags).values(
        tagIds.map((tagId) => ({ recipeId: recipe.id, tagId }))
      );
    }
    
    return recipe;
  }

  async updateRecipe(
    id: string,
    recipeData: Partial<Recipe>,
    tagIds?: string[]
  ): Promise<Recipe | undefined> {
    const [updated] = await db
      .update(recipes)
      .set({ ...recipeData, updatedAt: new Date() })
      .where(eq(recipes.id, id))
      .returning();
    
    if (!updated) return undefined;
    
    if (tagIds !== undefined) {
      await db.delete(recipeTags).where(eq(recipeTags.recipeId, id));
      if (tagIds.length > 0) {
        await db.insert(recipeTags).values(
          tagIds.map((tagId) => ({ recipeId: id, tagId }))
        );
      }
    }
    
    return updated;
  }

  async deleteRecipe(id: string): Promise<boolean> {
    const result = await db.delete(recipes).where(eq(recipes.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
