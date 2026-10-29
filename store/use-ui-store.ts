// store/use-ui-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  /** Desktop: icon-only rail. Persisted per browser. */
  sidebarCollapsed: boolean;
  /** Mobile: off-canvas drawer visibility. Never persisted. */
  mobileNavOpen: boolean;
  toggleSidebar: () => void;
  setMobileNavOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileNavOpen: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
    }),
    {
      name: 'techbox-ui',
      partialize: ({ sidebarCollapsed }) => ({ sidebarCollapsed }),
      skipHydration: true,
    },
  ),
);
