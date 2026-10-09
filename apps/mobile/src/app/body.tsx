import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  addDays,
  loadVersusUsual,
  mainRecoveryCause,
  observations,
  projectedSessions,
  recentWindowDays,
  recoveryAt,
  sessionLoadOf,
  usualDailyLoad,
  type BodyRegion,
  type CompletedSession,
} from '@fitplan/engine';

import { deviceNow, shortDay } from '@/data/plan';
import { useStore } from '@/data/store';
import { observationSentence, readinessWords, regionHeading } from '@/i18n/sentences';
import { metrics, useTheme } from '@/theme';
import {
  ActionChip,
  BottomBar,
  Button,
  CardDivider,
  FlatRowButton,
  MeterBar,
  RangeGauge,
  Section,
  SurfaceCard,
  Text,
} from '@/ui';

const lib = metrics.library;

/** The four regions the Body screen meters, in the mockup's order. */
const METER_REGIONS: readonly BodyRegion[] = [
  'legs',
  'backAndCore',
  'armsAndShoulders',
  'fingersAndForearms',
];

/** "2 h" for long sessions, "39 min" for short ones. */
function durationWords(minutes: number): string {
  if (minutes >= 90) return `${Math.round((minutes / 60) * 10) / 10} h`;
  return `${minutes} min`;
}

const verdictWords = {
  less: 'Less than your usual',
  about: 'Right where you usually are',
  more: 'More than your usual',
  // With nothing logged yet there is no usual; the dot rests in the middle.
  unknown: 'Right where you usually are',
} as const;

/** The Body tab: recovery right now, training load, observations, history. */
export default function Body() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const store = useStore();
  const { state, inputs, result, names, today } = store;

  const ctx = useMemo(() => ({ names, shortDay }), [names]);

  // Recovery right now: history plus the plan ahead, read at this moment.
  const now = deviceNow();
  const projected = { ...inputs, history: projectedSessions(inputs, result.plan) };
  const recovery = recoveryAt(projected, now);

  const worstRegion = METER_REGIONS.reduce((worst, region) =>
    recovery[region].readiness < recovery[worst].readiness ? region : worst,
  );
  const cause = mainRecoveryCause(inputs, result.plan, worstRegion, now);
  const basedOn = cause
    ? `Based on ${shortDay(cause.day)}'s ${(names.get(cause.exerciseId) ?? 'session').toLowerCase()} (${cause.minutes} min, effort ${cause.effort}) and your check-ins. Tell the app if it feels wrong and it adjusts.`
    : "Based on everything you've logged and your check-ins. Tell the app if it feels wrong and it adjusts.";

  // Training load over the last 7 days, against the user's usual.
  const verdict = loadVersusUsual(state.history, today);
  const usual = usualDailyLoad(state.history, today);
  const windowFrom = addDays(today, -recentWindowDays);
  const windowTo = addDays(today, -1);
  const recent = state.history.filter((s) => s.day >= windowFrom && s.day <= windowTo);
  const recentLoad = recent.reduce((sum, s) => sum + sessionLoadOf(s), 0);
  const ratio = usual > 0 ? recentLoad / recentWindowDays / usual : 1;
  // 0.5x of usual sits at 0.1, 1x at 0.5, 1.5x at 0.9.
  const position = Math.max(0, Math.min(1, 0.5 + (ratio - 1) * 0.8));
  const recentHours = Math.round(recent.reduce((sum, s) => sum + s.minutes, 0) / 60);

  const noticed = observations(inputs.exercises, inputs.history, inputs.learned);

  const recentSessions: CompletedSession[] = [...state.history]
    .sort((a, b) => b.day.localeCompare(a.day))
    .slice(0, 3);

  return (
    <View style={[styles.root, { backgroundColor: colors.ground, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Text variant="screenTitle">Body</Text>
          <ActionChip label="Not feeling 100%" onPress={() => router.push('/unwell' as Href)} />
        </View>

        <SurfaceCard style={styles.recoveryCard}>
          <View style={styles.cardHead}>
            <Text variant="sectionHeading">Recovery right now</Text>
            <Text variant="secondary" tone="muted">
              An estimate
            </Text>
          </View>
          {METER_REGIONS.map((region) => (
            <MeterBar
              key={region}
              label={regionHeading(region)}
              words={readinessWords(recovery[region].ready, recovery[region].readyOn, ctx, today)}
              fraction={recovery[region].readiness}
            />
          ))}
          <Text variant="secondary" tone="muted" style={styles.smallBody}>
            {basedOn}
          </Text>
          <Button
            label="Correct this"
            onPress={() =>
              router.push({ pathname: '/flow/before', params: { correct: '1' } } as Href)
            }
          />
        </SurfaceCard>

        <SurfaceCard style={styles.loadCard}>
          <Text variant="sectionHeading">Training load, last 7 days</Text>
          <Text variant="statValue">{verdictWords[verdict]}</Text>
          <RangeGauge
            position={position}
            leftLabel="Much less"
            midLabel="Your usual"
            rightLabel="Much more"
          />
          <Text variant="secondary" tone="muted" style={styles.smallBody}>
            {`${recent.length} ${recent.length === 1 ? 'session' : 'sessions'}, about ${recentHours} ${recentHours === 1 ? 'hour' : 'hours'}. Staying near your usual keeps the injury risk low while fitness holds steady.`}
          </Text>
        </SurfaceCard>

        <SurfaceCard style={styles.noticedCard}>
          <Text variant="sectionHeading">What the app has noticed</Text>
          {noticed.length === 0 ? (
            <Text variant="advice" tone="muted">
              Nothing yet — it speaks up when a pattern is clear.
            </Text>
          ) : (
            noticed.map((observation, index) => (
              <Text key={index} variant="advice">
                {observationSentence(observation, ctx)}
              </Text>
            ))
          )}
        </SurfaceCard>

        <Section heading="Recent sessions">
          <SurfaceCard list>
            {recentSessions.map((session, index) => (
              <View key={`${session.exerciseId}:${session.day}:${index}`}>
                {index > 0 ? <CardDivider /> : null}
                <View style={styles.sessionRow}>
                  <Text variant="label" tone="muted" style={styles.dateGutter}>
                    {shortDay(session.day)}
                  </Text>
                  <Text variant="listTitle" style={styles.grow}>
                    {names.get(session.exerciseId) ?? session.exerciseId}
                  </Text>
                  <Text variant="secondary" tone="muted">
                    {`${durationWords(session.minutes)} · effort ${session.effort}`}
                  </Text>
                </View>
              </View>
            ))}
            {recentSessions.length > 0 ? <CardDivider /> : null}
            <FlatRowButton
              label="See everything you've done"
              onPress={() => router.push('/history' as Href)}
            />
          </SurfaceCard>
        </Section>
      </ScrollView>

      <BottomBar
        current="body"
        onSelect={(tab) => {
          if (tab === 'body') return;
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: metrics.header.inset,
  },
  recoveryCard: { gap: 14 },
  loadCard: { gap: 12 },
  noticedCard: { gap: 6 },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  smallBody: { lineHeight: 18 },
  sessionRow: {
    minHeight: lib.rowSession,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateGutter: { width: lib.dateGutter },
  grow: { flex: 1 },
});
