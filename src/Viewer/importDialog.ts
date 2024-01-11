import type { Nullable } from "@babylonjs/core/types";

export class ImportDialog {
    public readonly root: HTMLDivElement;

    private readonly _ownerDocument: Document;
    private readonly _titleDiv: HTMLDivElement;
    private readonly _fileListInnerDiv: HTMLDivElement;

    public constructor(ownerDocument: Document) {
        this._ownerDocument = ownerDocument;

        const root = this.root = ownerDocument.createElement("div");
        root.style.position = "absolute";
        root.style.top = "0";
        root.style.left = "0";
        root.style.width = "100%";
        root.style.height = "100%";
        root.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
        root.style.display = "none";
        root.style.flexDirection = "column";
        root.style.justifyContent = "center";
        root.style.alignItems = "center";
        root.style.fontFamily = "sans-serif";
        root.style.color = "white";
        root.style.pointerEvents = "auto";
        root.style.zIndex = "1000";

        const importDialog = ownerDocument.createElement("div");
        importDialog.style.width = "400px";
        importDialog.style.height = "300px";
        importDialog.style.backgroundColor = "rgb(51, 51, 51)";
        importDialog.style.display = "flex";
        importDialog.style.flexDirection = "column";
        importDialog.style.alignItems = "center";
        importDialog.style.userSelect = "none";
        importDialog.onclick = (event): void => {
            event.stopPropagation();
        };
        root.appendChild(importDialog);

        const dialogTitleDiv = this._titleDiv = ownerDocument.createElement("div");
        dialogTitleDiv.style.width = "100%";
        dialogTitleDiv.style.height = "40px";
        dialogTitleDiv.style.backgroundColor = "rgb(68, 68, 68)";
        dialogTitleDiv.style.display = "flex";
        dialogTitleDiv.style.justifyContent = "center";
        dialogTitleDiv.style.alignItems = "center";
        dialogTitleDiv.textContent = "Import";
        importDialog.appendChild(dialogTitleDiv);

        const fileListDiv = ownerDocument.createElement("div");
        fileListDiv.style.display = "flex";
        fileListDiv.style.flexDirection = "column";
        fileListDiv.style.justifyContent = "center";
        fileListDiv.style.alignItems = "center";
        fileListDiv.style.width = "100%";
        fileListDiv.style.height = "calc(100% - 40px)";
        fileListDiv.style.boxSizing = "border-box";
        importDialog.appendChild(fileListDiv);

        const fileListInnerDiv = this._fileListInnerDiv = ownerDocument.createElement("div");
        fileListInnerDiv.style.display = "flex";
        fileListInnerDiv.style.flexDirection = "column";
        fileListInnerDiv.style.padding = "10px";
        fileListInnerDiv.style.boxSizing = "border-box";
        fileListInnerDiv.style.overflow = "auto";
        fileListInnerDiv.style.width = "100%";
        fileListDiv.appendChild(fileListInnerDiv);
    }

    public select<T>(title: string, items: readonly T[], getItemName: (item: T) => string): Promise<Nullable<T>> {
        const ownerDocument = this._ownerDocument;

        this._titleDiv.textContent = title;

        const fileListInnerDiv = this._fileListInnerDiv;
        fileListInnerDiv.innerHTML = "";

        return new Promise((resolve) => {
            const root = this.root;
            root.style.display = "flex";

            root.onclick = (): void => {
                root.style.display = "none";
                root.onclick = null;
                fileListInnerDiv.innerHTML = "";
                resolve(null);
            };

            for (let i = 0; i < items.length; i++) {
                const item = items[i];

                const itemDiv = ownerDocument.createElement("div");
                itemDiv.style.width = "auto";
                itemDiv.style.minHeight = "32px";
                itemDiv.style.padding = "5px 10px";
                itemDiv.style.boxSizing = "border-box";
                itemDiv.style.marginBottom = "3px";
                itemDiv.style.backgroundColor = "rgb(85, 85, 85)";
                itemDiv.style.overflow = "auto hidden";
                itemDiv.style.whiteSpace = "nowrap";
                itemDiv.textContent = getItemName(item);
                itemDiv.onclick = (): void => {
                    root.style.display = "none";
                    root.onclick = null;
                    fileListInnerDiv.innerHTML = "";
                    resolve(item);
                };
                fileListInnerDiv.appendChild(itemDiv);
            }
        });
    }
}
