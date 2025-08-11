import { createResource, createSignal, For, Show } from "solid-js";
import { openDatabase, type Entry } from "./data";

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

  return (
    <main class="grid grid-rows-[auto_1fr_auto] items-start max-w-xl mx-auto bg-gray-200 h-full p-4 text-emerald-950">
      <h1 class="text-2xl font-light mb-3">Waight</h1>
      <ol class="grid grid-cols-[auto_1fr_auto_auto] gap-y-2">
        <For each={entries()}>
          {(entry) => (
            <li class="grid grid-cols-subgrid col-span-4 gap-x-3 rounded-xl p-4 bg-gray-50 items-center">
              <p class="text-3xl grid col-span-2 grid-cols-subgrid gap-x-1">
                <span class="text-end">{entry.weight}</span> <span>㎏</span>
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
        <form class="grid grid-cols-[1fr_auto] gap-2" onSubmit={handleSubmit}>
          <label for="weight" class="sr-only">
            Weight
          </label>
          <input
            type="number"
            id="weight"
            name="weight"
            step="0.01"
            placeholder="Enter weight"
            class="outline-none bg-gray-50 px-3 py-2 rounded-full"
          />
          <button
            type="submit"
            class="rounded-full size-10 bg-emerald-500 content-center justify-items-center outline-none"
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
