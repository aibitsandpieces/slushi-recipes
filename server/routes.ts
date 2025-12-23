import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { apiRecipePayloadSchema, SLUSHI_MIN_VOLUME, SLUSHI_MAX_VOLUME } from "@shared/schema";
import type { SlushiIngredient, RecipeType } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import session from "express-session";
import { z } from "zod";
import { registerObjectStorageRoutes, ObjectStorageService } from "./replit_integrations/object_storage";

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for image uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Get app password from environment or use default for development
const APP_PASSWORD = process.env.APP_PASSWORD || "cocktails123";
const API_KEY = process.env.API_KEY || "recipe-api-key-123";

// Session authentication middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session?.authenticated) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
}

// API key authentication middleware
function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers["x-api-key"] || req.headers["authorization"]?.replace("Bearer ", "");
  if (apiKey === API_KEY) {
    return next();
  }
  res.status(401).json({ error: "Invalid API key" });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Register object storage routes for persistent image storage
  registerObjectStorageRoutes(app);
  
  // Serve uploaded images (legacy local storage - fallback for old images)
  app.use("/uploads", (req, res, next) => {
    const filePath = path.join(uploadsDir, req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send("Image not found");
    }
  });

  // Auth routes
  app.post("/api/auth/login", (req, res) => {
    const { password } = req.body;
    if (password === APP_PASSWORD) {
      req.session.authenticated = true;
      res.json({ success: true });
    } else {
      res.status(401).json({ error: "Invalid password" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      res.json({ success: true });
    });
  });

  app.get("/api/auth/check", (req, res) => {
    if (req.session?.authenticated) {
      res.json({ authenticated: true });
    } else {
      res.status(401).json({ authenticated: false });
    }
  });

  // Tags routes
  app.get("/api/tags", requireAuth, async (req, res) => {
    try {
      const allTags = await storage.getAllTags();
      res.json(allTags);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tags" });
    }
  });

  // Recipes routes
  app.get("/api/recipes", requireAuth, async (req, res) => {
    try {
      const allRecipes = await storage.getAllRecipes();
      res.json(allRecipes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recipes" });
    }
  });

  app.get("/api/recipes/:id", requireAuth, async (req, res) => {
    try {
      const recipe = await storage.getRecipeById(req.params.id);
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      res.json(recipe);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recipe" });
    }
  });

  // Create recipe (form data with image path from object storage)
  app.post("/api/recipes", requireAuth, upload.single("image"), async (req, res) => {
    try {
      const { name, type, tags: tagsJson, ingredients: ingredientsJson, method: methodJson, notes, baseVolumeMl, mode, imagePath: imagePathFromBody } = req.body;
      
      const parsedTags = tagsJson ? JSON.parse(tagsJson) : [];
      const parsedIngredients = ingredientsJson ? JSON.parse(ingredientsJson) : [];
      const parsedMethod = methodJson ? JSON.parse(methodJson) : [];
      
      // Validate SLUSHi volume
      if (type === "slushi") {
        const totalVolume = parsedIngredients.reduce((sum: number, i: SlushiIngredient) => sum + (i.amount_ml || 0), 0);
        if (totalVolume < SLUSHI_MIN_VOLUME || totalVolume > SLUSHI_MAX_VOLUME) {
          return res.status(400).json({
            error: `SLUSHi recipes must have a total volume between ${SLUSHI_MIN_VOLUME}ml and ${SLUSHI_MAX_VOLUME}ml (current: ${totalVolume}ml)`,
          });
        }
      }
      
      // Get or create tags
      const tagRecords = await storage.getOrCreateTags(parsedTags);
      const tagIds = tagRecords.map((t) => t.id);
      
      // Handle image path - support both object storage paths and legacy file uploads
      let imagePath = imagePathFromBody || null;
      if (req.file) {
        imagePath = `/uploads/${req.file.filename}`;
      }
      
      const recipe = await storage.createRecipe(
        {
          name,
          type: type as RecipeType,
          imagePath,
          ingredients: parsedIngredients,
          method: parsedMethod,
          notes: notes || null,
          baseVolumeMl: baseVolumeMl ? parseInt(baseVolumeMl) : null,
          mode: mode || null,
          favourite: false,
        },
        tagIds
      );
      
      res.json(recipe);
    } catch (error) {
      console.error("Create recipe error:", error);
      res.status(500).json({ error: "Failed to create recipe" });
    }
  });

  // Update recipe
  app.put("/api/recipes/:id", requireAuth, upload.single("image"), async (req, res) => {
    try {
      const { name, type, tags: tagsJson, ingredients: ingredientsJson, method: methodJson, notes, baseVolumeMl, mode, imagePath: imagePathFromBody } = req.body;
      
      const parsedTags = tagsJson ? JSON.parse(tagsJson) : [];
      const parsedIngredients = ingredientsJson ? JSON.parse(ingredientsJson) : [];
      const parsedMethod = methodJson ? JSON.parse(methodJson) : [];
      
      // Validate SLUSHi volume
      if (type === "slushi") {
        const totalVolume = parsedIngredients.reduce((sum: number, i: SlushiIngredient) => sum + (i.amount_ml || 0), 0);
        if (totalVolume < SLUSHI_MIN_VOLUME || totalVolume > SLUSHI_MAX_VOLUME) {
          return res.status(400).json({
            error: `SLUSHi recipes must have a total volume between ${SLUSHI_MIN_VOLUME}ml and ${SLUSHI_MAX_VOLUME}ml (current: ${totalVolume}ml)`,
          });
        }
      }
      
      // Get or create tags
      const tagRecords = await storage.getOrCreateTags(parsedTags);
      const tagIds = tagRecords.map((t) => t.id);
      
      // Handle image path - support both object storage paths and legacy file uploads
      let imagePath = imagePathFromBody || null;
      if (req.file) {
        imagePath = `/uploads/${req.file.filename}`;
      }
      
      const recipe = await storage.updateRecipe(
        req.params.id,
        {
          name,
          type: type as RecipeType,
          imagePath,
          ingredients: parsedIngredients,
          method: parsedMethod,
          notes: notes || null,
          baseVolumeMl: baseVolumeMl ? parseInt(baseVolumeMl) : null,
          mode: mode || null,
        },
        tagIds
      );
      
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      
      res.json(recipe);
    } catch (error) {
      console.error("Update recipe error:", error);
      res.status(500).json({ error: "Failed to update recipe" });
    }
  });

  // Partial update (for toggling favourite)
  app.patch("/api/recipes/:id", requireAuth, async (req, res) => {
    try {
      const recipe = await storage.updateRecipe(req.params.id, req.body);
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      res.json(recipe);
    } catch (error) {
      res.status(500).json({ error: "Failed to update recipe" });
    }
  });

  // Delete recipe
  app.delete("/api/recipes/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteRecipe(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete recipe" });
    }
  });

  // GPT Actions API endpoint
  app.post("/api/gpt/recipes", requireApiKey, async (req, res) => {
    try {
      const validation = apiRecipePayloadSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validation.error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        });
      }
      
      const data = validation.data;
      
      // For SLUSHi, validate volume
      if (data.type === "slushi") {
        const ingredients = data.ingredients as SlushiIngredient[];
        const totalVolume = ingredients.reduce((sum, i) => sum + (i.amount_ml || 0), 0);
        const baseVolume = data.base_volume_ml || totalVolume;
        
        if (baseVolume < SLUSHI_MIN_VOLUME || baseVolume > SLUSHI_MAX_VOLUME) {
          return res.status(400).json({
            error: `SLUSHi recipes must have a base volume between ${SLUSHI_MIN_VOLUME}ml and ${SLUSHI_MAX_VOLUME}ml (current: ${baseVolume}ml)`,
          });
        }
      }
      
      // Get or create tags
      const tagRecords = await storage.getOrCreateTags(data.tags);
      const tagIds = tagRecords.map((t) => t.id);
      
      const baseVolume = data.type === "slushi"
        ? data.base_volume_ml || (data.ingredients as SlushiIngredient[]).reduce((sum, i) => sum + (i.amount_ml || 0), 0)
        : null;
      
      const recipe = await storage.createRecipe(
        {
          name: data.name,
          type: data.type,
          imagePath: null,
          ingredients: data.ingredients,
          method: data.method,
          notes: data.notes || null,
          baseVolumeMl: baseVolume,
          mode: data.mode || null,
          favourite: false,
        },
        tagIds
      );
      
      const recipeWithTags = await storage.getRecipeById(recipe.id);
      
      res.json({
        success: true,
        id: recipe.id,
        recipe: recipeWithTags,
      });
    } catch (error) {
      console.error("GPT API error:", error);
      res.status(500).json({ error: "Failed to create recipe" });
    }
  });

  // OpenAPI schema endpoint - dynamically set server URL
  app.get("/api/openapi.json", (req, res) => {
    const host = req.get("host") || "localhost:5000";
    const protocol = req.get("x-forwarded-proto") || req.protocol || "https";
    const baseUrl = `${protocol}://${host}`;
    
    const schema = {
      ...openApiSchema,
      servers: [{ url: baseUrl }],
    };
    res.json(schema);
  });

  return httpServer;
}

// OpenAPI 3.1.0 schema for ChatGPT Actions (servers array is set dynamically in the endpoint)
const openApiSchema = {
  openapi: "3.1.0",
  info: {
    title: "Cocktail & SLUSHi Recipe Library API",
    version: "1.0.0",
    description: "API for creating recipes in the Cocktail & SLUSHi Recipe Library. Authenticate using the X-API-Key header.",
  },
  servers: [] as { url: string }[],
  paths: {
    "/api/gpt/recipes": {
      post: {
        operationId: "createRecipe",
        summary: "Create a new cocktail or SLUSHi recipe",
        description: "Creates a new recipe. For SLUSHi recipes, the total ingredient volume must be between 475ml and 1890ml.",
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreateRecipeRequest",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Recipe created successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CreateRecipeResponse",
                },
              },
            },
          },
          "400": {
            description: "Validation error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "401": {
            description: "Invalid or missing API key",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "X-API-Key",
        description: "API key for authentication",
      },
    },
    schemas: {
      CocktailIngredient: {
        type: "object",
        required: ["text"],
        properties: {
          text: {
            type: "string",
            description: "Ingredient description (e.g., '50 ml gin', '2 dashes bitters')",
          },
        },
        additionalProperties: false,
      },
      SlushiIngredient: {
        type: "object",
        required: ["name", "amount_ml"],
        properties: {
          name: {
            type: "string",
            description: "Ingredient name",
          },
          amount_ml: {
            type: "number",
            description: "Amount in milliliters",
          },
        },
        additionalProperties: false,
      },
      CocktailIngredients: {
        type: "array",
        minItems: 1,
        items: {
          $ref: "#/components/schemas/CocktailIngredient",
        },
        description: "Array of cocktail ingredients. Each ingredient is a free-text description line (e.g., '50 ml gin', '2 dashes bitters').",
      },
      SlushiIngredients: {
        type: "array",
        minItems: 1,
        items: {
          $ref: "#/components/schemas/SlushiIngredient",
        },
        description: "Array of SLUSHi ingredients. Each ingredient must be a liquid with name and amount_ml. Total volume must be 475-1890ml.",
      },
      CreateRecipeRequest: {
        type: "object",
        required: ["name", "type", "ingredients", "method"],
        properties: {
          name: {
            type: "string",
            description: "Name of the recipe",
          },
          type: {
            type: "string",
            enum: ["cocktail", "slushi"],
            description: "Type of recipe: 'cocktail' for standard drinks, 'slushi' for Ninja SLUSHi frozen drinks",
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Tags for categorization (e.g., 'rum', 'refreshing', 'summer')",
          },
          ingredients: {
            description: "Ingredients list. For type='cocktail', use CocktailIngredients (array of {text}). For type='slushi', use SlushiIngredients (array of {name, amount_ml}).",
            oneOf: [
              { $ref: "#/components/schemas/CocktailIngredients" },
              { $ref: "#/components/schemas/SlushiIngredients" },
            ],
          },
          method: {
            type: "array",
            items: { type: "string" },
            description: "List of preparation steps",
          },
          notes: {
            type: "string",
            description: "Optional notes about the recipe",
          },
          base_volume_ml: {
            type: "number",
            description: "Base volume for SLUSHi recipes (475-1890ml). Auto-calculated from ingredients if not provided.",
          },
          mode: {
            type: "string",
            enum: ["Slush", "Spiked Slush", "Frozen Cocktail", "Frappe", "Milkshake", "Frozen Juice"],
            description: "SLUSHi machine mode. Only used for slushi type recipes.",
          },
        },
      },
      CreateRecipeResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            description: "Whether the recipe was created successfully",
          },
          id: {
            type: "integer",
            description: "ID of the created recipe",
          },
          recipe: {
            type: "object",
            description: "The created recipe object with all fields and tags",
          },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: {
            type: "string",
            description: "Error message",
          },
          details: {
            type: "array",
            description: "Detailed validation errors (for 400 responses)",
            items: {
              type: "object",
              properties: {
                path: { type: "string" },
                message: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
};
