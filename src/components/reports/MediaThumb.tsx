import { Image, View } from 'react-native';
import { Play } from 'lucide-react-native';
import { thumb } from '@/services/cloudinary';

interface MediaThumbProps {
  /** local file uri (before upload) */
  uri?: string;
  /** uploaded Cloudinary url */
  url?: string;
  type: 'image' | 'video';
  width?: number;
  className?: string;
}

/** Photo, or a video poster with a play badge. Fills its container. */
export function MediaThumb({ uri, url, type, width = 300, className = '' }: MediaThumbProps) {
  const src = uri ?? (url ? thumb(url, width) : undefined);
  return (
    <View className={`overflow-hidden rounded-btn bg-line ${className}`}>
      {src && <Image source={{ uri: src }} style={{ width: '100%', height: '100%' }} resizeMode="cover" accessibilityIgnoresInvertColors />}
      {type === 'video' && (
        <View className="absolute inset-0 items-center justify-center">
          <View className="h-8 w-8 items-center justify-center rounded-full bg-black/60">
            <Play size={16} color="#fff" fill="#fff" />
          </View>
        </View>
      )}
    </View>
  );
}
