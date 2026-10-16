import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/layout/Screen';
import { MediaPicker } from '@/components/reports/MediaPicker';
import { Button, TextField, Txt, toast } from '@/components/ui';
import { useAuth } from '@/features/auth/store';
import { useNetwork } from '@/features/offline/store';
import { uploadAll, type LocalMedia } from '@/services/cloudinary';
import { errorMessage } from '@/services/errors';
import { addInfo } from '@/services/reports';

const MAX = 3;

/** Extra details/photos from any citizen on an existing report → reports/{id}/additions. */
export default function AddInfo() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const uid = useAuth((s) => s.user?.uid);
  const online = useNetwork((s) => s.online);
  const [text, setText] = useState('');
  const [media, setMedia] = useState<LocalMedia[]>([]);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string>();

  const canSend = (text.trim().length > 0 || media.length > 0) && online && !progress;

  const send = async () => {
    if (!uid || !id) return;
    setError(undefined);
    try {
      setProgress(media.length ? t('review.uploading', { done: 0, total: media.length }) : t('review.submitting'));
      const uploaded = await uploadAll(media, (done, total) => setProgress(t('review.uploading', { done, total })));
      setProgress(t('review.submitting'));
      await addInfo(id, uid, text, uploaded);
      toast(t('addInfo.thanks'));
      router.back();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setProgress(null);
    }
  };

  return (
    <Screen
      title={t('addInfo.title')}
      contentContainerClassName="gap-5 px-4 pb-6"
      footer={<Button full label={progress ?? t('addInfo.send')} loading={!!progress} disabled={!canSend} onPress={send} />}
    >
      <Txt className="text-muted">{t('addInfo.body', { id })}</Txt>
      <TextField label={t('addInfo.text')} value={text} onChangeText={setText} multiline maxLength={300} placeholder={t('addInfo.placeholder')} />
      <View>
        <Txt variant="bodySm" weight="semibold" className="mb-2">
          {t('addInfo.photos', { max: MAX })}
        </Txt>
        <MediaPicker value={media} onChange={setMedia} max={MAX} />
      </View>
      {!online && <Txt className="text-danger-dark">{t('addInfo.offline')}</Txt>}
      {error && (
        <Txt weight="medium" className="text-danger-dark" accessibilityLiveRegion="polite">
          {error}
        </Txt>
      )}
    </Screen>
  );
}
