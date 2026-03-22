<template>
  <div class="nq-page">
    <PageHeader title="الموردين" subtitle="إدارة بيانات الموردين، الأرصدة الحالية، والتعاملات المالية المتعلقة بهم">
      <template #actions>
        <v-btn color="primary" prepend-icon="mdi-plus" :to="{ name: 'SupplierCreate' }">
          إضافة مورد
        </v-btn>
      </template>
    </PageHeader>

    <v-card class="nq-table-card">
      <div class="nq-filter-bar">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="بحث..."
          hide-details
          style="flex: 1 1 320px; min-width: 200px"
          @update:model-value="onSearch"
        />
      </div>

      <v-data-table
        :headers="headers"
        :items="suppliersStore.items"
        :loading="suppliersStore.loading"
        :items-per-page="20"
        density="comfortable"
        @click:row="
          (_: Event, { item }: { item: any }) =>
            router.push({ name: 'SupplierDetails', params: { id: item.id } })
        "
      >
        <template #item.currentBalance="{ item }">
          <MoneyDisplay :amount="item.currentBalance ?? 0" size="sm" colored />
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex ga-1">
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
          </div>
        </template>
        <template #no-data>
          <EmptyState
            icon="mdi-truck-delivery-outline"
            title="لا يوجد موردين"
            description="أضف موردين لتتبع المشتريات والتعاملات المالية"
            min-height="200px"
          />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSuppliersStore } from '../../stores/suppliersStore';
import MoneyDisplay from '../../components/shared/MoneyDisplay.vue';
import PageHeader from '@/components/common/PageHeader.vue';
import EmptyState from '@/components/common/EmptyState.vue';

const router = useRouter();
const suppliersStore = useSuppliersStore();
const search = ref('');

const headers = [
  { title: 'الاسم', key: 'name' },
  { title: 'الهاتف', key: 'phone' },
  { title: 'المدينة', key: 'city' },
  { title: 'المستحق', key: 'currentBalance', align: 'end' as const },
  { title: 'الإجراءات', key: 'actions', sortable: false, align: 'center' as const },
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
