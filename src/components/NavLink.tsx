import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { prefetchRoute, cancelPrefetch } from "@/lib/routePrefetch";

interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
  onMouseLeave?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, onMouseEnter, onMouseLeave, onFocus, ...props }, ref) => {
    // Prefetch on hover/focus com DEBOUNCE de 150ms + DEDUPE por sessão.
    // Mouse só passando rapidamente NÃO dispara — só hover com intent
    // de pousar. Cancela se mouse sair antes do timeout.
    //
    // Antes: cada mouseEnter chamava import() imediato. Em sidebar com
    // 25+ links, mexer mouse próximo do menu disparava 5-10 fetches.
    // Causava "do nada carregamento" perceptível em preview/Lovable.
    const targetPath = typeof to === "string" ? to : String(to);
    const handlePrefetch = useCallback(() => {
      prefetchRoute(targetPath);
    }, [targetPath]);

    return (
      <RouterNavLink
        ref={ref}
        to={to}
        className={({ isActive, isPending }) =>
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        onMouseEnter={(e) => {
          handlePrefetch();
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          cancelPrefetch();
          onMouseLeave?.(e);
        }}
        onFocus={(e) => {
          handlePrefetch();
          onFocus?.(e);
        }}
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
