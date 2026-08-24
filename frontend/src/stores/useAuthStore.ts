import { create } from "zustand";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import type { AuthState } from "@/types/store";
import { persist } from "zustand/middleware";
import { useChatStore } from "./useChatStore";
import { CryptoService } from "@/services/cryptoService";

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      loading: false,
      temp2FAToken: null,
      requires2FA: false,

      setAccessToken: (accessToken) => {
        set({ accessToken });
      },
      setUser: (user) => {
        set({ user });
      },
      clearState: () => {
        set({ accessToken: null, user: null, loading: false, temp2FAToken: null, requires2FA: false });
        useChatStore.getState().reset();
        localStorage.clear();
        sessionStorage.clear();
      },
      signUp: async (username, password, email, firstName, lastName) => {
        try {
          set({ loading: true });

          const data = await authService.signUp(username, password, email, firstName, lastName);

          toast.success(
            data.message || "Đăng ký thành công! Vui lòng nhập mã OTP 6 số đã được gửi đến email."
          );
          return { success: true, requiresOTP: data.requiresOTP, email: data.email || email };
        } catch (error: any) {
          console.error(error);
          const errorMsg = error?.response?.data?.message || "Đăng ký không thành công";
          toast.error(errorMsg);
          return { success: false, error: errorMsg };
        } finally {
          set({ loading: false });
        }
      },
      signIn: async (username, password) => {
        try {
          get().clearState();
          set({ loading: true });

          const data = await authService.signIn(username, password);

          if (data.requires2FA) {
            set({ requires2FA: true, temp2FAToken: data.tempToken });
            toast.info("Tài khoản đã bật 2FA. Vui lòng nhập mã xác nhận.");
            return { success: false, requires2FA: true };
          }

          get().setAccessToken(data.accessToken);
          await get().fetchMe();
          useChatStore.getState().fetchConversations();

          toast.success("Chào mừng bạn quay lại với Kyeto 🎉");
          return { success: true };
        } catch (error: any) {
          console.error(error);
          const msg = error?.response?.data?.message || "Đăng nhập không thành công!";
          toast.error(msg);
          return { success: false, error: msg };
        } finally {
          set({ loading: false });
        }
      },
      validate2FALogin: async (code: string) => {
        try {
          set({ loading: true });
          const { temp2FAToken } = get();
          if (!temp2FAToken) {
            toast.error("Phiên 2FA hết hạn.");
            return false;
          }

          const data = await authService.validate2FALogin(temp2FAToken, code);
          set({ requires2FA: false, temp2FAToken: null });
          get().setAccessToken(data.accessToken);
          await get().fetchMe();
          useChatStore.getState().fetchConversations();

          toast.success("Xác thực 2FA thành công! 🎉");
          return true;
        } catch (error: any) {
          console.error(error);
          const msg = error?.response?.data?.message || "Mã 2FA không đúng!";
          toast.error(msg);
          return false;
        } finally {
          set({ loading: false });
        }
      },
      signOut: async () => {
        try {
          get().clearState();
          await authService.signOut();
          toast.success("Logout thành công!");
        } catch (error) {
          console.error(error);
          toast.error("Lỗi xảy ra khi logout. Hãy thử lại!");
        }
      },
      fetchMe: async () => {
        try {
          set({ loading: true });
          const user = await authService.fetchMe();
          set({ user });
          if (user?._id || user?.id) {
            CryptoService.initUserKeys(user._id || user.id);
          }
        } catch (error) {
          console.error(error);
          set({ user: null, accessToken: null });
          toast.error("Lỗi xảy ra khi lấy dữ liệu người dùng. Hãy thử lại!");
        } finally {
          set({ loading: false });
        }
      },
      refresh: async () => {
        try {
          set({ loading: true });
          const { user, fetchMe, setAccessToken } = get();
          const accessToken = await authService.refresh();

          setAccessToken(accessToken);

          if (!user) {
            await fetchMe();
          }
        } catch (error) {
          console.error(error);
          toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
          get().clearState();
        } finally {
          set({ loading: false });
        }
      },
      signInWithGoogle: async (credentialOrToken: string) => {
        try {
          get().clearState();
          set({ loading: true });

          const data = await authService.verifyGoogleToken(credentialOrToken);

          get().setAccessToken(data.accessToken);
          await get().fetchMe();
          useChatStore.getState().fetchConversations();

          toast.success("Đăng nhập bằng tài khoản Google thành công! 🎉");
          return true;
        } catch (error: any) {
          console.error("Lỗi Google Sign-In:", error);
          const msg = error?.response?.data?.message || "Đăng nhập Google thất bại!";
          toast.error(msg);
          return false;
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user }), // chỉ persist user
    }
  )
);
