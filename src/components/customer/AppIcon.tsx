import React from "react";
import { useAppIcons, type AppIconKey } from "@/hooks/useAppIcons";

interface AppIconProps {
  iconKey: AppIconKey;
  className?: string;
  style?: React.CSSProperties;
  strokeWidth?: number;
}

/** Renders an icon from the brand's app_icons config — lucide or custom image */
const AppIcon = React.memo(function AppIcon({ iconKey, className = "h-5 w-5", style, strokeWidth }: AppIconProps) {
  const { getLucideComponent, getCustomUrl } = useAppIcons();

  const customUrl = getCustomUrl(iconKey);
  if (customUrl) {
    return <img src={customUrl} alt={iconKey} className={className} style={style} />;
  }

  const LucideIcon = getLucideComponent(iconKey);
  if (LucideIcon) {
    return <LucideIcon className={className} style={style} strokeWidth={strokeWidth} />;
  }

  return null;
});

export default AppIcon;
