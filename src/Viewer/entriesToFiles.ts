async function readDirectories(entries: FileSystemEntry[], path = ""): Promise<FileSystemFileEntry[]> {
    const result: FileSystemFileEntry[] = [];

    for (let i = 0; i < entries.length; ++i) {
        const entry = entries[i];
        if (entry.isDirectory) {
            const dirReader = (entry as FileSystemDirectoryEntry).createReader();
            const entries = await new Promise<FileSystemEntry[]>((resolve, reject) => {
                dirReader.readEntries(resolve, reject);
            });
            result.push(...await readDirectories(entries, path + entry.name + "/"));
        } else {
            result.push(entry as FileSystemFileEntry);
        }
    }

    return result;
}

export async function entriesToFiles(entries: FileSystemEntry[]): Promise<File[]> {
    const files: File[] = [];
    const directories = await readDirectories(entries);
    for (let i = 0; i < directories.length; ++i) {
        const entry = directories[i];
        const file = await new Promise<File>((resolve, reject) => {
            entry.file(resolve, reject);
        });
        if (file.webkitRelativePath === "") {
            Object.defineProperty(file, "webkitRelativePath", {
                writable: true
            });
            (file as any).webkitRelativePath = entry.fullPath;
        }
        files.push(file);
    }
    return files;
}
