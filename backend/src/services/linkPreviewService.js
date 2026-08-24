export const getLinkPreview = async (url) => {
  try {
    if (!url || !url.startsWith("http")) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) KyetoBot/1.0",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    const html = await response.text();

    const getMeta = (property) => {
      const match =
        html.match(new RegExp(`<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']+)["']`, "i")) ||
        html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:${property}["']`, "i")) ||
        html.match(new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`, "i"));
      return match ? match[1] : null;
    };

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);

    const title = getMeta("title") || (titleMatch ? titleMatch[1] : null);
    const description = getMeta("description");
    const image = getMeta("image");

    if (!title && !description) return null;

    return {
      url,
      title: title?.trim() || url,
      description: description?.trim() || "",
      image: image || "",
    };
  } catch (error) {
    console.warn("[LinkPreviewService] Error fetching OG metadata:", error.message);
    return null;
  }
};
