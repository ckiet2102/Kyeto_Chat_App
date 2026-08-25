import { BrowserRouter, Route, Routes } from "react-router";
import SignInPage from "./pages/SignInPage";
import ChatAppPage from "./pages/ChatAppPage";
import { Toaster } from "sonner";
import SignUpPage from "./pages/SignUpPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { useThemeStore } from "./stores/useThemeStore";
import { useEffect } from "react";
import { useAuthStore } from "./stores/useAuthStore";
import { useSocketStore } from "./stores/useSocketStore";

import IncomingCallModal from "./components/chat/IncomingCallModal";
import CallModal from "./components/chat/CallModal";
import GroupCallModal from "./components/chat/GroupCallModal";
import IncomingGroupCallModal from "./components/chat/IncomingGroupCallModal";

import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { OAuthCallbackPage } from "./pages/OAuthCallbackPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { TwoFactorVerify } from "./components/auth/TwoFactorVerify";
import { JoinGroupPage } from "./pages/JoinGroupPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";

import { CryptoService } from "./services/cryptoService";

function App() {
  const { isDark, setTheme } = useThemeStore();
  const { accessToken, user, requires2FA } = useAuthStore();
  const { connectSocket, disconnectSocket } = useSocketStore();

  useEffect(() => {
    setTheme(isDark);
  }, [isDark]);

  useEffect(() => {
    if (accessToken) {
      connectSocket();
      if (user?._id) {
        CryptoService.initUserKeys(user._id);
      }
    }

    return () => disconnectSocket();
  }, [accessToken, user?._id]);

  if (requires2FA) {
    return (
      <>
        <Toaster richColors />
        <BrowserRouter>
          <Routes>
            <Route path="*" element={<TwoFactorVerify />} />
          </Routes>
        </BrowserRouter>
      </>
    );
  }

  return (
    <>
      <Toaster richColors />
      <IncomingCallModal />
      <IncomingGroupCallModal />
      <CallModal />
      <GroupCallModal />
      <BrowserRouter>
        <Routes>
          {/* public routes */}
          <Route
            path="/signin"
            element={<SignInPage />}
          />
          <Route
            path="/signup"
            element={<SignUpPage />}
          />
          <Route
            path="/forgot-password"
            element={<ForgotPasswordPage />}
          />
          <Route
            path="/reset-password"
            element={<ResetPasswordPage />}
          />
          <Route
            path="/oauth-callback"
            element={<OAuthCallbackPage />}
          />
          <Route
            path="/verify-email"
            element={<VerifyEmailPage />}
          />
          <Route
            path="/join/:inviteCode"
            element={<JoinGroupPage />}
          />
          <Route
            path="/terms"
            element={<TermsPage />}
          />
          <Route
            path="/privacy"
            element={<PrivacyPage />}
          />

          {/* protectect routes */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/"
              element={<ChatAppPage />}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
