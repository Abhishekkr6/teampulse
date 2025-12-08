"use client";

import { create } from "zustand";
import { connectWS, subscribeWS } from "../lib/ws";

interface LiveEvent {
  type: string;
  prId?: string;
  [key: string]: unknown;
}

interface LiveState {
  wsConnected: boolean;
  lastEvent: LiveEvent | null;
  livePRs: LiveEvent[];
  alerts: LiveEvent[];
  init: () => void;
  reset: () => void;
}

export const useLiveStore = create<LiveState>((set, get) => ({
  wsConnected: false,
  lastEvent: null,
  livePRs: [],
  alerts: [],

  init: () => {
    connectWS();
    subscribeWS((event: unknown) => {
      const liveEvent = event as LiveEvent;
      set({ lastEvent: liveEvent });

      if (liveEvent.type === "PR_UPDATED") {
        set({
          livePRs: [
            ...get().livePRs.filter((p) => p.prId !== liveEvent.prId),
            liveEvent,
          ],
        });
      }

      if (liveEvent.type === "NEW_ALERT") {
        set({
          alerts: [liveEvent, ...get().alerts],
        });
      }
    });
  },

  reset: () => {
    set({ wsConnected: false, lastEvent: null, livePRs: [], alerts: [] });
  },
}));
