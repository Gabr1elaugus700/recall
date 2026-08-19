import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

function jsonResponse(body: unknown, ok = true): Response {
  return {
    ok,
    json: async () => body,
  } as Response;
}

describe("App", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the app title", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ status: "ok" })),
    );

    render(<App />);

    expect(screen.getByRole("heading", { name: "Recall" })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId("api-status")).toHaveTextContent("ok");
    });
  });
});
