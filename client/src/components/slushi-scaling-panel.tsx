import { useState, useMemo } from "react";
import { Snowflake, Scale, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SLUSHI_MIN_VOLUME, SLUSHI_MAX_VOLUME, type SlushiIngredient } from "@shared/schema";

interface SlushiScalingPanelProps {
  baseVolumeMl: number;
  ingredients: SlushiIngredient[];
}

export function SlushiScalingPanel({ baseVolumeMl, ingredients }: SlushiScalingPanelProps) {
  const [targetVolume, setTargetVolume] = useState(baseVolumeMl);

  const scaleFactor = useMemo(() => {
    return targetVolume / baseVolumeMl;
  }, [targetVolume, baseVolumeMl]);

  const scaledIngredients = useMemo(() => {
    return ingredients.map((ing) => ({
      ...ing,
      scaledAmount: Math.round(ing.amount_ml * scaleFactor),
    }));
  }, [ingredients, scaleFactor]);

  function handleVolumeChange(value: number) {
    const clamped = Math.max(SLUSHI_MIN_VOLUME, Math.min(SLUSHI_MAX_VOLUME, value));
    setTargetVolume(clamped);
  }

  return (
    <Card className="lg:sticky lg:top-24" data-testid="panel-slushi-scaling">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Scale className="h-5 w-5 text-primary" />
          Scale Recipe
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="target-volume" className="text-sm font-medium">
            Target Volume (ml)
          </Label>
          <Input
            id="target-volume"
            type="number"
            min={SLUSHI_MIN_VOLUME}
            max={SLUSHI_MAX_VOLUME}
            value={targetVolume}
            onChange={(e) => handleVolumeChange(parseInt(e.target.value) || SLUSHI_MIN_VOLUME)}
            className="text-center font-mono text-lg"
            data-testid="input-target-volume"
          />
          <Slider
            value={[targetVolume]}
            onValueChange={([val]) => handleVolumeChange(val)}
            min={SLUSHI_MIN_VOLUME}
            max={SLUSHI_MAX_VOLUME}
            step={5}
            data-testid="slider-target-volume"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{SLUSHI_MIN_VOLUME}ml</span>
            <span>{SLUSHI_MAX_VOLUME}ml</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">Scale Factor</span>
          <Badge variant="secondary" className="font-mono" data-testid="text-scale-factor">
            {scaleFactor.toFixed(2)}x
          </Badge>
        </div>
        
        <div className="space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Snowflake className="h-4 w-4 text-primary" />
            Scaled Ingredients
          </h4>
          <div className="space-y-2">
            {scaledIngredients.map((ing, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between py-2 border-b last:border-0"
                data-testid={`row-scaled-ingredient-${idx}`}
              >
                <span className="text-sm">{ing.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground line-through">
                    {ing.amount_ml}ml
                  </span>
                  <Badge variant="outline" className="font-mono">
                    {ing.scaledAmount}ml
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-2 border-t font-medium">
            <span>Total</span>
            <Badge className="font-mono" data-testid="text-scaled-total">
              {targetVolume}ml
            </Badge>
          </div>
        </div>
        
        <div className="flex items-start gap-2 p-3 bg-accent/50 rounded-lg text-xs text-muted-foreground">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            For best results, ensure your recipe has sufficient sugar content for proper slushing.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
