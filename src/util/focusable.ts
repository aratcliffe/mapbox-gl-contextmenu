import type { Focusable, MenuItem } from "../types";

export function isFocusable(item: MenuItem): item is MenuItem & Focusable {
  return (
    "focus" in item &&
    "blur" in item &&
    "click" in item &&
    typeof (item as Focusable).focus === "function"
  );
}
