import type { Map as MapboxMap, MapMouseEvent } from "mapbox-gl";
import { ContextMenuContext } from "../types";
import { ContextMenu, ContextMenuOptions } from "../ContextMenu";

export interface MapboxContextMenuOptions extends ContextMenuOptions {}

export default class MapboxContextMenu extends ContextMenu {
  private _map: MapboxMap | null = null;
  private _target: string | undefined = undefined;
  private _handlers = {
    contextmenu: null as ((e: MapMouseEvent) => void) | null,
    mousedown: null as ((e: MapMouseEvent) => void) | null,
    move: null as (() => void) | null
  };

  constructor(options?: MapboxContextMenuOptions) {
    super(options);
  }

  // @ts-expect-error - Override with different signature for Mapbox-specific API
  addTo(map: MapboxMap, target?: string): this {
    this._map = map;
    this._target = target;

    ContextMenu.prototype.addTo.call(this, map.getContainer());

    this._addEventListeners();

    return this;
  }

  remove(): this {
    if (!this._map) return this;

    this._removeEventListeners();
    super.remove();

    this._map = null;
    this._target = undefined;
    return this;
  }

  private _addEventListeners(): void {
    this._handlers.contextmenu = (e: MapMouseEvent) => {
      e.preventDefault();
      const ctx: ContextMenuContext = {
        map: this._map!,
        event: e
      };
      this.show(e.point.x, e.point.y, ctx);
    };

    this._handlers.mousedown = () => {
      this.hide();
    };

    this._handlers.move = () => {
      this.hide();
    };

    if (this._target) {
      this._map!.on("contextmenu", this._target, this._handlers.contextmenu);
    } else {
      this._map!.on("contextmenu", this._handlers.contextmenu);
    }

    this._map!.on("move", this._handlers.move);
    this._map!.on("mousedown", this._handlers.mousedown);
  }

  private _removeEventListeners(): void {
    if (!this._map) return;

    for (const [event, handler] of Object.entries(this._handlers)) {
      if (!handler) continue;

      if (event === "contextmenu") {
        this._target
          ? this._map.off(
              "contextmenu",
              this._target,
              handler as (e: MapMouseEvent) => void
            )
          : this._map.off("contextmenu", handler as (e: MapMouseEvent) => void);
      } else {
        this._map.off(event, handler as () => void);
      }
      this._handlers[event as keyof typeof this._handlers] = null;
    }
  }
}
