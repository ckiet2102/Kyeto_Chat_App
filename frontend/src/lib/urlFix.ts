/**
 * Fix file and media URLs for multi-environment support (Local, Hosting, Vercel + Backend).
 * Resolves localhost:5001, vercel.app, and relative /uploads/ paths to the correct backend origin.
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
    // Default fallback backend domain if VITE_API_URL is not set on Vercel
    const defaultLiveBackend = "https://tieuchankiet.id.vn";

    let backendOrigin = "";
    if (viteApiUrl && !viteApiUrl.includes("localhost")) {
      backendOrigin = viteApiUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
    } else {
      backendOrigin = isLocalhostEnv ? window.location.origin : defaultLiveBackend;
    }

    if (!isLocalhostEnv) {
      let cleanUrl = url;
      // Strip any wrong frontend domain or localhost references
      if (cleanUrl.includes("kyeto-chat-app.vercel.app")) {
        cleanUrl = cleanUrl.replace(/https?:\/\/kyeto-chat-app\.vercel\.app/g, backendOrigin);
      }
      if (cleanUrl.includes("localhost:5001") || cleanUrl.includes("127.0.0.1:5001")) {
        cleanUrl = cleanUrl
          .replace(/https?:\/\/localhost:5001/g, backendOrigin)
          .replace(/https?:\/\/127\.0\.0\.1:5001/g, backendOrigin);
      }
      if (cleanUrl.startsWith("/uploads/")) {
        cleanUrl = `${backendOrigin}${cleanUrl}`;
      }
      if (cleanUrl.startsWith("http://") && !cleanUrl.includes("localhost")) {
        cleanUrl = cleanUrl.replace("http://", "https://");
      }
      return cleanUrl;
    }
  }

  return url;
}
