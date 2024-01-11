import type { Nullable } from "@babylonjs/core/types";

export class ObjectListControl<T> {
    public onSelectedItemChanged: Nullable<(item: Nullable<T>) => void>;

    public readonly listDiv: HTMLDivElement;

    private readonly _ownerDocument: Document;

    private readonly _items: [T, HTMLDivElement][];
    private _seletedItem: Nullable<[T, HTMLDivElement]>;

    public constructor(ownerDocument: Document) {
        this._ownerDocument = ownerDocument;

        this.onSelectedItemChanged = null;

        this.listDiv = ownerDocument.createElement("div");
        this._items = [];
        this._seletedItem = null;
    }

    public get selectedItem(): Nullable<T> {
        return this._seletedItem?.[0] ?? null;
    }

    public set selectedItem(value: Nullable<T>) {
        if (this.selectedItem === value) return;

        if (this._seletedItem !== null) {
            const oldItem = this._seletedItem;
            oldItem[1].style.backgroundColor = "rgb(85, 85, 85)";
            oldItem[1].style.cursor = "pointer";
        }

        let item: Nullable<[T, HTMLDivElement]> = null;
        for (let i = 0; i < this._items.length; ++i) {
            if (this._items[i][0] === value) {
                item = this._items[i];
                break;
            }
        }

        if (item === null) {
            this._seletedItem = null;
            this.onSelectedItemChanged?.(null);
            return;
        }

        item[1].style.backgroundColor = "rgb(85, 136, 85)";
        item[1].style.cursor = "default";
        this._seletedItem = item;

        this.onSelectedItemChanged?.(item[0]);
    }

    private readonly _onSelectItem = (item: T): T => this.selectedItem = item;

    public addItem(item: T, text: string): void {
        const ownerDocument = this._ownerDocument;

        const itemDiv = ownerDocument.createElement("div");
        itemDiv.style.width = "100%";
        itemDiv.style.height = "32px";
        itemDiv.style.padding = "0 10px";
        itemDiv.style.boxSizing = "border-box";
        itemDiv.style.marginBottom = "3px";
        itemDiv.style.backgroundColor = "rgb(85, 85, 85)";
        itemDiv.style.cursor = "pointer";
        itemDiv.style.overflowX = "auto";
        itemDiv.style.whiteSpace = "nowrap";
        itemDiv.style.fontSize = "16px";
        itemDiv.style.display = "flex";
        itemDiv.style.alignItems = "center";
        itemDiv.style.userSelect = "none";
        itemDiv.textContent = text;
        itemDiv.onclick = (): T => this._onSelectItem(item);
        this.listDiv.appendChild(itemDiv);

        const objectItem: [T, HTMLDivElement] = [item, itemDiv];
        this._items.push(objectItem);

    }

    public removeItem(item: T): void {
        const index = this._items.findIndex((value): boolean => value[0] === item);
        if (index === -1) return;

        const itemDiv = this._items[index][1];
        this.listDiv.removeChild(itemDiv);
        this._items.splice(index, 1);

        if (this._seletedItem?.[0] === item) {
            this.selectedItem = null;
        }
    }
}
