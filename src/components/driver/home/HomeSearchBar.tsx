import { Search } from "lucide-react";

interface Props {
  onActivate: () => void;
}

export default function HomeSearchBar({ onActivate }: Props) {
  return (
    <div className="px-4 pb-2">
      <button
        onClick={onActivate}
        className="w-full flex items-center gap-3 rounded-xl px-4 py-2.5 text-left transition-shadow bg-muted"
      >
        <Search className="h-[18px] w-[18px] flex-shrink-0 text-foreground/50" />
        <span className="text-sm text-foreground/50">O que está procurando?</span>
      </button>
    </div>
  );
}
