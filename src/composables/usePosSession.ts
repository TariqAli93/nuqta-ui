import { computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useTheme } from 'vuetify';
import { useAuthStore } from '@/stores/authStore';
import { useVuetifyStore } from '@/stores/vuetify';
import { initEventBridge, destroyEventBridge } from '@/plugins/eventBridge';
import { t } from '@/i18n/t';

export function usePosSession() {
  const authStore = useAuthStore();
  const router = useRouter();
  const vuetifyStore = useVuetifyStore();
  const vuetifyTheme = useTheme();

  const currentUser = computed(() => authStore.user?.fullName ?? t('common.none'));

  const currentDate = computed(() => {
    const now = new Date();
    return now.toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'numeric',
      day: '2-digit',
      numberingSystem: 'latn',
    });
  });

  const shiftTime = computed(() => {
    const now = new Date();
    return now.toLocaleTimeString('ar-IQ', {
      hour: '2-digit',
      minute: '2-digit',
      numberingSystem: 'latn',
    });
  });

  function toggleTheme() {
    vuetifyTheme.change(vuetifyTheme.global.name.value === 'dark' ? 'light' : 'dark');
    vuetifyStore.toggleTheme();
  }

  function logout() {
    authStore.logout();
    router.push('/auth/login');
  }

  watch(
    () => authStore.isAuthenticated,
    (isAuth) => {
      if (!isAuth) logout();
    }
  );

  onMounted(() => {
    if (!authStore.isAuthenticated) {
      logout();
      return;
    }
    initEventBridge();
  });

  onUnmounted(() => {
    destroyEventBridge();
  });

  return { currentUser, currentDate, shiftTime, toggleTheme, logout };
}
