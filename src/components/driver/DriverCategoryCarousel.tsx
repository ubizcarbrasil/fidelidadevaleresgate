import { LayoutGrid } from "lucide-react";
import { LucideIcon, type DealCategory } from "./DriverMarketplace";

interface Props {
  categories: DealCategory[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export default function DriverCategoryCarousel({ categories, selectedId, onSelect }: Props) {
  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pt-4 pb-1">
      {/* "Todos" button */}
      <button
        onClick={() => onSelect(null)}
        className="flex flex-col items-center gap-1.5 flex-shrink-0"
      >
        <div
          className="h-14 w-14 rounded-full flex items-center justify-center transition-all"
          style={{
            backgroundColor: selectedId === null ? "hsl(var(--primary))" : "hsl(var(--muted))",
          }}
        >
          <LayoutGrid
            className="h-6 w-6"
            style={{ color: selectedId === null ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))" }}
          />
        </div>
        <span className="text-[10px] font-medium text-foreground max-w-[56px] text-center truncate">
          Todos
        </span>
      </button>

      {categories.map(cat => {
        const isSelected = selectedId === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0"
          >
            <div
              className="h-14 w-14 rounded-full flex items-center justify-center transition-all"
              style={{
                backgroundColor: isSelected ? cat.color : `${cat.color}20`,
                boxShadow: isSelected ? `0 4px 12px ${cat.color}40` : "none",
              }}
            >
              <LucideIcon
                name={cat.icon_name}
                className="h-6 w-6"
                style={{ color: isSelected ? "#fff" : cat.color }}
              />
            </div>
            <span className="text-[10px] font-medium text-foreground max-w-[56px] text-center truncate">
              {cat.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
