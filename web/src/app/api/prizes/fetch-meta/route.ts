import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/session";

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function extractMeta(html: string, property: string): string {
  return (
    html.match(new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"))?.[1] ??
    html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i"))?.[1] ??
    ""
  );
}

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function tryLegoUrl(url: string): { title: string; image: string } | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("lego.com")) return null;

    // /en-us/product/mclaren-mcl39-f1-car-42228
    const segments = u.pathname.split("/").filter(Boolean);
    const slug = segments[segments.length - 1]; // e.g. mclaren-mcl39-f1-car-42228
    const parts = slug.split("-");
    const setNumber = parts[parts.length - 1];
    if (!/^\d{4,6}$/.test(setNumber)) return null;

    const nameSlug = parts.slice(0, -1).join("-");
    const title = slugToTitle(nameSlug) || `LEGO Set ${setNumber}`;
    const image = `https://images.brickset.com/sets/images/${setNumber}-1.jpg`;
    return { title, image };
  } catch {
    return null;
  }
}

function extractPrice(html: string): number | null {
  // JSON-LD schema.org Product offers
  const ldBlocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const [, body] of ldBlocks) {
    try {
      const data = JSON.parse(body);
      const nodes = Array.isArray(data) ? data : [data];
      for (const node of nodes) {
        const offer = node?.offers ?? node?.offers?.[0];
        const price = offer?.price ?? (Array.isArray(offer) ? offer[0]?.price : undefined);
        if (price != null) {
          const cents = Math.round(parseFloat(String(price)) * 100);
          if (cents > 0) return cents;
        }
      }
    } catch { /* ignore */ }
  }

  // Amazon: <span class="a-offscreen">$XX.XX</span>
  const offscreen = html.match(/class="a-offscreen">\$([0-9,]+\.?\d*)/);
  if (offscreen) {
    const cents = Math.round(parseFloat(offscreen[1].replace(/,/g, "")) * 100);
    if (cents > 0) return cents;
  }

  // og:price:amount
  const ogPrice =
    html.match(/<meta[^>]+property=["']og:price:amount["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:price:amount["']/i)?.[1];
  if (ogPrice) {
    const cents = Math.round(parseFloat(ogPrice) * 100);
    if (cents > 0) return cents;
  }

  return null;
}

async function tryNintendoUrl(
  url: string,
  headers: Record<string, string>,
): Promise<{ title: string; image: string; description: string; priceCents: number | null } | null> {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("nintendo.com")) return null;

    // Extract product ID — the long numeric segment in the URL slug
    // e.g. .../donkey-kong-bananza-dk-island-and-emerald-rush-70050000062442-switch-2/
    const slug = u.pathname.split("/").filter(Boolean).at(-1) ?? "";
    const productIdMatch = slug.match(/(\d{12,})/);
    if (!productIdMatch) return null;
    const productId = productIdMatch[1];

    // Fetch price from Nintendo eShop public API
    let priceCents: number | null = null;
    try {
      const priceRes = await fetch(
        `https://api.ec.nintendo.com/v1/price?country=US&lang=en&ids=${productId}`,
        { signal: AbortSignal.timeout(5000) },
      );
      if (priceRes.ok) {
        const data = await priceRes.json();
        const raw = data?.prices?.[0]?.regular_price?.raw_value;
        if (raw) priceCents = Math.round(parseFloat(raw) * 100);
      }
    } catch { /* ignore */ }

    // Fetch product page for title, image, description
    const pageRes = await fetch(url, { headers, redirect: "follow", signal: AbortSignal.timeout(10000) });
    if (!pageRes.ok) return null;
    const html = await pageRes.text();

    const rawTitle =
      decodeEntities(extractMeta(html, "og:title") || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "").trim();
    const title = rawTitle.replace(/\s*\|\s*Nintendo.*$/i, "").trim();
    const image = extractImage(html, url);
    const description = decodeEntities(extractMeta(html, "og:description") || extractMeta(html, "description")).trim();

    return { title, image, description, priceCents };
  } catch {
    return null;
  }
}

function extractImage(html: string, url: string): string {
  // Standard og:image
  let img = extractMeta(html, "og:image:secure_url") || extractMeta(html, "og:image");
  if (img) return decodeEntities(img);

  // Amazon-specific: data-old-hires on the main product image
  const amazonHires = html.match(/data-old-hires="([^"]+)"/)?.[1];
  if (amazonHires) return decodeEntities(amazonHires);

  // Amazon: data-a-dynamic-image JSON map — pick largest
  const dynJson = html.match(/data-a-dynamic-image="([^"]+)"/)?.[1];
  if (dynJson) {
    try {
      const map = JSON.parse(decodeEntities(dynJson)) as Record<string, [number, number]>;
      const best = Object.entries(map).sort((a, b) => b[1][0] - a[1][0])[0];
      if (best) return best[0];
    } catch { /* ignore */ }
  }

  return "";
}

export async function POST(req: NextRequest) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url } = await req.json();
  if (typeof url !== "string" || !url.startsWith("http")) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Handle Lego URLs without fetching (Cloudflare blocks server requests)
  const legoMeta = tryLegoUrl(url);
  if (legoMeta) {
    return NextResponse.json({ title: legoMeta.title, image: legoMeta.image, description: "" });
  }

  const browserHeaders = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "no-cache",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
  };

  // Handle Nintendo URLs: eShop API for price + page scrape for image/title
  const nintendoMeta = await tryNintendoUrl(url, browserHeaders);
  if (nintendoMeta) {
    return NextResponse.json(nintendoMeta);
  }

  try {
    const res = await fetch(url, {
      headers: browserHeaders,
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const finalUrl = res.url;

    const title = decodeEntities(
      extractMeta(html, "og:title") ||
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ||
      ""
    ).trim();

    const image = extractImage(html, finalUrl);
    const priceCents = extractPrice(html);

    const description = decodeEntities(
      extractMeta(html, "og:description") ||
      extractMeta(html, "description")
    ).trim();

    return NextResponse.json({ title, image, description, priceCents });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
