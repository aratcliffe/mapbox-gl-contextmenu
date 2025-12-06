import ContextMenuItem from "../ContextMenuItem";
import { ContextMenuContext } from "../types";
import styles from "./ContextMenu.module.css";

export interface ContextMenuOptions {
  className?: string;
}

export default class ContextMenu {
  private _items: ContextMenuItem[] = [];
  private _className: string;
  private _itemClickHandlers = new Map<ContextMenuItem, () => void>();
  private _menuEl: HTMLMenuElement | null = null;
  private _container: HTMLElement | null = null;

  constructor(options?: ContextMenuOptions) {
    this._className = options?.className ?? styles.menu;
  }

  addItem(item: ContextMenuItem): this {
    this._items.push(item);
    const handler = () => {
      this.hide();
    };
    item.addEventListener("click", handler);
    this._itemClickHandlers.set(item, handler);
    return this;
  }

  removeItem(item: ContextMenuItem): this {
    const index = this._items.indexOf(item);
    if (index !== -1) {
      this._items.splice(index, 1);
      this._removeItemEventListener(item);
      item.remove();
    }
    return this;
  }

  protected show(x: number, y: number, context: ContextMenuContext): void {
    if (!this._menuEl) return;

    this._items.forEach((item) => {
      item.render(this._menuEl!, context);
    });

    const { left, top } = this._positionInViewport(x, y);

    this._menuEl.style.left = `${left}px`;
    this._menuEl.style.top = `${top}px`;

    this._menuEl.classList.add(styles.visible);
  }

  protected hide(): void {
    if (!this._menuEl) return;

    this._menuEl.classList.remove(styles.visible);
  }

  addTo(container: HTMLElement): this {
    this._container = container;
    this._createElements();
    return this;
  }

  remove(): this {
    this._removeItems();
    this._menuEl?.remove();

    this._menuEl = null;
    this._container = null;
    return this;
  }

  private _createElements(): void {
    if (!this._container) return;

    const menu = document.createElement("menu");
    menu.className = this._className;
    menu.setAttribute("role", "menu");
    menu.style.position = "absolute";

    this._container.appendChild(menu);

    this._menuEl = menu;
  }

  private _removeItems(): void {
    this._items.forEach((item) => {
      this._removeItemEventListener(item);
      item.remove();
    });
    this._items = [];
    this._itemClickHandlers.clear();
  }

  private _removeItemEventListener(item: ContextMenuItem): void {
    const handler = this._itemClickHandlers.get(item);
    if (handler) {
      item.removeEventListener("click", handler);
      this._itemClickHandlers.delete(item);
    }
  }

  private _positionInViewport(
    x: number,
    y: number
  ): { left: number; top: number } {
    if (!this._menuEl || !this._container) {
      return { left: x, top: y };
    }

    const containerWidth = this._container.clientWidth;
    const containerHeight = this._container.clientHeight;

    // Ensure menu has been made visible so offsetWidth/Height are accurate
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this._menuEl.offsetWidth;

    const menuWidth = this._menuEl.offsetWidth;
    const menuHeight = this._menuEl.offsetHeight;

    let left = x;
    let top = y;

    if (left + menuWidth > containerWidth) {
      left = containerWidth - menuWidth;
    }
    if (top + menuHeight > containerHeight) {
      top = containerHeight - menuHeight;
    }

    if (left < 0) left = 0;
    if (top < 0) top = 0;

    return { left, top };
  }
}
