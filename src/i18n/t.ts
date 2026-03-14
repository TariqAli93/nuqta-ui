import { ar } from './ar';

const FALLBACK_TEXT = 'نص غير مُعرّف';

function detectPermission(message: string): boolean {
  return /(unauthor|forbidden|permission|access|auth|لا توجد صلاحية)/i.test(message);
}

function detectInvalidData(message: string): boolean {
  return /(invalid|validation|required|must|format|payload|bad request|بيانات)/i.test(message);
}

function detectLoadFailure(message: string): boolean {
  return /(fetch|load|get|query|read|network|timeout|database|db|not found|failed)/i.test(message);
}

export function t(key: string): string {
  return ar[key] ?? ar['errors.undefinedText'] ?? FALLBACK_TEXT;
}

// ---------------------------------------------------------------------------
// Field name mapping — add your fields here
// ---------------------------------------------------------------------------

const FIELD_LABELS: Record<string, string> = {
  '/amount': 'المبلغ',
  '/price': 'السعر',
  '/quantity': 'الكمية',
  '/name': 'الاسم',
  '/email': 'البريد الإلكتروني',
  '/phone': 'رقم الهاتف',
  '/password': 'كلمة المرور',
  '/description': 'الوصف',
  '/code': 'الرمز',
  '/date': 'التاريخ',
  '/discount': 'الخصم',
  '/barcode': 'الباركود',
  '/categoryId': 'التصنيف',
  '/customerId': 'الزبون',
  // ... extend as needed
};

function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field.replace(/^\//, '');
}

// ---------------------------------------------------------------------------
// Ajv keyword → Arabic template
// ---------------------------------------------------------------------------

type ConstraintFormatter = (
  field: string,
  params: Record<string, unknown>,
  message: string
) => string;

/** Extract first number from Ajv message: "must be >= 1" → "1" */
function extractNumber(msg: string): string {
  const match = msg.match(/[\d.]+/);
  return match?.[0] ?? '?';
}

/** Extract last word: "must be object" → "object" */
function extractWord(msg: string): string {
  return msg.split(/\s+/).pop() ?? '';
}

/** Extract quoted value or last word: 'must match format "email"' → "email" */
function extractQuoted(msg: string): string {
  const match = msg.match(/"([^"]+)"/);
  return match?.[1] ?? extractWord(msg);
}

const KEYWORD_MAP: Record<string, ConstraintFormatter> = {
  minimum: (f, _p, msg) => `${f} يجب أن يكون ${extractNumber(msg)} على الأقل`,
  maximum: (f, _p, msg) => `${f} يجب أن لا يتجاوز ${extractNumber(msg)}`,
  minLength: (f, _p, msg) => `${f} يجب أن يكون ${extractNumber(msg)} حرف على الأقل`,
  maxLength: (f, _p, msg) => `${f} يجب أن لا يتجاوز ${extractNumber(msg)} حرف`,
  required: (f) => `${f} مطلوب`,
  type: (f, _p, msg) => `${f} يجب أن يكون ${typeLabel(extractWord(msg))}`,
  format: (f, _p, msg) => `${f} بصيغة غير صحيحة (${extractQuoted(msg)})`,
  enum: (f) => `${f} قيمة غير مسموحة`,
  pattern: (f) => `${f} بصيغة غير صحيحة`,
};

const TYPE_LABELS: Record<string, string> = {
  string: 'نص',
  number: 'رقم',
  integer: 'رقم صحيح',
  boolean: 'صح/خطأ',
  object: 'كائن',
  array: 'قائمة',
};

function typeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type;
}

// ---------------------------------------------------------------------------
// Detail item interface (matches your backend shape)
// ---------------------------------------------------------------------------

interface ValidationDetail {
  field: string;
  message: string; // Ajv's English message
  keyword: string; // Ajv keyword: "minimum", "type", "required", etc.
  limit?: unknown; // For min/max constraints
  type?: string; // For "type" keyword
  format?: string; // For "format" keyword
  [key: string]: unknown;
}

interface ApiErrorBody {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: ValidationDetail[];
  };
}

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

/**
 * Translate a backend API error into Arabic.
 * Handles structured validation details from Fastify/Ajv.
 */
export function mapErrorToArabic(error: unknown, fallbackKey = 'errors.unexpected'): string {
  const fallback = t(fallbackKey);
  if (!error) return fallback;

  // Handle structured API error with details array
  const body = extractErrorBody(error);

  if (body?.code === 'VALIDATION_ERROR' && body.details?.length) {
    return body.details.map((d) => formatDetail(d)).join('\n');
  }

  // Code-level mapping for non-validation errors
  if (body?.code) {
    const codeMsg = ERROR_CODE_MAP[body.code];
    if (codeMsg) return codeMsg;
  }

  // Legacy: pattern-match on raw message string
  const message = (body?.message ?? '').trim();
  if (!message) return fallback;

  if (detectPermission(message)) return t('errors.noPermission');
  if (detectInvalidData(message)) return t('errors.invalidData');
  if (detectLoadFailure(message)) return t('errors.loadFailed');

  return fallback;
}

/**
 * Format a single validation detail into Arabic.
 */
function formatDetail(detail: ValidationDetail): string {
  const field = fieldLabel(detail.field);
  const formatter = KEYWORD_MAP[detail.keyword];

  if (formatter) {
    return formatter(field, detail as Record<string, unknown>, detail.message);
  }

  return `${field}: ${detail.message}`;
}

// ---------------------------------------------------------------------------
// Error code → Arabic (for non-validation errors)
// ---------------------------------------------------------------------------

const ERROR_CODE_MAP: Record<string, string> = {
  NOT_FOUND: 'العنصر غير موجود',
  UNAUTHORIZED: 'يجب تسجيل الدخول',
  PERMISSION_DENIED: 'لا تملك صلاحية لهذا الإجراء',
  CONFLICT: 'يوجد تعارض مع بيانات موجودة',
  INSUFFICIENT_STOCK: 'الكمية غير متوفرة في المخزن',
  INVALID_STATE: 'الحالة الحالية لا تسمح بهذا الإجراء',
  RATE_LIMITED: 'طلبات كثيرة، حاول بعد قليل',
  NETWORK_ERROR: 'خطأ في الشبكة — تأكد من اتصالك',
  TIMEOUT: 'انتهت مهلة الطلب',
  INTERNAL_ERROR: 'خطأ في الخادم، حاول مرة أخرى',
  DATABASE_ERROR: 'خطأ في قاعدة البيانات',
};

// ---------------------------------------------------------------------------
// Extract error body from various shapes
// ---------------------------------------------------------------------------

function extractErrorBody(
  error: unknown
): { code: string; message: string; details?: ValidationDetail[] } | null {
  if (!error || typeof error !== 'object') return null;

  // Shape: { ok, error: { code, message, details } } — full API response
  const asApi = error as Partial<ApiErrorBody>;
  if (asApi.error?.code) {
    return asApi.error;
  }

  // Shape: { code, message, details } — already unwrapped
  const asFlat = error as { code?: string; message?: string; details?: ValidationDetail[] };
  if (asFlat.code && asFlat.message) {
    return asFlat as { code: string; message: string; details?: ValidationDetail[] };
  }

  // Shape: { message } — generic Error object
  if (asFlat.message) {
    return { code: 'UNKNOWN', message: asFlat.message };
  }

  return null;
}

export function mapRoleToArabic(role: string | null | undefined): string {
  if (!role) return t('common.none');
  const value = t(`enum.role.${role}`);
  return value === t('errors.undefinedText') ? t('common.none') : value;
}
