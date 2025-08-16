import {
  createEffect,
  createResource,
  createSignal,
  ErrorBoundary,
  For,
  Show,
} from "solid-js";
import { openDatabase } from "./data";
import Graph from "./Graph";

type Unit = "kg" | "lb";

export default function Debug() {
  const [database] = createResource(openDatabase);

  const [entries, { refetch }] = createResource(database, async (database) => {
    const entries = await database.getAll("entries");

    return entries;
  });

  async function handleSubmit(
    event: SubmitEvent & { currentTarget: HTMLFormElement }
  ) {
    event.preventDefault();
    console.debug("handleSubmit", event);

    const input = event.currentTarget.elements.namedItem("weight");
    if (!(input instanceof HTMLInputElement))
      throw new Error("Expected input element");

    const weight = input.valueAsNumber;

    const currentDatabase = database();
    console.debug("currentDatabase", currentDatabase);
    const now = new Date();
    currentDatabase?.add(
      "entries",
      {
        timestamp: now,
        weight,
      },
      now.getTime()
    );
    event.currentTarget.reset();
    refetch();
  }

  async function remove(date: Date) {
    const currentDatabase = database();
    if (!currentDatabase) throw new Error("Expected database to be ready");

    currentDatabase.delete("entries", date.getTime());
    refetch();
  }

  const [unit, setUnit] = createSignal<Unit>("kg");

  function format(weight: number, unit: Unit) {
    if (unit === "kg") return weight;
    // If 1lb = 0.45_359_237kg
    // Then divide both sides by 45359237 to get 1/45_359_237lb and 0.00_000_001kg
    // Multiply both sides by 100_000_000 to get 2.2_046_226_218lbs = 1kg
    // 1/45_359_237*100_000_000
    return weight * 2.2046226218;
  }

  let weightInput: HTMLInputElement | undefined;

  createEffect(() => {
    // Need to access unit here to register it as a effect dependency
    const currentUnit = unit();
    if (!weightInput?.valueAsNumber) return;
    weightInput.valueAsNumber =
      currentUnit === "kg"
        ? weightInput.valueAsNumber / 2.2046226218
        : weightInput.valueAsNumber * 2.2046226218;
  });

  return (
    <main class="items-start max-w-xl mx-auto bg-gray-200 h-full p-4 text-emerald-950">
      <h1 class="text-2xl font-light mb-3">Debug</h1>
      <ErrorBoundary
        fallback={(error, reset) => (
          <article>
            <h2>Error creating graph</h2>
            <details>
              <summary>Error</summary>
              <pre class="whitespace-pre-wrap">{error.message}</pre>
              <pre>{error}</pre>
            </details>
            <button onClick={reset}>Try again</button>
          </article>
        )}
      >
        <Graph entries={() => entries() ?? []} />
      </ErrorBoundary>
    </main>
  );
}
