import assert from "node:assert/strict";
import test from "node:test";
import { properties } from "../src/data/properties";
import { filterProperties, parseSavedHomes, toggleSavedHome } from "../src/lib/collection";

test("filters the collection by category without mutating source data", () => {
  const sourceIds = properties.map((property) => property.id);
  const coastal = filterProperties(properties, "Coastal");

  assert.equal(coastal.length, 1);
  assert.equal(coastal[0]?.title, "Casa del Sol");
  assert.deepEqual(properties.map((property) => property.id), sourceIds);
});

test("saved-home parsing removes malformed, duplicate, and unknown ids", () => {
  const validIds = properties.map((property) => property.id);
  const raw = JSON.stringify([validIds[0], validIds[0], "not-a-home", 42, "  ", validIds[1]]);

  assert.deepEqual(parseSavedHomes(raw, validIds), [validIds[0], validIds[1]]);
  assert.deepEqual(parseSavedHomes("not json", validIds), []);
  assert.deepEqual(parseSavedHomes(JSON.stringify({ id: validIds[0] }), validIds), []);
});

test("toggleSavedHome preserves valid order and rejects unknown homes", () => {
  const validIds = properties.map((property) => property.id);
  const first = toggleSavedHome([], validIds[0], validIds);
  const second = toggleSavedHome(first, validIds[1], validIds);

  assert.deepEqual(second, [validIds[0], validIds[1]]);
  assert.deepEqual(toggleSavedHome(second, validIds[0], validIds), [validIds[1]]);
  assert.deepEqual(toggleSavedHome(second, "not-a-home", validIds), second);
});
