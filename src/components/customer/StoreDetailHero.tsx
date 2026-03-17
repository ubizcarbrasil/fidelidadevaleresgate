import React from "react";
import { ArrowLeft, Share2, Heart } from "lucide-react";
import { motion } from "framer-motion";
import SafeImage from "@/components/customer/SafeImage";
import { Store as StoreIcon } from "lucide-react";
import { brandAlpha } from "@/lib/utils";

interface Props {
  storeName: string;
  bannerUrl: string | null;
  logoUrl: string | null;
  primary: string;
  isFav: boolean;
  onBack: () => void;
  onShare: () => void;
  onToggleFav: () => void;
}

const StoreDetailHero = React.memo(function StoreDetailHero({
  storeName, bannerUrl, logoUrl, primary, isFav, onBack, onShare, onToggleFav,
}: Props) {
  return (
    <div className="relative w-full">
      <div
        className="w-full h-48"
        style={bannerUrl ? {
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.35)), url(${bannerUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        } : {
          background: `linear-gradient(135deg, ${brandAlpha(primary, 0.19)} 0%, ${brandAlpha(primary, 0.03)} 100%)`,
        }}
      />

      <button
        onClick={onBack}
        className="absolute top-4 left-4 h-10 w-10 rounded-full bg-card/80 backdrop-blur flex items-center justify-center shadow-md"
      >
        <ArrowLeft className="h-5 w-5 text-foreground" />
      </button>

      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={onShare}
          className="h-10 w-10 rounded-full bg-card/80 backdrop-blur flex items-center justify-center shadow-md"
        >
          <Share2 className="h-5 w-5 text-muted-foreground" />
        </button>
        <motion.button
          whileTap={{ scale: 1.3 }}
          onClick={onToggleFav}
          className="h-10 w-10 rounded-full bg-card/80 backdrop-blur flex items-center justify-center shadow-md"
        >
          <Heart
            className="h-5 w-5 transition-colors"
            fill={isFav ? "#E5195F" : "none"}
            stroke={isFav ? "#E5195F" : "hsl(var(--muted-foreground))"}
            strokeWidth={2}
          />
        </motion.button>
      </div>

      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
        <SafeImage
          src={logoUrl}
          alt={storeName}
          className="h-20 w-20 rounded-2xl object-cover shadow-lg border-4 border-background"
          fallback={
            <div
              className="h-20 w-20 rounded-2xl flex items-center justify-center shadow-lg border-4 border-background"
              style={{ backgroundColor: brandAlpha(primary, 0.08) }}
            >
              <StoreIcon className="h-10 w-10" style={{ color: primary }} />
            </div>
          }
        />
      </div>
    </div>
  );
});

export default StoreDetailHero;
