import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { metrics, useTheme } from '@/theme';
import { BackHeader, Text } from '@/ui';

const lib = metrics.library;

interface Article {
  title: string;
  paragraphs: readonly string[];
}

/**
 * The short reads. Written here, not generated: the app only ever says
 * things a person wrote down. 'how-recovery' describes the real model in
 * packages/engine and must stay true to it.
 */
const articles: Record<string, Article> = {
  'why-rest': {
    title: 'Why rest days make you fitter',
    paragraphs: [
      'A workout does not make you fitter while it happens. It makes you a little weaker: muscles, tendons and energy stores all take a small hit. The gains come afterwards, when your body repairs the damage and builds back slightly stronger than before.',
      'That rebuilding takes time, and it only happens when you are not adding new strain on top. Train hard every day and you keep interrupting the repair work — you collect fatigue instead of fitness, and the risk of getting hurt creeps up.',
      'So a rest day is not a day off from getting fitter. It is the day the getting fitter actually happens. The session earns it; the rest banks it.',
      'Rest does not have to mean the sofa. A walk, light stretching or an easy spin are fine — they keep you moving without asking your body for more than it can give while it rebuilds.',
    ],
  },
  'easy-easy': {
    title: 'Easy runs should feel easy',
    paragraphs: [
      'Most of the running that builds your endurance happens at an effort that feels almost too gentle. Around 3 or 4 out of 10: you could talk in full sentences the whole way, and you finish feeling like you could have gone on.',
      'It is tempting to push a bit on those runs. A little faster feels more productive, and the pace on the watch looks better. But the extra speed mostly adds fatigue, not fitness — and that fatigue is paid for by the sessions that actually need you fresh.',
      'The pattern that works is plain: easy days genuinely easy, hard days genuinely hard. Blur them together and you end up doing everything at a middling effort that is too hard to recover from quickly and too easy to push you forward.',
      'If your easy runs keep drifting harder, slow down until talking feels comfortable again. Slower than feels natural is usually about right.',
    ],
  },
  'warm-up': {
    title: 'Warming up properly',
    paragraphs: [
      'A warm-up is not a separate ritual. It is the first part of the session, done gently: a few minutes of easy movement to raise your temperature, get blood into the muscles and remind the joints what is coming.',
      'Start general — easy jogging, brisk walking or light rowing until you feel warm. Then get specific: rehearse what the session will ask of you at a low dose. Lighter sets before heavy ones, easy moves before hard pulls, a gentle first kilometre before picking up the pace.',
      'Tendons and fingers deserve extra patience. They warm up more slowly than the big muscles, and they complain the loudest when rushed — climbers feel this more than most.',
      'A proper warm-up costs about ten minutes. The first hard effort of the day feels noticeably better for it, and skipping it is one of the cheaper ways to get hurt.',
    ],
  },
  soreness: {
    title: "What soreness does and doesn't tell you",
    paragraphs: [
      'Soreness a day or two after training is a normal reaction to work your body is not used to — a new exercise, a bigger dose, a long break. It usually peaks around the second day and fades on its own.',
      'What it tells you: the work was unfamiliar. What it does not tell you: how good the session was. You can get fitter without ever being sore, and very sore without having trained well. Chasing soreness is chasing the wrong signal.',
      'Training gently while mildly sore is fine, and moving often helps. Loading the same muscles hard while they are still clearly sore mostly delays the repair you were waiting for.',
      'Pain is a different thing from soreness. Something sharp, one-sided, or getting worse while you train is not a training signal to push through — ease off, and if it stays, ask someone qualified to look at it.',
      "Either way, tell the app at check-in. A sore region nudges the day's plan, and that is exactly what the check-in is for.",
    ],
  },
  'how-recovery': {
    title: 'How the app estimates recovery',
    paragraphs: [
      'Every session you log gets one number for how much it asked of you: the minutes, times how hard it felt on the 1 to 10 scale. A long easy run and a short hard climb can end up with a similar number — duration and effort both count.',
      'That number lands on your body unevenly, depending on the activity. A run goes mostly to your legs; climbing goes mostly to your fingers, forearms, arms and shoulders; a back routine goes to your back and core.',
      'Each region then sheds its share over time, and each has its own pace: the load fades by half over a set stretch of hours, then half again, and so on. Fingers and forearms shed load more slowly than legs, which is why a climbing day lingers longer than a running day.',
      "The app also looks forward, not just back. Planned sessions are counted as if they will happen at their usual dose — so tomorrow's picture already knows about tonight's climb before you have done it.",
      "Your check-ins steer the whole thing. When you report feeling fresher or more sore than the estimate says, today's picture adjusts right away, and repeated differences slowly teach the app how fast your body actually recovers.",
      'All of it is an estimate, and the app labels it as one. It cannot see inside your legs — it can only do the arithmetic honestly and listen when you say it feels wrong.',
    ],
  },
};

/** One short read, plain text on the ground colour. */
export default function Read() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const article = (typeof slug === 'string' ? articles[slug] : undefined) ?? {
    title: 'Short read',
    paragraphs: ["This read isn't available."],
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.ground, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BackHeader title={article.title} backLabel="Back" />
        {article.paragraphs.map((paragraph, index) => (
          <Text key={index} variant="advice">
            {paragraph}
          </Text>
        ))}
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
});
