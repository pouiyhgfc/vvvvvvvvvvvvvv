import { expect, test } from "vitest";
import { editCounter } from "./editCounter.js";

test("zonder bewerking is er niets op te slaan", () => {
  expect(editCounter(false).isDirty()).toBe(false);
  expect(editCounter(true).isDirty()).toBe(true);
});

test("na opslaan is alles opgeslagen", () => {
  const c = editCounter(false);
  c.edit();
  const done = c.start();
  done();
  expect(c.isDirty()).toBe(false);
});

// Was een bug: een toetsaanslag tijdens het schrijven telde als opgeslagen,
// dus "terug" sloeg hem daarna niet meer op.
test("een bewerking tijdens het opslaan blijft op te slaan", () => {
  const c = editCounter(false);
  c.edit();
  const done = c.start();
  c.edit();
  done();
  expect(c.isDirty()).toBe(true);
});
