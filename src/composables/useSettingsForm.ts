import { ref, computed, onMounted, type Ref } from 'vue';
import { notifySuccess, notifyError } from '../utils/notify';

interface SettingsStore<T> {
  data: Ref<T | null>;
  loading: Ref<boolean>;
  fetch: (force?: boolean) => Promise<void>;
  update: (payload: Partial<T>) => Promise<void>;
}

export function useSettingsForm<T extends object>(store: SettingsStore<T>, successMessage: string) {
  const form = ref<T>({} as T);
  const saving = ref(false);
  const originalSnapshot = ref<string>('');

  const isDirty = computed(() => JSON.stringify(form.value) !== originalSnapshot.value);

  function syncFromStore() {
    if (store.data.value) {
      form.value = { ...store.data.value };
      originalSnapshot.value = JSON.stringify(form.value);
    }
  }

  async function load() {
    await store.fetch();
    syncFromStore();
  }

  async function save() {
    if (!isDirty.value) return;
    saving.value = true;
    try {
      await store.update(form.value);
      syncFromStore();
      notifySuccess(successMessage);
    } catch {
      notifyError('فشل في حفظ الإعدادات');
    } finally {
      saving.value = false;
    }
  }

  function reset() {
    syncFromStore();
  }

  onMounted(() => {
    void load();
  });

  return { form, saving, isDirty, load, save, reset };
}
