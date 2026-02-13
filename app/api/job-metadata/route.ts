import { NextResponse } from "next/server";

type MetaResult = {
  title?: string;
  company?: string;
  company_logo?: string;
  location?: string;
  description?: string;
};

// Lightweight HTML meta scraper (no external deps)
function extractMeta(html: string): MetaResult {
  const result: MetaResult = {};
  const get = (regex: RegExp) => {
    const match = html.match(regex);
    return match?.[1]?.trim();
  };

  result.title =
    get(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
    get(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
    get(/<title>([^<]+)<\/title>/i);

  result.company =
    get(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
    get(/<meta[^>]+name=["']application-name["'][^>]+content=["']([^"']+)["'][^>]*>/i);

  result.company_logo =
    get(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
    get(/<link[^>]+rel=["']icon["'][^>]+href=["']([^"']+)["'][^>]*>/i) ||
    get(/<link[^>]+rel=["']shortcut icon["'][^>]+href=["']([^"']+)["'][^>]*>/i);

  result.location = get(/<meta[^>]+property=["']og:locale["'][^>]+content=["']([^"']+)["'][^>]*>/i);
  result.description =
    get(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
    get(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
    get(/<meta[^>]+name=["']twitter:description["'][^>]+content=["']([^"']+)["'][^>]*>/i);

  return result;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobUrl = searchParams.get("url");

  if (!jobUrl) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  try {
    const res = await fetch(jobUrl, { cache: "no-store" });
    const html = await res.text();
    const meta = extractMeta(html);

    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return NextResponse.json({
      title: meta.title || null,
      company: meta.company || null,
      company_logo: meta.company_logo || null,
      location: meta.location || null,
      description: meta.description || textContent.slice(0, 1600) || null,
    });
  } catch (error) {
    console.error("job-metadata fetch failed", error);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}
