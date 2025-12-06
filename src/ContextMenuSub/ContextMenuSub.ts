import type { ContextMenuContext, MenuItem } from "../types";
import ContextMenuItem, {
  type ContextMenuItemOptions
} from "../ContextMenuItem/ContextMenuItem";
import ContextMenu from "../ContextMenu/ContextMenu";
import styles from "./ContextMenuSub.module.scss";
import itemStyles from "../ContextMenuItem/ContextMenuItem.module.scss";
import chevronSvg from "../icons/chevron-right.svg?raw";

export interface ContextMenuSubOptions extends ContextMenuItemOptions {}

export default class ContextMenuSub extends ContextMenuItem {
  private _submenu: ContextMenu;
  private _chevronEl: SVGElement | null = null;
  private _hoverTimeout: number | null = null;
  private _submenuContainer: HTMLElement | null = null;
  private _isPinned: boolean = false;

  private _handlers = {
    mouseenter: null as (() => void) | null,
    mouseleave: null as (() => void) | null,
    click: null as ((ev: MouseEvent) => void) | null,
    keydown: null as ((ev: KeyboardEvent) => void) | null
  };

  constructor(options: ContextMenuSubOptions) {
    super(options);
    this._submenu = new ContextMenu();
  }

  addItem(item: MenuItem): this {
    this._submenu.addItem(item);
    return this;
  }

  insertItem(index: number, item: MenuItem): this {
    this._submenu.insertItem(index, item);
    return this;
  }

  removeItem(item: MenuItem): this {
    this._submenu.removeItem(item);
    return this;
  }

  render(parent: HTMLElement, ctx: ContextMenuContext): HTMLElement {
    const liEl = super.render(parent, ctx);

    if (!this._chevronEl && this._buttonEl) {
      this._chevronEl = this._createChevron();
      this._buttonEl.appendChild(this._chevronEl);
    }

    if (!this._submenuContainer) {
      const { map, menuWidth, menuTheme } = ctx;

      this._submenuContainer = map.getContainer();
      this._submenu.addTo(this._submenuContainer);

      if (menuWidth !== undefined) {
        this._submenu.width = menuWidth;
      }

      if (menuTheme !== undefined) {
        this._submenu.theme = menuTheme;
      }
    }

    return liEl;
  }

  focus(): void {
    super.focus();
  }

  blur(): void {
    super.blur();
    this._closeSubmenu();
  }

  /**
   * Opens the submenu and focuses its first item.
   * Used for keyboard navigation (Enter/Space/ArrowRight).
   */
  openAndFocusSubmenu(): void {
    this._openSubmenu();
    this._isPinned = true;

    // Show parent item with lighter highlight while submenu has focus
    this._buttonEl?.classList.remove(itemStyles.focused);
    this._buttonEl?.classList.add(itemStyles.focusedParent);

    // Set up callback so ArrowLeft returns focus to this item
    this._submenu.onEscapeLeft = () => {
      this._buttonEl?.classList.remove(itemStyles.focusedParent);
      this._closeSubmenu();
      this.focus();
    };

    this._submenu.focusFirstItem();
  }

  remove(): this {
    this._removeEventListeners();
    this._cancelOpen();
    this._closeSubmenu();
    this._submenu.remove();
    super.remove();
    this._submenuContainer = null;
    return this;
  }

  protected _addEventListeners(): void {
    // Don't call super - we want our own unified click handler for submenu toggling
    if (!this._buttonEl) return;

    this._handlers.mouseenter = () => {
      this._scheduleOpen();
    };

    this._handlers.mouseleave = () => {
      this._cancelOpen();
      // Don't auto-close if submenu was opened via click (pinned)
      if (this._isPinned) return;
      // Close after a delay to allow moving to submenu
      setTimeout(() => {
        if (!this._isHovering() && !this._isPinned) {
          this._closeSubmenu();
        }
      }, 200);
    };

    // Unified click handler for submenu toggling (doesn't fire "click" event)
    this._handlers.click = (ev: MouseEvent) => {
      ev.preventDefault();
      ev.stopPropagation();

      const submenuEl = this._submenu.menuElement;
      if (submenuEl?.classList.contains("visible")) {
        this._closeSubmenu();
      } else {
        this._openSubmenu();
        this._isPinned = true;
      }
    };

    // Prevent Space/Enter from triggering native button click
    // (keyboard navigation is handled by ContextMenu._handleKeydown)
    this._handlers.keydown = (ev: KeyboardEvent) => {
      if (ev.key === " " || ev.key === "Enter") {
        ev.preventDefault();
      }
    };

    this._buttonEl.addEventListener("mouseenter", this._handlers.mouseenter);
    this._buttonEl.addEventListener("mouseleave", this._handlers.mouseleave);
    this._buttonEl.addEventListener("click", this._handlers.click);
    this._buttonEl.addEventListener("keydown", this._handlers.keydown);
  }

  protected _removeEventListeners(): void {
    super._removeEventListeners();

    if (!this._buttonEl) return;

    for (const [event, handler] of Object.entries(this._handlers)) {
      if (!handler) continue;

      this._buttonEl.removeEventListener(
        event as keyof HTMLElementEventMap,
        handler as EventListener
      );
      this._handlers[event as keyof typeof this._handlers] = null;
    }
  }

  private _createChevron(): SVGElement {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(chevronSvg, "image/svg+xml");
    const svg = svgDoc.documentElement as unknown as SVGElement;
    svg.setAttribute("class", styles.chevron);
    return svg;
  }

  private _scheduleOpen(): void {
    this._cancelOpen();
    this._hoverTimeout = window.setTimeout(() => {
      this._openSubmenu();
    }, 300); // 300ms delay
  }

  private _cancelOpen(): void {
    if (this._hoverTimeout !== null) {
      clearTimeout(this._hoverTimeout);
      this._hoverTimeout = null;
    }
  }

  private _openSubmenu(): void {
    if (
      !this._buttonEl ||
      !this._submenuContainer ||
      this._disabled ||
      !this._currentCtx
    )
      return;

    // Prevent nested submenus - check if any item in submenu is also a submenu
    const hasNestedSubmenu = this._submenu.items.some(
      (item) => item instanceof ContextMenuSub
    );
    if (hasNestedSubmenu) {
      return; // Don't allow nested submenus
    }

    // Close any other open submenus
    this._closeOtherSubmenus();

    const liRect = this._liEl!.getBoundingClientRect();
    const containerRect = this._submenuContainer.getBoundingClientRect();

    // Position to the right of the menu item, with slight overlap
    let x = liRect.right - containerRect.left - 4;
    let y = liRect.top - containerRect.top;

    // Get actual submenu dimensions (need to show it first to measure)
    this._submenu.show(x, y, this._currentCtx);

    const submenuEl = this._submenu.menuElement;
    if (submenuEl) {
      const submenuWidth = submenuEl.offsetWidth;
      const submenuHeight = submenuEl.offsetHeight;

      // Check if submenu would go off-screen to the right
      if (x + submenuWidth > containerRect.width) {
        // Position to the left instead
        x = liRect.left - containerRect.left - submenuWidth;
      }

      // Check if submenu would go off-screen vertically
      if (y + submenuHeight > containerRect.height) {
        y = containerRect.height - submenuHeight;
      }
      if (y < 0) {
        y = 0;
      }

      // Reposition with correct coordinates
      this._submenu.show(x, y, this._currentCtx);
    }
  }

  private _closeSubmenu(): void {
    this._submenu.hide();
    this._isPinned = false;
    this._buttonEl?.classList.remove(itemStyles.focusedParent);
  }

  private _isHovering(): boolean {
    if (!this._buttonEl) return false;
    const submenuEl = this._submenu.menuElement;
    if (!submenuEl) return false;
    return this._buttonEl.matches(":hover") || submenuEl.matches(":hover");
  }

  private _closeOtherSubmenus(): void {
    if (!this._submenuContainer) return;

    // Close all other visible submenus
    const visibleSubmenus =
      this._submenuContainer.querySelectorAll(`menu.visible`);
    const currentSubmenuEl = this._submenu.menuElement;
    visibleSubmenus.forEach((submenu) => {
      const submenuEl = submenu as HTMLElement;
      if (submenuEl !== currentSubmenuEl) {
        submenuEl.classList.remove("visible");
        submenuEl.style.opacity = "0";
        submenuEl.style.pointerEvents = "none";
        submenuEl.style.visibility = "hidden";
      }
    });
  }
}
