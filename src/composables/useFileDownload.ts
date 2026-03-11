/**
 * Composable for downloading files (blobs) with progress tracking.
 */
import { ref } from 'vue';

export function useFileDownload() {
  const isDownloading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Download a blob as a file.
   * @param blob - The blob to download
   * @param filename - The filename for the download
   */
  function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Execute a download function and save the result as a file.
   * @param fetchFn - Async function that returns a Blob
   * @param filename - The filename for the download
   */
  async function download(
    fetchFn: () => Promise<Blob>,
    filename: string,
  ): Promise<void> {
    isDownloading.value = true;
    error.value = null;

    try {
      const blob = await fetchFn();
      downloadBlob(blob, filename);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Download failed';
    } finally {
      isDownloading.value = false;
    }
  }

  return { download, downloadBlob, isDownloading, error };
}
