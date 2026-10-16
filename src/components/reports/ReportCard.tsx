import { Image, View } from 'react-native';
import { ChevronRight, MapPin } from 'lucide-react-native';
import { PressableCard, StatusBadge, Txt } from '@/components/ui';
import { groupIcon } from '@/constants/categoryGroups';
import { colors } from '@/constants/theme';
import { useCatalog } from '@/features/catalog/store';
import { thumb } from '@/services/cloudinary';
import type { Report } from '@/types';
import { categoryName, formatDate } from '@/utils/format';

export function ReportCard({ report, onPress }: { report: Report; onPress: () => void }) {
  const category = useCatalog((s) => s.category(report.categoryId));
  const Icon = groupIcon(report.group);
  const photo = report.media.find((m) => m.type === 'image') ?? report.media[0];
  const title = categoryName(category) || report.categoryId;
  return (
    <PressableCard onPress={onPress} accessibilityLabel={`${title}, #${report.id}`} className="flex-row items-start gap-3">
      {photo ? (
        <Image source={{ uri: thumb(photo.url, 160) }} className="h-12 w-12 rounded-btn bg-line" accessibilityIgnoresInvertColors />
      ) : (
        <View className="h-12 w-12 items-center justify-center rounded-btn bg-primary-light">
          <Icon size={24} color={colors.primary} />
        </View>
      )}
      <View className="flex-1">
        <Txt weight="semibold" numberOfLines={1}>
          {title}
        </Txt>
        <Txt variant="caption" className="mt-0.5 text-muted">
          #{report.id} · {formatDate(report.createdAt)}
        </Txt>
        <View className="mt-1 flex-row items-center gap-1">
          <MapPin size={14} color={colors.muted} />
          <Txt variant="caption" numberOfLines={1} className="flex-1 text-muted">
            {report.location.address}
          </Txt>
        </View>
        <View className="mt-2.5">
          <StatusBadge status={report.status} />
        </View>
      </View>
      <View className="mt-3">
        <ChevronRight size={20} color={colors.placeholder} />
      </View>
    </PressableCard>
  );
}
