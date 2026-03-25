<template>
  <v-navigation-drawer
    permanent
    mobile-breakpoint="md"
    retain-focus
    class="pa-0 resizable-drawer border-b-0 border-t-0"
    :width="drawerWidth"
    :location="drawerLocation"
    style="border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity))"
  >
    <div class="d-flex flex-column h-100 bg-surface">
      <div
        class="d-flex align-center justify-space-between pa-4 flex-shrink-0"
        style="
          max-height: 53px;
          border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
        "
      >
        <span class="text-h6 font-weight-bold">{{ t('pos.cart') }}</span>
        <v-chip size="small" variant="flat" color="primary" class="font-weight-bold px-3">
          {{ items.length }} {{ t('common.items') }}
        </v-chip>
      </div>

      <div class="overflow-y-auto pa-0 flex-grow-1 custom-scrollbar">
        <v-list v-if="items.length > 0" density="comfortable" bg-color="transparent" class="py-0">
          <CartItem
            v-for="(item, index) in items"
            :key="`${item.productId}-${item.unitName}`"
            :item="item"
            :units="getUnitsForIndex(index)"
            @increase="$emit('increase', index)"
            @decrease="$emit('decrease', index)"
            @remove="$emit('remove', index)"
            @unit-change="(unit) => $emit('unitChange', { index, unit })"
          />
        </v-list>

        <div v-else class="d-flex flex-column align-center justify-center h-100 px-6">
          <v-sheet
            width="96"
            height="96"
            class="d-flex align-center justify-center rounded-circle bg-surface-variant mb-6"
          >
            <v-icon size="48" color="medium-emphasis">mdi-cart-outline</v-icon>
          </v-sheet>
          <div class="text-h6 font-weight-medium mb-2">{{ t('pos.cartEmpty') }}</div>
          <div class="text-body-2 text-center text-medium-emphasis">
            {{ t('pos.cartEmptyHint') }}
          </div>
        </div>
      </div>

      <div
        class="flex-shrink-0 bg-surface"
        style="
          border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
          box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.03);
        "
      >
        <slot name="totals"></slot>
        <div class="px-4 pb-4">
          <slot name="actions"></slot>
        </div>
      </div>
    </div>

    <!-- Handle للسحب -->
    <div
      class="drawer-resize-handle"
      :class="{ right: drawerLocation === 'right' }"
      @mousedown.prevent="onMouseDown"
    />
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { t } from '@/i18n/t';
import type { CartLineItem, ProductUnitOption } from '@/types/pos';
import { computed, onBeforeUnmount, ref } from 'vue';
import { useLayoutStore } from '@/stores/layout';
import CartItem from './CartItem.vue';

interface Props {
  items: CartLineItem[];
  unitsMap?: Map<number, ProductUnitOption[]>;
}

const props = withDefaults(defineProps<Props>(), {
  unitsMap: () => new Map(),
});

const layout = useLayoutStore();

const isDragging = ref(false);
const startX = ref(0);
const startWidth = ref(0);

// RTL support: إذا drawer على اليمين، السحب لازم يعكس الاتجاه
const drawerLocation = ref<'left' | 'right'>('left'); // غيّرها حسب مشروعك
const isRight = computed(() => drawerLocation.value === 'right');

const emit = defineEmits<{
  increase: [index: number];
  decrease: [index: number];
  remove: [index: number];
  unitChange: [{ index: number; unit: ProductUnitOption }];
}>();

function getUnitsForIndex(index: number): ProductUnitOption[] {
  return props.unitsMap?.get(index) ?? [];
}

const drawerWidth = computed(() => layout.drawerWidth);

function onMouseDown(e: MouseEvent) {
  isDragging.value = true;
  startX.value = e.clientX;
  startWidth.value = drawerWidth.value;

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
  document.body.style.userSelect = 'none';
  document.body.style.cursor = 'col-resize';
}

function onMouseMove(e: MouseEvent) {
  if (!isDragging.value) return;
  const dx = e.clientX - startX.value;
  const next = isRight.value ? startWidth.value - dx : startWidth.value + dx;
  layout.setDrawerWidth(next);
}

function onMouseUp() {
  isDragging.value = false;
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
  document.body.style.userSelect = '';
  document.body.style.cursor = '';
}

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
});
</script>
<style scoped>
.resizable-drawer {
  position: relative;
}

:deep(.resizable-drawer) {
  border: 0 !important;
}

/* شريط السحب */
.drawer-resize-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 8px;
  right: -4px; /* default: drawer على اليسار => السحب من اليمين */
  cursor: col-resize;
  z-index: 10;
}

/* إذا drawer على اليمين، خلي handle على اليسار */
.drawer-resize-handle.right {
  left: -4px;
  right: auto;
}

/* تحسين UX: خلي جزء "اللمس" أكبر بس بدون ما يبين */
.drawer-resize-handle::after {
  content: '';
  position: absolute;
  inset: 0;
  background: transparent;
}

:deep(.v-navigation-drawer--right) {
  border: 0 !important;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
