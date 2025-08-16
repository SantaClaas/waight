import { For, Show, type Accessor, type JSX } from "solid-js";
import type { Entry } from "./data";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

type Properties = { entries: Accessor<Entry[]> };

type TrendLine = Pick<
  JSX.LineSVGAttributes<SVGLineElement>,
  "x1" | "x2" | "y1" | "y2"
>;

type Range = {
  from: number;
  to: number;
};

type Ranges = {
  x: Range;
  y: Range;
};

type Aggregation = {
  sums: {
    xSquared: number;
    xTimesY: number;
    x: number;
    y: number;
  };
  ranges?: Ranges;
};

function aggregate(entries: Entry[]): Aggregation {
  if (entries.length === 0)
    return {
      sums: {
        xSquared: 0,
        xTimesY: 0,
        x: 0,
        y: 0,
      },
    };

  const sums = {
    xSquared: 0,
    xTimesY: 0,
    x: 0,
    y: 0,
  };

  const ranges = {
    x: {
      from: 0,
      to: 0,
    },
    y: {
      from: 0,
      to: 0,
    },
  };

  for (const entry of entries) {
    // const timeInRange = entry.timestamp.getTime() - xScope.from;
    // // x in minutes
    // const x = timeInRange / 1_000 / 60;
    const x = entry.timestamp.getTime();

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
//TODO write tests for 1, 2, n inputs
function useTrendLine(entries: Accessor<Entry[]>): {
  trendLine: Accessor<TrendLine | undefined>;
  aggregation: Accessor<Aggregation>;
} {
  const n = () => entries().length;
  const aggregation = () => aggregate(entries());

  const slope = () => {
    const { sums } = aggregation();
    const currentN = n();
    if (currentN === 0) return 0;

    const dividend = currentN * sums.xTimesY - sums.x * sums.y;
    if (dividend === 0) return 0;

    const divisor = currentN * sums.xSquared - sums.x * sums.x;
    if (divisor === 0) return Infinity;

    return dividend / divisor;
  };

  const xAverage = () => aggregation().sums.x / n();
  const yAverage = () => aggregation().sums.y / n();

  const yIntercept = () => yAverage() - slope() * xAverage();

  const y = (x: number) => slope() * x + yIntercept();

  const trendLine = (): TrendLine | undefined => {
    const { ranges } = aggregation();
    if (ranges === undefined) return;
    return {
      x1: 0,
      x2: ranges.x.to,
      y1: yIntercept(),
      y2: y(ranges.x.to),
    };
  };

  return { trendLine, aggregation };
}

function XAxisMarks({ height }: { height: number }) {
  return (
    <For each={[10, 20, 30, 40, 50, 60, 70, 80, 90]}>
      {(x) => (
        <line
          x1={x}
          x2={x}
          y1={height}
          y2={height - 2}
          class="stroke-[0.5] stroke-gray-400"
        />
      )}
    </For>
  );
}

function YAxisMarks() {
  return (
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
  );
}

export default function Graph({ entries }: Properties) {
  //TODO make range configurable
  // Need to curb time stamp or we get overflow
  const now = new Date();

  const timeStart = startOfMonth(now).getTime();
  const timeEnd = endOfMonth(now).getTime();

  // const weightStart = 0;
  const weightEnd = 100;

  const { trendLine } = useTrendLine(entries);

  const width = 100;
  const height = 100;
  const adjustX = (x: number) => {
    const timeRange = timeEnd - timeStart;
    const xInTimeRange = x - timeStart;
    const percentage = xInTimeRange / timeRange;

    const inSvg = percentage * width;
    return inSvg;
  };

  const adjustY = (y: number) => {
    const percentage = y / weightEnd;
    const inSvg = height - percentage * height;
    return inSvg;
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`}>
      <YAxisMarks />
      <XAxisMarks height={height} />
      <Show when={trendLine()}>
        {(trendLine) => {
          const { x1, x2, y1, y2 } = trendLine();
          return (
            <line
              x1={adjustX(x1 as number)}
              x2={adjustX(x2 as number)}
              y1={adjustY(y1 as number)}
              y2={adjustY(y2 as number)}
              stroke-linecap="round"
              class="stroke-[0.5] stroke-sky-400"
            />
          );
        }}
      </Show>
      <For each={entries()}>
        {({ weight, timestamp }) => {
          return (
            // TODO filter out values out of range
            <circle
              cx={adjustX(timestamp.getTime())}
              cy={adjustY(weight)}
              r="1"
              data-weight={weight}
              class="fill-emerald-500"
            />
          );
        }}
      </For>
      <path
        d={`M${width / 2 - 2.5},${height / 2} l5,0 M${width / 2},${
          height / 2 - 2.5
        } l0,5 `}
        stroke-width={0.5}
        class="stroke-gray-300"
      />
    </svg>
  );
}
