"use client";

import { create } from "zustand";
import { api } from "../lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  // Add other user properties as needed
}

interface UserState {
  user: User | null;
  loading: boolean;
  fetchUser: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  loading: true,

  fetchUser: async () => {
    try {
      const res = await api.get("/me");
      set({ user: res.data.data, loading: false });
    } catch (err) {
      console.log("User load error");
      set({ loading: false });
    }
  },
}));
