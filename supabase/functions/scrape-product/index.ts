const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

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

    console.log('Scraping product URL:', formattedUrl);

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
      console.error('Firecrawl API error:', raw);
      return new Response(
        JSON.stringify({ success: false, error: raw.error || `Failed with status ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract structured product data from the scraped content
    const data = raw.data || raw;
    const metadata = data.metadata || {};
    const markdown = data.markdown || '';

    // Try to extract price patterns from markdown (R$ XX,XX or R$XX.XX)
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

    // Usually: first price = current, second = original (strikethrough)
    const currentPrice = prices.length > 0 ? prices[0] : null;
    const originalPrice = prices.length > 1 ? prices[1] : null;

    // If original < current, swap (common pattern: original shown first with strikethrough)
    let price = currentPrice;
    let origPrice = originalPrice;
    if (price && origPrice && origPrice < price) {
      [price, origPrice] = [origPrice, price];
    }

    // Extract image from OG metadata
    const imageUrl = metadata.ogImage || metadata['og:image'] || null;

    // Extract store/site name
    const siteName = metadata.ogSiteName || metadata['og:site_name'] || '';

    // Build result
    const product = {
      title: metadata.ogTitle || metadata.title || '',
      description: metadata.ogDescription || metadata.description || '',
      image_url: imageUrl,
      price: price,
      original_price: origPrice && origPrice > (price || 0) ? origPrice : null,
      store_name: siteName,
      store_logo_url: metadata.ogImage ? null : null, // OG doesn't usually have logo
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
