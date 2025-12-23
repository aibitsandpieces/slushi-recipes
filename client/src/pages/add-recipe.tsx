import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Wine, Snowflake, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TagInput } from "@/components/tag-input";
import { IngredientInput } from "@/components/ingredient-input";
import { MethodInput } from "@/components/method-input";
import { ImageUpload } from "@/components/image-upload";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SLUSHI_MIN_VOLUME, SLUSHI_MAX_VOLUME } from "@shared/schema";
import type { RecipeWithTags, Tag, RecipeType, CocktailIngredient, SlushiIngredient } from "@shared/schema";

export default function AddRecipePage() {
  const [, setLocation] = useLocation();
  const [, editParams] = useRoute("/edit/:id");
  const isEditing = !!editParams?.id;
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [type, setType] = useState<RecipeType>("cocktail");
  const [tags, setTags] = useState<string[]>([]);
  const [cocktailIngredients, setCocktailIngredients] = useState<CocktailIngredient[]>([]);
  const [slushiIngredients, setSlushiIngredients] = useState<SlushiIngredient[]>([{ name: "", amount_ml: 0 }]);
  const [method, setMethod] = useState<string[]>([""]);
  const [notes, setNotes] = useState("");
  const [mode, setMode] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImagePath, setExistingImagePath] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: allTags = [] } = useQuery<Tag[]>({
    queryKey: ["/api/tags"],
  });

  const { data: existingRecipe } = useQuery<RecipeWithTags>({
    queryKey: ["/api/recipes", editParams?.id],
    enabled: isEditing,
  });

  useEffect(() => {
    if (existingRecipe) {
      setName(existingRecipe.name);
      setType(existingRecipe.type);
      setTags(existingRecipe.tags.map((t) => t.name));
      setMethod(existingRecipe.method);
      setNotes(existingRecipe.notes || "");
      setMode(existingRecipe.mode || "");
      setExistingImagePath(existingRecipe.imagePath);
      
      if (existingRecipe.type === "cocktail") {
        setCocktailIngredients(existingRecipe.ingredients as CocktailIngredient[]);
      } else {
        setSlushiIngredients(existingRecipe.ingredients as SlushiIngredient[]);
      }
    }
  }, [existingRecipe]);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setImagePreview(null);
  }, [imageFile]);

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(isEditing ? `/api/recipes/${editParams?.id}` : "/api/recipes", {
        method: isEditing ? "PUT" : "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
      toast({
        title: isEditing ? "Recipe updated" : "Recipe created",
        description: `${name} has been ${isEditing ? "updated" : "added"} to your library.`,
      });
      setLocation(`/recipe/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save recipe.",
        variant: "destructive",
      });
    },
  });

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = "Recipe name is required";
    }
    
    if (type === "cocktail") {
      const validIngredients = cocktailIngredients.filter((i) => i.text.trim());
      if (validIngredients.length === 0) {
        newErrors.ingredients = "At least one ingredient is required";
      }
    } else {
      const validIngredients = slushiIngredients.filter((i) => i.name.trim() && i.amount_ml > 0);
      if (validIngredients.length === 0) {
        newErrors.ingredients = "At least one ingredient with amount is required";
      } else {
        const totalVolume = validIngredients.reduce((sum, i) => sum + i.amount_ml, 0);
        if (totalVolume < SLUSHI_MIN_VOLUME || totalVolume > SLUSHI_MAX_VOLUME) {
          newErrors.ingredients = `Total volume must be between ${SLUSHI_MIN_VOLUME}ml and ${SLUSHI_MAX_VOLUME}ml (current: ${totalVolume}ml)`;
        }
      }
    }
    
    const validSteps = method.filter((s) => s.trim());
    if (validSteps.length === 0) {
      newErrors.method = "At least one method step is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validate()) return;
    
    const formData = new FormData();
    formData.append("name", name);
    formData.append("type", type);
    formData.append("tags", JSON.stringify(tags));
    formData.append("method", JSON.stringify(method.filter((s) => s.trim())));
    formData.append("notes", notes);
    
    if (type === "cocktail") {
      formData.append("ingredients", JSON.stringify(cocktailIngredients.filter((i) => i.text.trim())));
    } else {
      const validIngredients = slushiIngredients.filter((i) => i.name.trim() && i.amount_ml > 0);
      formData.append("ingredients", JSON.stringify(validIngredients));
      formData.append("baseVolumeMl", String(validIngredients.reduce((sum, i) => sum + i.amount_ml, 0)));
      if (mode) formData.append("mode", mode);
    }
    
    if (imageFile) {
      formData.append("image", imageFile);
    } else if (existingImagePath) {
      formData.append("existingImagePath", existingImagePath);
    }
    
    createMutation.mutate(formData);
  }

  const typeButtons = [
    { value: "cocktail" as RecipeType, label: "Cocktail", icon: Wine },
    { value: "slushi" as RecipeType, label: "SLUSHi", icon: Snowflake },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {isEditing ? "Edit Recipe" : "Add New Recipe"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <Label htmlFor="name">Recipe Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Frozen Margarita"
                  data-testid="input-recipe-name"
                />
                {errors.name && (
                  <p className="text-sm text-destructive" data-testid="error-name">
                    {errors.name}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Recipe Type</Label>
                <div className="flex rounded-lg border p-1 gap-1 w-fit">
                  {typeButtons.map(({ value, label, icon: Icon }) => (
                    <Button
                      key={value}
                      type="button"
                      variant={type === value ? "default" : "ghost"}
                      onClick={() => setType(value)}
                      className="gap-2"
                      data-testid={`button-type-${value}`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Image</Label>
                <ImageUpload
                  currentImage={existingImagePath}
                  previewUrl={imagePreview}
                  onImageSelect={setImageFile}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Tags</Label>
                <TagInput
                  tags={tags}
                  onTagsChange={setTags}
                  suggestions={allTags.map((t) => t.name)}
                />
              </div>
              
              <div className="space-y-2">
                {type === "cocktail" ? (
                  <IngredientInput
                    type="cocktail"
                    ingredients={cocktailIngredients}
                    onChange={setCocktailIngredients}
                  />
                ) : (
                  <IngredientInput
                    type="slushi"
                    ingredients={slushiIngredients}
                    onChange={setSlushiIngredients}
                  />
                )}
                {errors.ingredients && (
                  <p className="text-sm text-destructive" data-testid="error-ingredients">
                    {errors.ingredients}
                  </p>
                )}
              </div>
              
              {type === "slushi" && (
                <div className="space-y-2">
                  <Label htmlFor="mode">Mode (optional)</Label>
                  <Select value={mode} onValueChange={setMode}>
                    <SelectTrigger data-testid="select-mode">
                      <SelectValue placeholder="Select a mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slush">Slush</SelectItem>
                      <SelectItem value="spiked-slush">Spiked Slush / Frozen Cocktail</SelectItem>
                      <SelectItem value="frappe">Frappe</SelectItem>
                      <SelectItem value="milkshake">Milkshake</SelectItem>
                      <SelectItem value="frozen-juice">Frozen Juice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <MethodInput steps={method} onChange={setMethod} />
                {errors.method && (
                  <p className="text-sm text-destructive" data-testid="error-method">
                    {errors.method}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional tips or variations..."
                  rows={3}
                  data-testid="textarea-notes"
                />
              </div>
              
              <Button
                type="submit"
                className="w-full"
                disabled={createMutation.isPending}
                data-testid="button-submit"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : isEditing ? (
                  "Update Recipe"
                ) : (
                  "Add Recipe"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
