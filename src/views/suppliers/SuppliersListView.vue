<template>
  <div class="win-page">
    <div class="ds-page-header-block">
      <div>
        <div class="win-title">{{ t('suppliers.title') }}</div>
        <div class="win-subtitle">{{ t('suppliers.subtitle') }}</div>
      </div>
      <div class="ds-page-header__actions">
        <v-btn color="primary" prepend-icon="mdi-plus" :to="{ name: 'SupplierCreate' }">
          {{ t('suppliers.new') }}
        </v-btn>
      </div>
    </div>

    <v-card flat class="ds-filter-bar">
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        :placeholder="t('common.search')"
        hide-details
        variant="outlined"
        density="comfortable"
        @update:model-value="onSearch"
      />
    </v-card>

    <v-card flat>
      <v-card-text class="pa-0">
        <v-data-table
          :headers="headers"
          :items="suppliersStore.items"
          :loading="suppliersStore.loading"
          :items-per-page="20"
          class="ds-table-enhanced ds-table-striped"
          @click:row="
            (_: Event, { item }: { item: any }) =>
              router.push({ name: 'SupplierDetails', params: { id: item.id } })
          "
        >
          <template #item.currentBalance="{ item }">
            <MoneyDisplay :amount="item.currentBalance ?? 0" size="sm" colored />
          </template>
          <template #item.actions="{ item }">
            <v-btn
              icon="mdi-pencil"
              size="small"
              variant="text"
              @click.stop
              :to="{ name: 'SupplierEdit', params: { id: item.id } }"
            />
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              @click.stop="onDelete(item.id!)"
            />
          </template>
          <template #no-data>
            <div class="text-center py-8 text-medium-emphasis">{{ t('suppliers.noSuppliers') }}</div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSuppliersStore } from '@/stores/suppliersStore';
import MoneyDisplay from '@/components/shared/MoneyDisplay.vue';
import { t } from '@/i18n/t';

const router = useRouter();
const suppliersStore = useSuppliersStore();
const search = ref('');

const headers = [
  { title: t('common.name'), key: 'name' },
  { title: t('common.phone'), key: 'phone' },
  { title: t('common.city'), key: 'city' },
  { title: t('suppliers.currentBalance'), key: 'currentBalance', align: 'end' as const },
  { title: t('common.actions'), key: 'actions', sortable: false, align: 'center' as const },
];

onMounted(() => {
  suppliersStore.fetchSuppliers();
});

function onSearch(val: string) {
  suppliersStore.fetchSuppliers({ search: val || undefined });
}

async function onDelete(id: number) {
  const result = await suppliersStore.deleteSupplier(id);
  if (result.ok) suppliersStore.fetchSuppliers({ search: search.value || undefined });
}
</script>
