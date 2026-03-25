import { describe, it, expect, beforeEach } from "vitest";
import {
  setHasAnonWork,
  getHasAnonWork,
  getAnonWorkData,
  clearAnonWork,
} from "@/lib/anon-work-tracker";

const STORAGE_KEY = "uigen_has_anon_work";
const DATA_KEY = "uigen_anon_data";

describe("anon-work-tracker", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  describe("setHasAnonWork", () => {
    it("stores data when messages array is non-empty", () => {
      setHasAnonWork([{ role: "user", content: "hello" }], { "/": {} });

      expect(sessionStorage.getItem(STORAGE_KEY)).toBe("true");
      const stored = JSON.parse(sessionStorage.getItem(DATA_KEY)!);
      expect(stored.messages).toEqual([{ role: "user", content: "hello" }]);
    });

    it("stores data when fileSystemData has more than one key (more than just root)", () => {
      setHasAnonWork([], { "/": {}, "/App.jsx": "code" });

      expect(sessionStorage.getItem(STORAGE_KEY)).toBe("true");
    });

    it("does NOT store data when messages is empty and fileSystemData has only root", () => {
      setHasAnonWork([], { "/": {} });

      expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
      expect(sessionStorage.getItem(DATA_KEY)).toBeNull();
    });

    it("does NOT store data when both messages and fileSystemData are empty", () => {
      setHasAnonWork([], {});

      expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("serializes fileSystemData correctly", () => {
      const fsData = { "/": { type: "directory" }, "/App.jsx": "const x = 1;" };
      setHasAnonWork([{ role: "user" }], fsData);

      const stored = JSON.parse(sessionStorage.getItem(DATA_KEY)!);
      expect(stored.fileSystemData).toEqual(fsData);
    });
  });

  describe("getHasAnonWork", () => {
    it("returns false when nothing is stored", () => {
      expect(getHasAnonWork()).toBe(false);
    });

    it("returns true after setHasAnonWork stores data", () => {
      setHasAnonWork([{ role: "user", content: "hi" }], {});
      expect(getHasAnonWork()).toBe(true);
    });

    it("returns false after clearAnonWork", () => {
      setHasAnonWork([{ role: "user", content: "hi" }], {});
      clearAnonWork();
      expect(getHasAnonWork()).toBe(false);
    });
  });

  describe("getAnonWorkData", () => {
    it("returns null when nothing is stored", () => {
      expect(getAnonWorkData()).toBeNull();
    });

    it("returns stored messages and fileSystemData", () => {
      const messages = [{ role: "user", content: "build me a form" }];
      const fsData = { "/": {}, "/App.jsx": "code here" };
      setHasAnonWork(messages, fsData);

      const result = getAnonWorkData();
      expect(result).not.toBeNull();
      expect(result!.messages).toEqual(messages);
      expect(result!.fileSystemData).toEqual(fsData);
    });

    it("returns null when stored data is invalid JSON", () => {
      sessionStorage.setItem(DATA_KEY, "not-valid-json{{{");
      expect(getAnonWorkData()).toBeNull();
    });

    it("returns null when data key exists but is empty string", () => {
      sessionStorage.setItem(DATA_KEY, "");
      expect(getAnonWorkData()).toBeNull();
    });
  });

  describe("clearAnonWork", () => {
    it("removes both storage keys", () => {
      setHasAnonWork([{ role: "user" }], { "/": {}, "/x": "y" });
      clearAnonWork();

      expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
      expect(sessionStorage.getItem(DATA_KEY)).toBeNull();
    });

    it("is a no-op when nothing is stored", () => {
      expect(() => clearAnonWork()).not.toThrow();
    });

    it("getAnonWorkData returns null after clear", () => {
      setHasAnonWork([{ role: "user" }], {});
      clearAnonWork();
      expect(getAnonWorkData()).toBeNull();
    });
  });
});
