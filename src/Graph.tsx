import { createEffect, For, Show, type Accessor, type JSX } from "solid-js";
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

type Point = {
  x: number;
  y: number;
};

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

function YAxisMarks({ width }: { width: number }) {
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

// const adjustToSvgSpace = () => {
//   const { x, y } = ranges();
//   const maxX = x.to;
//   const maxY = y.to;

//   return (x: number, y: number) => {
//     // Percent of the max value
//     // Percent of the width
//     x = (x / maxX) * width;
//     y = (y / maxY) * height;

//     return [height - y, width - x];
//   };
// };

function adjustToSvgSpace(
  x: number,
  y: number,
  maxX: number,
  maxY: number,
  width: number,
  height: number
) {
  // Percent of the max value
  // Percent of the width
  x = (x / maxX) * width;
  y = (y / maxY) * height;

  console.debug({ x, y, maxX, maxY, width, height });

  return [height - y, width - x];
}

export default function Graph({ entries }: Properties) {
  //TODO make range configurable
  // Need to curb time stamp or we get overflow
  const now = new Date();
  const xRange = {
    from: startOfMonth(now.getFullYear(), now.getMonth()).getTime(),
    to: Number.POSITIVE_INFINITY,
  };
  const { trendLine, aggregation } = useTrendLine(entries);

  const width = 100;
  const height = 100;

  createEffect(() => console.debug("trendLine", trendLine()));

  return (
    <Show when={aggregation().ranges}>
      {(ranges) => {
        const adjust = (x: number, y: number) => {
          const { x: xRange } = ranges();
          const relativeX = (x / xRange.to) * 100;

          return adjustToSvgSpace(relativeX, y, 100, 100, width, height);
        };
        return (
          <svg viewBox={`0 0 ${width} ${height}`}>
            <YAxisMarks width={width} />
            <XAxisMarks height={height} />
            <Show when={trendLine()}>
              {(trendLine) => {
                const line = trendLine();
                const [x1, y1] = adjust(line.x1 as number, line.x2 as number);
                const [x2, y2] = adjust(line.x2 as number, line.x2 as number);
                return (
                  <line
                    x1={x1}
                    x2={x2}
                    y1={y1}
                    y2={y2}
                    stroke-linecap="round"
                    class="stroke-[0.5] stroke-sky-400"
                  />
                );
              }}
            </Show>
            <For each={entries()}>
              {({ weight, timestamp }) => {
                const [x, y] = adjust(timestamp.getTime(), weight);
                return (
                  // TODO filter out values out of range
                  <circle
                    cx={x}
                    cy={y}
                    r="1"
                    data-weight={weight}
                    class="fill-emerald-500"
                  />
                );
              }}
            </For>
            <circle cx="50" cy="50" r="1" class="fill-emerald-500" />
          </svg>
        );
      }}
    </Show>
  );
}
