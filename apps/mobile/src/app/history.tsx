import { Fragment, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { shortDay } from '@/data/plan';
import { useStore } from '@/data/store';
import { metrics, useTheme } from '@/theme';
import {
  ActionChip,
  CardDivider,
  ChoiceButton,
  ListRow,
  RoundIconButton,
  Section,
  SurfaceCard,
  Text,
} from '@/ui';

const lib = metrics.library;

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** "October", with the year when it is not this year's. */
function monthHeading(monthKey: string, today: string): string {
  const [year, month] = monthKey.split('-');
  const name = monthNames[Number(month) - 1] ?? monthKey;
  return year === today.slice(0, 4) ? name : `${name} ${year}`;
}

/** "2 h" for long sessions, "39 min" for short ones. */
function durationWords(minutes: number): string {
  if (minutes >= 90) return `${Math.round((minutes / 60) * 10) / 10} h`;
  return `${minutes} min`;
}

interface HistoryEntry {
  kind: 'session' | 'skip';
  exerciseId: string;
  day: string;
  title: string;
  meta: string;
  minutes: number;
}

/** Everything done and skipped, grouped by month, newest first. */
export default function History() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const store = useStore();
  const { state, names, today } = store;
  const params = useLocalSearchParams<{ exercise?: string }>();

  const [filter, setFilter] = useState<string | undefined>(() =>
    typeof params.exercise === 'string' && params.exercise.length > 0 ? params.exercise : undefined,
  );
  const [exportNote, setExportNote] = useState(false);
  const [openMonths, setOpenMonths] = useState<ReadonlySet<string>>(new Set());

  // Filter pills: Everything plus up to four exercises present in history,
  // most recently done first.
  const pillIds = useMemo(() => {
    const seen: string[] = [];
    const sorted = [...state.history].sort((a, b) => b.day.localeCompare(a.day));
    for (const session of sorted) {
      if (!seen.includes(session.exerciseId)) seen.push(session.exerciseId);
    }
    let ids = seen.slice(0, 4);
    if (filter && seen.includes(filter) && !ids.includes(filter)) {
      ids = [filter, ...ids.slice(0, 3)];
    }
    return ids;
  }, [state.history, filter]);

  const sessions = useMemo(
    () => state.history.filter((s) => !filter || s.exerciseId === filter),
    [state.history, filter],
  );
  const skips = useMemo(
    () => state.skips.filter((s) => !filter || s.exerciseId === filter),
    [state.skips, filter],
  );

  // This month's totals, under the current filter.
  const currentMonth = today.slice(0, 7);
  const monthSessions = sessions.filter((s) => s.day.slice(0, 7) === currentMonth);
  const monthMinutes = monthSessions.reduce((sum, s) => sum + s.minutes, 0);
  const averageEffort =
    monthSessions.length > 0
      ? (monthSessions.reduce((sum, s) => sum + s.effort, 0) / monthSessions.length).toFixed(1)
      : '–';

  // Month groups, newest first; sessions and skips interleaved by day.
  const months = useMemo(() => {
    const entries: HistoryEntry[] = [];
    for (const session of sessions) {
      const detail = state.sessionDetails.find(
        (d) => d.exerciseId === session.exerciseId && d.day === session.day,
      );
      const soreBefore = state.checkIns.some(
        (c) => c.day === session.day && Object.values(c.soreness).includes('sore'),
      );
      const parts = [`${durationWords(session.minutes)} · effort ${session.effort}`];
      if (detail?.source === 'imported') parts.push('from import');
      if (detail?.source === 'logged') parts.push('logged afterwards');
      if (detail?.note) parts.push(`"${detail.note}"`);
      if (soreBefore) parts.push('sore before');
      entries.push({
        kind: 'session',
        exerciseId: session.exerciseId,
        day: session.day,
        title: names.get(session.exerciseId) ?? session.exerciseId,
        meta: parts.join(' · '),
        minutes: session.minutes,
      });
    }
    for (const skip of skips) {
      entries.push({
        kind: 'skip',
        exerciseId: skip.exerciseId,
        day: skip.day,
        title: `${names.get(skip.exerciseId) ?? skip.exerciseId}, skipped`,
        meta: 'Kept in the log',
        minutes: 0,
      });
    }
    entries.sort((a, b) => b.day.localeCompare(a.day));
    const byMonth = new Map<string, HistoryEntry[]>();
    for (const entry of entries) {
      const key = entry.day.slice(0, 7);
      const list = byMonth.get(key) ?? [];
      list.push(entry);
      byMonth.set(key, list);
    }
    return [...byMonth.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, list]) => ({ key, entries: list }));
  }, [sessions, skips, state.sessionDetails, state.checkIns, names]);

  return (
    <View style={[styles.root, { backgroundColor: colors.ground, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <RoundIconButton icon="chevronLeft" label="Back" onPress={() => router.back()} />
          <Text variant="backTitle" style={styles.grow}>
            History
          </Text>
          <ActionChip label="Export" onPress={() => setExportNote((value) => !value)} />
        </View>

        {exportNote ? (
          <Text variant="secondary" tone="muted" style={styles.note}>
            Export lands with the next update — nothing you log is ever deleted.
          </Text>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          <ChoiceButton
            label="Everything"
            shape="pill"
            selected={filter == null}
            onPress={() => setFilter(undefined)}
          />
          {pillIds.map((id) => (
            <ChoiceButton
              key={id}
              label={names.get(id) ?? id}
              shape="pill"
              selected={filter === id}
              onPress={() => setFilter(id)}
            />
          ))}
        </ScrollView>

        <SurfaceCard style={styles.totals}>
          <View style={styles.totalCell}>
            <Text variant="statValue">{`${monthSessions.length}`}</Text>
            <Text variant="secondary" tone="muted">
              {`sessions so far in ${monthNames[Number(currentMonth.slice(5)) - 1]}`}
            </Text>
          </View>
          <View style={styles.totalCell}>
            <Text variant="statValue">
              {`${Math.floor(monthMinutes / 60)} h ${String(monthMinutes % 60).padStart(2, '0')}`}
            </Text>
            <Text variant="secondary" tone="muted">
              time spent
            </Text>
          </View>
          <View style={styles.totalCell}>
            <Text variant="statValue">{averageEffort}</Text>
            <Text variant="secondary" tone="muted">
              average effort
            </Text>
          </View>
        </SurfaceCard>

        {months.map((month) => {
          const open = month.key === currentMonth || openMonths.has(month.key);
          const monthCount = month.entries.filter((e) => e.kind === 'session').length;
          const hours = Math.round(month.entries.reduce((sum, e) => sum + e.minutes, 0) / 60);
          return (
            <Section key={month.key} heading={monthHeading(month.key, today)}>
              <SurfaceCard list>
                {open ? (
                  month.entries.map((entry, index) => (
                    <Fragment key={`${entry.kind}:${entry.exerciseId}:${entry.day}:${index}`}>
                      {index > 0 ? <CardDivider /> : null}
                      <View style={styles.entry}>
                        <View style={styles.entryTop}>
                          <Text
                            variant="listTitle"
                            {...(entry.kind === 'skip' ? { tone: 'muted' as const } : {})}
                            style={styles.entryTitle}
                          >
                            {entry.title}
                          </Text>
                          <Text variant="secondary" tone="muted">
                            {shortDay(entry.day)}
                          </Text>
                        </View>
                        <Text variant="secondary" tone="muted">
                          {entry.meta}
                        </Text>
                      </View>
                    </Fragment>
                  ))
                ) : (
                  <ListRow
                    label={`${monthCount} sessions`}
                    value={`${hours} h · show all`}
                    height={lib.rowTall}
                    accessibilityLabel={`Show all of ${monthHeading(month.key, today)}`}
                    onPress={() => setOpenMonths((current) => new Set([...current, month.key]))}
                  />
                )}
              </SurfaceCard>
            </Section>
          );
        })}

        <Text variant="secondary" tone="muted" style={styles.note}>
          Everything you enter is kept on your phone: sessions, check-ins, notes, skips and every
          change to the plan. Export gives you the lot as a file.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingTop: lib.scrollPaddingTop,
    paddingHorizontal: lib.scrollPaddingHorizontal,
    paddingBottom: lib.scrollPaddingBottom,
    gap: 18,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  grow: { flex: 1 },
  note: { lineHeight: 18, paddingHorizontal: metrics.header.inset },
  filters: { gap: 6 },
  totals: { flexDirection: 'row', gap: 12 },
  totalCell: { flex: 1, gap: 2 },
  entry: { gap: 2, paddingVertical: 12 },
  entryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
  },
  entryTitle: { flexShrink: 1 },
});
