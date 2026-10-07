import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { metrics, useTheme } from '@/theme';

import { Text } from './text';

export interface SheetProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}

/** A bottom sheet over the plan: scrim, 24-radius top corners, drag handle. */
export function Sheet({ visible, title, subtitle, onClose, children }: SheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const m = metrics.sheet;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close without saving"
          onPress={onClose}
          style={[styles.scrim, { backgroundColor: colors.scrim }]}
        />
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, paddingBottom: m.paddingBottom + insets.bottom },
          ]}
        >
          <View style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: colors.controlBorder }]} />
          </View>
          <View style={styles.titles}>
            <Text variant="sheetTitle">{title}</Text>
            {subtitle ? (
              <Text variant="secondary" tone="muted">
                {subtitle}
              </Text>
            ) : null}
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const m = metrics.sheet;

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  scrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  sheet: {
    borderTopLeftRadius: m.radius,
    borderTopRightRadius: m.radius,
    paddingTop: m.paddingTop,
    paddingHorizontal: m.paddingHorizontal,
    gap: m.gap,
  },
  handleRow: { alignItems: 'center' },
  handle: {
    width: m.handleWidth,
    height: m.handleHeight,
    borderRadius: m.handleRadius,
  },
  titles: { gap: m.titleGap, paddingHorizontal: m.inset },
});
