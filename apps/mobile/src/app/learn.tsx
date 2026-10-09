import { Fragment, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  addDays,
  mainRecoveryCause,
  recoveryDays,
  slotMinutes,
  SLOTS,
  type PlanChange,
} from '@fitplan/engine';

import { ratingFor, shortDay } from '@/data/plan';
import { useStore } from '@/data/store';
import { adviceSentence, changeSentence, recoverySentence } from '@/i18n/sentences';
import { metrics, useTheme } from '@/theme';
import { BottomBar, CardDivider, FlatRowButton, Section, SurfaceCard, Text } from '@/ui';

const lib = metrics.library;

/** The device-local day of an ISO timestamp (the stored `at` is UTC). */
function localDay(atIso: string): string {
  const date = new Date(atIso);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

const READS: { slug: string; title: string; duration: string }[] = [
  { slug: 'why-rest', title: 'Why rest days make you fitter', duration: '2 min' },
  { slug: 'easy-easy', title: 'Easy runs should feel easy', duration: '3 min' },
  { slug: 'warm-up', title: 'Warming up properly', duration: '3 min' },
  { slug: 'soreness', title: "What soreness does and doesn't tell you", duration: '2 min' },
  { slug: 'how-recovery', title: 'How the app estimates recovery', duration: '4 min' },
];

/** The Learn tab: why the plan looks like this, the change log, short reads. */
export default function Learn() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const store = useStore();
  const { state, inputs, result, names, today } = store;

  const [allChanges, setAllChanges] = useState(false);

  const ctx = useMemo(() => ({ names, shortDay }), [names]);

  // Up to three entries explaining the next placements (looking up to a week
  // ahead, so a busy weekend doesn't leave the section empty), plus one
  // upcoming rest day when the engine says a region is still recovering.
  const whyEntries = useMemo(() => {
    const horizon = addDays(today, 7);
    const entries = result.plan.items
      .filter((item) => item.day >= today && item.day <= horizon)
      .sort((a, b) => a.day.localeCompare(b.day) || SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot))
      .map((item) => ({
        key: `${item.exerciseId}:${item.day}:${item.slot}`,
        title: `${names.get(item.exerciseId) ?? item.exerciseId} ${
          item.day === today
            ? 'today'
            : item.day === addDays(today, 1)
              ? 'tomorrow'
              : `on ${shortDay(item.day)}`
        }`,
        body: adviceSentence(ratingFor(store, item)?.reasons ?? [], ctx),
      }));

    const resting = recoveryDays(inputs, result.plan, 4);
    for (let i = 1; i <= 3; i++) {
      const day = addDays(today, i);
      const occupied =
        result.plan.items.some((item) => item.day === day) ||
        inputs.anchors.some((anchor) => !anchor.cancelled && anchor.day === day);
      const regions = resting.get(day);
      if (!occupied && regions && regions.length > 0) {
        entries.push({
          key: `rest:${day}`,
          title: `Nothing on ${shortDay(day)}`,
          body: recoverySentence(
            regions,
            mainRecoveryCause(inputs, result.plan, regions[0]!, {
              day,
              minutes: slotMinutes.morning,
            }),
            ctx,
          ),
        });
        break;
      }
    }
    return entries.slice(0, 3);
  }, [store, inputs, result, names, today, ctx]);

  // Every saved change, newest first, for the change log.
  const changePairs = useMemo(() => {
    const pairs: { at: string; change: PlanChange }[] = [];
    for (let i = state.planLog.length - 1; i >= 0; i--) {
      const entry = state.planLog[i]!;
      for (const change of entry.changes) pairs.push({ at: entry.at, change });
    }
    return pairs;
  }, [state.planLog]);
  const shownPairs = changePairs.slice(0, allChanges ? 20 : 4);

  return (
    <View style={[styles.root, { backgroundColor: colors.ground, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text variant="screenTitle" style={styles.title}>
          Learn
        </Text>

        <Section heading="Why your plan looks like this">
          <SurfaceCard list>
            {whyEntries.length === 0 ? (
              <View style={styles.entry}>
                <Text variant="advice" tone="muted">
                  Nothing is placed in the next week — busy time or a break. The app explains each
                  placement here once something is planned.
                </Text>
              </View>
            ) : (
              whyEntries.map((entry, index) => (
                <Fragment key={entry.key}>
                  {index > 0 ? <CardDivider /> : null}
                  <View style={styles.entry}>
                    <Text variant="sectionHeading">{entry.title}</Text>
                    <Text variant="advice" tone="muted">
                      {entry.body}
                    </Text>
                  </View>
                </Fragment>
              ))
            )}
          </SurfaceCard>
        </Section>

        <Section heading="What the app changed">
          <SurfaceCard list>
            {shownPairs.length === 0 ? (
              <View style={styles.entry}>
                <Text variant="advice" tone="muted">
                  No changes yet.
                </Text>
              </View>
            ) : (
              shownPairs.map((pair, index) => (
                <Fragment key={index}>
                  {index > 0 ? <CardDivider /> : null}
                  <View style={styles.changeRow}>
                    <Text variant="label" tone="muted" style={styles.dateGutter}>
                      {shortDay(localDay(pair.at))}
                    </Text>
                    <Text variant="advice" style={styles.grow}>
                      {changeSentence(pair.change, ctx)}
                    </Text>
                  </View>
                </Fragment>
              ))
            )}
            {!allChanges && changePairs.length > shownPairs.length ? (
              <>
                <CardDivider />
                <FlatRowButton label="See all changes" onPress={() => setAllChanges(true)} />
              </>
            ) : null}
          </SurfaceCard>
        </Section>

        <Section heading="Short reads that fit your training">
          <SurfaceCard list>
            {READS.map((read, index) => (
              <Fragment key={read.slug}>
                {index > 0 ? <CardDivider /> : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${read.title}, ${read.duration} read`}
                  onPress={() => router.push(`/read/${read.slug}` as Href)}
                  style={({ pressed }) => [styles.readRow, pressed && styles.pressed]}
                >
                  <Text variant="listTitle" style={styles.readTitle}>
                    {read.title}
                  </Text>
                  <Text variant="secondary" tone="muted">
                    {read.duration}
                  </Text>
                </Pressable>
              </Fragment>
            ))}
          </SurfaceCard>
        </Section>
      </ScrollView>

      <BottomBar
        current="learn"
        onSelect={(tab) => {
          if (tab === 'learn') return;
          router.replace((tab === 'plan' ? '/' : `/${tab}`) as Href);
        }}
        onAdd={() => router.push({ pathname: '/', params: { add: '1' } })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingTop: lib.scrollPaddingTop,
    paddingHorizontal: lib.scrollPaddingHorizontal,
    paddingBottom: lib.scrollPaddingBottom,
    gap: lib.sectionGap,
  },
  title: { paddingHorizontal: metrics.header.inset },
  entry: { gap: 3, paddingVertical: 12 },
  changeRow: { flexDirection: 'row', gap: 12, paddingVertical: 12 },
  dateGutter: { width: lib.dateGutter, paddingTop: 1 },
  grow: { flex: 1 },
  readRow: {
    minHeight: lib.rowPick,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  readTitle: { flexShrink: 1 },
  pressed: { opacity: 0.7 },
});
