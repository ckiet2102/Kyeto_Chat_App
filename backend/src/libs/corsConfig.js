export const getCorsOrigins = () => {
  const envOrigins = (process.env.CLIENT_URL || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const defaultOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "https://kyeto-chat-app.vercel.app",
  ];

  return Array.from(new Set([...envOrigins, ...defaultOrigins]));
};

export const corsOptionsDelegate = (req, callback) => {
  const origin = req.header("Origin");
  if (!origin) return callback(null, { origin: true, credentials: true });

  const allowedList = getCorsOrigins();

  if (
    allowedList.includes(origin) ||
    allowedList.includes("*") ||
    origin.includes("localhost") ||
    origin.includes("127.0.0.1") ||
    origin.endsWith(".vercel.app")
  ) {
    return callback(null, { origin: true, credentials: true });
  }

  // Allow dynamic origin matching for custom domains
  return callback(null, { origin: true, credentials: true });
};

export const socketCorsOriginDelegate = (origin, callback) => {
  if (!origin) return callback(null, true);

  const allowedList = getCorsOrigins();

  if (
    allowedList.includes(origin) ||
    allowedList.includes("*") ||
    origin.includes("localhost") ||
    origin.includes("127.0.0.1") ||
    origin.endsWith(".vercel.app")
  ) {
    return callback(null, true);
  }

  return callback(null, true);
};
