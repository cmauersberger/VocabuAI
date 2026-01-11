import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { FlashCardLearningStatisticsDto } from "../../domain/dtos/flashcards/FlashCardLearningStatisticsDto";
import { getApiBaseUrl } from "../../infrastructure/apiBaseUrl";
import { formatRelativeTime } from "../../infrastructure/formatRelativeTime";

type Props = {
  userName: string | null;
  authToken: string;
  onAuthFailure?: () => void;
};

const isAuthFailureResponse = (response: Response) =>
  response.status === 401 || response.status === 403;

export default function HomePage({ userName, authToken, onAuthFailure }: Props) {
  const apiBaseUrl = getApiBaseUrl();
  const [boxCounts, setBoxCounts] = React.useState<Record<string, number> | null>(
    null
  );
  const [learningStatistics, setLearningStatistics] =
    React.useState<FlashCardLearningStatisticsDto | null>(null);

  const loadBoxCounts = React.useCallback(async () => {
    try {
      const response = await fetch(
        `${apiBaseUrl}/flashcards/count-per-box`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      if (isAuthFailureResponse(response)) {
        onAuthFailure?.();
        return;
      }
      if (!response.ok) return;
      const payload = (await response.json()) as Record<string, number>;
      setBoxCounts(payload);
    } catch {
      onAuthFailure?.();
    }
  }, [apiBaseUrl, authToken, onAuthFailure]);

  const loadLearningStatistics = React.useCallback(async () => {
    try {
      const response = await fetch(
        `${apiBaseUrl}/flashcards/learning-statistics`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      if (isAuthFailureResponse(response)) {
        onAuthFailure?.();
        return;
      }
      if (!response.ok) return;
      const payload = (await response.json()) as FlashCardLearningStatisticsDto;
      setLearningStatistics(payload);
    } catch {
      onAuthFailure?.();
    }
  }, [apiBaseUrl, authToken, onAuthFailure]);

  React.useEffect(() => {
    void loadBoxCounts();
    void loadLearningStatistics();
  }, [loadLearningStatistics, loadBoxCounts]);

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>
        Welcome{userName ? `, ${userName}` : ""} to the Arabic Memo App
      </Text>
      {boxCounts ? <BoxOverview counts={boxCounts} /> : null}
      {learningStatistics ? (
        <LearningStatisticsOverview statistics={learningStatistics} />
      ) : null}
    </View>
  );
}

type BoxOverviewProps = {
  counts: Record<string, number>;
};

function BoxOverview({ counts }: BoxOverviewProps) {
  const entries = Object.entries(counts).sort(
    ([left], [right]) => Number(left) - Number(right)
  );
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <View style={styles.boxOverviewCard}>
      <View style={styles.boxOverviewRow}>
        {entries.map(([box, count]) => (
          <View key={box} style={styles.boxOverviewItem}>
            <Text style={styles.boxOverviewBox}>Box {box}</Text>
            <Text style={styles.boxOverviewCount}>{count}</Text>
          </View>
        ))}
        <View style={styles.boxOverviewSeparator} />
        <View style={styles.boxOverviewItem}>
          <Text style={styles.boxOverviewBox}>Total</Text>
          <Text style={styles.boxOverviewCount}>{total}</Text>
        </View>
      </View>
    </View>
  );
}

type LearningStatisticsOverviewProps = {
  statistics: FlashCardLearningStatisticsDto;
};

function LearningStatisticsOverview({
  statistics
}: LearningStatisticsOverviewProps) {
  const totalAnswered =
    statistics.correctCountTotal + statistics.wrongCountTotal;

  return (
    <View style={styles.boxOverviewCard}>
      <View style={styles.boxOverviewRow}>
        <View style={styles.boxOverviewItem}>
          <Text style={styles.boxOverviewBox}>Correct</Text>
          <Text style={styles.boxOverviewCount}>
            {statistics.correctCountTotal}
          </Text>
        </View>
        <View style={styles.boxOverviewSeparator} />
        <View style={styles.boxOverviewItem}>
          <Text style={styles.boxOverviewBox}>Wrong</Text>
          <Text style={styles.boxOverviewCount}>
            {statistics.wrongCountTotal}
          </Text>
        </View>
        <View style={styles.boxOverviewSeparator} />
        <View style={styles.boxOverviewItem}>
          <Text style={styles.boxOverviewBox}>Total answered</Text>
          <Text style={styles.boxOverviewCount}>{totalAnswered}</Text>
        </View>
        <View style={styles.boxOverviewSeparator} />
        <View style={styles.boxOverviewItem}>
          <Text style={styles.boxOverviewBox}>Last learned</Text>
          <Text style={styles.boxOverviewCount}>
            {formatRelativeTime(statistics.lastAnsweredAt)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 12
  },
  subtitle: {
    fontSize: 16,
    color: "#C7D2FE"
  },
  boxOverviewCard: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    padding: 8,
    gap: 6,
    alignSelf: "center"
  },
  boxOverviewRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    justifyContent: "center",
    gap: 4
  },
  boxOverviewItem: {
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 4,
    minWidth: 48
  },
  boxOverviewBox: {
    color: "#93C5FD",
    fontSize: 11
  },
  boxOverviewCount: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600"
  },
  boxOverviewSeparator: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(148, 163, 184, 0.4)",
    alignSelf: "center"
  }
});
