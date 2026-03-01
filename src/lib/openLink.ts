import { supabase } from "@/integrations/supabase/client";

export interface OpenLinkOptions {
  url: string;
  mode: "WEBVIEW" | "REDIRECT";
  title?: string;
  openInNewTab?: boolean;
  showHeader?: boolean;
  allowBack?: boolean;
  shareEnabled?: boolean;
  tracking?: {
    brand_id: string;
    branch_id?: string;
    customer_id?: string;
    click_type: string;
    source_context_json?: Record<string, any>;
  };
}

/**
 * Central function to open any link in the app.
 * Handles tracking + WEBVIEW (internal iframe) or REDIRECT (external).
 */
export async function openLink(options: OpenLinkOptions, navigate?: (path: string) => void) {
  const { url, mode, title, openInNewTab = true, tracking } = options;

  // Track click first
  if (tracking) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("link_clicks" as any).insert({
        brand_id: tracking.brand_id,
        branch_id: tracking.branch_id || null,
        user_id: user?.id || null,
        customer_id: tracking.customer_id || null,
        click_type: tracking.click_type,
        source_context_json: tracking.source_context_json || {},
        url,
        mode,
        referrer_route: window.location.pathname,
        user_agent: navigator.userAgent,
      });
    } catch (e) {
      console.warn("Failed to track click:", e);
    }
  }

  if (mode === "WEBVIEW") {
    // Navigate to internal webview page
    const params = new URLSearchParams({ url });
    if (title) params.set("title", title);
    if (options.showHeader !== false) params.set("header", "1");
    if (options.shareEnabled) params.set("share", "1");
    if (options.allowBack !== false) params.set("back", "1");

    const path = `/webview?${params.toString()}`;
    if (navigate) {
      navigate(path);
    } else {
      window.location.href = path;
    }
  } else {
    // REDIRECT — open externally
    if (openInNewTab) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = url;
    }
  }
}

/**
 * Tracks a click without opening a link (for internal navigation tracking).
 */
export async function trackClick(tracking: OpenLinkOptions["tracking"] & { url?: string }) {
  if (!tracking) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("link_clicks" as any).insert({
      brand_id: tracking.brand_id,
      branch_id: tracking.branch_id || null,
      user_id: user?.id || null,
      customer_id: tracking.customer_id || null,
      click_type: tracking.click_type,
      source_context_json: tracking.source_context_json || {},
      url: (tracking as any).url || window.location.pathname,
      mode: "INTERNAL",
      referrer_route: window.location.pathname,
      user_agent: navigator.userAgent,
    });
  } catch (e) {
    console.warn("Failed to track click:", e);
  }
}
