/**
 * Fix file and media URLs for multi-environment support (Local, Hosting, Vercel + Backend).
 * Resolves localhost:5001 and relative /uploads/ paths to the correct backend origin.
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
      // Replace localhost references with live backend origin
      if (url.includes("localhost:5001") || url.includes("127.0.0.1:5001")) {
        return url
          .replace(/https?:\/\/localhost:5001/g, backendOrigin)
          .replace(/https?:\/\/127\.0\.0\.1:5001/g, backendOrigin);
      }
      if (url.startsWith("/uploads/")) {
        return `${backendOrigin}${url}`;
      }
      // Convert http to https for production audio streaming security
      if (url.startsWith("http://") && !url.includes("localhost")) {
        return url.replace("http://", "https://");
      }
    }
  }

  return url;
}
