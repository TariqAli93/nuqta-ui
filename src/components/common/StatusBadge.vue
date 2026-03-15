<template>
  <v-chip
    :color="chipColor"
    :size="size"
    variant="tonal"
    :prepend-icon="chipIcon"
    class="status-badge"
  >
    {{ label ?? statusLabel }}
  </v-chip>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type SaleStatus = 'open' | 'completed' | 'cancelled' | 'refunded' | 'partially_refunded';
type PayrollStatus = 'draft' | 'submitted' | 'approved' | 'disbursed' | 'cancelled';
type PurchaseStatus = 'pending' | 'received' | 'cancelled';

const STATUS_CONFIG: Record<
  string,
  { color: string; icon: string; label: string }
> = {
  // Generic
  active: { color: 'success', icon: 'mdi-check-circle', label: 'نشط' },
  inactive: { color: 'default', icon: 'mdi-minus-circle', label: 'غير نشط' },
  // Sales
  open: { color: 'info', icon: 'mdi-shopping', label: 'مفتوح' },
  completed: { color: 'success', icon: 'mdi-check-circle', label: 'مكتمل' },
  cancelled: { color: 'error', icon: 'mdi-close-circle', label: 'ملغي' },
  refunded: { color: 'warning', icon: 'mdi-refresh', label: 'مسترد' },
  partially_refunded: { color: 'warning', icon: 'mdi-refresh', label: 'مسترد جزئياً' },
  // Purchases
  pending: { color: 'warning', icon: 'mdi-clock-outline', label: 'معلق' },
  received: { color: 'success', icon: 'mdi-package-check', label: 'مستلم' },
  // Payroll
  draft: { color: 'default', icon: 'mdi-pencil', label: 'مسودة' },
  submitted: { color: 'info', icon: 'mdi-send', label: 'مُرسل' },
  approved: { color: 'success', icon: 'mdi-check-all', label: 'مُعتمد' },
  disbursed: { color: 'primary', icon: 'mdi-cash-multiple', label: 'مُصرف' },
  // Payments
  voided: { color: 'error', icon: 'mdi-close', label: 'ملغي' },
};

const props = withDefaults(
  defineProps<{
    status: string;
    label?: string;
    size?: 'x-small' | 'small' | 'default' | 'large';
  }>(),
  { size: 'small' }
);

const config = computed(() => STATUS_CONFIG[props.status] ?? {
  color: 'default',
  icon: 'mdi-help-circle',
  label: props.status,
});

const chipColor = computed(() => config.value.color);
const chipIcon = computed(() => config.value.icon);
const statusLabel = computed(() => config.value.label);
</script>
