import type { UnifiedBlock } from "./types";
import ElementRenderer from "./ElementRenderer";

interface Props {
  blocks: UnifiedBlock[];
}

export default function UnifiedPreview({ blocks }: Props) {
  if (blocks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Página vazia — adicione blocos no editor
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2 max-w-md mx-auto">
      {blocks.map((block) => {
        if (block.blockType === "static") {
          return <ElementRenderer key={block.id} element={block.element} />;
        }
        // Dynamic section placeholder preview
        return (
          <div
            key={block.id}
            className="rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 p-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono font-bold">
                {block.section.section_templates?.key || "SESSÃO"}
              </span>
              {!block.section.is_enabled && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Desativada</span>
              )}
            </div>
            <p className="text-sm font-semibold">{block.section.title || "Sessão sem título"}</p>
            {block.section.subtitle && (
              <p className="text-xs text-muted-foreground">{block.section.subtitle}</p>
            )}
            <div className="flex gap-2 mt-2 text-[10px] text-muted-foreground">
              <span>{block.section.display_mode}</span>
              <span>·</span>
              <span>{block.section.columns_count} col</span>
              {block.section.cta_text && (
                <>
                  <span>·</span>
                  <span>CTA: {block.section.cta_text}</span>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
