import { UserCircle, HelpCircle, MessageCircle, Share2 } from "lucide-react";

interface Props {
  logoUrl?: string;
  title: string;
  fontHeading?: string;
  whatsappNumber?: string;
  onProfile: () => void;
  onHelp: () => void;
  onShare: () => void;
}

export default function HomeHeader({ logoUrl, title, fontHeading, whatsappNumber, onProfile, onHelp, onShare }: Props) {
  return (
    <div className="flex items-center justify-between px-4 pt-3 pb-2">
      <div className="flex items-center gap-2.5">
        {logoUrl && (
          <img src={logoUrl} alt={title} className="h-9 w-9 object-contain rounded-lg" />
        )}
        <span
          className="font-extrabold text-[16px] tracking-tight text-foreground uppercase"
          style={{ fontFamily: fontHeading }}
        >
          {title}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={onProfile}
          className="h-9 w-9 flex items-center justify-center rounded-xl bg-muted transition-transform active:scale-95"
        >
          <UserCircle className="h-[18px] w-[18px] text-foreground" />
        </button>
        <button
          onClick={onHelp}
          className="h-9 w-9 flex items-center justify-center rounded-xl bg-muted transition-transform active:scale-95"
        >
          <HelpCircle className="h-[18px] w-[18px] text-foreground" />
        </button>
        {whatsappNumber && (
          <a
            href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-muted transition-transform active:scale-95"
          >
            <MessageCircle className="h-[18px] w-[18px]" style={{ color: "#25D366" }} />
          </a>
        )}
        <button
          onClick={onShare}
          className="h-9 w-9 flex items-center justify-center rounded-xl bg-muted transition-transform active:scale-95"
        >
          <Share2 className="h-[18px] w-[18px] text-foreground" />
        </button>
      </div>
    </div>
  );
}
