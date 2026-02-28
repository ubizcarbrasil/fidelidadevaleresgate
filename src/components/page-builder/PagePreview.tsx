import type { PageElement } from "./types";
import ElementRenderer from "./ElementRenderer";

interface Props {
  elements: PageElement[];
}

export default function PagePreview({ elements }: Props) {
  if (elements.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Página vazia — adicione elementos no editor
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      {elements.map((el) => (
        <ElementRenderer key={el.id} element={el} />
      ))}
    </div>
  );
}
