import { expect, it } from "vitest";
import { pickRandomSong, withSolved } from "./progress";

it("marks a song solved once per mode", () => {
  const once = withSolved({}, "missing-note", "twinkle");
  expect(withSolved(once, "missing-note", "twinkle")).toBe(once);
  expect(withSolved(once, "one-note-off", "twinkle")).toEqual({
    "missing-note": ["twinkle"],
    "one-note-off": ["twinkle"],
  });
});

it("picks random songs from the unsolved ones first", () => {
  const songs = [{ id: "a" }, { id: "b" }, { id: "c" }];
  for (let i = 0; i < 50; i++)
    expect(pickRandomSong(songs, ["a", "c"])?.id).toBe("b");
  expect(songs).toContainEqual(pickRandomSong(songs, ["a", "b", "c"]));
  expect(pickRandomSong([], [])).toBeNull();
});
