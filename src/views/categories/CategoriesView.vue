<template>
  <div class="win-page">
    <div class="ds-page-header-block">
      <div>
        <div class="win-title">{{ t('categories.title') }}</div>
        <div class="win-subtitle">{{ t('categories.subtitle') }}</div>
      </div>
      <div class="ds-page-header__actions">
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">
          {{ t('categories.add') }}
        </v-btn>
      </div>
    </div>

    <v-card flat>
      <v-card-text class="pa-0">
        <v-skeleton-loader v-if="loading" type="table-row@3" class="ma-4" />

        <v-data-table
          v-else-if="categories.length > 0"
          :headers="tableHeaders"
          :items="categories"
          density="comfortable"
          class="ds-table-enhanced ds-table-striped"
          :hide-default-footer="true"
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
            <v-btn
              size="small"
              variant="text"
              class="win-ghost-btn"
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
      </v-card-text>
    </v-card>

    <v-dialog v-model="dialogOpen" max-width="500" class="ds-dialog">
      <v-card rounded="lg">
        <v-card-title>
          {{ editingId === null ? t('categories.dialogAdd') : t('categories.dialogEdit') }}
        </v-card-title>
        <v-card-text>
          <v-text-field v-model="name" :label="t('categories.name')" required autofocus />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogOpen = false">{{ t('common.cancel') }}</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" @click="saveCategory">
            {{ t('common.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="420" class="ds-dialog">
      <v-card rounded="lg">
        <v-card-title>{{ t('common.delete') }}</v-card-title>
        <v-card-text>{{ t('categories.deleteConfirm') }}</v-card-text>
        <v-card-actions>
          <v-spacer />
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
import { mapErrorToArabic, t } from '@/i18n/t';
import { categoriesClient } from '@/api';
import EmptyState from '@/components/common/EmptyState.vue';
import type { Category } from '@/types/domain';
import { notifyError, notifySuccess, notifyWarn } from '@/utils/notify';

const tableHeaders = computed(() => [
  { title: t('categories.name'), key: 'name' },
  { title: '', key: 'actions', sortable: false, width: 180 },
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
  try {
    const result = await categoriesClient.getAll({});
    if (result.ok) {
      categories.value = Array.isArray(result.data) ? (result.data as Category[]) : [];
    } else {
      notifyError(mapErrorToArabic(result.error, 'errors.loadFailed'));
    }
  } finally {
    loading.value = false;
  }
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
  try {
    if (editingId.value === null) {
      const result = await categoriesClient.create({
        name: name.value.trim(),
        description: null,
        isActive: true,
      });
      if (!result.ok) {
        notifyError(mapErrorToArabic(result.error, 'errors.saveFailed'));
        return;
      }
    } else {
      const result = await categoriesClient.update(editingId.value, {
        name: name.value.trim(),
      });
      if (!result.ok) {
        notifyError(mapErrorToArabic(result.error, 'errors.saveFailed'));
        return;
      }
    }
    dialogOpen.value = false;
    await loadCategories();
    notifySuccess(t('common.saved'));
  } finally {
    saving.value = false;
  }
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
  try {
    const result = await categoriesClient.delete(deletingId.value);
    if (!result.ok) {
      notifyError(mapErrorToArabic(result.error, 'errors.deleteFailed'));
    } else {
      await loadCategories();
      notifySuccess(t('common.deleted'));
    }
  } finally {
    deleting.value = false;
    deleteDialog.value = false;
    deletingId.value = null;
  }
}

onMounted(() => {
  void loadCategories();
});
</script>
