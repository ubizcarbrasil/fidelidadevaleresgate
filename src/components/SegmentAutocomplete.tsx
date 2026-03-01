import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Check, X } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

interface MatchResult {
  segment_id: string;
  segment_name: string;
  category_id: string;
  score: number;
  match_method: string;
  matched_term: string;
}

interface SegmentAutocompleteProps {
  value: string | null; // taxonomy_segment_id
  segmentName?: string; // display name (for initial render)
  onSelect: (segmentId: string | null, segmentName: string) => void;
  storeId?: string;
  placeholder?: string;
  className?: string;
}

export default function SegmentAutocomplete({
  value,
  segmentName = "",
  onSelect,
  storeId,
  placeholder = "Digite o segmento... Ex: Pizzaria",
  className,
}: SegmentAutocompleteProps) {
  const [query, setQuery] = useState(segmentName);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedName, setSelectedName] = useState(segmentName);
  const debouncedQuery = useDebounce(query, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch matches when query changes
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2 || debouncedQuery === selectedName) {
      setMatches([]);
      return;
    }

    const fetchMatches = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("match-taxonomy", {
          body: { query: debouncedQuery, limit: 6, store_id: storeId, log: false },
        });
        if (error) throw error;
        setMatches(data?.matches || []);
        setOpen(true);
      } catch (err) {
        console.error("match-taxonomy error:", err);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [debouncedQuery, storeId, selectedName]);

  const handleSelect = (match: MatchResult) => {
    setQuery(match.segment_name);
    setSelectedName(match.segment_name);
    onSelect(match.segment_id, match.segment_name);
    setOpen(false);
    setMatches([]);

    // Log accepted match
    supabase.functions.invoke("match-taxonomy", {
      body: { query: query, limit: 1, store_id: storeId, log: true },
    }).catch(() => {});
  };

  const handleClear = () => {
    setQuery("");
    setSelectedName("");
    onSelect(null, "");
    setMatches([]);
  };

  const scoreColor = (score: number) => {
    if (score >= 90) return "text-primary";
    if (score >= 70) return "text-amber-600";
    return "text-muted-foreground";
  };

  return (
    <div ref={wrapperRef} className={`relative ${className || ""}`}>
      <div className="relative">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value !== selectedName) {
              // User is typing something new, clear selection
            }
          }}
          onFocus={() => {
            if (matches.length > 0) setOpen(true);
          }}
          placeholder={placeholder}
          className="pl-9 pr-8 h-11"
        />
        {loading && (
          <Loader2 className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
        {!loading && value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Selected indicator */}
      {value && selectedName && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <Check className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs text-primary font-medium">Segmento selecionado: {selectedName}</span>
        </div>
      )}

      {/* Dropdown */}
      {open && matches.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-popover border rounded-xl shadow-lg overflow-hidden">
          {matches.map((match) => (
            <button
              key={match.segment_id}
              type="button"
              onClick={() => handleSelect(match)}
              className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-center justify-between gap-2 border-b last:border-0"
            >
              <div className="min-w-0">
                <span className="text-sm font-medium block">{match.segment_name}</span>
                {match.matched_term !== match.segment_name && (
                  <span className="text-xs text-muted-foreground">
                    via "{match.matched_term}"
                  </span>
                )}
              </div>
              <Badge
                variant="secondary"
                className={`text-[10px] shrink-0 ${scoreColor(match.score)}`}
              >
                {match.score}%
              </Badge>
            </button>
          ))}
        </div>
      )}

      {open && matches.length === 0 && debouncedQuery.length >= 2 && !loading && (
        <div className="absolute z-50 top-full mt-1 w-full bg-popover border rounded-xl shadow-lg p-4">
          <p className="text-xs text-muted-foreground text-center">
            Nenhum segmento encontrado para "{debouncedQuery}"
          </p>
        </div>
      )}
    </div>
  );
}
