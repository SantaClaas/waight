import { createSignal, For } from "solid-js";

type Entry = {
  weight: number;
  timestamp: Date;
};

export default function App() {
  const [entries, setEntries] = createSignal<Entry[]>(
    [
      {
        timestamp: new Date(),
        weight: 100,
      },
    ],
    {
      equals: false,
    }
  );

  function handleSubmit(
    event: SubmitEvent & { currentTarget: HTMLFormElement }
  ) {
    event.preventDefault();

    const input = event.currentTarget.elements.namedItem("weight");
    if (!(input instanceof HTMLInputElement))
      throw new Error("Expected input element");

    const weight = input.valueAsNumber;
    setEntries((entries) => {
      entries.push({ weight, timestamp: new Date() });
      return entries;
    });
  }

  return (
    <main class="max-w-xl mx-auto bg-gray-200 h-full p-4 text-emerald-950">
      <h1 class="text-3xl font-bold mb-3">Waight</h1>
      <ol class="grid grid-cols-2">
        <For each={entries()}>
          {(entry) => (
            <li class="grid grid-cols-subgrid col-span-2 rounded-xl p-3 bg-gray-50">
              <p>{entry.weight}</p>
              <time>
                {entry.timestamp.toLocaleString(undefined, {
                  timeStyle: "short",
                  dateStyle: "short",
                })}
              </time>
            </li>
          )}
        </For>
      </ol>
      <form class="fixed bottom-0 flex p-4 gap-2" onSubmit={handleSubmit}>
        <label for="weight" class="sr-only">
          Weight
        </label>
        <input
          type="number"
          id="weight"
          name="weight"
          placeholder="Enter weight"
          class="outline-none bg-gray-50 px-3 py-2 rounded-full"
        />
        <button
          type="button"
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
    </main>
  );
}
