/**
 * Fix file and media URLs for multi-environment support (Local, Hosting, Vercel + Render).
 * Resolves localhost:5001 and relative /uploads/ paths to the correct backend origin.
 */
export function fixFileUrl(url: string | undefined | null): string {
  if (!url) return "";

  // If already full HTTPS URL (like Cloudinary https://res.cloudinary.com/...), return as-is
  if (url.startsWith("https://") && !url.includes("localhost") && !url.includes("127.0.0.1")) {
    return url;
  }

  if (typeof window !== "undefined") {
    const isLocalhostEnv =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.startsWith("192.168.");

    const viteApiUrl = import.meta.env.VITE_API_URL;
    let backendOrigin = "";

    if (viteApiUrl && !viteApiUrl.includes("localhost")) {
      // Remove trailing /api or /
      backendOrigin = viteApiUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
    } else {
      backendOrigin = window.location.origin;
    }

    // On remote/production environments (e.g. Vercel)
    if (!isLocalhostEnv) {
      if (url.includes("localhost:5001") || url.includes("127.0.0.1:5001")) {
        return url
          .replace(/https?:\/\/localhost:5001/g, backendOrigin)
          .replace(/https?:\/\/127\.0\.0\.1:5001/g, backendOrigin);
      }
      if (url.startsWith("/uploads/")) {
        return `${backendOrigin}${url}`;
      }
    }
  }

  return url;
}
