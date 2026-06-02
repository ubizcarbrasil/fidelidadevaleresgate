import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { prefetchRoute } from "@/lib/routePrefetch";

interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, onMouseEnter, onFocus, ...props }, ref) => {
    // Prefetch on hover/focus — quando user passa mouse num link do
    // menu, o chunk da rota já começa a baixar em background. Click
    // depois vira navegação instantânea (sem flash de Suspense).
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
