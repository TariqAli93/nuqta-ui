import { ref, computed, onMounted } from 'vue';
import type { Ref } from 'vue';
import isEqual from 'fast-deep-equal';
import { notifySuccess, notifyError } from '../utils/notify';

/**
 * Matches a Pinia composition-API store that exposes `data`, `loading`,
 * `fetch`, and `update`.  Pinia auto-unwraps refs, so the properties
 * are plain values — NOT `Ref` wrappers.
 */
export interface SettingsStore<T> {
  data: T | null | undefined;
  loading: boolean;
  fetch: (force?: boolean) => Promise<void>;
  update: (payload: Partial<T>) => Promise<void>;
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Generic composable for any settings page.
 *
 * @param store    – the Pinia settings store (no `as any` needed now)
 * @param message  – success toast shown after save
 * @param defaults – optional deep defaults for nested objects
 *                   (merged under store data so the template never
 *                    hits `undefined` on nested paths)
 */
export function useSettingsForm<T extends object>(
  store: SettingsStore<T>,
  message: string,
  defaults?: Partial<T>
) {
  const form = ref<T>(defaults ? (deepClone({ ...defaults }) as T) : ({} as T)) as Ref<T>;

  const saving = ref(false);
  const originalSnapshot = ref<T | null>(null);

  const isDirty = computed(() => {
    if (!originalSnapshot.value) return false;
    return !isEqual(form.value, originalSnapshot.value);
  });

  function syncFromStore(): void {
    if (store.data == null) return;

    // Deep-merge: defaults first, then actual data on top
    const merged = defaults
      ? { ...deepClone(defaults), ...deepClone(store.data) }
      : deepClone(store.data);

    form.value = merged as T;
    originalSnapshot.value = deepClone(merged) as T;
  }

  async function load(force = false): Promise<void> {
    await store.fetch(force);
    syncFromStore();
  }

  async function save(): Promise<void> {
    if (!isDirty.value) return;

    saving.value = true;
    try {
      await store.update(form.value);
      syncFromStore();
      notifySuccess(message);
    } catch {
      notifyError('فشل في حفظ الإعدادات');
    } finally {
      saving.value = false;
    }
  }

  function reset(): void {
    syncFromStore();
  }

  onMounted(() => {
    void load();
  });

  return { form, saving, isDirty, load, save, reset };
}
