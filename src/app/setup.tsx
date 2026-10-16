import { View } from 'react-native';
import { Settings2 } from 'lucide-react-native';
import { Screen } from '@/components/layout/Screen';
import { Card, EmptyState, Txt } from '@/components/ui';

// Developer-facing screen shown only when .env is missing Firebase values.
// Intentionally English-only: end users never see it.
export default function Setup() {
  return (
    <Screen contentContainerClassName="px-4 pb-8">
      <EmptyState icon={Settings2} title="Firebase is not configured" body="Create civicconnect-app/.env from .env.example, then restart with: npx expo start --clear" />
      <Card className="gap-2">
        <Txt weight="semibold">Needed in .env</Txt>
        {['EXPO_PUBLIC_FIREBASE_API_KEY', 'EXPO_PUBLIC_FIREBASE_PROJECT_ID', 'EXPO_PUBLIC_FIREBASE_APP_ID', 'EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME', 'EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET'].map((k) => (
          <View key={k} className="rounded-btn bg-canvas px-3 py-2">
            <Txt variant="caption" lang="en">
              {k}
            </Txt>
          </View>
        ))}
        <Txt variant="caption" className="text-muted">
          See README.md → Setup for where to find each value.
        </Txt>
      </Card>
    </Screen>
  );
}
