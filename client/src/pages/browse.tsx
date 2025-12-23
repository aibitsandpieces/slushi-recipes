import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { FilterBar } from "@/components/filter-bar";
import { RecipeCard } from "@/components/recipe-card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { RecipeWithTags, Tag, RecipeType } from "@shared/schema";
import { Wine, Snowflake } from "lucide-react";

export default function BrowsePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<RecipeType | "all">("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFavourites, setShowFavourites] = useState(false);

  const { data: recipes = [], isLoading: recipesLoading } = useQuery<RecipeWithTags[]>({
    queryKey: ["/api/recipes"],
  });

  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ["/api/tags"],
  });

  const toggleFavouriteMutation = useMutation({
    mutationFn: async ({ id, favourite }: { id: string; favourite: boolean }) => {
      await apiRequest("PATCH", `/api/recipes/${id}`, { favourite });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
    },
  });

  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      if (typeFilter !== "all" && recipe.type !== typeFilter) return false;
      
      if (showFavourites && !recipe.favourite) return false;
      
      if (selectedTags.length > 0) {
        const recipeTagNames = recipe.tags.map((t) => t.name);
        if (!selectedTags.every((tag) => recipeTagNames.includes(tag))) return false;
      }
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = recipe.name.toLowerCase().includes(query);
        const ingredientMatch = JSON.stringify(recipe.ingredients).toLowerCase().includes(query);
        if (!nameMatch && !ingredientMatch) return false;
      }
      
      return true;
    });
  }, [recipes, typeFilter, showFavourites, selectedTags, searchQuery]);

  function handleTagToggle(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function handleTagClick(tag: string) {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([tag]);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        <FilterBar
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          selectedTags={selectedTags}
          onTagToggle={handleTagToggle}
          allTags={tags}
          showFavourites={showFavourites}
          onFavouritesToggle={() => setShowFavourites(!showFavourites)}
        />
        
        {recipesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex items-center gap-2 mb-4">
              <Wine className="h-12 w-12 text-muted-foreground/40" />
              <Snowflake className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-medium mb-2" data-testid="text-no-recipes">
              {recipes.length === 0 ? "No recipes yet" : "No recipes match your filters"}
            </h3>
            <p className="text-muted-foreground text-sm max-w-md">
              {recipes.length === 0
                ? "Get started by adding your first cocktail or SLUSHi recipe!"
                : "Try adjusting your search or filters to find what you're looking for."}
            </p>
          </div>
        ) : (
          <div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            data-testid="grid-recipes"
          >
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onToggleFavourite={(id, favourite) =>
                  toggleFavouriteMutation.mutate({ id, favourite })
                }
                onTagClick={handleTagClick}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
