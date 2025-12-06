import type { Map, MapMouseEvent } from "mapbox-gl";
import type ContextMenuItem from "./ContextMenuItem";
import type ContextMenuSeparator from "./ContextMenuSeparator";
import type ContextMenuSub from "./ContextMenuSub";
import type { ContextMenuTheme } from "./ContextMenu/ContextMenu";

export interface ContextMenuContext {
  map: Map;
  event: MapMouseEvent;
  menuWidth?: string | number;
  menuTheme?: ContextMenuTheme;
}

export interface ContextMenuItemEventData {
  originalEvent: MouseEvent;
  point: { x: number; y: number };
  lngLat: { lng: number; lat: number };
  features?: Array<GeoJSON.Feature>;
  map: Map;
}

export interface Focusable {
  readonly disabled: boolean;
  focus(): void;
  blur(): void;
  click(): void;
}

export type MenuItem = ContextMenuItem | ContextMenuSeparator | ContextMenuSub;
