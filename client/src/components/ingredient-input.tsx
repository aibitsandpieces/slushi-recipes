import { useRef, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { CocktailIngredient, SlushiIngredient, RecipeType } from "@shared/schema";
import { SLUSHI_MIN_VOLUME, SLUSHI_MAX_VOLUME } from "@shared/schema";

interface CocktailIngredientInputProps {
  type: "cocktail";
  ingredients: CocktailIngredient[];
  onChange: (ingredients: CocktailIngredient[]) => void;
}

interface SlushiIngredientInputProps {
  type: "slushi";
  ingredients: SlushiIngredient[];
  onChange: (ingredients: SlushiIngredient[]) => void;
}

type IngredientInputProps = CocktailIngredientInputProps | SlushiIngredientInputProps;

export function IngredientInput(props: IngredientInputProps) {
  if (props.type === "cocktail") {
    return <CocktailIngredients {...props} />;
  }
  return <SlushiIngredients {...props} />;
}

function CocktailIngredients({ ingredients, onChange }: CocktailIngredientInputProps) {
  const text = ingredients.map((i) => i.text).join("\n");

  function handleChange(value: string) {
    const lines = value.split("\n").filter((line) => line.trim());
    onChange(lines.map((text) => ({ text: text.trim() })));
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="cocktail-ingredients">Ingredients (one per line)</Label>
      <Textarea
        id="cocktail-ingredients"
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="50 ml gin&#10;25 ml lime juice&#10;20 ml simple syrup&#10;Top with soda"
        rows={6}
        data-testid="textarea-cocktail-ingredients"
      />
      <p className="text-xs text-muted-foreground">
        Enter each ingredient on a new line. Use flexible format (e.g., "1 dash bitters", "top up soda").
      </p>
    </div>
  );
}

function SlushiIngredients({ ingredients, onChange }: SlushiIngredientInputProps) {
  const totalVolume = ingredients.reduce((sum, ing) => sum + (ing.amount_ml || 0), 0);
  const isValidVolume = totalVolume >= SLUSHI_MIN_VOLUME && totalVolume <= SLUSHI_MAX_VOLUME;
  const [focusNewInput, setFocusNewInput] = useState(false);
  const lastInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusNewInput && lastInputRef.current) {
      lastInputRef.current.focus();
      setFocusNewInput(false);
    }
  }, [focusNewInput, ingredients.length]);

  function addIngredient() {
    onChange([...ingredients, { name: "", amount_ml: 0 }]);
    setFocusNewInput(true);
  }

  function updateIngredient(index: number, field: keyof SlushiIngredient, value: string | number) {
    const updated = [...ingredients];
    updated[index] = { 
      ...updated[index], 
      [field]: field === "amount_ml" ? parseInt(value as string) || 0 : value 
    };
    onChange(updated);
  }

  function removeIngredient(index: number) {
    onChange(ingredients.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Ingredients (liquid only)</Label>
        <Badge 
          variant={isValidVolume ? "default" : "destructive"}
          data-testid="badge-total-volume"
        >
          Total: {totalVolume}ml
        </Badge>
      </div>
      
      {!isValidVolume && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg" data-testid="text-volume-error">
          SLUSHi recipes must have a total volume between {SLUSHI_MIN_VOLUME}ml and {SLUSHI_MAX_VOLUME}ml
        </div>
      )}
      
      <div className="space-y-2">
        {ingredients.map((ing, index) => (
          <div key={index} className="flex items-center gap-2" data-testid={`row-ingredient-${index}`}>
            <Input
              ref={index === ingredients.length - 1 ? lastInputRef : undefined}
              value={ing.name}
              onChange={(e) => updateIngredient(index, "name", e.target.value)}
              placeholder="Ingredient name"
              className="flex-1"
              data-testid={`input-ingredient-name-${index}`}
            />
            <div className="flex items-center gap-1 w-32">
              <Input
                type="number"
                value={ing.amount_ml || ""}
                onChange={(e) => updateIngredient(index, "amount_ml", e.target.value)}
                placeholder="ml"
                min={1}
                className="text-right"
                data-testid={`input-ingredient-amount-${index}`}
              />
              <span className="text-sm text-muted-foreground">ml</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeIngredient(index)}
              data-testid={`button-remove-ingredient-${index}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      
      <Button
        type="button"
        variant="outline"
        onClick={addIngredient}
        className="w-full"
        data-testid="button-add-ingredient"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Ingredient
      </Button>
      
      <p className="text-xs text-muted-foreground">
        Only liquid ingredients with volume in ml. Do not include ice or solid ingredients.
      </p>
    </div>
  );
}
