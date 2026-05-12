function iniciais(nome?: string | null) {
  if (!nome) return "?";
  return nome
    .replace(/\[MOTORISTA\]/gi, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
}

interface Props {
  nome?: string | null;
  url?: string | null;
  size?: number;
}

/**
 * Avatar do motorista com fallback de iniciais.
 * Usado em telas de campeonato/duelo (admin e motorista).
 */
export function AvatarMotorista({ nome, url, size = 40 }: Props) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full bg-muted text-xs font-medium text-foreground/70 flex items-center justify-center"
      style={{ height: size, width: size }}
    >
      {url ? (
        <img
          src={url}
          alt={nome ?? "motorista"}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{iniciais(nome)}</span>
      )}
    </div>
  );
}

export default AvatarMotorista;