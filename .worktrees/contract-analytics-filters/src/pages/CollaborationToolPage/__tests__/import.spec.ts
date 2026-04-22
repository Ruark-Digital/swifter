import { test, expect } from "@playwright/test";
import * as XLSX from "xlsx";

test.describe("Collaboration Tool import markdown", () => {
  test("loads Imported Markdown when URL params provided", async ({ page }) => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["Name", "Age"],
      ["Alice", 30],
      ["Bob", 28],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const array = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const bytes = new Uint8Array(array as ArrayBuffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = Buffer.from(binary, "binary").toString("base64");
    const dataUrl = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
    const url = `/collaboration-tool?sourceUrl=${encodeURIComponent(
      dataUrl
    )}&fileName=${encodeURIComponent("sample.xlsx")}&fileType=XLSX`;
    await page.goto(url);
    await expect(page.getByText("Document Editor")).toBeVisible();
    await expect(page.getByText("Sheet1")).toBeVisible();
    await expect(page.getByText("Name")).toBeVisible();
    await expect(page.getByText("Alice")).toBeVisible();
  });
});
