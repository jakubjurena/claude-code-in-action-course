import { describe, it, expect, beforeEach } from "vitest";
import { buildStrReplaceTool } from "@/lib/tools/str-replace";
import { VirtualFileSystem } from "@/lib/file-system";

const TOOL_CONTEXT = { toolCallId: "test-call", messages: [] as any[] };

describe("buildStrReplaceTool", () => {
  let fs: VirtualFileSystem;
  let tool: ReturnType<typeof buildStrReplaceTool>;

  beforeEach(() => {
    fs = new VirtualFileSystem();
    tool = buildStrReplaceTool(fs);
  });

  describe("create command", () => {
    it("creates a new file with the given content", async () => {
      await tool.execute!(
        { command: "create", path: "/App.jsx", file_text: "export default function App() {}" },
        TOOL_CONTEXT
      );

      expect(fs.exists("/App.jsx")).toBe(true);
      expect(fs.readFile("/App.jsx")).toBe("export default function App() {}");
    });

    it("creates parent directories automatically", async () => {
      await tool.execute!(
        { command: "create", path: "/components/Button.jsx", file_text: "const Button = () => {};" },
        TOOL_CONTEXT
      );

      expect(fs.exists("/components/Button.jsx")).toBe(true);
    });

    it("creates file with empty content when file_text is omitted", async () => {
      await tool.execute!(
        { command: "create", path: "/empty.js" },
        TOOL_CONTEXT
      );

      expect(fs.readFile("/empty.js")).toBe("");
    });
  });

  describe("view command", () => {
    beforeEach(async () => {
      await tool.execute!(
        { command: "create", path: "/App.jsx", file_text: "line1\nline2\nline3" },
        TOOL_CONTEXT
      );
    });

    it("views the full file content", async () => {
      const result = await tool.execute!(
        { command: "view", path: "/App.jsx" },
        TOOL_CONTEXT
      );
      expect(result).toContain("line1");
      expect(result).toContain("line2");
    });

    it("views a specific range", async () => {
      const result = await tool.execute!(
        { command: "view", path: "/App.jsx", view_range: [1, 1] },
        TOOL_CONTEXT
      );
      expect(result).toContain("line1");
    });
  });

  describe("str_replace command", () => {
    beforeEach(async () => {
      await tool.execute!(
        { command: "create", path: "/App.jsx", file_text: "const x = 1;\nconst y = 2;" },
        TOOL_CONTEXT
      );
    });

    it("replaces matching text in the file", async () => {
      await tool.execute!(
        { command: "str_replace", path: "/App.jsx", old_str: "const x = 1;", new_str: "const x = 42;" },
        TOOL_CONTEXT
      );

      expect(fs.readFile("/App.jsx")).toContain("const x = 42;");
      expect(fs.readFile("/App.jsx")).not.toContain("const x = 1;");
    });

    it("uses empty string for old_str when omitted", async () => {
      // Should not throw; prepends empty string match (no-op depending on impl)
      await expect(
        tool.execute!(
          { command: "str_replace", path: "/App.jsx", new_str: "prefix" },
          TOOL_CONTEXT
        )
      ).resolves.toBeDefined();
    });

    it("uses empty string for new_str when omitted", async () => {
      await tool.execute!(
        { command: "str_replace", path: "/App.jsx", old_str: "const x = 1;", new_str: undefined },
        TOOL_CONTEXT
      );
      expect(fs.readFile("/App.jsx")).not.toContain("const x = 1;");
    });
  });

  describe("insert command", () => {
    beforeEach(async () => {
      await tool.execute!(
        { command: "create", path: "/App.jsx", file_text: "line1\nline2\nline3" },
        TOOL_CONTEXT
      );
    });

    it("inserts text at the specified line", async () => {
      await tool.execute!(
        { command: "insert", path: "/App.jsx", insert_line: 1, new_str: "inserted" },
        TOOL_CONTEXT
      );
      expect(fs.readFile("/App.jsx")).toContain("inserted");
    });

    it("defaults insert_line to 0 when omitted", async () => {
      await expect(
        tool.execute!(
          { command: "insert", path: "/App.jsx", new_str: "top" },
          TOOL_CONTEXT
        )
      ).resolves.toBeDefined();
    });
  });

  describe("undo_edit command", () => {
    it("returns an unsupported error message", async () => {
      const result = await tool.execute!(
        { command: "undo_edit", path: "/App.jsx" },
        TOOL_CONTEXT
      );
      expect(result).toMatch(/not supported/i);
    });
  });
});
