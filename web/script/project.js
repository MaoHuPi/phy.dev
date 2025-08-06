class Project {
	constructor({ subFileDict = {}, folderList = [] } = {}) {
		this.subFileDict = subFileDict;
		this.folderList = folderList;
	}

	hasFile(filePath) {
		return (filePath in this.subFileDict) && (this.subFileDict[filePath] !== undefined);
	}
	getFile(filePath, createAsTypeWhenNotExist = undefined) {
		if (this.hasFile(filePath)) {
			return this.subFileDict[filePath];
		} else if (createAsTypeWhenNotExist !== undefined) {
			this.subFileDict[filePath] = new createAsTypeWhenNotExist();
			return this.subFileDict[filePath];
		}
	}
	searchFile(regexp) {
		return Object.keys(this.subFileDict).filter(path => regexp.test(path));
	}
	moveFile(oldFilePath, newFilePath) {
		if (this.hasFile(oldFilePath)) {
			if (this.hasFile(newFilePath)) return false;
			this.subFileDict[newFilePath] = this.subFileDict[oldFilePath];
			this.subFileDict[oldFilePath] = undefined;
			delete this.subFileDict[oldFilePath];
		}
	}
	removeFile(filePath) {
		if (this.hasFile(filePath)) {
			this.subFileDict[filePath] = undefined;
			delete this.subFileDict[filePath];
		}
	}

	hasFolder(folderPath) {
		return this.folderList.includes(folderPath);
	}
	createFolder(folderPath) {
		if (!this.hasFolder(folderPath)) {
			return this.folderList.push(folderPath);
		}
	}
	searchFolder(regexp) {
		return this.folderList.filter(path => regexp.test(path));
	}
	moveFolder(oldFolderPath, newFolderPath) {
		if (this.hasFolder(oldFolderPath)) {
			if (this.hasFolder(newFolderPath)) return false;
			this.folderList.splice(this.folderList.indexOf(oldFolderPath), 1);
			this.folderList.push(newFolderPath);
			let folderRegexp = new RegExp(`^${oldFolderPath}`, 'g');
			this.searchFile(folderRegexp).forEach(oldFilePath => {
				let newFilePath = oldFilePath.replace(folderRegexp, newFolderPath);
				this.moveFile(oldFilePath, newFilePath);
			});
		}
	}
	removeFolder(folderPath) {
		if (this.hasFolder(folderPath)) {
			this.folderList.splice(this.folderList.indexOf(folderPath), 1);
			this.searchFile(new RegExp(`^${folderPath}`)).forEach(filePath => {
				this.removeFile(filePath);
			});
		}
	}

	static fromZip(zip) {
		let project = new Project();
		function path2string(path) { return path.length == 0 ? '' : (path.join('/')) }
		for (let [filePath, file] of Object.entries(zip.files)) {
			// folder
			let folderPath = filePath.split('/');
			folderPath.pop();
			while (folderPath.length > 0) {
				let folderPathString = path2string(folderPath);
				if (project.hasFolder(folderPathString)) break;
				project.createFolder(folderPathString);
				folderPath.pop();
			}

			// file
			let filePathSplit = filePath.split('.');
			let extensionName = filePathSplit.pop().toLowerCase();
			filePath = filePathSplit.join('.');
			let subFile = undefined;
			switch (extensionName) {
				case 'js':
					subFile = project.getFile(filePath, SystemFile);
					file.async('string').then(text => {
						subFile.content = text;
					});
					break;
				case 'csv':
					subFile = project.getFile(filePath, DataFile);
					file.async('string').then(text => {
						subFile.content = text;
					});
					break;
				case 'png':
					subFile = project.getFile(filePath, ImageFile);
					break;
				case 'meta':
					extensionName = filePathSplit.pop().toLowerCase();
					filePath = filePathSplit.join('.');
					switch (extensionName) {
						case 'js':
							subFile = project.getFile(filePath, SystemFile);
							break;
						case 'csv':
							subFile = project.getFile(filePath, DataFile);
							file.async('string').then(text => {
								subFile.meta = text;
							});
							break;
						case 'png':
							subFile = project.getFile(filePath, ImageFile);
							break;
					}
					break;
			}
		}
		return project;
	}
	toZip() {
		let zip = new JSZip();
		for (let [filePath, file] of Object.entries(this.subFileDict)) {
			switch (file.type) {
				case SystemFile:
					zip.file(filePath + '.js', file.content);
					break;
				case DataFile:
					zip.file(filePath + '.csv', file.content);
					zip.file(filePath + '.csv.meta', file.meta);
					break;
				case ImageFile:
					// zip.file(filePath, file.content);
					// zip.file(filePath + '.meta', file.meta);
					break;
			}
		}
		for (let folderPath of this.folderList) {
			zip.file(folderPath + '/.occ.txt', 'occ');
		}
		return zip;
	}
}

class SystemFile {
	constructor({ content = '' } = {}) {
		this.type = SystemFile;
		this.content = content;
	}
	writeToZip() {

	}
}
class DataFile {
	constructor({ content = '', meta = '' } = {}) {
		this.type = DataFile;
		this.content = content;
		this.meta = meta;
	}
	writeToZip() {

	}
}
class ImageFile {
	constructor({ content, meta } = {}) {
		this.type = ImageFile;
		this.content = content;
		this.meta = meta;
	}
	writeToZip() {

	}
}