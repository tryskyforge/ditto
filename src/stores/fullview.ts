import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { Guide, Screenshot, Step } from '@/core/guides/types';

interface GuideExportData {
  guideId: string;
  guide: Guide;
  steps: Step[];
  screenshots: Map<string, Screenshot>;
}

interface FullviewStore {
  guides: Guide[];
  setGuides: (guides: Guide[]) => void;
  updateGuide: (id: string, patch: Partial<Guide>) => void;
  thumbnails: Map<string, Screenshot>;
  setThumbnails: (thumbnails: Map<string, Screenshot>) => void;
  libraryLoading: boolean;
  setLibraryLoading: (loading: boolean) => void;
  counts: { all: number; starred: number; trash: number };
  setCounts: (counts: { all: number; starred: number; trash: number }) => void;

  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  toggleSearch: () => void;

  guideTitle: string;
  setGuideTitle: (title: string) => void;
  guideStepCount: number;
  setGuideStepCount: (count: number) => void;
  guideExportData: GuideExportData | null;
  setGuideExportData: (data: GuideExportData | null) => void;
  scrollToStepId: string | null;
  scrollToStep: (stepId: string) => void;
  activeStepId: string | null;
  setActiveStepId: (id: string | null) => void;

  editing: boolean;
  setEditing: (editing: boolean) => void;
  historyOpen: boolean;
  setHistoryOpen: (open: boolean) => void;
  historyRefreshKey: number;
  bumpHistoryRefresh: () => void;
}

function flushFocusedField() {
  const el = document.activeElement;
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) el.blur();
}

export const useFullviewStore = create<FullviewStore>((set) => ({
  guides: [],
  setGuides: (guides) => set({ guides }),
  updateGuide: (id, patch) => set((s) => ({ guides: s.guides.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),
  thumbnails: new Map(),
  setThumbnails: (thumbnails) => set({ thumbnails }),
  libraryLoading: true,
  setLibraryLoading: (libraryLoading) => set({ libraryLoading }),
  counts: { all: 0, starred: 0, trash: 0 },
  setCounts: (counts) => set({ counts }),

  searchOpen: false,
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  toggleSearch: () => set((s) => ({ searchOpen: !s.searchOpen })),

  guideTitle: '',
  setGuideTitle: (guideTitle) => set({ guideTitle }),
  guideStepCount: 0,
  setGuideStepCount: (guideStepCount) => set({ guideStepCount }),
  guideExportData: null,
  setGuideExportData: (guideExportData) =>
    set((s) =>
      s.guideExportData?.guideId === guideExportData?.guideId
        ? { guideExportData }
        : { guideExportData, editing: false, historyOpen: false, historyRefreshKey: 0 },
    ),
  scrollToStepId: null,
  scrollToStep: (stepId) => {
    set({ scrollToStepId: stepId });
    setTimeout(() => set({ scrollToStepId: null }), 100);
  },
  activeStepId: null,
  setActiveStepId: (activeStepId) => set({ activeStepId }),

  editing: false,
  setEditing: (editing) => {
    if (!editing) flushFocusedField();
    set({ editing });
  },
  historyOpen: false,
  setHistoryOpen: (historyOpen) => {
    if (historyOpen) flushFocusedField();
    set({ historyOpen });
  },
  historyRefreshKey: 0,
  bumpHistoryRefresh: () => set((s) => ({ historyRefreshKey: s.historyRefreshKey + 1 })),
}));

export function useFullview<T>(selector: (s: FullviewStore) => T): T {
  return useFullviewStore(useShallow(selector));
}
