import type { PageElement } from "./types";
import { ExternalLink } from "lucide-react";

interface Props {
  element: PageElement;
}

export default function ElementRenderer({ element }: Props) {
  const { type, content, style, action, imageUrl, badgeText } = element;

  const handleClick = () => {
    if (action.type === "external_link" && action.url) {
      window.open(action.url, "_blank");
    } else if (action.type === "internal_route" && action.route) {
      // In customer context this would navigate; for preview just log
      console.log("Navigate to:", action.route);
    } else if (action.type === "webview" && action.url) {
      window.open(action.url, "_blank");
    }
  };

  const isClickable = action.type !== "none";
  const baseStyle: React.CSSProperties = {
    fontSize: style.fontSize,
    fontFamily: style.fontFamily,
    fontWeight: style.fontWeight as any,
    color: style.color,
    backgroundColor: style.backgroundColor,
    borderRadius: style.borderRadius,
    padding: style.padding,
    margin: style.margin,
    textAlign: style.textAlign as any,
    boxShadow: style.boxShadow,
    width: style.width,
    height: style.height,
    opacity: style.opacity ? Number(style.opacity) : undefined,
    cursor: isClickable ? "pointer" : undefined,
  };

  if (type === "divider") {
    return <div style={{ ...baseStyle, padding: 0 }} />;
  }

  if (type === "spacer") {
    return <div style={{ height: style.height || "24px" }} />;
  }

  if (type === "banner") {
    return (
      <div className="relative overflow-hidden" style={baseStyle} onClick={isClickable ? handleClick : undefined}>
        {imageUrl ? (
          <img src={imageUrl} alt={content} className="w-full h-full object-cover absolute inset-0" style={{ borderRadius: style.borderRadius }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted" style={{ borderRadius: style.borderRadius }}>
            <span className="text-muted-foreground text-xs">Sem imagem</span>
          </div>
        )}
        {badgeText && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md z-10">
            {badgeText}
          </span>
        )}
        {content && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3 z-10">
            <span className="text-white font-bold text-sm">{content}</span>
          </div>
        )}
        {isClickable && (
          <div className="absolute top-2 right-2 z-10">
            <ExternalLink className="h-3 w-3 text-white/70" />
          </div>
        )}
      </div>
    );
  }

  if (type === "button") {
    return (
      <button
        className="w-full transition-transform active:scale-[0.98]"
        style={baseStyle}
        onClick={isClickable ? handleClick : undefined}
      >
        {badgeText && (
          <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded mr-2 font-bold">{badgeText}</span>
        )}
        {content}
      </button>
    );
  }

  if (type === "icon") {
    return (
      <div
        className="flex items-center justify-center"
        style={baseStyle}
        onClick={isClickable ? handleClick : undefined}
      >
        <span className="text-2xl">{content || "⭐"}</span>
      </div>
    );
  }

  // text
  return (
    <div style={baseStyle} onClick={isClickable ? handleClick : undefined}>
      {content}
    </div>
  );
}
