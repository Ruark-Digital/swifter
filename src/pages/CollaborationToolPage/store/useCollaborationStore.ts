import { create } from "zustand";

export type CollaborationTab = "comments" | "redline" | "versions";

type CollaborationStoreState = {
  activeTab: CollaborationTab;
  presenceActive: boolean;
  setActiveTab: (tab: CollaborationTab) => void;
  setPresenceActive: (active: boolean) => void;
};

export const useCollaborationStore = create<CollaborationStoreState>((set) => ({
  activeTab: "comments",
  presenceActive: true,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setPresenceActive: (presenceActive) => set({ presenceActive }),
}));
