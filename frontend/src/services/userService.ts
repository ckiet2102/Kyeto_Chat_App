import api from "@/lib/axios";

export const userService = {
  uploadAvatar: async (formData: FormData) => {
    const res = await api.post("/users/uploadAvatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  uploadCover: async (formData: FormData) => {
    const res = await api.post("/users/uploadCover", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  updateProfile: async (data: { displayName?: string; bio?: string; phone?: string; showOnlineStatus?: boolean }) => {
    const res = await api.put("/users/profile", data);
    return res.data;
  },
  changePassword: async (data: { oldPassword: string; newPassword: string }) => {
    const res = await api.put("/users/change-password", data);
    return res.data;
  },
  toggleNotifications: async () => {
    const res = await api.put("/users/notifications");
    return res.data;
  },
  blockUser: async (targetUserId: string) => {
    const res = await api.post("/users/block", { targetUserId });
    return res.data;
  },
  unblockUser: async (targetUserId: string) => {
    const res = await api.post("/users/unblock", { targetUserId });
    return res.data;
  },
  getBlockedUsers: async () => {
    const res = await api.get("/users/blocked");
    return res.data;
  },
  reportUser: async (targetUserId: string, reason: string) => {
    const res = await api.post("/users/report", { targetUserId, reason });
    return res.data;
  },
  getUserProfile: async (userId: string) => {
    const res = await api.get(`/users/${userId}`);
    return res.data;
  },
};
