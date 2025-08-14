import { createEffect, For, from, type Accessor, type JSX } from "solid-js";
import type { Entry } from "./data";

function* repeat(times: number) {
  for (let index = 0; index < times; index++) {
    yield index;
  }
}

function daysInMonth(year: number, month: number) {
  // You can go negative on days. So 0 is the last day of the previous month
  // Momth is 0 based index e.g. 11 is December
  // Sou we would have to -1 to get the current month with the momth number
  // But we want the next one so it would be +1 which cancels out the -1
  return new Date(year, month, 0).getDate();
}

function startOfMonth(year: number, month: number) {
  return new Date(year, month, 1);
}

type Properties = { entries: Accessor<Entry[]> };

type TrendLine = Pick<
  JSX.LineSVGAttributes<SVGLineElement>,
  "x1" | "x2" | "y1" | "y2"
>;

type Max = {
  x: number;
  y: number;
};

type Range = {
  from: number;
  to: number;
};

type Aggregation = {
  sums: {
    xSquared: number;
    xTimesY: number;
    x: number;
    y: number;
  };
  ranges: {
    x: Range;
    y: Range;
  };
};

function aggregate(entries: Entry[], xScope: Range): Aggregation {
  const sums = {
    xSquared: 0,
    xTimesY: 0,
    x: 0,
    y: 0,
  };

  const ranges = {
    x: {
      from: Number.NEGATIVE_INFINITY,
      to: Number.POSITIVE_INFINITY,
    },
    y: {
      from: Number.NEGATIVE_INFINITY,
      to: Number.POSITIVE_INFINITY,
    },
  };

  for (const entry of entries) {
    const x = entry.timestamp.getTime() - xScope.from;
    // If the timestamp is before the start of the month
    if (x < 0) continue;

    sums.xSquared += x * x;
    sums.xTimesY += x * entry.weight;
    sums.x += x;
    sums.y += entry.weight;

    ranges.x.to = Math.max(ranges.x.to, x);
    ranges.y.to = Math.max(ranges.y.to, entry.weight);
    ranges.x.from = Math.min(ranges.x.from, x);
    ranges.y.from = Math.min(ranges.y.from, entry.weight);
  }

  return { sums, ranges };
}

function useTrendLine(
  entries: Accessor<Entry[]>,
  xRange: Range
): {
  trendLine: Accessor<TrendLine>;
  aggregation: Accessor<Aggregation>;
} {
  const n = () => entries().length;
  const aggregation = () => aggregate(entries(), xRange);

  const slope = () => {
    const { sums } = aggregation();
    const dividend = n() * sums.xTimesY - sums.x * sums.y;
    const divisor = n() * sums.xSquared - sums.x * sums.x;
    return dividend / divisor;
  };

  const xAverage = () => aggregation().sums.x / n();
  const yAverage = () => aggregation().sums.y / n();

  const yIntercept = () => yAverage() - slope() * xAverage();

  const y = (x: number) => slope() * x + yIntercept();

  const trendLine = (): TrendLine => {
    const { ranges } = aggregation();
    return {
      x1: 0,
      x2: ranges.x.to,
      y1: ranges.y.to - yIntercept(),
      y2: ranges.y.to - y(ranges.x.to),
    };
  };

  return { trendLine, aggregation };
}

export default function Graph({ entries }: Properties) {
  //TODO make range configurable
  // Need to curb time stamp or we get overflow
  const now = new Date();
  const xRange = {
    from: startOfMonth(now.getFullYear(), now.getMonth()).getTime(),
    to: Number.POSITIVE_INFINITY,
  };
  const { trendLine, aggregation } = useTrendLine(entries, xRange);

  createEffect(() => {
    console.debug("trendLine", trendLine());
  });

  const maxX = () => aggregation().ranges.x.to;
  const maxY = () => aggregation().ranges.y.to;
  return (
    <svg viewBox={`0 0 ${maxX()} ${maxY()}`}>
      {/* Y markers */}
      <For each={[10, 20, 30, 40, 50, 60, 70, 80, 90]}>
        {(y) => (
          <line
            x1="0"
            x2="2"
            y1={y}
            y2={y}
            stroke-linecap="round"
            class="stroke-[0.5] stroke-gray-400"
          />
        )}
      </For>
      {/* X markers */}
      <For each={[10, 20, 30, 40, 50, 60, 70, 80, 90]}>
        {(x) => (
          <line
            x1={x}
            x2={x}
            y1={maxY()}
            y2={maxY() - 2}
            class="stroke-[0.5] stroke-gray-400"
          />
        )}
      </For>
      <line
        {...trendLine()}
        stroke-linecap="round"
        class="stroke-[0.5] stroke-sky-400"
      />
      <For each={entries()}>
        {(entry) => {
          return (
            // TODO filter out values out of range
            <circle
              cx={entry.timestamp.getTime() - xRange.from}
              cy={maxY() - entry.weight}
              r="1"
              class="fill-emerald-500"
            />
          );
        }}
      </For>
    </svg>
  );
}
