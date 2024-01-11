import { entriesToFiles } from "./entriesToFiles";

export class FileDropControlBuilder {
    private readonly _ownerDocument: Document;

    public constructor(ownerDocument: Document) {
        this._ownerDocument = ownerDocument;
    }

    public createFileDrop(onReceiveFiles: (files: File[]) => void): HTMLInputElement {
        const fileInput = this._ownerDocument.createElement("input");
        fileInput.type = "file";
        fileInput.setAttribute("directory", "");
        fileInput.setAttribute("webkitdirectory", "");
        fileInput.setAttribute("allowdirs", "");
        fileInput.ondragover = (event): void => event.preventDefault();
        fileInput.ondrop = async(event): Promise<void> => {
            event.preventDefault();
            const dataTransferItemList = event.dataTransfer!.items;
            if (!dataTransferItemList) return;
            const entries: FileSystemEntry[] = [];
            for (let i = 0; i < dataTransferItemList.length; ++i) {
                const item = dataTransferItemList[i];
                const entry = item.webkitGetAsEntry();
                if (entry) entries.push(entry);
            }

            const files = await entriesToFiles(entries);
            onReceiveFiles(files);
        };
        fileInput.onchange = (): void => {
            if (fileInput.files === null) return;
            const files = Array.from(fileInput.files);
            onReceiveFiles(files);
        };

        return fileInput;
    }
}
