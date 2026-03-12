<template>
  <ErrorBoundary>
    <router-view />
  </ErrorBoundary>
  <ToastContainer />
</template>

<script setup lang="ts">
import { ToastContainer } from 'vue-toastflow';
import ErrorBoundary from '@/components/shared/ErrorBoundary.vue';
</script>
