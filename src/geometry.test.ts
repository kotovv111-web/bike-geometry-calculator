import { test } from "node:test";
import assert from "node:assert/strict";
import { calculate, defaults } from "./geometry.ts";
const close = (a: number, b: number) =>
  assert.ok(Math.abs(a - b) < 1e-8, `${a} ≠ ${b}`);
test("BB origin, frame stack/reach and wheelbase", () => {
  const b = defaults[0],
    g = calculate(b);
  close(g.headTop.x, b.reach);
  close(g.headTop.y, b.stack);
  close(g.front.x - g.rear.x, b.wheelbase);
  close(Math.hypot(g.rear.x, g.rear.y), b.chainstay);
});
test("spacers move bars up and back along steering axis", () => {
  const b = defaults[0],
    g = calculate(b),
    h = calculate({ ...b, spacers: b.spacers + 10 });
  close(h.bar.x - g.bar.x, -10 * Math.cos((b.headAngle * Math.PI) / 180));
  close(h.bar.y - g.bar.y, 10 * Math.sin((b.headAngle * Math.PI) / 180));
});
test("zero horizontal stem pitch", () => {
  const b = defaults[0],
    g = calculate({ ...b, stemAngle: b.headAngle - 90 });
  close(g.bar.y, g.stemBase.y);
  close(g.bar.x - g.stemBase.x, b.stemLength);
});
test("effective top tube and trail geometric identities", () => {
  const b = defaults[0],
    g = calculate(b);
  close(
    g.effectiveTopTube,
    b.reach + b.stack / Math.tan((b.seatAngle * Math.PI) / 180),
  );
  close(
    g.trail,
    g.headTop.x +
      (g.headTop.y - b.bbDrop + b.wheelRadius) /
        Math.tan((b.headAngle * Math.PI) / 180) -
      g.front.x,
  );
});
test("invalid values rejected", () => {
  for (const stack of [NaN, Infinity, 0, 900])
    assert.throws(() => calculate({ ...defaults[0], stack }));
});
