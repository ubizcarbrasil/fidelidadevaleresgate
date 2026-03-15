import { useEffect } from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FontOption {
  name: string;
  category: string;
}

const GOOGLE_FONTS: { category: string; fonts: string[] }[] = [
  {
    category: "Sans-serif",
    fonts: [
      "Inter", "Poppins", "Montserrat", "Open Sans", "Roboto", "Lato",
      "Nunito", "Raleway", "Work Sans", "DM Sans", "Plus Jakarta Sans", "Outfit",
    ],
  },
  {
    category: "Serif",
    fonts: [
      "Playfair Display", "Merriweather", "Lora", "PT Serif", "Crimson Text", "Libre Baskerville",
    ],
  },
  {
    category: "Display",
    fonts: ["Bebas Neue", "Oswald", "Anton", "Righteous", "Pacifico"],
  },
  {
    category: "Monospace",
    fonts: ["JetBrains Mono", "Fira Code", "Space Mono"],
  },
];

function loadGoogleFont(fontName: string) {
  const id = `gfont-${fontName.replace(/\s+/g, "-")}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

// Preload all fonts for preview in select
const allFontNames = GOOGLE_FONTS.flatMap((g) => g.fonts);

interface FontSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function FontSelect({ value, onChange, placeholder }: FontSelectProps) {
  // Preload fonts on mount
  useEffect(() => {
    allFontNames.forEach(loadGoogleFont);
  }, []);

  return (
    <Select value={value || ""} onValueChange={(v) => onChange(v === "__none__" ? "" : v)}>
      <SelectTrigger className="h-9 text-xs">
        <SelectValue placeholder={placeholder || "Selecionar fonte"}>
          {value ? (
            <span style={{ fontFamily: `"${value}", sans-serif` }}>{value}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder || "Selecionar fonte"}</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-72">
        <SelectItem value="__none__" className="text-xs text-muted-foreground">
          Padrão do sistema
        </SelectItem>
        {GOOGLE_FONTS.map((group) => (
          <SelectGroup key={group.category}>
            <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {group.category}
            </SelectLabel>
            {group.fonts.map((font) => (
              <SelectItem key={font} value={font} className="text-xs">
                <span style={{ fontFamily: `"${font}", sans-serif` }}>{font}</span>
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
