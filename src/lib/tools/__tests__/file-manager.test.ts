import { describe, it, expect, beforeEach } from "vitest";
import { buildFileManagerTool } from "@/lib/tools/file-manager";
import { VirtualFileSystem } from "@/lib/file-system";

const TOOL_CONTEXT = { toolCallId: "test-call", messages: [] as any[] };

describe("buildFileManagerTool", () => {
  let fs: VirtualFileSystem;
  let tool: ReturnType<typeof buildFileManagerTool>;

  beforeEach(() => {
    fs = new VirtualFileSystem();
    tool = buildFileManagerTool(fs);
    // Pre-create some files
    fs.createFile("/App.jsx", "app content");
    fs.createFile("/components/Button.jsx", "button content");
  });

  describe("rename command", () => {
    it("renames a file and returns success", async () => {
      const result = await tool.execute!(
        { command: "rename", path: "/App.jsx", new_path: "/Main.jsx" },
        TOOL_CONTEXT
      );

      expect(result).toMatchObject({ success: true });
      expect(result.message).toContain("/App.jsx");
      expect(result.message).toContain("/Main.jsx");
    });

    it("the file exists at the new path after rename", async () => {
      await tool.execute!(
        { command: "rename", path: "/App.jsx", new_path: "/Renamed.jsx" },
        TOOL_CONTEXT
      );

      expect(fs.exists("/Renamed.jsx")).toBe(true);
      expect(fs.exists("/App.jsx")).toBe(false);
    });

    it("returns error when new_path is omitted", async () => {
      const result = await tool.execute!(
        { command: "rename", path: "/App.jsx" },
        TOOL_CONTEXT
      );

      expect(result).toMatchObject({ success: false });
      expect(result.error).toMatch(/new_path/i);
    });

    it("returns error when source path does not exist", async () => {
      const result = await tool.execute!(
        { command: "rename", path: "/nonexistent.jsx", new_path: "/other.jsx" },
        TOOL_CONTEXT
      );

      expect(result).toMatchObject({ success: false });
    });
  });

  describe("delete command", () => {
    it("deletes a file and returns success", async () => {
      const result = await tool.execute!(
        { command: "delete", path: "/App.jsx" },
        TOOL_CONTEXT
      );

      expect(result).toMatchObject({ success: true });
      expect(result.message).toContain("/App.jsx");
    });

    it("the file no longer exists after delete", async () => {
      await tool.execute!(
        { command: "delete", path: "/App.jsx" },
        TOOL_CONTEXT
      );

      expect(fs.exists("/App.jsx")).toBe(false);
    });

    it("returns error when path does not exist", async () => {
      const result = await tool.execute!(
        { command: "delete", path: "/nonexistent.jsx" },
        TOOL_CONTEXT
      );

      expect(result).toMatchObject({ success: false });
    });

    it("can delete a nested file", async () => {
      const result = await tool.execute!(
        { command: "delete", path: "/components/Button.jsx" },
        TOOL_CONTEXT
      );

      expect(result).toMatchObject({ success: true });
      expect(fs.exists("/components/Button.jsx")).toBe(false);
    });
  });
});
