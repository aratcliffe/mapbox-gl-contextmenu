type EventHandler<T = unknown> = (event: T) => void;

export class Evented<Events extends Record<string, unknown> = Record<string, unknown>> {
  private _eventHandlers: Record<string, EventHandler[]> = {};

  on<K extends keyof Events>(type: K, handler: EventHandler<Events[K]>): this {
    const handlers = this._eventHandlers[type as string] || (this._eventHandlers[type as string] = []);
    handlers.push(handler as EventHandler);
    return this;
  }

  off<K extends keyof Events>(type: K, handler: EventHandler<Events[K]>): this {
    const handlers = this._eventHandlers[type as string];
    if (handlers) {
      const index = handlers.indexOf(handler as EventHandler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
    return this;
  }

  fire<K extends keyof Events>(type: K, event: Events[K]): this {
    const handlers = this._eventHandlers[type as string];
    if (handlers) {
      for (const handler of handlers.slice()) {
        (handler as EventHandler<Events[K]>)(event);
      }
    }
    return this;
  }

  listens<K extends keyof Events>(type: K): boolean {
    const handlers = this._eventHandlers[type as string];
    return !!(handlers && handlers.length > 0);
  }
}
