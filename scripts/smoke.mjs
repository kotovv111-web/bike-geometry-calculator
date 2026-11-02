import assert from "node:assert/strict";
import { chromium } from "playwright";
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH }
    : {}),
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(process.env.APP_URL || "http://127.0.0.1:5173/bike-geometry-calculator/");
  await page.getByRole("heading", { level: 1 }).waitFor();
  assert.equal(await page.locator("svg").count(), 1);
  const cockpit = page.locator(".stats .accent strong");
  const original = await cockpit.textContent();
  await page
    .getByRole("spinbutton", { name: "Проставки", exact: true })
    .fill("40");
  assert.notEqual(await cockpit.textContent(), original);
  await page.reload();
  assert.equal(
    await page
      .getByRole("spinbutton", { name: "Проставки", exact: true })
      .inputValue(),
    "40",
  );
  await page
    .getByRole("spinbutton", { name: "Stack рами", exact: true })
    .fill("0");
  assert.equal(
    await page
      .getByRole("spinbutton", { name: "Stack рами", exact: true })
      .getAttribute("aria-invalid"),
    "true",
  );
  assert.equal(await page.locator("svg").count(), 1);
  await page.getByRole("tab", { name: "Велосипед B" }).click();
  await page
    .getByRole("spinbutton", { name: "Stack рами", exact: true })
    .fill("560");
  assert.match(await page.locator("tbody tr").first().textContent(), /560.0/);
  await page.getByRole("checkbox", { name: "Порівняти A + B" }).uncheck();
  await page.getByRole("checkbox", { name: "Розміри", exact: true }).uncheck();
  assert.equal(await page.locator("svg .dimensions").count(), 0);
  await page
    .getByRole("button", { name: "Скинути приклади", exact: false })
    .click();
  assert.equal(
    await page
      .getByRole("spinbutton", { name: "Stack рами", exact: true })
      .inputValue(),
    "545",
  );
  await page.screenshot({ path: "/tmp/bike-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    "No horizontal page overflow on mobile",
  );
  await page.screenshot({ path: "/tmp/bike-mobile.png", fullPage: true });
  assert.deepEqual(errors, []);
  console.log(
    "Browser smoke passed: live geometry, persistence, validation, bike B, overlay, dimensions, reset, mobile layout, no JS errors.",
  );
} finally {
  await browser.close();
}
