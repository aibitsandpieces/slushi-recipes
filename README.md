# Cocktail & SLUSHi Recipe Library

A private web app for managing cocktail and SLUSHi (Ninja SLUSHi) recipes with image uploads, tag-based organization, and recipe scaling.

## Features

- Add and manage cocktail and SLUSHi recipes with images
- Browse recipes in a clean gallery view
- Search by name and ingredients
- Filter by type (Cocktail/SLUSHi) and tags
- Mark recipes as favourites
- SLUSHi recipe scaling (475ml - 1890ml)
- GPT Actions API endpoint for external recipe creation

## Setup

### Running the App

The app is configured to run with `npm run dev`. It starts on port 5000.

### Environment Variables

Set these environment variables for configuration:

| Variable | Description | Default |
|----------|-------------|---------|
| `APP_PASSWORD` | Password for accessing the app | `cocktails123` |
| `API_KEY` | API key for GPT Actions endpoint | `recipe-api-key-123` |
| `SESSION_SECRET` | Secret for session encryption | Auto-generated |
| `DATABASE_URL` | PostgreSQL connection string | Provided by Replit |

### Accessing the App

1. Open the app in your browser
2. Enter the password (default: `cocktails123`)
3. Start adding recipes!

### Image Storage

Uploaded images are stored in the `/uploads` directory and served at `/uploads/<filename>`.

## Custom GPT Integration

This section contains everything you need to configure a Custom GPT Action.

### Quick Reference (Copy These Values)

| Setting | Value |
|---------|-------|
| **Base URL** | Your deployed Replit app URL (e.g., `https://your-app.replit.app`) |
| **Endpoint Path** | `/api/gpt/recipes` |
| **HTTP Method** | `POST` |
| **Auth Header** | `X-API-Key` |
| **Auth Type** | API Key (in header) |
| **Environment Variable** | `API_KEY` |
| **OpenAPI Schema URL** | `/api/openapi.json` |

### Step-by-Step Setup

1. **Get your Base URL**: After publishing, your app URL will be `https://your-app-name.replit.app`
2. **Get the OpenAPI Schema**: Visit `https://your-app-url/api/openapi.json` and copy the full JSON
3. **In ChatGPT**: Create a new GPT, go to "Configure" > "Actions" > "Create new action"
4. **Paste the Schema**: Paste the OpenAPI JSON into the schema field
5. **Set Authentication**: Choose "API Key", set header name to `X-API-Key`, and enter your API key value

### Authentication

Include your API key in the request header:
```
X-API-Key: <your-api-key-value>
```

The API key is stored in the `API_KEY` environment variable (set in Replit Secrets).

### Example Payload (Cocktail)

```json
{
  "name": "Classic Mojito",
  "type": "cocktail",
  "tags": ["rum", "refreshing", "summer"],
  "ingredients": [
    { "text": "50 ml white rum" },
    { "text": "25 ml fresh lime juice" },
    { "text": "20 ml simple syrup" },
    { "text": "6-8 fresh mint leaves" },
    { "text": "Top with soda water" }
  ],
  "method": [
    "Muddle mint leaves gently in a glass",
    "Add rum, lime juice, and simple syrup",
    "Fill with ice and top with soda water",
    "Stir gently and garnish with mint"
  ],
  "notes": "Use fresh mint for best results"
}
```

### Example Payload (SLUSHi)

```json
{
  "name": "Frozen Margarita",
  "type": "slushi",
  "tags": ["tequila", "frozen", "citrus"],
  "ingredients": [
    { "name": "Tequila blanco", "amount_ml": 200 },
    { "name": "Triple sec", "amount_ml": 100 },
    { "name": "Fresh lime juice", "amount_ml": 150 },
    { "name": "Simple syrup", "amount_ml": 100 },
    { "name": "Water", "amount_ml": 400 }
  ],
  "method": [
    "Combine all ingredients in the Ninja SLUSHi",
    "Run the slush cycle",
    "Serve immediately with lime wedge"
  ],
  "mode": "Frozen Cocktail",
  "notes": "Total volume: 950ml. Adjust water for consistency."
}
```

### SLUSHi Constraints

- Minimum batch volume: 475ml
- Maximum batch volume: 1890ml
- Only liquid ingredients with amounts in ml

### Example cURL Request

```bash
curl -X POST https://your-app.replit.app/api/gpt/recipes \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "name": "Test Cocktail",
    "type": "cocktail",
    "tags": ["test"],
    "ingredients": [{"text": "50 ml vodka"}],
    "method": ["Stir and serve"]
  }'
```

### OpenAPI Schema

Access the OpenAPI schema at `/api/openapi.json` for use in GPT Actions configuration. The schema automatically includes the correct server URL based on your deployment.

## SLUSHi Scaling

On any SLUSHi recipe detail page, use the scaling panel to:
1. Set a target volume (475ml - 1890ml)
2. View automatically calculated scaled ingredient amounts
3. See the scale factor applied

The original recipe amounts are preserved alongside the scaled values.

## Tech Stack

- Frontend: React, TypeScript, TailwindCSS, shadcn/ui
- Backend: Express.js, Node.js
- Database: PostgreSQL with Drizzle ORM
- File Storage: Local filesystem (uploads directory)
