import { For } from "solid-js";

export default function Graph() {
  const maxX = 100;
  const maxY = 100;

  const sampleData = {
    x: [1, 5, 12, 18, 25],
    y: [80, 79.5, 79, 78, 77.5],
  };

  if (sampleData.x.length !== sampleData.y.length)
    throw new Error("Expected x and y to be the same length");

  const n = sampleData.x.length;

  const xSquared = () => sampleData.x.values().map((x) => x * x);

  const xTimesY = () =>
    sampleData.x.values().map((x, i) => x * sampleData.y[i]);

  // Σx²
  const xSquaredSum = xSquared().reduce((sum, x) => sum + x, 0);
  console.debug("xSquaredSum", xSquaredSum);

  // Σxy
  const xTimesYSum = xTimesY().reduce((sum, product) => sum + product, 0);
  console.debug("xTimesYSum", xTimesYSum);

  const xSum = sampleData.x.reduce((sum, x) => sum + x, 0);
  const ySum = sampleData.y.reduce((sum, y) => sum + y, 0);

  // Calculate slope m
  // n(∑xy)−(∑x)(∑y)​
  const dividend = n * xTimesYSum - xSum * ySum;
  const divisor = n * xSquaredSum - xSum * xSum;
  const slope = dividend / divisor;
  console.debug("slope", slope);

  // Calculate y intercept b
  // b=yˉ​−mxˉ
  // Find the averages
  // yˉ​
  const yAverage = ySum / n;

  // xˉ
  const xAverage = xSum / n;

  // Calculate b
  const yIntercept = yAverage - slope * xAverage;

  console.debug("yIntercept", yIntercept);

  return (
    <svg viewBox={`0 0 ${maxX} ${maxY}`}>
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
            y1={maxY}
            y2={maxY - 2}
            class="stroke-[0.5] stroke-gray-400"
          />
        )}
      </For>
      <line
        x1="0"
        x2={maxX}
        y1={maxY - yIntercept}
        y2={maxY - (slope * maxX + yIntercept)}
        stroke-linecap="round"
        class="stroke-[0.5] stroke-gray-400"
      />
      <For each={sampleData.x}>
        {(x, index) => {
          const y = sampleData.y[index()];
          return <circle cx={x} cy={maxY - y} r="2" fill="red" />;
        }}
      </For>
    </svg>
  );
}
