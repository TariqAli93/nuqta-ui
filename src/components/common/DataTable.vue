<template>
  <v-card
    :flat="true"
    elevation="0"
    variant="flat"
    :class="['ds-table-wrapper', { 'border': !flat }]"
    :rounded="flat ? 0 : 'lg'"
  >
    <v-card-title
      v-if="title || $slots.actions"
      class="d-flex align-center justify-space-between"
      style="padding: var(--ds-card-py) var(--ds-card-px) var(--ds-space-2)"
    >
      <span v-if="title" class="win-title">{{ title }}</span>
      <slot name="actions" />
    </v-card-title>

    <slot name="filters" />

    <v-data-table-server
      v-if="serverSide"
      v-model:items-per-page="localPageSize"
      v-model:page="localPage"
      :headers="headers"
      :items="items"
      :items-length="total"
      :loading="loading"
      :density="density"
      :no-data-text="noDataText"
      class="ds-table-enhanced ds-table-striped"
      @update:page="onPageChange"
      @update:items-per-page="onPageSizeChange"
    >
      <template v-for="(_, name) in $slots" #[name]="slotData">
        <slot :name="name" v-bind="slotData ?? {}" />
      </template>
    </v-data-table-server>

    <v-data-table
      v-else
      :headers="headers"
      :items="items"
      :loading="loading"
      :density="density"
      :items-per-page="pageSize"
      :no-data-text="noDataText"
      class="ds-table-enhanced ds-table-striped"
    >
      <template v-for="(_, name) in $slots" #[name]="slotData">
        <slot :name="name" v-bind="slotData ?? {}" />
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

export interface DataTableHeader {
  title: string;
  key: string;
  align?: 'start' | 'center' | 'end';
  sortable?: boolean;
  width?: string | number;
}

const props = withDefaults(
  defineProps<{
    headers: DataTableHeader[];
    items: unknown[];
    total?: number;
    page?: number;
    pageSize?: number;
    loading?: boolean;
    title?: string;
    flat?: boolean;
    density?: 'default' | 'comfortable' | 'compact';
    noDataText?: string;
    serverSide?: boolean;
  }>(),
  {
    total: 0,
    page: 1,
    pageSize: 25,
    loading: false,
    flat: false,
    density: 'comfortable',
    noDataText: 'لا توجد بيانات',
    serverSide: false,
  }
);

const emit = defineEmits<{
  (e: 'update:page', page: number): void;
  (e: 'update:pageSize', pageSize: number): void;
}>();

const localPage = ref(props.page);
const localPageSize = ref(props.pageSize);

watch(
  () => props.page,
  (v) => {
    localPage.value = v;
  }
);
watch(
  () => props.pageSize,
  (v) => {
    localPageSize.value = v;
  }
);

function onPageChange(page: number) {
  emit('update:page', page);
}

function onPageSizeChange(size: number) {
  emit('update:pageSize', size);
}
</script>
