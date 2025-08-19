import { For, Show, type Accessor, type JSX } from "solid-js";
import type { Entry } from "./data";
import {
  daysInMilliseconds,
  daysInMonth,
  endOfMonth,
  startOfDay,
  startOfMonth,
} from "./date";

type Properties = { entries: Accessor<Entry[]> };

type TrendLine = Required<
  Pick<JSX.LineSVGAttributes<SVGLineElement>, "x1" | "x2" | "y1" | "y2">
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

type Point = { x: number; y: number };
function aggregate(points: Point[]): Aggregation {
  if (points.length === 0)
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
      from: Infinity,
      to: 0,
    },
    y: {
      from: Infinity,
      to: 0,
    },
  };

  for (const { x, y } of points) {
    sums.xSquared += x * x;
    sums.xTimesY += x * y;
    sums.x += x;
    sums.y += y;

    ranges.x.to = Math.max(ranges.x.to, x);
    ranges.y.to = Math.max(ranges.y.to, y);
    ranges.x.from = Math.min(ranges.x.from, x);
    ranges.y.from = Math.min(ranges.y.from, y);
  }

  return { sums, ranges };
}

//TODO write tests for 1, 2, n inputs
/**
 * @param xRange - The range of the x axis that is visible in the graph
 */
function useTrendLine(
  entries: Accessor<Point[]>,
  xRange: Range
): {
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
      x2: xRange.to,
      y1: yIntercept(),
      y2: y(xRange.to),
    };
  };

  return { trendLine, aggregation };
}

function XAxisMarks({
  height,
  xMarks,
  projectX,
}: {
  height: number;
  xMarks: number[];
  projectX: Projector;
}) {
  return (
    <For each={xMarks}>
      {(xMark) => {
        const x = projectX(xMark);
        return (
          <>
            <line
              x1={x}
              x2={x}
              y1={height}
              y2={height - 2}
              data-x={xMark}
              class="stroke-[0.5] stroke-gray-400"
            />
            <text x={x} y={height - 5} text-anchor="middle">
              {xMark}
            </text>
          </>
        );
      }}
    </For>
  );
}

function YAxisMarks({
  yMarks,
  projectY,
}: {
  yMarks: number[];
  projectY: Projector;
}) {
  return (
    <For each={yMarks}>
      {(yMark) => {
        const y = projectY(yMark);
        return (
          <>
            <line
              x1="0"
              x2="2"
              y1={y}
              y2={y}
              stroke-linecap="round"
              class="stroke-[0.5] stroke-gray-400"
            />

            <text x={2} y={y} alignment-baseline="middle">
              {yMark}
            </text>
          </>
        );
      }}
    </For>
  );
}

type Projector = (value: number) => number;
let rerenderCount = 0;

function Path({
  points,
  projectX,
  projectY,
}: {
  points: Point[];
  projectX: Projector;
  projectY: Projector;
}) {
  const projected = points
    .values()
    .map(({ x, y }) => ({
      x: projectX(x),
      y: projectY(y),
    }))
    .toArray();

  let data = "";

  /**
   * A semicolon-separated list of entire path definitions (d="..."). This is where you define the key shapes:
   */
  const values = `M${projected
    .map(({ x, y }) => `${x},100`)
    .join(" L")}; M${projected.map(({ x, y }) => `${x},${y}`).join(" L")}`;
  console.debug("values", values);
  /**
   * A list of time markers (0 to 1) corresponding to each shape in {@link values}. This controls the timing of the bounce.
   * For example, `0; 0.8; 1` would spend 80% of the duration moving to the overshoot shape and 20% settling back.
   */
  const keyTimes = "0; 1";

  /**
   * "ease-out" easing function bezier curve points (x1, y1, x2, y2) in keySplines syntax.
   * [MDN easing-function](https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function#cubic-bezier-easing-function)
   */
  const EASE_OUT_KEY_SPLINES = "0.42 0 1 1";

  return (
    <path
      d={`M${projected.map(({ x, y }) => `${x},${y}`).join(" L")}`}
      class="stroke-emerald-300 fill-none stroke-[0.5]"
    >
      {rerenderCount++}
      <animate
        attributeName="d"
        values={values}
        dur="2s"
        fill="freeze"
        repeatCount={1}
        calcMode="spline"
        keySplines={EASE_OUT_KEY_SPLINES}
        keyTimes={keyTimes}
      />
    </path>
  );
}

export default function Graph({ entries }: Properties) {
  // Need to curb time stamp or we get overflow
  const now = new Date();

  const timeStart = startOfMonth(now).getTime();
  const timeEnd = endOfMonth(now).getTime();
  function isInMonth({ timestamp }: Entry) {
    return timeStart <= timestamp.getTime() && timestamp.getTime() < timeEnd;
  }

  const days = daysInMonth(now);

  const points = () =>
    entries()
      .values()
      .filter(isInMonth)
      .map(({ weight, timestamp }) => {
        const time = timestamp.getTime() - startOfDay(timestamp).getTime();
        const dayCompletion = time / daysInMilliseconds(1);
        // It is easier to work with full days instead of milliseconds
        const day = timestamp.getDate() + dayCompletion;
        return {
          x: day,
          y: weight,
        };
      })
      .toArray();

  const { trendLine, aggregation } = useTrendLine(points, {
    from: 0,
    to: days,
  });

  const width = 100;
  const height = 100;

  function projectX(x: number) {
    const percentage = x / days;

    const inSvg = percentage * width;
    return inSvg;
  }

  const xMarks = function* () {
    const step = 5;
    // 1st
    yield 1;
    // 5th
    yield step;
    // 10th until end of month
    for (let x = step * 2; x < days - step; x += step) {
      yield x;
    }

    yield days;
  };

  return (
    <Show when={aggregation().ranges}>
      {(ranges) => {
        const yRange = () => {
          const { y } = ranges();
          const padding = 3;
          const median = (y.from + y.to) / 2;
          let from = Math.min(median - 5, y.from - padding);
          let to = Math.max(median + 5, y.to + padding);
          // let from = y.from - padding;
          // let to = y.to + padding;
          const stepSize = to - from > 10 ? 5 : 2;
          // Round to nearest step marker to make it look cleaner
          from = Math.floor(from / stepSize) * stepSize;
          to = Math.ceil(to / stepSize) * stepSize;

          return { from, to, stepSize };
        };

        function projectY(y: number) {
          const { from, to } = yRange();
          const length = to - from;
          const percentage = (y - from) / length;

          const inSvg = height - percentage * height;
          return inSvg;
        }

        const yMarks = function* () {
          const { from, to, stepSize } = yRange();

          for (let y = from + stepSize; y < to; y += stepSize) {
            yield y;
          }
          yield to;
        };

        function projectTrendline(trendLine: TrendLine) {
          const { x1, x2, y1, y2 } = trendLine;
          return {
            // Assume when it is a string is is the correct percentage string
            x1: typeof x1 === "number" ? projectX(x1) : x1,
            x2: typeof x2 === "number" ? projectX(x2) : x2,
            y1: typeof y1 === "number" ? projectY(y1) : y1,
            y2: typeof y2 === "number" ? projectY(y2) : y2,
          };
        }

        return (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            overflow="visible"
            class="w-full"
          >
            <YAxisMarks yMarks={yMarks().toArray()} projectY={projectY} />
            <XAxisMarks
              height={height}
              xMarks={xMarks().toArray()}
              projectX={projectX}
            />
            <Show when={trendLine()}>
              {(trendLine) => {
                const projectedTrendLine = projectTrendline(trendLine());
                return (
                  <line
                    {...projectedTrendLine}
                    stroke-linecap="round"
                    class="stroke-[0.5] stroke-sky-400"
                  />
                );
              }}
            </Show>
            <Path points={points()} projectX={projectX} projectY={projectY} />
            <For each={points()}>
              {({ x, y }) => {
                return (
                  // TODO filter out values out of range
                  <circle
                    cx={projectX(x)}
                    cy={projectY(y)}
                    r="1"
                    data-weight={y}
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
      }}
    </Show>
  );
}
