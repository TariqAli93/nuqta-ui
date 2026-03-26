<template>
  <component :is="props.embedded ? 'div' : PageShell">
    <!-- Full-page header (non-embedded) -->
    <PageHeader v-if="!props.embedded" :title="t('users.title')" :subtitle="t('users.subtitle')">
      <template #actions>
        <v-btn
          class="win-btn"
          color="primary"
          prepend-icon="mdi-plus"
          :disabled="!canCreate"
          @click="openCreateDialog"
        >
          {{ t('users.add') }}
        </v-btn>
      </template>
    </PageHeader>

    <!-- Embedded inline header -->
    <div v-else class="d-flex justify-space-between align-center mb-4">
      <div class="text-subtitle-1 font-weight-bold">{{ t('users.title') }}</div>
      <v-btn
        class="win-btn"
        color="primary"
        prepend-icon="mdi-plus"
        :disabled="!canCreate"
        @click="openCreateDialog"
      >
        {{ t('users.add') }}
      </v-btn>
    </div>

    <v-card class="border" elevation="0" variant="flat" rounded="lg">
      <v-card-text class="pa-0">
        <v-skeleton-loader v-if="loading" type="table" />
        <v-data-table
          v-else
          :headers="tableHeaders"
          :items="users"
          density="comfortable"
          class="ds-table-enhanced ds-table-striped"
          :hide-default-footer="true"
        >
          <template #item.role="{ item }">
            {{ mapRoleToArabic(item.role) }}
          </template>
          <template #item.isActive="{ item }">
            <v-chip size="small" :color="item.isActive ? 'success' : 'warning'" variant="tonal">
              {{ item.isActive ? t('users.active') : t('users.inactive') }}
            </v-chip>
          </template>
          <template #item.actions="{ item }">
            <div class="d-flex ga-2">
              <v-btn
                size="small"
                variant="text"
                :disabled="!canEdit"
                @click="openEditDialog(item)"
              >
                {{ t('common.edit') }}
              </v-btn>
              <v-btn
                size="small"
                variant="text"
                :color="item.isActive ? 'warning' : 'success'"
                :loading="togglingId === item.id"
                :disabled="!canEdit"
                @click="toggleUserState(item)"
              >
                {{ item.isActive ? t('common.disable') : t('common.enable') }}
              </v-btn>
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <v-dialog v-model="dialogOpen" max-width="520" class="ds-dialog">
      <v-card rounded="lg">
        <v-card-title>
          {{ isEditMode ? t('users.editDialog') : t('users.createDialog') }}
        </v-card-title>
        <v-card-text>
          <v-form class="d-flex flex-column ga-4" @submit.prevent="saveUser">
            <v-text-field v-model="form.username" :label="t('users.username')" required variant="outlined" density="comfortable" />
            <v-text-field v-model="form.fullName" :label="t('users.fullName')" required variant="outlined" density="comfortable" />
            <v-text-field v-model="form.phone" :label="t('common.phone')" variant="outlined" density="comfortable" />
            <v-select
              v-model="form.role"
              :label="t('users.role')"
              :items="roleOptions"
              item-title="title"
              item-value="value"
              required
              variant="outlined" density="comfortable"
            />
            <v-text-field
              v-model="form.password"
              type="password"
              :label="t('users.password')"
              :hint="isEditMode ? t('users.passwordHint') : undefined"
              persistent-hint
              :required="!isEditMode"
              variant="outlined" density="comfortable"
            />
            <v-switch v-model="form.isActive" :label="t('users.active')" inset color="primary" hide-details />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn class="win-ghost-btn" variant="text" @click="closeDialog">{{ t('common.cancel') }}</v-btn>
          <v-btn class="win-btn" color="primary" variant="flat" :loading="saving" @click="saveUser">
            {{ t('common.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </component>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { PageShell, PageHeader } from '@/components/layout';
import { mapErrorToArabic, mapRoleToArabic, t } from '@/i18n/t';
import { usersClient } from '@/api';
import { useAuthStore } from '@/stores/authStore';
import type { UserInput, UserPublic, UserRole } from '@/types/domain';
import { notifyError, notifySuccess, notifyWarn } from '@/utils/notify';

const props = withDefaults(
  defineProps<{
    embedded?: boolean;
  }>(),
  {
    embedded: false,
  }
);

const authStore = useAuthStore();

const canCreate = computed(() => authStore.permissions.includes('users:create'));
const canEdit = computed(() => authStore.permissions.includes('users:update'));

const tableHeaders = computed(() => [
  { title: t('users.username'), key: 'username' },
  { title: t('users.fullName'), key: 'fullName' },
  { title: t('users.role'), key: 'role' },
  { title: t('users.state'), key: 'isActive' },
  { title: t('common.actions'), key: 'actions', sortable: false },
]);

type UserRow = UserPublic & {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  phone?: string | null;
};

const users = ref<UserRow[]>([]);
const loading = ref(false);
const saving = ref(false);
const dialogOpen = ref(false);
const editingId = ref<number | null>(null);
const togglingId = ref<number | null>(null);

const form = reactive<UserInput & { password: string }>({
  username: '',
  fullName: '',
  role: 'cashier',
  isActive: true,
  phone: null,
  password: '',
});

const isEditMode = computed(() => editingId.value !== null);

const roleOptions = computed(() => [
  { title: t('users.admin'), value: 'admin' },
  { title: t('users.manager'), value: 'manager' },
  { title: t('users.cashier'), value: 'cashier' },
  { title: t('users.viewer'), value: 'viewer' },
]);

function resetForm() {
  form.username = '';
  form.fullName = '';
  form.role = 'cashier';
  form.isActive = true;
  form.phone = null;
  form.password = '';
}

async function loadUsers() {
  loading.value = true;
  const result = await usersClient.getAll({});
  if (result.ok) {
    const data = result.data as unknown;
    users.value = Array.isArray(data)
      ? (data as UserRow[])
      : Array.isArray((data as { items?: unknown[] }).items)
        ? ((data as { items: UserRow[] }).items ?? [])
        : [];
  } else {
    notifyError(mapErrorToArabic(result.error, 'errors.loadFailed'));
  }
  loading.value = false;
}

function openCreateDialog() {
  editingId.value = null;
  resetForm();
  dialogOpen.value = true;
}

function openEditDialog(user: UserRow) {
  editingId.value = user.id;
  form.username = user.username;
  form.fullName = user.fullName;
  form.role = user.role;
  form.isActive = user.isActive;
  form.phone = user.phone ?? null;
  form.password = '';
  dialogOpen.value = true;
}

function closeDialog() {
  dialogOpen.value = false;
  editingId.value = null;
  resetForm();
}

async function saveUser() {
  if (!form.username.trim() || !form.fullName.trim()) {
    notifyWarn(t('errors.invalidData'));
    return;
  }
  if (!isEditMode.value && !form.password.trim()) {
    notifyWarn(t('errors.invalidData'));
    return;
  }

  saving.value = true;
  try {
    if (isEditMode.value && editingId.value !== null) {
      const payload: Partial<UserInput> = {
        username: form.username,
        fullName: form.fullName,
        role: form.role,
        isActive: form.isActive,
        phone: form.phone,
      };
      if (form.password.trim()) {
        payload.password = form.password.trim();
      }
      const result = await usersClient.update(editingId.value, payload);
      if (!result.ok) {
        notifyError(mapErrorToArabic(result.error, 'errors.saveFailed'));
        return;
      }
    } else {
      const result = await usersClient.create({
        username: form.username,
        fullName: form.fullName,
        role: form.role,
        isActive: form.isActive,
        phone: form.phone,
        password: form.password,
      });
      if (!result.ok) {
        notifyError(mapErrorToArabic(result.error, 'errors.saveFailed'));
        return;
      }
    }
    closeDialog();
    await loadUsers();
    notifySuccess(t('common.saved'));
  } finally {
    saving.value = false;
  }
}

async function toggleUserState(user: UserRow) {
  togglingId.value = user.id;
  const result = await usersClient.update(user.id, {
    isActive: !user.isActive,
  });
  if (!result.ok) {
    notifyError(mapErrorToArabic(result.error, 'errors.saveFailed'));
  } else {
    await loadUsers();
    notifySuccess(t('common.saved'));
  }
  togglingId.value = null;
}

onMounted(() => {
  void loadUsers();
});
</script>
