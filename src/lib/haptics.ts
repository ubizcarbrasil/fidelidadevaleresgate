/** Trigger haptic feedback if the device supports it */
export function haptic(style: "light" | "medium" | "heavy" = "light") {
  if (!navigator.vibrate) return;
  const ms = style === "heavy" ? 30 : style === "medium" ? 15 : 8;
  navigator.vibrate(ms);
}
