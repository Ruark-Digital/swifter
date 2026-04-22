import { create } from "zustand";

export type CollaborationTab = "comments" | "log";

type CollaborationStoreState = {
  activeTab: CollaborationTab;
  hasVisitedLog: boolean;
  presenceActive: boolean;
  setActiveTab: (tab: CollaborationTab) => void;
  setPresenceActive: (active: boolean) => void;
};

export const useCollaborationStore = create<CollaborationStoreState>((set) => ({
  activeTab: "comments",
  hasVisitedLog: false,
  presenceActive: true,
  setActiveTab: (tab) =>
    set((state) => ({
      activeTab: tab,
      hasVisitedLog: state.hasVisitedLog || tab === "log",
    })),
  setPresenceActive: (presenceActive) => set({ presenceActive }),
}));
