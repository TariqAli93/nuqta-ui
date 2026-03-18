import { defineStore } from 'pinia';
import { ref } from 'vue';
import { barcodeClient } from '../api/endpoints/barcode';
import type {
  BarcodeTemplate,
  BarcodeTemplateInput,
  BarcodePrintJob,
  BarcodePrintJobInput,
} from '../types/domain';

export const useBarcodeStore = defineStore('barcode', () => {
  /* ── State ───────────────────────────────────────────────────── */
  const templates = ref<BarcodeTemplate[]>([]);
  const printJobs = ref<BarcodePrintJob[]>([]);
  const printJobsTotal = ref(0);
  const loading = ref(false);
  const error = ref<string | null>(null);

  let _pollInterval: ReturnType<typeof setInterval> | null = null;

  /* ── Actions ─────────────────────────────────────────────────── */

  async function fetchTemplates() {
    loading.value = true;
    error.value = null;
    try {
      const result = await barcodeClient.getTemplates();
      if (result.ok) {
        templates.value = result.data ?? [];
      } else {
        error.value = result.error.message;
      }
      return result;
    } finally {
      loading.value = false;
    }
  }

  async function createTemplate(data: BarcodeTemplateInput) {
    loading.value = true;
    error.value = null;
    try {
      const result = await barcodeClient.createTemplate(data);
      if (result.ok) {
        templates.value.push(result.data);
      } else {
        error.value = result.error.message;
      }
      return result;
    } finally {
      loading.value = false;
    }
  }

  async function deleteTemplate(id: number): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      const result = await barcodeClient.deleteTemplate(id);
      if (result.ok) {
        templates.value = templates.value.filter((t) => t.id !== id);
      } else {
        error.value = result.error.message;
      }
      return result.ok;
    } finally {
      loading.value = false;
    }
  }

  async function fetchPrintJobs(params?: {
    productId?: number;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    loading.value = true;
    error.value = null;
    try {
      const result = await barcodeClient.getPrintJobs(params);
      if (result.ok) {
        printJobs.value = result.data.items;
        printJobsTotal.value = result.data.total;
      } else {
        error.value = result.error.message;
      }
      return result;
    } finally {
      loading.value = false;
    }
  }

  async function createPrintJob(data: BarcodePrintJobInput) {
    loading.value = true;
    error.value = null;
    try {
      const result = await barcodeClient.createPrintJob(data);
      if (result.ok) {
        printJobs.value.unshift(result.data);
        printJobsTotal.value += 1;
      } else {
        error.value = result.error.message;
      }
      return result;
    } finally {
      loading.value = false;
    }
  }

  function startPrintJobPolling(
    params?: Parameters<typeof fetchPrintJobs>[0],
    intervalMs = 5000
  ): void {
    stopPrintJobPolling();
    // Fire immediately so the first result appears without waiting for an interval tick.
    // Subsequent interval ticks also call fetchPrintJobs, which sets loading=true briefly.
    // For heavy UX optimization, replace with a silent variant; omitted here to keep
    // the store API consistent and predictable.
    void fetchPrintJobs(params);
    _pollInterval = setInterval(() => {
      void fetchPrintJobs(params);
    }, intervalMs);
  }

  function stopPrintJobPolling(): void {
    if (_pollInterval !== null) {
      clearInterval(_pollInterval);
      _pollInterval = null;
    }
  }

  return {
    // State
    templates,
    printJobs,
    printJobsTotal,
    loading,
    error,

    // Actions
    fetchTemplates,
    createTemplate,
    deleteTemplate,
    fetchPrintJobs,
    createPrintJob,
    startPrintJobPolling,
    stopPrintJobPolling,
  };
});
