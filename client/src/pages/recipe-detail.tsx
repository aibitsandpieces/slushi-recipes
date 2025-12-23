import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Heart, Edit, Trash2, Wine, Snowflake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SlushiScalingPanel } from "@/components/slushi-scaling-panel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { RecipeWithTags, SlushiIngredient, CocktailIngredient } from "@shared/schema";

export default function RecipeDetailPage() {
  const [, params] = useRoute("/recipe/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: recipe, isLoading } = useQuery<RecipeWithTags>({
    queryKey: ["/api/recipes", params?.id],
    enabled: !!params?.id,
  });

  const toggleFavouriteMutation = useMutation({
    mutationFn: async () => {
      if (!recipe) return;
      await apiRequest("PATCH", `/api/recipes/${recipe.id}`, { favourite: !recipe.favourite });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes", params?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!recipe) return;
      await apiRequest("DELETE", `/api/recipes/${recipe.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({ title: "Recipe deleted", description: "The recipe has been removed." });
      setLocation("/");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete recipe.", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Skeleton className="h-10 w-32 mb-6" />
          <Skeleton className="w-full h-96 rounded-lg mb-6" />
          <Skeleton className="h-8 w-2/3 mb-4" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Recipe not found</h2>
          <Button onClick={() => setLocation("/")} data-testid="button-back-home">
            Go back to recipes
          </Button>
        </div>
      </div>
    );
  }

  const TypeIcon = recipe.type === "slushi" ? Snowflake : Wine;
  const isSlushi = recipe.type === "slushi";
  const slushiIngredients = isSlushi ? (recipe.ingredients as SlushiIngredient[]) : [];
  const cocktailIngredients = !isSlushi ? (recipe.ingredients as CocktailIngredient[]) : [];
  const baseVolume = isSlushi
    ? recipe.baseVolumeMl || slushiIngredients.reduce((sum, i) => sum + i.amount_ml, 0)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleFavouriteMutation.mutate()}
              data-testid="button-favourite"
            >
              <Heart
                className={`h-5 w-5 ${recipe.favourite ? "fill-destructive text-destructive" : ""}`}
              />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation(`/edit/${recipe.id}`)}
              data-testid="button-edit"
            >
              <Edit className="h-5 w-5" />
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-delete">
                  <Trash2 className="h-5 w-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{recipe.name}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate()}
                    data-testid="button-confirm-delete"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        
        <div className="relative rounded-lg overflow-hidden mb-6 max-h-96">
          {recipe.imagePath ? (
            <>
              <img
                src={recipe.imagePath}
                alt={recipe.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <TypeIcon className="h-3 w-3" />
                    <span className="capitalize">{recipe.type}</span>
                  </Badge>
                  {recipe.mode && (
                    <Badge variant="outline" className="bg-background/50">
                      {recipe.mode}
                    </Badge>
                  )}
                </div>
                <h1
                  className="text-3xl font-bold text-white"
                  data-testid="text-recipe-name"
                >
                  {recipe.name}
                </h1>
              </div>
            </>
          ) : (
            <div className="w-full h-64 bg-muted flex items-center justify-center">
              <TypeIcon className="h-24 w-24 text-muted-foreground/40" />
            </div>
          )}
        </div>
        
        {!recipe.imagePath && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <TypeIcon className="h-3 w-3" />
                <span className="capitalize">{recipe.type}</span>
              </Badge>
              {recipe.mode && <Badge variant="outline">{recipe.mode}</Badge>}
            </div>
            <h1
              className="text-3xl font-bold"
              data-testid="text-recipe-name"
            >
              {recipe.name}
            </h1>
          </div>
        )}
        
        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {recipe.tags.map((tag) => (
              <Badge key={tag.id} variant="outline" data-testid={`badge-tag-${tag.id}`}>
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
        
        <div className={`grid gap-8 ${isSlushi ? "lg:grid-cols-3" : "lg:grid-cols-3"}`}>
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ingredients</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {isSlushi
                    ? slushiIngredients.map((ing, idx) => (
                        <li
                          key={idx}
                          className="flex items-center justify-between py-2 border-b last:border-0"
                          data-testid={`text-ingredient-${idx}`}
                        >
                          <span>{ing.name}</span>
                          <Badge variant="outline" className="font-mono">
                            {ing.amount_ml}ml
                          </Badge>
                        </li>
                      ))
                    : cocktailIngredients.map((ing, idx) => (
                        <li
                          key={idx}
                          className="py-2 border-b last:border-0"
                          data-testid={`text-ingredient-${idx}`}
                        >
                          {ing.text}
                        </li>
                      ))}
                </ul>
                {isSlushi && (
                  <div className="flex items-center justify-between pt-4 mt-4 border-t font-medium">
                    <span>Base Volume</span>
                    <Badge className="font-mono" data-testid="text-base-volume">
                      {baseVolume}ml
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Method</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-4">
                  {recipe.method.map((step, idx) => (
                    <li key={idx} className="flex gap-4" data-testid={`text-step-${idx}`}>
                      <div className="shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                        {idx + 1}
                      </div>
                      <p className="pt-1">{step}</p>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
            
            {recipe.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground" data-testid="text-notes">
                    {recipe.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        {isSlushi && baseVolume > 0 && (
          <div className="mt-8">
            <SlushiScalingPanel
              baseVolumeMl={baseVolume}
              ingredients={slushiIngredients}
            />
          </div>
        )}
      </div>
    </div>
  );
}
