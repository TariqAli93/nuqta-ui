<template>
  <PosClearCartDialog v-model="ctx.ui.showClearConfirm" @confirm="ctx.handlers.confirmClear" />

  <PosRemoveItemDialog
    v-model="ctx.ui.showRemoveConfirm"
    @confirm="ctx.handlers.confirmRemove"
    @cancel="ctx.handlers.cancelRemove"
  />

  <PosZeroPriceDialog
    v-model="ctx.ui.showZeroPriceConfirm"
    @confirm="ctx.handlers.confirmZeroPriceAdd"
    @cancel="ctx.handlers.cancelZeroPriceAdd"
  />

  <PosDeleteHeldSaleDialog
    v-model="ctx.ui.showDeleteHeldConfirm"
    @confirm="ctx.handlers.confirmDeleteHeld"
    @cancel="ctx.handlers.cancelDeleteHeld"
  />

  <PosResetSaleDialog v-model="ctx.ui.showResetConfirm" @confirm="ctx.handlers.confirmReset" />

  <PosCustomerDialog
    v-model="ctx.ui.showCustomerDialog"
    :customers="ctx.filteredCustomers.value"
    :selected-id="ctx.selectedCustomerId.value"
    :search="ctx.ui.customerSearch"
    :loading="customersStore.loading"
    @select="ctx.handlers.selectCustomer"
    @clear="ctx.handlers.clearCustomer"
    @update:search="ctx.ui.customerSearch = $event"
  />

  <PosDiscountDialog
    v-model="ctx.ui.showDiscountDialog"
    :subtotal="ctx.subtotal.value"
    :initial-amount="ctx.ui.discountInput"
    @confirm="
      (amt) => {
        ctx.ui.discountInput = amt;
        ctx.handlers.applyDiscount();
      }
    "
  />

  <PosNoteDialog
    v-model="ctx.ui.showNoteDialog"
    :initial-note="ctx.ui.noteInput"
    @save="
      (note) => {
        ctx.ui.noteInput = note;
        ctx.handlers.saveNote();
      }
    "
    @clear="ctx.handlers.clearNote"
  />

  <PosHoldSaleDialog
    v-model="ctx.ui.showHoldDialog"
    :initial-name="ctx.ui.holdName"
    @confirm="
      (name) => {
        ctx.ui.holdName = name;
        ctx.handlers.confirmHold();
      }
    "
  />

  <PosResumeSaleDialog
    v-model="ctx.ui.showResumeDialog"
    :held-sales="ctx.heldSales.value"
    :sale-name="ctx.heldSaleName"
    :format-currency="ctx.formatCurrency"
    @resume="ctx.handlers.resumeHeldSale"
    @delete="ctx.handlers.onDeleteHeldSale"
  />

  <PosMoreOptionsDialog
    v-model="ctx.ui.showMoreDialog"
    :held-count="ctx.heldSales.value.length"
    @open-resume="ctx.handlers.openResumeDialog"
    @reset="ctx.handlers.resetSale"
  />
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { useCustomersStore } from '@/stores/customersStore';
import { POS_CONTEXT_KEY } from '../types/pos.types';
import PosClearCartDialog from '../dialogs/PosClearCartDialog.vue';
import PosRemoveItemDialog from '../dialogs/PosRemoveItemDialog.vue';
import PosZeroPriceDialog from '../dialogs/PosZeroPriceDialog.vue';
import PosDeleteHeldSaleDialog from '../dialogs/PosDeleteHeldSaleDialog.vue';
import PosResetSaleDialog from '../dialogs/PosResetSaleDialog.vue';
import PosCustomerDialog from '../dialogs/PosCustomerDialog.vue';
import PosDiscountDialog from '../dialogs/PosDiscountDialog.vue';
import PosNoteDialog from '../dialogs/PosNoteDialog.vue';
import PosHoldSaleDialog from '../dialogs/PosHoldSaleDialog.vue';
import PosResumeSaleDialog from '../dialogs/PosResumeSaleDialog.vue';
import PosMoreOptionsDialog from '../dialogs/PosMoreOptionsDialog.vue';

const ctx = inject(POS_CONTEXT_KEY)!;
const customersStore = useCustomersStore();
</script>
