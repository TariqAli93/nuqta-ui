<template>
  <PageShell>
    <PageHeader :title="t('profile.title')" :subtitle="t('profile.subtitle')" />

    <v-card class="win-card--padded border" elevation="0" variant="flat" rounded="lg">
      <v-list>
        <v-list-item
          :title="t('common.fullName')"
          :subtitle="authStore.user?.fullName ?? t('common.none')"
        />
        <v-list-item
          :title="t('profile.username')"
          :subtitle="authStore.user?.username ?? t('common.none')"
        />
        <v-list-item
          :title="t('profile.role')"
          :subtitle="mapRoleToArabic(authStore.user?.role)"
        />
        <v-list-item
          :title="t('profile.lastLogin')"
          :subtitle="formatLastLogin(authStore.user?.lastLoginAt)"
        />
      </v-list>

      <div class="d-flex ga-2 mt-4">
        <v-btn class="win-btn" color="error" variant="flat" @click="logout">
          {{ t('profile.logout') }}
        </v-btn>
        <v-btn
          class="win-ghost-btn"
          variant="outlined"
          :disabled="!authStore.user?.username"
          @click="openPasswordDialog"
        >
          {{ t('profile.changePassword') }}
        </v-btn>
      </div>
    </v-card>

    <v-dialog v-model="passwordDialog" max-width="520" class="ds-dialog">
      <v-card rounded="lg">
        <v-card-title>{{ t('profile.changePassword') }}</v-card-title>
        <v-card-text>
          <v-form class="d-flex flex-column ga-4" @submit.prevent="changePassword">
            <v-text-field
              v-model="currentPassword"
              :label="t('profile.currentPassword')"
              type="password"
              required
              variant="outlined" density="comfortable"
            />
            <v-text-field
              v-model="newPassword"
              :label="t('profile.newPassword')"
              type="password"
              required
              variant="outlined" density="comfortable"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn class="win-ghost-btn" variant="text" @click="passwordDialog = false">{{ t('common.cancel') }}</v-btn>
          <v-btn class="win-btn" color="primary" variant="flat" :loading="saving" @click="changePassword">
            {{ t('common.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </PageShell>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { PageShell, PageHeader } from '@/components/layout';
import { useAuthStore } from '@/stores/authStore';
import { authClient } from '@/api';
import { mapErrorToArabic, mapRoleToArabic, t } from '@/i18n/t';
import { notifyError, notifySuccess, notifyWarn } from '@/utils/notify';

const authStore = useAuthStore();
const router = useRouter();

const passwordDialog = ref(false);
const currentPassword = ref('');
const newPassword = ref('');
const saving = ref(false);

function formatLastLogin(value?: string | null): string {
  if (!value) return t('common.none');
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t('common.none');
  return date.toLocaleString('ar-IQ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function logout() {
  authStore.logout();
  router.push('/auth/login');
}

function openPasswordDialog() {
  if (!authStore.user?.username) return;
  currentPassword.value = '';
  newPassword.value = '';
  passwordDialog.value = true;
}

async function changePassword() {
  if (!authStore.user?.username) {
    notifyWarn(t('common.notAvailable'));
    return;
  }
  if (!currentPassword.value.trim() || !newPassword.value.trim()) {
    notifyWarn(t('errors.invalidData'));
    return;
  }

  saving.value = true;
  try {
    const result = await authClient.changePassword({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    });
    if (!result.ok) {
      notifyError(mapErrorToArabic(result.error, 'errors.saveFailed'));
    } else {
      passwordDialog.value = false;
      notifySuccess(t('profile.passwordChanged'));
    }
  } finally {
    saving.value = false;
  }
}
</script>
