import type { ContextMenuContext } from "../types";
import styles from "./ContextMenuSeparator.module.css";

export interface ContextMenuSeparatorOptions {
  id?: string;
  className?: string;
}

let nextId = 0;

export default class ContextMenuSeparator {
  public readonly id: string;
  private _className: string;
  private _liEl: HTMLLIElement | null = null;

  constructor(options?: ContextMenuSeparatorOptions) {
    this.id = options?.id ?? `menu-separator-${nextId++}`;
    this._className = options?.className ?? styles.separator;
  }

  render(parent: HTMLElement, _ctx: ContextMenuContext): HTMLElement {
    if (!this._liEl) {
      this._createElements();
    }

    const liEl = this._liEl!;
    if (liEl.parentElement !== parent) {
      parent.appendChild(liEl);
    }

    return liEl;
  }

  private _createElements(): void {
    const li = document.createElement("li");
    li.className = this._className;
    li.setAttribute("role", "separator");
    li.setAttribute("aria-orientation", "horizontal");

    this._liEl = li;
  }

  remove(): this {
    if (this._liEl?.parentElement) {
      this._liEl.remove();
    }

    this._liEl = null;
    return this;
  }
}

