import type { Map, MapMouseEvent } from "mapbox-gl";
import type ContextMenuItem from "./ContextMenuItem";
import type ContextMenuSeparator from "./ContextMenuSeparator";

export interface ContextMenuContext {
  map: Map;
  event: MapMouseEvent;
}

export type MenuItem = ContextMenuItem | ContextMenuSeparator;
