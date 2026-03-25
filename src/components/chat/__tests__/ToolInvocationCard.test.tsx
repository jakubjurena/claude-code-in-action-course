import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationCard } from "../ToolInvocationCard";

afterEach(() => {
  cleanup();
});

function makeInvocation(
  toolName: string,
  args: Record<string, any>,
  state: "partial-call" | "call" | "result" = "result",
  result?: any
) {
  return { toolCallId: "test-id", toolName, args, state, result };
}

// --- Label derivation: str_replace_editor ---

test("shows 'Created' label for str_replace_editor + create", () => {
  render(
    <ToolInvocationCard
      toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/Card.tsx" }, "result", "File created")}
    />
  );
  expect(screen.getByText(/Created/)).toBeDefined();
});

test("shows 'Edited' label for str_replace_editor + str_replace", () => {
  render(
    <ToolInvocationCard
      toolInvocation={makeInvocation("str_replace_editor", { command: "str_replace", path: "/Button.tsx" }, "result", "Done")}
    />
  );
  expect(screen.getByText(/Edited/)).toBeDefined();
});

test("shows 'Edited' label for str_replace_editor + insert", () => {
  render(
    <ToolInvocationCard
      toolInvocation={makeInvocation("str_replace_editor", { command: "insert", path: "/Button.tsx" }, "result", "Done")}
    />
  );
  expect(screen.getByText(/Edited/)).toBeDefined();
});

test("shows 'Viewed' label for str_replace_editor + view", () => {
  render(
    <ToolInvocationCard
      toolInvocation={makeInvocation("str_replace_editor", { command: "view", path: "/App.tsx" }, "result", "contents...")}
    />
  );
  expect(screen.getByText(/Viewed/)).toBeDefined();
});

test("shows 'Undone edit in' label for str_replace_editor + undo_edit", () => {
  render(
    <ToolInvocationCard
      toolInvocation={makeInvocation("str_replace_editor", { command: "undo_edit", path: "/App.tsx" }, "result", "Done")}
    />
  );
  expect(screen.getByText(/Undone edit in/)).toBeDefined();
});

// --- Label derivation: file_manager ---

test("shows 'Renamed' label for file_manager + rename", () => {
  render(
    <ToolInvocationCard
      toolInvocation={makeInvocation("file_manager", { command: "rename", path: "/Old.tsx", new_path: "/New.tsx" }, "result", { success: true })}
    />
  );
  expect(screen.getByText(/Renamed/)).toBeDefined();
});

test("shows 'Deleted' label for file_manager + delete", () => {
  render(
    <ToolInvocationCard
      toolInvocation={makeInvocation("file_manager", { command: "delete", path: "/Old.tsx" }, "result", { success: true })}
    />
  );
  expect(screen.getByText(/Deleted/)).toBeDefined();
});

// --- Filename display ---

test("shows basename only for a nested path", () => {
  render(
    <ToolInvocationCard
      toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/workspace/src/components/Card.tsx" }, "result", "Done")}
    />
  );
  expect(screen.getByText("Card.tsx")).toBeDefined();
  // Full path should not be shown
  expect(screen.queryByText("/workspace/src/components/Card.tsx")).toBeNull();
});

test("shows 'OldName.tsx → NewName.tsx' for file_manager rename", () => {
  render(
    <ToolInvocationCard
      toolInvocation={makeInvocation("file_manager", { command: "rename", path: "/src/OldName.tsx", new_path: "/src/NewName.tsx" }, "result", { success: true })}
    />
  );
  expect(screen.getByText("OldName.tsx → NewName.tsx")).toBeDefined();
});

test("shows bare filename when path has no directory component", () => {
  render(
    <ToolInvocationCard
      toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "Button.tsx" }, "result", "Done")}
    />
  );
  expect(screen.getByText("Button.tsx")).toBeDefined();
});

// --- Pending state ---

test("renders spinner (status-pending) when state is 'call'", () => {
  render(
    <ToolInvocationCard
      toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/Card.tsx" }, "call")}
    />
  );
  expect(screen.getByTestId("status-pending")).toBeDefined();
});

test("renders spinner when state is 'partial-call'", () => {
  render(
    <ToolInvocationCard
      toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/Card.tsx" }, "partial-call")}
    />
  );
  expect(screen.getByTestId("status-pending")).toBeDefined();
});

test("does not render success or error icon when pending", () => {
  render(
    <ToolInvocationCard
      toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/Card.tsx" }, "call")}
    />
  );
  expect(screen.queryByTestId("status-success")).toBeNull();
  expect(screen.queryByTestId("status-error")).toBeNull();
});

// --- Success state ---

test("renders status-success when state=result and result is a non-error string", () => {
  render(
    <ToolInvocationCard
      toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/Card.tsx" }, "result", "File created successfully")}
    />
  );
  expect(screen.getByTestId("status-success")).toBeDefined();
});

test("renders status-success when state=result and result is { success: true }", () => {
  render(
    <ToolInvocationCard
      toolInvocation={makeInvocation("file_manager", { command: "delete", path: "/Old.tsx" }, "result", { success: true })}
    />
  );
  expect(screen.getByTestId("status-success")).toBeDefined();
});

test("does not render spinner when state is 'result'", () => {
  render(
    <ToolInvocationCard
      toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/Card.tsx" }, "result", "Done")}
    />
  );
  expect(screen.queryByTestId("status-pending")).toBeNull();
});

// --- Error state ---

test("renders status-error when state=result and result string starts with 'Error'", () => {
  render(
    <ToolInvocationCard
      toolInvocation={makeInvocation("str_replace_editor", { command: "str_replace", path: "/Card.tsx" }, "result", "Error: string not found")}
    />
  );
  expect(screen.getByTestId("status-error")).toBeDefined();
});

test("renders status-error when state=result and result is { success: false }", () => {
  render(
    <ToolInvocationCard
      toolInvocation={makeInvocation("file_manager", { command: "delete", path: "/Old.tsx" }, "result", { success: false })}
    />
  );
  expect(screen.getByTestId("status-error")).toBeDefined();
});

test("renders status-error when result is { success: false, error: 'Permission denied' }", () => {
  render(
    <ToolInvocationCard
      toolInvocation={makeInvocation("file_manager", { command: "rename", path: "/Old.tsx", new_path: "/New.tsx" }, "result", { success: false, error: "Permission denied" })}
    />
  );
  expect(screen.getByTestId("status-error")).toBeDefined();
});

// --- Edge cases ---

test("renders without crashing when args.command is undefined", () => {
  render(
    <ToolInvocationCard
      toolInvocation={makeInvocation("str_replace_editor", { path: "/Card.tsx" }, "result", "Done")}
    />
  );
  // Should render fallback label without throwing
  expect(screen.getByTestId("status-success")).toBeDefined();
});
