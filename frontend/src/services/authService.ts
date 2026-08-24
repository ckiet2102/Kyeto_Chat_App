import api from "@/lib/axios";

export const authService = {
  signUp: async (
    username: string,
    password: string,
    email: string,
    firstName: string,
    lastName: string
  ) => {
    const res = await api.post(
      "/auth/signup",
      { username, password, email, firstName, lastName },
      { withCredentials: true }
    );
    return res.data;
  },

  verifyRegistrationOTP: async (email: string, otp: string) => {
    const res = await api.post(
      "/auth/verify-registration-otp",
      { email, otp },
      { withCredentials: true }
    );
    return res.data;
  },

  resendRegistrationOTP: async (email: string) => {
    const res = await api.post("/auth/resend-registration-otp", { email });
    return res.data;
  },

  signIn: async (username: string, password: string) => {
    const res = await api.post(
      "/auth/signin",
      { username, password },
      { withCredentials: true }
    );
    return res.data; // access token or { requires2FA: true, tempToken }
  },

  signOut: async () => {
    return api.post("/auth/signout", {}, { withCredentials: true });
  },

  fetchMe: async () => {
    const res = await api.get("/users/me", { withCredentials: true });
    return res.data.user;
  },

  refresh: async () => {
    const res = await api.post("/auth/refresh", {}, { withCredentials: true });
    return res.data.accessToken;
  },

  // 2FA Services
  setup2FA: async () => {
    const res = await api.post("/auth/2fa/setup", {}, { withCredentials: true });
    return res.data; // { secret, qrCodeDataUrl }
  },

  verify2FA: async (code: string) => {
    const res = await api.post("/auth/2fa/verify", { code }, { withCredentials: true });
    return res.data;
  },

  validate2FALogin: async (tempToken: string, code: string) => {
    const res = await api.post(
      "/auth/2fa/validate",
      { tempToken, code },
      { withCredentials: true }
    );
    return res.data; // { accessToken, user }
  },

  // Password Reset & Email Verification
  forgotPassword: async (email: string) => {
    const res = await api.post("/auth/forgot-password", { email });
    return res.data;
  },

  verifyOTP: async (email: string, otp: string) => {
    const res = await api.post("/auth/verify-otp", { email, otp });
    return res.data;
  },

  resetPassword: async (payload: { email?: string; otp?: string; token?: string; newPassword: string }) => {
    const res = await api.post("/auth/reset-password", payload);
    return res.data;
  },

  verifyEmail: async (token: string) => {
    const res = await api.get(`/auth/verify-email/${token}`);
    return res.data;
  },

  verifyGoogleToken: async (credentialOrToken: string) => {
    const res = await api.post(
      "/auth/google/verify",
      { credential: credentialOrToken, idToken: credentialOrToken },
      { withCredentials: true }
    );
    return res.data; // { accessToken, user }
  },
};
