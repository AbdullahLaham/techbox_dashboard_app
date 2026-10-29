// store/use-classroom-store.ts
import { create } from 'zustand';

/**
 * The lesson open in the classroom. Only the id is kept: the page reads the lesson
 * from the current program data, so it never shows another program's lesson or a
 * stale copy (e.g. still locked after the enrollment was accepted).
 */
interface ClassroomState {
  activeNodeId: string | null;
  setActiveNodeId: (id: string | null) => void;
}

export const useClassroomStore = create<ClassroomState>((set) => ({
  activeNodeId: null,
  setActiveNodeId: (id) => set({ activeNodeId: id }),
}));
