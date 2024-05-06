import { Material } from "@babylonjs/core/Materials/material";
import type { Nullable } from "@babylonjs/core/types";
import type { MmdStandardMaterial } from "babylon-mmd/esm/Loader/mmdStandardMaterial";
import type { RuntimeMmdMesh } from "babylon-mmd/esm/Runtime/mmdMesh";

export class FixMaterialTab {
    public readonly root: HTMLDivElement;

    private readonly _ownerDocument: Document;
    private _mmdMesh: Nullable<RuntimeMmdMesh>;

    private _uiToggleFadeOutTimeout: Nullable<number>;

    private readonly _uiContainer: HTMLDivElement;
    private readonly _uiToggle: HTMLButtonElement;
    private readonly _materialListDiv: HTMLDivElement;

    public get uiOpened(): boolean {
        return this._uiContainer.style.left === "0px";
    }

    public set uiOpened(value: boolean) {
        if (this.uiOpened === value) return;

        if (value) {
            this._uiContainer.style.left = "0px";
            this._uiToggle.textContent = "<";
            window.clearTimeout(this._uiToggleFadeOutTimeout ?? undefined);
            this._uiToggleFadeOutTimeout = null;
            this._uiToggle.style.opacity = "1";

        } else {
            this._uiContainer.style.left = "-300px";
            this._uiToggle.textContent = ">";
            this._uiToggleFadeOut();
        }
    }

    public constructor(ownerDocument: Document) {
        this._ownerDocument = ownerDocument;
        this._mmdMesh = null;

        this._uiToggleFadeOutTimeout = null;

        const root = this.root = ownerDocument.createElement("div");
        root.style.position = "absolute";
        root.style.top = "0";
        root.style.left = "0";
        root.style.width = "100%";
        root.style.height = "100%";
        root.style.overflow = "hidden";
        root.style.pointerEvents = "none";

        const uiContainer = this._uiContainer = ownerDocument.createElement("div");
        uiContainer.style.position = "absolute";
        uiContainer.style.top = "0";
        uiContainer.style.left = "-300px";
        uiContainer.style.fontFamily = "sans-serif";
        uiContainer.style.color = "white";
        uiContainer.style.transition = "left 0.5s";
        uiContainer.style.pointerEvents = "auto";
        root.appendChild(uiContainer);

        const uiInnerContainer = ownerDocument.createElement("div");
        uiInnerContainer.style.width = "300px";
        uiInnerContainer.style.height = "calc(100vh - 200px)";
        uiInnerContainer.style.display = "flex";
        uiInnerContainer.style.flexDirection = "column";
        uiInnerContainer.style.justifyContent = "space-between";
        uiInnerContainer.style.alignItems = "center";
        uiInnerContainer.style.backgroundColor = "rgb(34, 34, 34)";
        uiInnerContainer.style.padding = "5px";
        uiInnerContainer.style.boxSizing = "border-box";
        uiContainer.appendChild(uiInnerContainer);

        const uiToggle = this._uiToggle = ownerDocument.createElement("button");
        uiToggle.style.width = "20px";
        uiToggle.style.height = "20px";
        uiToggle.style.position = "absolute";
        uiToggle.style.top = "0";
        uiToggle.style.left = "300px";
        uiToggle.style.backgroundColor = "rgb(34, 34, 34)";
        uiToggle.style.textAlign = "center";
        uiToggle.style.border = "none";
        uiToggle.style.color = "white";
        uiToggle.textContent = ">";
        uiToggle.style.opacity = "0";
        uiContainer.appendChild(uiToggle);
        uiToggle.style.transition = "opacity 0.5s";
        uiToggle.ontouchmove = (): void => {
            if (this._mmdMesh !== null && !this.uiOpened) this._uiToggleFadeOut();
        };
        uiToggle.onmousemove = (): void => {
            if (this._mmdMesh !== null && !this.uiOpened) this._uiToggleFadeOut();
        };
        uiToggle.onclick = (): void => {
            if (this._mmdMesh === null) return;
            this.uiOpened = !this.uiOpened;
        };

        const materialListDiv = this._materialListDiv = ownerDocument.createElement("div");
        materialListDiv.style.height = "100%";
        materialListDiv.style.width = "100%";
        materialListDiv.style.padding = "5px";
        materialListDiv.style.boxSizing = "border-box";
        materialListDiv.style.backgroundColor = "rgb(68, 68, 68)";
        materialListDiv.style.overflow = "auto";
        uiInnerContainer.appendChild(materialListDiv);
    }

    private _uiToggleFadeOut(): void {
        this._uiToggle.style.opacity = "1";

        if (this._uiToggleFadeOutTimeout !== null) {
            window.clearTimeout(this._uiToggleFadeOutTimeout);
            this._uiToggleFadeOutTimeout = null;
        }

        this._uiToggleFadeOutTimeout = window.setTimeout(() => {
            this._uiToggleFadeOutTimeout = null;
            this._uiToggle.style.opacity = "0";
        }, 2000);
    }

    public setMmdMesh(value: Nullable<RuntimeMmdMesh>): void {
        this._mmdMesh = value;

        if (value === null) {
            this.uiOpened = false;
            return;
        }

        const ownerDocument = this._ownerDocument;
        const materialListDiv = this._materialListDiv;
        materialListDiv.innerHTML = "";

        const materials = value.metadata.materials;
        for (let i = 0; i < materials.length; ++i) {
            const material = materials[i] as MmdStandardMaterial;

            const item = ownerDocument.createElement("div");
            item.style.width = "100%";
            item.style.padding = "5px 0px";
            item.style.boxSizing = "border-box";
            item.style.display = "flex";
            item.style.alignItems = "center";
            item.style.flexDirection = "row";
            item.style.justifyContent = "space-between";

            const itemLabel = ownerDocument.createElement("label");
            itemLabel.style.width = "160px";
            itemLabel.style.height = "auto";
            itemLabel.style.whiteSpace = "nowrap";
            itemLabel.style.overflow = "hidden";
            itemLabel.style.marginRight = "5px";
            itemLabel.textContent = material.name;
            itemLabel.title = material.name;
            item.appendChild(itemLabel);

            const transparencyModeButton = ownerDocument.createElement("button");
            transparencyModeButton.style.float = "right";
            transparencyModeButton.style.width = "100px";
            transparencyModeButton.style.height = "auto";
            transparencyModeButton.style.fontSize = "14px";
            transparencyModeButton.style.marginRight = "10px";
            transparencyModeButton.style.border = "none";
            transparencyModeButton.style.backgroundColor = "rgb(34, 34, 34)";
            transparencyModeButton.style.color = "white";
            transparencyModeButton.style.userSelect = "none";
            transparencyModeButton.textContent = fromTransparencyModeEnumToString(material.transparencyMode ?? 0);
            transparencyModeButton.onclick = (): void => {
                if (material.transparencyMode === null) material.transparencyMode = 0;
                material.transparencyMode = material.transparencyMode === Material.MATERIAL_ALPHABLEND ? Material.MATERIAL_OPAQUE : Material.MATERIAL_ALPHABLEND;
                transparencyModeButton.textContent = fromTransparencyModeEnumToString(material.transparencyMode ?? 0);
            };
            item.appendChild(transparencyModeButton);

            materialListDiv.appendChild(item);
        }

        function fromTransparencyModeEnumToString(transparencyMode: number): string {
            switch (transparencyMode) {
            case Material.MATERIAL_OPAQUE:
                return "Opaque";
            case Material.MATERIAL_ALPHATEST:
                return "Alpha Test";
            case Material.MATERIAL_ALPHABLEND:
                return "Alpha Blend";
            default:
                return "Unknown";
            }
        }
    }
}
