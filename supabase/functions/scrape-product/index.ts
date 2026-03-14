import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createEdgeLogger } from "../_shared/edgeLogger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, brand_id } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const log = createEdgeLogger("scrape-product");
    log.info("Scraping product URL", { url: formattedUrl });

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ['markdown', 'links'],
        onlyMainContent: true,
      }),
    });

    const raw = await response.json();

    if (!response.ok) {
      log.error("Firecrawl API error", { status: response.status, raw });
      return new Response(
        JSON.stringify({ success: false, error: raw.error || `Failed with status ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = raw.data || raw;
    const metadata = data.metadata || {};
    const markdown = data.markdown || '';

    // Extract price patterns
    const pricePattern = /R\$\s*([\d.,]+)/g;
    const prices: number[] = [];
    let match;
    while ((match = pricePattern.exec(markdown)) !== null) {
      const cleaned = match[1].replace(/\./g, '').replace(',', '.');
      const num = parseFloat(cleaned);
      if (!isNaN(num) && num > 0 && num < 100000) {
        prices.push(num);
      }
    }

    const currentPrice = prices.length > 0 ? prices[0] : null;
    const originalPrice = prices.length > 1 ? prices[1] : null;

    let price = currentPrice;
    let origPrice = originalPrice;
    if (price && origPrice && origPrice < price) {
      [price, origPrice] = [origPrice, price];
    }

    const imageUrl = metadata.ogImage || metadata['og:image'] || null;
    const siteName = metadata.ogSiteName || metadata['og:site_name'] || '';
    const title = metadata.ogTitle || metadata.title || '';
    const description = metadata.ogDescription || metadata.description || '';

    // Auto-categorize: match against brand's categories using keywords
    let matched_category_id: string | null = null;
    let matched_category_name: string | null = null;

    if (brand_id) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const sb = createClient(supabaseUrl, supabaseKey);

        const { data: cats } = await sb
          .from('affiliate_deal_categories')
          .select('id, name, keywords')
          .eq('brand_id', brand_id)
          .eq('is_active', true);

        if (cats && cats.length > 0) {
          const searchText = `${title} ${description} ${formattedUrl} ${siteName}`.toLowerCase();

          let bestScore = 0;
          for (const cat of cats) {
            const kws = (cat.keywords as string[]) || [];
            let score = 0;
            for (const kw of kws) {
              if (searchText.includes(kw.toLowerCase())) {
                score += kw.length; // longer keyword matches = higher confidence
              }
            }
            if (score > bestScore) {
              bestScore = score;
              matched_category_id = cat.id;
              matched_category_name = cat.name;
            }
          }
        }
      } catch (e) {
        log.error("Category matching error", { error: String(e) });
      }
    }

    const product = {
      title,
      description,
      image_url: imageUrl,
      price,
      original_price: origPrice && origPrice > (price || 0) ? origPrice : null,
      store_name: siteName,
      store_logo_url: null,
      category_id: matched_category_id,
      category_name: matched_category_name,
    };

    console.log('Extracted product:', JSON.stringify(product));

    return new Response(
      JSON.stringify({ success: true, product }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping product:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to scrape';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
