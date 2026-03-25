<template>
  <div class="pt-2">
    <v-btn
      :color="props.canPay ? 'primary' : 'surface-variant'"
      :variant="props.canPay ? 'flat' : 'flat'"
      :disabled="!props.canPay"
      block
      class="grow pay-button mb-4 rounded-lg button-premium"
      height="64"
      elevation="0"
      @click="emit('pay')"
    >
      <template #prepend>
        <v-icon size="28" class="mr-2">mdi-cash-register</v-icon>
      </template>
      <template #default>
        <span class="text-h6 font-weight-bold tracking-wide text-uppercase"> {{ t('pos.pay') }}</span>
      </template>
      <template #append>
        <v-hotkey border="0" display-mode="icon" elevation="0" keys="f5" />
      </template>
    </v-btn>

    <div class="item-group-container">
      <v-item-group class="actions-grid-auto">
        <v-item v-for="action in actions" :key="action.event">
          <v-btn
            :color="action.color || 'surface-variant'"
            :variant="action.color === 'error' ? 'outlined' : 'flat'"
            :disabled="action.disabled"
            block
            class="grow min-h-12 rounded-lg button-secondary"
            elevation="0"
            @click="emitAction(action.event)"
          >
            <template #prepend>
              <v-icon size="20">{{ action.icon }}</v-icon>
            </template>
            <template #default>
              <span class="text-caption font-weight-bold">{{ action.label }}</span>
            </template>
          </v-btn>
        </v-item>
      </v-item-group>
    </div>
  </div>
</template>

<style scoped>
.button-premium {
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s;
}
.button-premium:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(var(--v-theme-primary), 0.2) !important;
}
.button-secondary {
  transition: background-color 0.2s;
}
.button-secondary:not(.text-error):hover:not(:disabled) {
  background-color: rgba(var(--v-theme-primary), 0.1) !important;
  color: rgb(var(--v-theme-primary)) !important;
}
</style>

<script setup lang="ts">
import { computed } from 'vue';
import { t } from '@/i18n/t';

interface Props {
  canPay?: boolean;
  canClear?: boolean;
}

type ActionEvent = 'hold' | 'discount' | 'customer' | 'clear' | 'note' | 'more';

const props = withDefaults(defineProps<Props>(), {
  canPay: false,
  canClear: false,
});

const emit = defineEmits<{
  pay: [];
  hold: [];
  discount: [];
  customer: [];
  clear: [];
  note: [];
  more: [];
}>();

const actions = computed(() => [
  {
    event: 'hold' as ActionEvent,
    icon: 'mdi-pause-circle-outline',
    label: t('pos.hold'),
    key: 'f2',
    color: undefined,
    variant: 'outlined' as const,
    disabled: false,
  },
  {
    event: 'discount' as ActionEvent,
    icon: 'mdi-tag-outline',
    label: t('pos.discount'),
    key: 'f8',
    color: undefined,
    variant: 'outlined' as const,
    disabled: false,
  },
  {
    event: 'customer' as ActionEvent,
    icon: 'mdi-account-outline',
    label: t('pos.customer'),
    key: 'f4',
    color: undefined,
    variant: 'outlined' as const,
    disabled: false,
  },

  {
    event: 'note' as ActionEvent,
    icon: 'mdi-note-text-outline',
    label: t('pos.note'),
    key: 'n',
    color: undefined,
    variant: 'outlined' as const,
    disabled: false,
  },
  {
    event: 'more' as ActionEvent,
    icon: 'mdi-dots-horizontal',
    label: t('pos.more'),
    key: 'm',
    color: undefined,
    variant: 'outlined' as const,
    disabled: false,
  },
  {
    event: 'clear' as ActionEvent,
    icon: 'mdi-trash-can-outline',
    label: t('common.clear'),
    key: 'f9',
    color: 'error',
    variant: 'outlined' as const,
    disabled: !props.canClear,
  },
]);

function emitAction(event: ActionEvent) {
  if (event === 'hold') emit('hold');
  else if (event === 'discount') emit('discount');
  else if (event === 'customer') emit('customer');
  else if (event === 'clear') emit('clear');
  else if (event === 'note') emit('note');
  else emit('more');
}
</script>

<style lang="scss" scoped>
.pay-button {
  justify-content: space-between !important;
}

.item-group-container {
  container-type: inline-size; /* يخلي العناصر داخلها تقيس عرض الحاوية */
}

.actions-grid-auto {
  display: grid;
  gap: 0.25rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

/* لما drawer يصير أوسع */
@container (min-width: 360px) {
  .actions-grid-auto {
    gap: 0.5rem;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

/* إذا بعد أوسع */
@container (min-width: 520px) {
  .actions-grid-auto {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
