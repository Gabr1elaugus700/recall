import { useEffect, useState } from "react";
import "./App.css";

type HealthStatus = "checking" | "ok" | "offline";

type HealthResponse = {
  status: string;
};

export default function App() {
  const [health, setHealth] = useState<HealthStatus>("checking");

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/health", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Health check failed");
        }

        return response.json() as Promise<HealthResponse>;
      })
      .then((data) => {
        setHealth(data.status === "ok" ? "ok" : "offline");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setHealth("offline");
      });

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <main className="app">
      <h1>Recall</h1>
      <p>
        API: <span data-testid="api-status">{health}</span>
      </p>
    </main>
  );
}
