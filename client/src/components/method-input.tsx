import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface MethodInputProps {
  steps: string[];
  onChange: (steps: string[]) => void;
}

export function MethodInput({ steps, onChange }: MethodInputProps) {
  function addStep() {
    onChange([...steps, ""]);
  }

  function updateStep(index: number, value: string) {
    const updated = [...steps];
    updated[index] = value;
    onChange(updated);
  }

  function removeStep(index: number) {
    onChange(steps.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      <Label>Method Steps</Label>
      
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={index} className="flex gap-2" data-testid={`row-step-${index}`}>
            <div className="flex items-start gap-2 shrink-0 pt-2">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                {index + 1}
              </div>
            </div>
            <Textarea
              value={step}
              onChange={(e) => updateStep(index, e.target.value)}
              placeholder={`Step ${index + 1}...`}
              rows={2}
              className="flex-1"
              data-testid={`textarea-step-${index}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeStep(index)}
              className="shrink-0"
              data-testid={`button-remove-step-${index}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      
      <Button
        type="button"
        variant="outline"
        onClick={addStep}
        className="w-full"
        data-testid="button-add-step"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Step
      </Button>
    </div>
  );
}
