/**
 * Re-exports core boot state + React hook.
 * Components that need useBootReady import from here.
 * main.tsx should import from bootStateCore instead.
 */
import { useSyncExternalStore } from "react";

// Re-export everything from core so existing imports keep working
export {
  type BootPhase,
  setBootPhase,
  getBootPhase,
  onBootPhase,
  dismissBootstrap,
  isBootResolved,
  subscribeBootState,
} from "./bootStateCore";

import { isBootResolved, subscribeBootState } from "./bootStateCore";

/** Returns true once boot has ever reached BRAND_READY or FAILED. Never reverts. */
export function useBootReady(): boolean {
  return useSyncExternalStore(subscribeBootState, isBootResolved, isBootResolved);
}
