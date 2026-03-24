// src/stores/layout.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

function readStoredWidth(): number {
  try {
    return Number(localStorage.getItem('drawerWidth')) || 300;
  } catch {
    return 300;
  }
}

export type PosLayoutMode = 'grid' | 'list';

function readPosLayout(): PosLayoutMode {
  try {
    const stored = localStorage.getItem('posLayout');
    return stored === 'list' ? 'list' : 'grid';
  } catch {
    return 'grid';
  }
}

export const useLayoutStore = defineStore(
  'layout',
  () => {
    const drawerWidth = ref(readStoredWidth());
    const posLayout = ref<PosLayoutMode>(readPosLayout());

    function setDrawerWidth(width: number) {
      const w = clamp(Math.round(width), 300, 450);
      drawerWidth.value = w;
      try {
        localStorage.setItem('drawerWidth', String(w));
      } catch {
        /* noop */
      }
    }

    function setPosLayout(mode: PosLayoutMode) {
      posLayout.value = mode;
      try {
        localStorage.setItem('posLayout', mode);
      } catch {
        /* noop */
      }
    }

    function togglePosLayout() {
      setPosLayout(posLayout.value === 'grid' ? 'list' : 'grid');
    }

    return { drawerWidth, setDrawerWidth, posLayout, setPosLayout, togglePosLayout };
  },
  { persist: true }
);
