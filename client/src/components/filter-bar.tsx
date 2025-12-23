import { X, Heart, Wine, Snowflake, Grid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { Tag, RecipeType } from "@shared/schema";

interface FilterBarProps {
  typeFilter: RecipeType | "all";
  onTypeFilterChange: (type: RecipeType | "all") => void;
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  allTags: Tag[];
  showFavourites: boolean;
  onFavouritesToggle: () => void;
}

export function FilterBar({
  typeFilter,
  onTypeFilterChange,
  selectedTags,
  onTagToggle,
  allTags,
  showFavourites,
  onFavouritesToggle,
}: FilterBarProps) {
  const typeButtons: { value: RecipeType | "all"; label: string; icon: typeof Grid }[] = [
    { value: "all", label: "All", icon: Grid },
    { value: "cocktail", label: "Cocktails", icon: Wine },
    { value: "slushi", label: "SLUSHi", icon: Snowflake },
  ];

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border p-1 gap-1">
          {typeButtons.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant={typeFilter === value ? "default" : "ghost"}
              size="sm"
              onClick={() => onTypeFilterChange(value)}
              className="gap-1"
              data-testid={`button-filter-${value}`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </Button>
          ))}
        </div>
        
        <Button
          variant={showFavourites ? "default" : "outline"}
          size="sm"
          onClick={onFavouritesToggle}
          className="gap-1"
          data-testid="button-filter-favourites"
        >
          <Heart className={`h-4 w-4 ${showFavourites ? "fill-current" : ""}`} />
          <span className="hidden sm:inline">Favourites</span>
        </Button>
      </div>
      
      {allTags.length > 0 && (
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            {allTags.map((tag) => {
              const isSelected = selectedTags.includes(tag.name);
              return (
                <Badge
                  key={tag.id}
                  variant={isSelected ? "default" : "outline"}
                  className="cursor-pointer shrink-0 text-sm py-1 px-3"
                  onClick={() => onTagToggle(tag.name)}
                  data-testid={`badge-filter-tag-${tag.id}`}
                >
                  {tag.name}
                  {isSelected && <X className="h-3 w-3 ml-1" />}
                </Badge>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
      
      {selectedTags.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => selectedTags.forEach(onTagToggle)}
            data-testid="button-clear-filters"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
