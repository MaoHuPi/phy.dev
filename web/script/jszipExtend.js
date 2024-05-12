// From:
// https://stackoverflow.com/questions/77970997/is-there-a-way-to-rename-a-file-in-jszip
JSZip.prototype.renameAsync = async function rename(oldName, newName) {
    const old = this.file(oldName) || this.folder(oldName);
    const type = old.file ? "folder" : "file";

    if (type == "file") {
        const content = await old.async("uint8array");
        this.remove(old.name);
        this.file(newName, content);
    } else if (type == "folder") {
        const newFolder = this.folder(newName);
        old.forEach(async function(name, file) {
            const content = await file.async("uint8array");
            old.remove(name);
            newFolder.file(name, content);
        });
        this.remove(oldName);
    }
}