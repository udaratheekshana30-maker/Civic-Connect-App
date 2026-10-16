import * as ImagePicker from 'expo-image-picker';
import { toast } from '@/components/ui/Toast';
import i18n from '@/i18n';
import type { LocalMedia } from '@/services/cloudinary';

export type PickSource = 'camera' | 'gallery';

/** Photos only (camera or gallery). Returns [] if cancelled/denied. */
export async function pickMedia(source: PickSource, remaining: number): Promise<LocalMedia[]> {
  if (remaining <= 0) return [];
  try {
    if (source === 'gallery') {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: remaining > 1,
        selectionLimit: remaining,
        quality: 0.8,
      });
      return res.canceled ? [] : res.assets.slice(0, remaining).map((a) => ({ uri: a.uri, type: 'image' as const }));
    }
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      toast(i18n.t('details.cameraDenied'), { tone: 'error' });
      return [];
    }
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
    return res.canceled ? [] : res.assets.map((a) => ({ uri: a.uri, type: 'image' as const }));
  } catch {
    toast(i18n.t('errors.generic'), { tone: 'error' });
    return [];
  }
}
