import i18n from '@/i18n';

// Firebase error codes → friendly, translated messages (i18n `errors.*`).
const map: Record<string, string> = {
  'auth/invalid-email': 'errors.invalidEmail',
  'auth/missing-email': 'errors.invalidEmail',
  'auth/user-not-found': 'errors.wrongCredentials',
  'auth/wrong-password': 'errors.wrongCredentials',
  'auth/invalid-credential': 'errors.wrongCredentials',
  'auth/invalid-login-credentials': 'errors.wrongCredentials',
  'auth/email-already-in-use': 'errors.emailInUse',
  'auth/weak-password': 'errors.weakPassword',
  'auth/too-many-requests': 'errors.tooManyRequests',
  'auth/network-request-failed': 'errors.network',
  'auth/user-disabled': 'errors.userDisabled',
  'auth/operation-not-allowed': 'errors.notEnabled',
  'auth/admin-restricted-operation': 'errors.notEnabled',
  'auth/invalid-api-key': 'errors.notConfigured',
  'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'errors.notConfigured',
  'auth/requires-recent-login': 'errors.recentLogin',
  'permission-denied': 'errors.permission',
  unavailable: 'errors.network',
  'deadline-exceeded': 'errors.network',
  'not-found': 'errors.notFound',
  'failed-precondition': 'errors.index',
  'cloudinary/not-configured': 'errors.mediaNotConfigured',
  'cloudinary/upload-failed': 'errors.upload',
};

export function errorMessage(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  const key = map[code];
  if (key) return i18n.t(key);
  console.warn('[CivicConnect]', e);
  return i18n.t('errors.generic');
}

/** Short technical line ("code: message") shown in small text so screenshots are debuggable. */
export function errorDetail(e: unknown, stage?: string): string {
  const err = e as { code?: string; name?: string; message?: string };
  const head = err?.code || err?.name || 'Error';
  const msg = (err?.message ?? String(e)).replace(/^Firebase(Error)?:\s*/i, '').slice(0, 160);
  return `${stage ? `[${stage}] ` : ''}${head}: ${msg}`;
}
