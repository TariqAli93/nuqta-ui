<template>
  <div class="nq-page">
    <PageHeader :title="t('categories.title')" :subtitle="t('categories.subtitle')">
      <template #actions>
        <v-btn color="primary" @click="openCreateDialog" prepend-icon="mdi-plus">
          {{ t('categories.add') }}
        </v-btn>
      </template>
    </PageHeader>

    <v-card class="nq-table-card">
      <v-skeleton-loader v-if="loading" type="table-row@3" class="ma-4" />

      <v-data-table
        v-else-if="categories.length > 0"
        :headers="tableHeaders"
        :items="categories"
        density="comfortable"
      >
        <template #item.name="{ item }">
          <div class="d-flex align-center ga-3">
            <v-avatar size="32" color="primary" variant="tonal">
              <v-icon size="18">mdi-shape-outline</v-icon>
            </v-avatar>
            <span class="font-weight-medium">{{ item.name }}</span>
          </div>
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex ga-1">
            <v-btn
              size="small"
              variant="text"
              prepend-icon="mdi-pencil"
              @click="openEditDialog(item)"
            >
              {{ t('common.edit') }}
            </v-btn>
            <v-btn
              size="small"
              variant="text"
              color="error"
              prepend-icon="mdi-delete-outline"
              @click="openDeleteDialog(item)"
            >
              {{ t('common.delete') }}
            </v-btn>
          </div>
        </template>
      </v-data-table>

      <EmptyState
        v-else
        icon="mdi-shape-outline"
        :title="t('categories.empty')"
        :description="t('categories.emptyHint')"
        :action-label="t('categories.add')"
        action-icon="mdi-plus"
        @action="openCreateDialog"
      />
    </v-card>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialogOpen" max-width="480">
      <v-card>
        <v-card-title class="pt-5 px-6">
          {{ editingId === null ? t('categories.dialogAdd') : t('categories.dialogEdit') }}
        </v-card-title>
        <v-card-text class="px-6 py-4">
          <v-text-field v-model="name" :label="t('categories.name')" required autofocus />
        </v-card-text>
        <v-card-actions class="px-6 pb-5 ga-2 justify-end">
          <v-btn variant="text" @click="dialogOpen = false">{{ t('common.cancel') }}</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" @click="saveCategory">
            {{ t('common.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Dialog -->
    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card>
        <v-card-title class="pt-5 px-6">{{ t('common.delete') }}</v-card-title>
        <v-card-text class="px-6 py-4">{{ t('categories.deleteConfirm') }}</v-card-text>
        <v-card-actions class="px-6 pb-5 ga-2 justify-end">
          <v-btn variant="text" @click="deleteDialog = false">{{ t('common.cancel') }}</v-btn>
          <v-btn color="error" variant="flat" :loading="deleting" @click="confirmDelete">
            {{ t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { mapErrorToArabic, t } from '../../i18n/t';
import { categoriesClient } from '../../api';
import EmptyState from '@/components/common/EmptyState.vue';
import PageHeader from '@/components/common/PageHeader.vue';
import type { Category } from '../../types/domain';
import { notifyError, notifySuccess, notifyWarn } from '@/utils/notify';

const tableHeaders = computed(() => [
  { title: t('categories.name'), key: 'name' },
  { title: '', key: 'actions', sortable: false, width: 220 },
]);

const categories = ref<Category[]>([]);
const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);

const dialogOpen = ref(false);
const deleteDialog = ref(false);
const editingId = ref<number | null>(null);
const deletingId = ref<number | null>(null);
const name = ref('');

async function loadCategories() {
  loading.value = true;

  const result = await categoriesClient.getAll({});
  if (result.ok) {
    const data = result.data as unknown;
    categories.value = Array.isArray(data) ? (data as Category[]) : [];
  } else {
    notifyError(mapErrorToArabic(result.error, 'errors.loadFailed'));
  }

  loading.value = false;
}

function openCreateDialog() {
  editingId.value = null;
  name.value = '';
  dialogOpen.value = true;
}

function openEditDialog(category: Category) {
  editingId.value = category.id ?? null;
  name.value = category.name;
  dialogOpen.value = true;
}

async function saveCategory() {
  if (!name.value.trim()) {
    notifyWarn(t('errors.invalidData'));
    return;
  }

  saving.value = true;

  if (editingId.value === null) {
    const result = await categoriesClient.create({
      name: name.value.trim(),
      description: null,
      isActive: true,
    });

    if (!result.ok) {
      notifyError(mapErrorToArabic(result.error, 'errors.saveFailed'));
      saving.value = false;
      return;
    }
  } else {
    const result = await categoriesClient.update(editingId.value, {
      name: name.value.trim(),
    });

    if (!result.ok) {
      notifyError(mapErrorToArabic(result.error, 'errors.saveFailed'));
      saving.value = false;
      return;
    }
  }

  saving.value = false;
  dialogOpen.value = false;
  await loadCategories();
  notifySuccess(t('common.saved'));
}

function openDeleteDialog(category: Category) {
  deletingId.value = category.id ?? null;
  deleteDialog.value = true;
}

async function confirmDelete() {
  if (deletingId.value === null) {
    deleteDialog.value = false;
    return;
  }

  deleting.value = true;

  const result = await categoriesClient.delete(deletingId.value);
  if (!result.ok) {
    notifyError(mapErrorToArabic(result.error, 'errors.deleteFailed'));
  } else {
    await loadCategories();
    notifySuccess(t('common.deleted'));
  }

  deleting.value = false;
  deleteDialog.value = false;
  deletingId.value = null;
}

onMounted(() => {
  void loadCategories();
});
</script>
