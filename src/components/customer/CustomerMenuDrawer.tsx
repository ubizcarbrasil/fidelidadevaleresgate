import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import AppIcon from "@/components/customer/AppIcon";
import type { AppIconKey } from "@/hooks/useAppIcons";

interface TabItem {
  key: string;
  label: string;
  iconKey: AppIconKey;
}

interface CustomerMenuDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tabs: TabItem[];
  activeTab: string;
  onNavigate: (tabKey: string) => void;
}

export default function CustomerMenuDrawer({
  open,
  onOpenChange,
  tabs,
  activeTab,
  onNavigate,
}: CustomerMenuDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[280px] p-0 border-l border-border bg-card">
        <SheetHeader className="px-5 pt-6 pb-4">
          <SheetTitle className="text-base font-bold text-foreground">Menu</SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-1 px-3 pb-6">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  onNavigate(tab.key);
                  onOpenChange(false);
                }}
                className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all text-left"
                style={{
                  backgroundColor: isActive ? "hsl(var(--foreground) / 0.10)" : "transparent",
                }}
              >
                <div
                  className="h-9 w-9 rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor: isActive ? "hsl(var(--foreground) / 0.12)" : "hsl(var(--muted))",
                  }}
                >
                  <AppIcon
                    iconKey={tab.iconKey}
                    className="h-5 w-5"
                    strokeWidth={isActive ? 2.2 : 1.6}
                    style={{
                      color: isActive ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                    }}
                  />
                </div>
                <span
                  className="text-sm font-semibold"
                  style={{
                    color: isActive ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                  }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
