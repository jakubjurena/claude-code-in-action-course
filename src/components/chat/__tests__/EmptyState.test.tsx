import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

afterEach(cleanup);
import { EmptyState } from "@/components/chat/EmptyState";

describe("EmptyState", () => {
  it("renders the heading text", () => {
    render(<EmptyState />);
    expect(
      screen.getByText("Start a conversation to generate React components")
    ).toBeDefined();
  });

  it("renders the subtext", () => {
    render(<EmptyState />);
    expect(
      screen.getByText("I can help you create buttons, forms, cards, and more")
    ).toBeDefined();
  });

  it("renders an SVG icon", () => {
    const { container } = render(<EmptyState />);
    expect(container.querySelector("svg")).toBeDefined();
  });
});
