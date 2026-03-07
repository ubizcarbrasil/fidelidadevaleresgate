/**
 * Auth Module — barrel export.
 */
export type {
  AppRole,
  ConsoleScope,
  ScopeLevel,
  UserRole,
  ScopeIds,
} from "./types";

export {
  ROLE_LABELS,
  CONSOLE_TITLES,
  resolveConsoleScope,
  resolveScopeLevel,
  extractScopeIds,
  canAccessScope,
} from "./types";
