import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/store';
import { errorMessage } from '@/services/errors';
import { setSupport } from '@/services/reports';
import type { Report } from '@/types';

/**
 * "Support (+1)" toggle with optimistic UI and an Undo toast.
 * `onChange` lets list screens patch their local copy.
 */
export function useSupport(report: Report | null | undefined, onChange?: (supported: boolean, count: number) => void) {
  const { t } = useTranslation();
  const uid = useAuth((s) => s.user?.uid);
  const serverSupported = !!(uid && report?.supporters?.includes(uid));
  const [supported, setSupported] = useState(serverSupported);
  const [count, setCount] = useState(report?.supportCount ?? 0);
  const [busy, setBusy] = useState(false);

  // Follow realtime updates from the server.
  useEffect(() => {
    setSupported(serverSupported);
    setCount(report?.supportCount ?? 0);
  }, [serverSupported, report?.supportCount, report?.id]);

  const apply = async (on: boolean) => {
    if (!report || !uid) return;
    const prev = { supported, count };
    const nextCount = Math.max(0, count + (on ? 1 : -1));
    setSupported(on);
    setCount(nextCount);
    onChange?.(on, nextCount);
    setBusy(true);
    try {
      await setSupport(report.id, uid, on);
      return true;
    } catch (e) {
      setSupported(prev.supported);
      setCount(prev.count);
      onChange?.(prev.supported, prev.count);
      toast(errorMessage(e), { tone: 'error' });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const toggle = async () => {
    const on = !supported;
    const ok = await apply(on);
    if (ok && on) toast(t('issue.supportAdded'), { actionLabel: t('common.undo'), onAction: () => apply(false) });
    if (ok && !on) toast(t('issue.supportRemoved'));
  };

  const isOwn = !!uid && report?.reporterId === uid;
  return { supported, count, toggle, busy, isOwn };
}
