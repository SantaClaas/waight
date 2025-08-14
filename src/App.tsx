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

export default function App() {
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
    // If 1lb = 0.45359237kg
    // Then divide both sides by 45359237 to get 1/45359237lb and 0.00000001kg
    // Multiply both sides by 100_000_000 to get 2.2046226218lbs = 1kg
    // 1/45359237*100_000_000
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
    <main class="grid grid-rows-[auto_1fr_auto] items-start max-w-xl mx-auto bg-gray-200 h-full p-4 text-emerald-950">
      <h1 class="text-2xl font-light mb-3">Waight</h1>
      <ErrorBoundary
        fallback={(error, reset) => (
          <article>
            <h2>Error creating graph</h2>
            <details>
              <summary>Error</summary>
              <pre>{error.message}</pre>
              <pre>{error}</pre>
            </details>
            <button onClick={reset}>Try again</button>
          </article>
        )}
      >
        <Graph entries={() => entries() ?? []} />
      </ErrorBoundary>
      <ol class="grid grid-cols-[auto_1fr_auto_auto] gap-y-2">
        <For each={entries()}>
          {(entry) => (
            <li class="grid grid-cols-subgrid col-span-4 gap-x-3 rounded-xl p-4 bg-gray-50 items-center">
              <p class="text-3xl grid col-span-2 grid-cols-subgrid gap-x-1">
                <span class="text-end">
                  {format(entry.weight, unit()).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                    style: unit() === "kg" ? "unit" : "currency",
                    currency: unit() === "lb" ? "gbp" : undefined,
                    unit: unit() === "kg" ? "kilogram" : undefined,
                  })}
                </span>
                {/* <span>{unit() === "kg" ? "㎏" : "￡"}</span> */}
              </p>
              <time>
                {entry.timestamp.toLocaleString(undefined, {
                  timeStyle: "short",
                  dateStyle: "short",
                })}
              </time>
              <button onClick={() => remove(entry.timestamp)}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  <path d="M3 6h18" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                <span class="sr-only">Delete</span>
              </button>
            </li>
          )}
        </For>
      </ol>
      <Show when={database.state === "ready"}>
        <form class="grid grid-cols-[1fr_auto_auto]" onSubmit={handleSubmit}>
          <label for="weight" class="grid grid-cols-[auto_1fr] items-center">
            <span class="sr-only col-start-1 col-end-2">Weight</span>
            <input
              type="number"
              id="weight"
              name="weight"
              step="0.01"
              placeholder="Enter weight"
              required
              ref={weightInput}
              class="outline-none bg-gray-50 ps-3 py-2 rounded-s-full col-span-2 col-start-1 col-end-3 row-start-1"
            />
          </label>
          {/* <fieldset class="rounded-e-full bg-gray-50 text-xl pe-4 py-1 w-12 text-end">
            <legend class="sr-only">Unit</legend>
            <label for="kg" class="has-checked:touch-none group">
              <input
                type="radio"
                name="unit"
                value="kg"
                id="kg"
                checked
                onChange={handleChange}
                class="sr-only"
              />
              <span class="not-group-[:has(:checked)]:sr-only">㎏</span>
            </label>
            <label for="lb" class="has-checked:touch-none group">
              <input
                type="radio"
                name="unit"
                value="lb"
                id="lb"
                onChange={handleChange}
                class="sr-only"
              />
              <span class="not-group-[:has(:checked)]:sr-only">￡</span>
            </label>
          </fieldset> */}
          <button
            type="button"
            onClick={() => setUnit(unit() === "kg" ? "lb" : "kg")}
            class="rounded-e-full bg-gray-50 text-xl pe-4 py-1 w-12 text-end"
          >
            {unit() === "kg" ? "㎏" : "￡"}
          </button>
          <button
            type="submit"
            class="rounded-full size-10 bg-emerald-500 content-center justify-items-center outline-none ms-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="size-9"
            >
              <path d="M5 12h14 M12 5v14" />
            </svg>
            <span class="sr-only">Add</span>
          </button>
        </form>
      </Show>
    </main>
  );
}
