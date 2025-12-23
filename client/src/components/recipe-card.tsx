import { Link } from "wouter";
import { Heart, Wine, Snowflake } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RecipeWithTags } from "@shared/schema";

interface RecipeCardProps {
  recipe: RecipeWithTags;
  onToggleFavourite: (id: string, favourite: boolean) => void;
  onTagClick: (tag: string) => void;
}

export function RecipeCard({ recipe, onToggleFavourite, onTagClick }: RecipeCardProps) {
  const TypeIcon = recipe.type === "slushi" ? Snowflake : Wine;

  return (
    <Card 
      className="overflow-hidden group hover-elevate transition-transform duration-200"
      data-testid={`card-recipe-${recipe.id}`}
    >
      <Link href={`/recipe/${recipe.id}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          {recipe.imagePath ? (
            <img
              src={recipe.imagePath}
              alt={recipe.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <TypeIcon className="h-16 w-16 text-muted-foreground/40" />
            </div>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavourite(recipe.id, !recipe.favourite);
            }}
            data-testid={`button-favourite-${recipe.id}`}
          >
            <Heart 
              className={`h-5 w-5 ${recipe.favourite ? "fill-destructive text-destructive" : "text-muted-foreground"}`} 
            />
          </Button>
          
          <Badge 
            variant="secondary"
            className="absolute top-2 left-2 flex items-center gap-1 bg-background/80 backdrop-blur-sm"
          >
            <TypeIcon className="h-3 w-3" />
            <span className="capitalize">{recipe.type}</span>
          </Badge>
        </div>
      </Link>
      
      <CardContent className="p-4">
        <Link href={`/recipe/${recipe.id}`}>
          <h3 
            className="font-semibold text-lg line-clamp-1 hover:text-primary transition-colors"
            data-testid={`text-recipe-name-${recipe.id}`}
          >
            {recipe.name}
          </h3>
        </Link>
        
        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {recipe.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="text-xs cursor-pointer"
                onClick={() => onTagClick(tag.name)}
                data-testid={`badge-tag-${tag.id}`}
              >
                {tag.name}
              </Badge>
            ))}
            {recipe.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{recipe.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
