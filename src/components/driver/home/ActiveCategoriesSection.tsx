import React from "react";
import { LucideIcon } from "@/components/driver/DriverMarketplace";

interface Category {
  id: string;
  name: string;
  icon_name: string;
  color: string;
}

interface Props {
  categories: Category[];
  fontHeading?: string;
  onSelectCategory: (cat: Category) => void;
}

export default function ActiveCategoriesSection({ categories, fontHeading, onSelectCategory }: Props) {
  if (!categories.length) return null;

  return (
    <section className="px-4">
      <h2 className="text-base font-bold text-foreground mb-3" style={{ fontFamily: fontHeading }}>
        Categorias
      </h2>
      <div
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-1"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 transition-transform active:scale-95"
            style={{ scrollSnapAlign: "start", minWidth: 68 }}
          >
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: `${cat.color}18` }}
            >
              <LucideIcon name={cat.icon_name} className="h-6 w-6" style={{ color: cat.color }} />
            </div>
            <span className="text-[10px] font-medium text-foreground/80 text-center leading-tight line-clamp-2 max-w-[68px]">
              {cat.name}
            </span>
          </button>
        ))}
        <div className="min-w-[8px] flex-shrink-0" />
      </div>
    </section>
  );
}
