import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, GripVertical, Eye, Save, Image, Type, Minus, Square, MousePointer, Copy } from "lucide-react";
import type { PageElement, PageElementStyle } from "./types";
import { DEFAULT_ELEMENT, ELEMENT_TYPE_LABELS } from "./types";
import PagePreview from "./PagePreview";

interface Props {
  page: { id: string; title: string; elements_json: PageElement[] };
  onSave: (elements: PageElement[]) => void;
  onBack: () => void;
  onPreview: () => void;
}

export default function ElementEditor({ page, onSave, onBack }: Props) {
  const [elements, setElements] = useState<PageElement[]>(page.elements_json || []);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const addElement = (type: PageElement["type"]) => {
    const el: PageElement = {
      ...DEFAULT_ELEMENT,
      id: crypto.randomUUID(),
      type,
      content: type === "divider" ? "" : type === "spacer" ? "" : type === "button" ? "Clique aqui" : type === "banner" ? "" : "Texto",
      style: {
        ...DEFAULT_ELEMENT.style,
        ...(type === "button" ? { backgroundColor: "hsl(var(--primary))", color: "#ffffff", textAlign: "center", fontWeight: "bold", borderRadius: "12px" } : {}),
        ...(type === "banner" ? { height: "160px", borderRadius: "16px" } : {}),
        ...(type === "divider" ? { height: "1px", backgroundColor: "#E5E5E5", padding: "0" } : {}),
        ...(type === "spacer" ? { height: "24px", padding: "0" } : {}),
      },
    };
    setElements([...elements, el]);
    setSelectedIdx(elements.length);
  };

  const updateElement = (idx: number, patch: Partial<PageElement>) => {
    setElements(elements.map((el, i) => i === idx ? { ...el, ...patch } : el));
  };

  const updateStyle = (idx: number, patch: Partial<PageElementStyle>) => {
    setElements(elements.map((el, i) => i === idx ? { ...el, style: { ...el.style, ...patch } } : el));
  };

  const removeElement = (idx: number) => {
    setElements(elements.filter((_, i) => i !== idx));
    setSelectedIdx(null);
  };

  const moveElement = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= elements.length) return;
    const copy = [...elements];
    [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
    setElements(copy);
    setSelectedIdx(newIdx);
  };

  const duplicateElement = (idx: number) => {
    const copy = { ...elements[idx], id: crypto.randomUUID() };
    const newElements = [...elements];
    newElements.splice(idx + 1, 0, copy);
    setElements(newElements);
    setSelectedIdx(idx + 1);
  };

  // Drag-and-drop state
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const copy = [...elements];
    const [moved] = copy.splice(dragIdx, 1);
    copy.splice(idx, 0, moved);
    setElements(copy);
    setSelectedIdx(idx);
    setDragIdx(idx);
  };
  const handleDragEnd = () => setDragIdx(null);

  const selected = selectedIdx !== null ? elements[selectedIdx] : null;

  if (showPreview) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <span className="font-bold">Preview: {page.title}</span>
          <Button size="sm" variant="outline" onClick={() => setShowPreview(false)}>Voltar ao Editor</Button>
        </div>
        <div className="flex-1 overflow-y-auto max-w-md mx-auto w-full bg-white">
          <PagePreview elements={elements} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-card">
        <Button size="icon" variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="font-bold flex-1 truncate">{page.title}</h2>
        <Button size="sm" variant="outline" onClick={() => setShowPreview(true)}>
          <Eye className="h-4 w-4 mr-1" /> Preview
        </Button>
        <Button size="sm" onClick={() => onSave(elements)}>
          <Save className="h-4 w-4 mr-1" /> Salvar
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Element list */}
        <div className="w-72 border-r flex flex-col bg-muted/30">
          <div className="p-3 border-b">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Adicionar elemento</p>
            <div className="grid grid-cols-3 gap-1.5">
              {(["text", "button", "banner", "icon", "divider", "spacer"] as PageElement["type"][]).map((t) => (
                <button
                  key={t}
                  onClick={() => addElement(t)}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] font-medium hover:bg-accent transition-colors"
                >
                  {t === "text" && <Type className="h-4 w-4" />}
                  {t === "button" && <MousePointer className="h-4 w-4" />}
                  {t === "banner" && <Image className="h-4 w-4" />}
                  {t === "icon" && <Square className="h-4 w-4" />}
                  {t === "divider" && <Minus className="h-4 w-4" />}
                  {t === "spacer" && <GripVertical className="h-4 w-4" />}
                  {ELEMENT_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {elements.length === 0 && (
              <p className="text-xs text-center text-muted-foreground py-8">Adicione elementos acima</p>
            )}
            {elements.map((el, idx) => (
              <div
                key={el.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm transition-colors ${dragIdx === idx ? "opacity-50" : ""} ${selectedIdx === idx ? "bg-primary/10 border border-primary/30" : "hover:bg-accent"}`}
                onClick={() => setSelectedIdx(idx)}
              >
                <GripVertical className="h-3 w-3 text-muted-foreground flex-shrink-0 cursor-grab" />
                <span className="flex-1 truncate text-xs">{ELEMENT_TYPE_LABELS[el.type]}: {el.content || "(vazio)"}</span>
                <div className="flex gap-0.5">
                  <button onClick={(e) => { e.stopPropagation(); duplicateElement(idx); }} className="text-muted-foreground hover:text-foreground" title="Duplicar">
                    <Copy className="h-3 w-3" />
                  </button>
                  {idx > 0 && <button onClick={(e) => { e.stopPropagation(); moveElement(idx, -1); }} className="text-muted-foreground hover:text-foreground text-[10px]">↑</button>}
                  {idx < elements.length - 1 && <button onClick={(e) => { e.stopPropagation(); moveElement(idx, 1); }} className="text-muted-foreground hover:text-foreground text-[10px]">↓</button>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Properties panel */}
        <div className="flex-1 overflow-y-auto p-4">
          {!selected ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              Selecione um elemento para editar suas propriedades
            </div>
          ) : (
            <div className="max-w-md space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm">{ELEMENT_TYPE_LABELS[selected.type]}</h3>
                <Button size="sm" variant="destructive" onClick={() => removeElement(selectedIdx!)}>
                  <Trash2 className="h-3 w-3 mr-1" /> Remover
                </Button>
              </div>

              {/* Content */}
              {!["divider", "spacer"].includes(selected.type) && (
                <div>
                  <Label className="text-xs">Conteúdo</Label>
                  {selected.type === "text" ? (
                    <Textarea value={selected.content} onChange={(e) => updateElement(selectedIdx!, { content: e.target.value })} rows={3} />
                  ) : (
                    <Input value={selected.content} onChange={(e) => updateElement(selectedIdx!, { content: e.target.value })} />
                  )}
                </div>
              )}

              {/* Image URL for banner */}
              {selected.type === "banner" && (
                <div>
                  <Label className="text-xs">URL da Imagem</Label>
                  <Input value={selected.imageUrl || ""} onChange={(e) => updateElement(selectedIdx!, { imageUrl: e.target.value })} placeholder="https://..." />
                </div>
              )}

              {/* Badge text */}
              {["banner", "button"].includes(selected.type) && (
                <div>
                  <Label className="text-xs">Badge / Tag</Label>
                  <Input value={selected.badgeText || ""} onChange={(e) => updateElement(selectedIdx!, { badgeText: e.target.value })} placeholder="Ex: IMPERDÍVEL" />
                </div>
              )}

              {/* Style properties */}
              <div className="border-t pt-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground">Estilo</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Tamanho da Fonte</Label>
                    <Input value={selected.style.fontSize || ""} onChange={(e) => updateStyle(selectedIdx!, { fontSize: e.target.value })} placeholder="16px" />
                  </div>
                  <div>
                    <Label className="text-xs">Peso da Fonte</Label>
                    <Select value={selected.style.fontWeight || "normal"} onValueChange={(v) => updateStyle(selectedIdx!, { fontWeight: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="bold">Negrito</SelectItem>
                        <SelectItem value="800">Extra Negrito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Cor do Texto</Label>
                    <div className="flex gap-2">
                      <input type="color" value={selected.style.color || "#000000"} onChange={(e) => updateStyle(selectedIdx!, { color: e.target.value })} className="h-9 w-9 rounded border cursor-pointer" />
                      <Input value={selected.style.color || ""} onChange={(e) => updateStyle(selectedIdx!, { color: e.target.value })} className="flex-1" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Cor de Fundo</Label>
                    <div className="flex gap-2">
                      <input type="color" value={selected.style.backgroundColor || "#ffffff"} onChange={(e) => updateStyle(selectedIdx!, { backgroundColor: e.target.value })} className="h-9 w-9 rounded border cursor-pointer" />
                      <Input value={selected.style.backgroundColor || ""} onChange={(e) => updateStyle(selectedIdx!, { backgroundColor: e.target.value })} className="flex-1" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Arredondamento</Label>
                    <Input value={selected.style.borderRadius || ""} onChange={(e) => updateStyle(selectedIdx!, { borderRadius: e.target.value })} placeholder="8px" />
                  </div>
                  <div>
                    <Label className="text-xs">Espaçamento Interno</Label>
                    <Input value={selected.style.padding || ""} onChange={(e) => updateStyle(selectedIdx!, { padding: e.target.value })} placeholder="12px" />
                  </div>
                  <div>
                    <Label className="text-xs">Alinhamento</Label>
                    <Select value={selected.style.textAlign || "left"} onValueChange={(v) => updateStyle(selectedIdx!, { textAlign: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Esquerda</SelectItem>
                        <SelectItem value="center">Centro</SelectItem>
                        <SelectItem value="right">Direita</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Sombra</Label>
                    <Select value={selected.style.boxShadow || "none"} onValueChange={(v) => updateStyle(selectedIdx!, { boxShadow: v === "none" ? undefined : v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem sombra</SelectItem>
                        <SelectItem value="0 2px 8px rgba(0,0,0,0.1)">Suave</SelectItem>
                        <SelectItem value="0 4px 16px rgba(0,0,0,0.15)">Média</SelectItem>
                        <SelectItem value="0 8px 32px rgba(0,0,0,0.2)">Forte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {["banner", "divider", "spacer"].includes(selected.type) && (
                    <div>
                      <Label className="text-xs">Altura</Label>
                      <Input value={selected.style.height || ""} onChange={(e) => updateStyle(selectedIdx!, { height: e.target.value })} placeholder="160px" />
                    </div>
                  )}
                  <div>
                    <Label className="text-xs">Opacidade</Label>
                    <Input type="range" min="0" max="1" step="0.05" value={selected.style.opacity || "1"} onChange={(e) => updateStyle(selectedIdx!, { opacity: e.target.value })} className="h-9" />
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="border-t pt-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground">Ação ao clicar</p>
                <Select value={selected.action.type} onValueChange={(v: any) => updateElement(selectedIdx!, { action: { ...selected.action, type: v } })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    <SelectItem value="external_link">Link Externo</SelectItem>
                    <SelectItem value="internal_route">Rota Interna</SelectItem>
                    <SelectItem value="webview">WebView</SelectItem>
                  </SelectContent>
                </Select>
                {selected.action.type === "external_link" && (
                  <Input value={selected.action.url || ""} onChange={(e) => updateElement(selectedIdx!, { action: { ...selected.action, url: e.target.value } })} placeholder="https://..." />
                )}
                {selected.action.type === "internal_route" && (
                  <Input value={selected.action.route || ""} onChange={(e) => updateElement(selectedIdx!, { action: { ...selected.action, route: e.target.value } })} placeholder="/offers, /wallet, etc." />
                )}
                {selected.action.type === "webview" && (
                  <Input value={selected.action.url || ""} onChange={(e) => updateElement(selectedIdx!, { action: { ...selected.action, url: e.target.value } })} placeholder="https://..." />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
