<template>
  <div class="win-page">
    <div class="ds-page-header-block">
      <div>
        <div class="win-title">مساحة عمل النسخ الاحتياطي</div>
        <div class="win-subtitle">
          إدارة النسخ الاحتياطية لقاعدة البيانات: إنشاء، استعادة، وحذف النسخ الاحتياطية.
        </div>
      </div>
      <div class="ds-page-header__actions">
        <v-btn
          color="primary"
          prepend-icon="mdi-backup-restore"
          :loading="creating"
          @click="createBackup"
        >
          إنشاء نسخة احتياطية
        </v-btn>
      </div>
    </div>

    <!-- Stats Cards -->
    <v-row v-if="stats" dense>
      <v-col cols="6" sm="3">
        <v-card flat>
          <div class="ds-stat-card">
            <div class="ds-stat-card__info">
              <div class="ds-stat-card__label">عدد النسخ</div>
              <div class="ds-stat-card__value">{{ stats.totalBackups }}</div>
            </div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card flat>
          <div class="ds-stat-card">
            <div class="ds-stat-card__info">
              <div class="ds-stat-card__label">الحجم الإجمالي</div>
              <div class="ds-stat-card__value">{{ formatSize(stats.totalSizeBytes) }}</div>
            </div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card flat>
          <div class="ds-stat-card">
            <div class="ds-stat-card__info">
              <div class="ds-stat-card__label">أقدم نسخة</div>
              <div class="ds-stat-card__value" style="font-size: 0.9rem">
                {{ stats.oldestBackup ? formatTimestamp(stats.oldestBackup.createdAt) : '—' }}
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card flat>
          <div class="ds-stat-card">
            <div class="ds-stat-card__info">
              <div class="ds-stat-card__label">أحدث نسخة</div>
              <div class="ds-stat-card__value" style="font-size: 0.9rem">
                {{ stats.latestBackup ? formatTimestamp(stats.latestBackup.createdAt) : '—' }}
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Backup list -->
    <v-card flat>
      <v-card-title
        class="d-flex align-center ga-2"
        style="padding: var(--ds-card-py) var(--ds-card-px) var(--ds-space-2)"
      >
        <v-icon color="primary">mdi-database</v-icon>
        النسخ المتوفرة
        <v-spacer />
        <v-btn variant="text" icon size="small" :loading="loadingList" @click="loadBackups">
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="backups"
        :loading="loadingList"
        density="comfortable"
        :items-per-page="20"
        no-data-text="لا توجد نسخ احتياطية بعد"
        class="ds-table-enhanced"
      >
        <template #item.size="{ item }">
          {{ formatSize(item.sizeBytes) }}
        </template>
        <template #item.createdAt="{ item }">
          {{ formatTimestamp(item.createdAt) }}
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex ga-1">
            <v-tooltip location="top">
              <template #activator="{ props: tp }">
                <v-btn
                  v-bind="tp"
                  variant="text"
                  size="small"
                  color="warning"
                  icon
                  :loading="restoringName === item.name"
                  @click="confirmRestore(item.name)"
                >
                  <v-icon size="18">mdi-database-import-outline</v-icon>
                </v-btn>
              </template>
              <span>استعادة</span>
            </v-tooltip>
            <v-tooltip location="top">
              <template #activator="{ props: tp }">
                <v-btn
                  v-bind="tp"
                  variant="text"
                  size="small"
                  color="error"
                  icon
                  :loading="deletingName === item.name"
                  @click="confirmDelete(item.name)"
                >
                  <v-icon size="18">mdi-delete-outline</v-icon>
                </v-btn>
              </template>
              <span>حذف</span>
            </v-tooltip>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Restore confirmation dialog -->
    <v-dialog v-model="restoreDialog" max-width="480" class="ds-dialog">
      <v-card rounded="lg">
        <v-card-title class="text-error">
          <v-icon class="me-2" color="error">mdi-alert</v-icon>
          تأكيد الاستعادة
        </v-card-title>
        <v-card-text>
          <div class="d-flex align-center ga-2 mb-3 text-warning">
            <v-icon size="18">mdi-alert</v-icon>
            <span>
              هذه العملية ستستبدل جميع البيانات الحالية بالنسخة الاحتياطية. لا يمكن التراجع عن هذا
              الإجراء.
            </span>
          </div>
          <div class="text-body-2">
            النسخة: <strong>{{ restoreTarget }}</strong>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="restoreDialog = false">إلغاء</v-btn>
          <v-btn color="error" :loading="restoringName !== null" @click="executeRestore">
            استعادة
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete confirmation dialog -->
    <v-dialog v-model="deleteDialog" max-width="420" class="ds-dialog">
      <v-card rounded="lg">
        <v-card-title>تأكيد الحذف</v-card-title>
        <v-card-text>
          هل أنت متأكد من حذف النسخة الاحتياطية <strong>{{ deleteTarget }}</strong>؟
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">إلغاء</v-btn>
          <v-btn color="error" :loading="deletingName !== null" @click="executeDelete">حذف</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { backupClient, type BackupInfo, type BackupStats } from '@/api/endpoints/backup';
import { notifyError, notifySuccess, notifyWarn } from '@/utils/notify';

const backups = ref<BackupInfo[]>([]);
const stats = ref<BackupStats | null>(null);
const loadingList = ref(false);
const creating = ref(false);

const restoreDialog = ref(false);
const deleteDialog = ref(false);
const restoreTarget = ref('');
const deleteTarget = ref('');
const restoringName = ref<string | null>(null);
const deletingName = ref<string | null>(null);

const headers = [
  { title: 'الاسم', key: 'name' },
  { title: 'الحجم', key: 'sizeBytes', width: '120px' },
  { title: 'تاريخ الإنشاء', key: 'createdAt', width: '180px' },
  { title: '', key: 'actions', sortable: false, width: '100px' },
];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleString('ar-IQ', { numberingSystem: 'latn' });
}

async function loadBackups() {
  loadingList.value = true;
  try {
    const [listRes, statsRes] = await Promise.all([backupClient.list(), backupClient.getStats()]);
    if (listRes.ok) {
      backups.value = listRes.data;
    } else {
      notifyError(listRes.error.message || 'فشل تحميل النسخ');
    }
    if (statsRes.ok) {
      stats.value = statsRes.data.stats;
    } else {
      notifyError(statsRes.error.message || 'فشل تحميل إحصاءات النسخ الاحتياطية');
    }
  } finally {
    loadingList.value = false;
  }
}

async function createBackup() {
  creating.value = true;
  try {
    const result = await backupClient.create();
    if (result.ok) {
      notifySuccess(`تم إنشاء النسخة الاحتياطية: ${result.data.backupName}`);
      await loadBackups();
    } else {
      notifyError(result.error.message || 'فشل إنشاء النسخة الاحتياطية');
    }
  } finally {
    creating.value = false;
  }
}

function confirmRestore(name: string) {
  restoreTarget.value = name;
  restoreDialog.value = true;
  notifyWarn(
    'هذه العملية ستستبدل جميع البيانات الحالية بالنسخة الاحتياطية. لا يمكن التراجع عن هذا الإجراء.',
    { dedupeKey: 'backup-restore-warning' }
  );
}

function confirmDelete(name: string) {
  deleteTarget.value = name;
  deleteDialog.value = true;
}

async function executeRestore() {
  restoringName.value = restoreTarget.value;
  restoreDialog.value = false;
  const tokenResult = await backupClient.generateToken(restoreTarget.value);
  if (!tokenResult.ok) {
    restoringName.value = null;
    notifyError(tokenResult.error.message || 'فشل إنشاء رمز الاستعادة');
    return;
  }
  const restoreResult = await backupClient.restore(tokenResult.data.token);
  restoringName.value = null;
  if (restoreResult.ok) {
    notifySuccess(restoreResult.data.message || 'تمت الاستعادة بنجاح — يرجى إعادة تشغيل التطبيق');
  } else {
    notifyError(restoreResult.error.message || 'فشل الاستعادة');
  }
}

async function executeDelete() {
  deletingName.value = deleteTarget.value;
  deleteDialog.value = false;
  const result = await backupClient.delete(deleteTarget.value);
  deletingName.value = null;
  if (result.ok) {
    notifySuccess('تم حذف النسخة بنجاح');
    await loadBackups();
  } else {
    notifyError(result.error.message || 'فشل الحذف');
  }
}

onMounted(() => {
  void loadBackups();
});
</script>
