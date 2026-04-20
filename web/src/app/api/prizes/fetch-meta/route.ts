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

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
      },
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

    const description = decodeEntities(
      extractMeta(html, "og:description") ||
      extractMeta(html, "description")
    ).trim();

    return NextResponse.json({ title, image, description });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
