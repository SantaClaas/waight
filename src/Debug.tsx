import { createResource, ErrorBoundary, Show } from "solid-js";
import { openDatabase, type Database, type Entry } from "./data";
import Graph from "./Graph";

async function loadDebugData(database: Database) {
  await database.clear("entries");

  const debugEntries: Entry[] = [
    {
      weight: 83.6,
      timestamp: new Date("2025-08-12T10:56:00.000+02:00"),
    },
    {
      weight: 84.6,
      timestamp: new Date("2025-08-13T09:23:00.000+02:00"),
    },
    {
      weight: 84.1,
      timestamp: new Date("2025-08-13T10:30:00.000+02:00"),
    },
    {
      weight: 84,
      timestamp: new Date("2025-08-14T09:28:00.000+02:00"),
    },
    {
      weight: 83.6,
      timestamp: new Date("2025-08-15T13:38:00.000+02:00"),
    },
    {
      weight: 83.9,
      timestamp: new Date("2025-08-16T10:20:00.000+02:00"),
    },
    {
      weight: 84.1,
      timestamp: new Date("2025-08-17T10:28:00.000+02:00"),
    },
  ];

  const adds = debugEntries.map((entry) =>
    database.add("entries", entry, entry.timestamp.getTime())
  );
  await Promise.all(adds);
}
export default function Debug() {
  const [database] = createResource(openDatabase);

  const [entries] = createResource(database, async (database) => {
    const entries = await database.getAll("entries");

    return entries;
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

      <Show when={database()}>
        {(database) => (
          <button onClick={() => loadDebugData(database())}>
            Load debug data
          </button>
        )}
      </Show>
    </main>
  );
}
