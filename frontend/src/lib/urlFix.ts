/**
 * Fix file and media URLs for multi-environment support (Local, Hosting, Vercel + Render).
 * Resolves localhost:5001, tieuchankiet.id.vn and relative /uploads/ paths to the correct backend origin.
 */
export function fixFileUrl(url: string | undefined | null): string {
  if (!url) return "";

  // Cloudinary or external HTTPS media (like Google avatars) should remain untouched
  if (
    url.includes("cloudinary.com") ||
    url.includes("googleusercontent.com") ||
    url.includes("lh3.googleusercontent.com")
  ) {
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
      backendOrigin = viteApiUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
    } else {
      backendOrigin = window.location.origin;
    }

    if (!isLocalhostEnv) {
      // Replace old domains (localhost, tieuchankiet.id.vn) with active backend origin
      if (
        url.includes("localhost:5001") ||
        url.includes("127.0.0.1:5001") ||
        url.includes("tieuchankiet.id.vn")
      ) {
        return url
          .replace(/https?:\/\/localhost:5001/g, backendOrigin)
          .replace(/https?:\/\/127\.0\.0\.1:5001/g, backendOrigin)
          .replace(/https?:\/\/tieuchankiet\.id\.vn/g, backendOrigin);
      }
      if (url.startsWith("/uploads/")) {
        return `${backendOrigin}${url}`;
      }
    }
  }

  return url;
}
