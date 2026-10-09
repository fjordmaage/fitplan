import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { metrics, useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Text } from './text';

export type TabName = 'plan' | 'exercises' | 'body' | 'learn';

const tabs: { name: TabName; label: string; icon: IconName }[] = [
  { name: 'plan', label: 'Plan', icon: 'tabPlan' },
  { name: 'exercises', label: 'Exercises', icon: 'tabExercises' },
  { name: 'body', label: 'Body', icon: 'tabBody' },
  { name: 'learn', label: 'Learn', icon: 'tabLearn' },
];

export interface BottomBarProps {
  current: TabName;
  onSelect?: (tab: TabName) => void;
  onAdd?: () => void;
}

/** Four tabs with the round Add button between the second and third. */
export function BottomBar({ current, onSelect, onAdd }: BottomBarProps) {
  const { colors } = useTheme();
  const m = metrics.bottomBar;
  // The bar itself is 68 high; the phone's gesture area is extra surface below
  // it, so the Android home bar never covers the icons.
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.hairline,
          paddingBottom: insets.bottom,
          height: m.height + insets.bottom,
        },
      ]}
    >
      {tabs.slice(0, 2).map((tab) => (
        <Tab key={tab.name} tab={tab} current={current} onSelect={onSelect} />
      ))}

      <View style={styles.addCell}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add a workout, a busy time or a past activity"
          onPress={onAdd}
          style={({ pressed }) => [
            styles.add,
            { backgroundColor: colors.ink },
            pressed && styles.pressed,
          ]}
        >
          <Icon name="plus" size={m.addGlyph} color={colors.textOnInk} />
        </Pressable>
      </View>

      {tabs.slice(2).map((tab) => (
        <Tab key={tab.name} tab={tab} current={current} onSelect={onSelect} />
      ))}
    </View>
  );
}

function Tab({
  tab,
  current,
  onSelect,
}: {
  tab: (typeof tabs)[number];
  current: TabName;
  onSelect?: (tab: TabName) => void;
}) {
  const { colors } = useTheme();
  const selected = tab.name === current;
  const tint = selected ? colors.ink : colors.mutedText;

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected }}
      onPress={onSelect ? () => onSelect(tab.name) : undefined}
      style={styles.tab}
    >
      <Icon name={tab.icon} size={metrics.bottomBar.glyph} color={tint} />
      <Text variant={selected ? 'smallLabelSelected' : 'smallLabel'} color={tint}>
        {tab.label}
      </Text>
    </Pressable>
  );
}

const m = metrics.bottomBar;

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: m.height,
    paddingHorizontal: m.paddingHorizontal,
    borderTopWidth: m.borderTopWidth,
  },
  tab: {
    flex: 1,
    height: m.itemHeight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: m.itemGap,
  },
  addCell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  add: {
    width: m.addSize,
    height: m.addSize,
    borderRadius: m.addRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.8 },
});
