import { createResource, ErrorBoundary } from "solid-js";
import { openDatabase } from "./data";
import Graph from "./Graph";

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
    </main>
  );
}
