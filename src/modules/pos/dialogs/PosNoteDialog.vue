<template>
  <v-dialog v-model="show" max-width="500" :fullscreen="$vuetify.display.xs">
    <v-card rounded="lg" class="pa-6">
      <v-card-title class="text-h6 pa-0">{{ t('pos.addNote') }}</v-card-title>
      <v-card-text class="pa-0 mt-4">
        <v-textarea
          v-model="localNote"
          variant="outlined"
          density="comfortable"
          :label="t('pos.saleNote')"
          rows="3"
          autofocus
        />
      </v-card-text>
      <v-card-actions class="pa-0 mt-6 d-flex align-center ga-2">
        <v-btn variant="text" @click="emit('clear')">{{ t('common.clear') }}</v-btn>
        <v-spacer />
        <v-btn variant="text" @click="show = false">{{ t('common.cancel') }}</v-btn>
        <v-btn color="primary" variant="flat" @click="emit('save', localNote)">{{
          t('common.save')
        }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { t } from '@/i18n/t';

const props = defineProps<{ initialNote: string }>();
const show = defineModel<boolean>({ required: true });
const emit = defineEmits<{ save: [note: string]; clear: [] }>();

const localNote = ref(props.initialNote);
watch(
  () => props.initialNote,
  (v) => {
    localNote.value = v;
  }
);
</script>
