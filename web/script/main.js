(async () => {
	let moduleDict = {};
	let result = await fetch(`script/module.js`);
	let moduleCode = await result.text();
	moduleDict = new Function(`
		${moduleCode}
		return moduleDict;
	`)();

	const clearVarList = [];
	const shared = {
		clearVarAll: function clearVarAll() {
			for (let clearVar of clearVarList) {
				clearVar();
			}
		}
	};
	function share(dictOfFunction) {
		for (let key in dictOfFunction) {
			if (key === 'clearVar') {
				clearVarList.push(dictOfFunction.clearVar);
			} else {
				shared[key] = dictOfFunction[key];
			}
		}
	}

	let vw, vh;
	function resize() {
		[vw, vh] = [window.innerWidth, window.innerHeight].map(n => n / 100);
	}
	resize();
	window.addEventListener('resize', resize);

	function contextMenuSystem() {
		let contextMenu = $('#contextMenu');
		function showContextMenu(x, y, optionDict) {
			contextMenu.innerHTML = '';
			if (x < vw * 50) {
				contextMenu.style.left = `${x}px`;
				contextMenu.style.right = 'none';
			} else {
				contextMenu.style.left = 'none';
				contextMenu.style.right = `${vw * 100 - x}px`;
			}
			if (y < vh * 50) {
				contextMenu.style.top = `${y}px`;
				contextMenu.style.bottom = 'none';
			} else {
				contextMenu.style.top = 'none';
				contextMenu.style.bottom = `${vh * 100 - y}px`;
			}
			for (let optionName in optionDict) {
				let optionElement = $e('div');
				optionElement.innerText = optionName;
				optionElement.addEventListener('click', event => {
					event.stopPropagation();
					optionDict[optionName](event);
					hideContextMenu();
				});
				contextMenu.appendChild(optionElement);
			}
			contextMenu.style.setProperty('--optionNum', contextMenu.children.length);
			contextMenu.setAttribute('show', '');
		}
		function hideContextMenu() {
			contextMenu.removeAttribute('show');
			contextMenu.style.setProperty('--optionNum', 0);
			contextMenu.innerHTML = '';
		}
		window.addEventListener('click', hideContextMenu);
		return { showContextMenu }
	} share(contextMenuSystem());

	let project = new Project();
	window.project = project;
	let projectName = 'project.phy';
	function projectSystem(shared) {
		let { saveFile, openFile } = fileIOInit({ changeProjectName, importProject });
		async function importProject(file) {
			// let lastProject = project;
			// if (project !== lastProject) {
			let zip = await JSZip.loadAsync(file);
			project = Project.fromZip(zip);
			window.project = project;
			shared.clearVarAll();
			// }
		}
		async function exportProject() {
			let zip = project.toZip();
			let dataBuffer = await zip.generateAsync({
				type: 'arrayBuffer',
			});
			await saveFile(dataBuffer, projectName);
		}
		function changeProjectName(newName) {
			projectName = newName;
		}
		function newProject() {
			shared.clearVarAll();
			project = new JSZip();
			window.fileEntry = undefined;
		}
		async function openProject() {
			await openFile();
		}
		async function saveProject() {
			// handle unprocessed changes...
			await exportProject();
		}

		document.addEventListener('keydown', event => {
			if (event.ctrlKey && event.key == 's') {
				event.stopPropagation();
				event.preventDefault();
				saveProject();
			}
			if (event.altKey && ['o', 'n', 's'].includes(event.key)) {
				event.stopPropagation();
				event.preventDefault();
				switch (event.key) {
					case 'o':
						openProject();
						break;
					case 's':
						saveProject();
						break;
					case 'n':
						newProject();
						break;
				}
			}
		});
	} projectSystem(shared);

	function component() {
		let draggingList = [];
		let resizeBarList = $$('[id|="resizeBar"]');
		resizeBarList.forEach(resizeBar => {
			resizeBar.dragging = false;
			resizeBar.addEventListener('mousedown', () => {
				resizeBar.dragging = true;
				draggingList.push(resizeBar);
			});
		});
		window.addEventListener('mouseup', () => {
			resizeBarList.forEach(resizeBar => {
				resizeBar.dragging = false;
			});
		});
		window.addEventListener('mousemove', event => {
			draggingList.forEach(resizeBar => {
				if (resizeBar.dragging) {
					if (resizeBar.getAttribute('type') == 'vertical') {
						resizeBar.parentNode.style.setProperty(resizeBar.getAttribute('for'), (Math.min(1, Math.max(0, event.pageX / (100 * vw)))).toString());
					} else {
						resizeBar.parentNode.style.setProperty(resizeBar.getAttribute('for'), (Math.min(1, Math.max(0, event.pageY / (100 * vh)))).toString());
					}
				} else {
					draggingList.pop(draggingList.indexOf(resizeBar));
				}
			});
		});
	} component();

	function fileSystem(shared) {
		let folderPath = [];
		let focusedFile = undefined; /* as path */
		let openedFilePath = undefined; /* as flag */
		let cutFilePath = undefined; /* as flag */
		let copiedFile = undefined; /* as path */
		let copiedFileType = undefined;
		function path2string(path) { return path.length == 0 ? '' : (path.join('/') + '/') }
		function path2regexp(path) { return new RegExp(path.length == 0 ? '' : ('^' + path2string(path))) }
		function cancelHandeler_copyAndCut(event) {
			if (event.key == 'Escape') {
				event.preventDefault();
				cutFilePath = undefined;
				copiedFile = undefined;
				copiedFileType = undefined;
				document.removeEventListener('keydown', cancelHandeler_copyAndCut);
				folderPathChanged();
			}
		}
		function newFileElement(type, name) {
			let file = $e('div');
			let icon = $e('div');
			let title = $e('div');
			icon.className = 'icon';
			title.className = 'title';
			title.innerText = name;
			file.setAttribute('type', type);
			file.appendChild(icon);
			file.appendChild(title);
			let openThis = () => {
				focusedFile = file;

				if (type == 'folder') {
					folderPath.push(name);
				} else {
					openedFilePath = path2string(folderPath) + name;
					shared.openSubFile(type, path2string(folderPath) + name);
				}
				folderPathChanged();
			}
			file.addEventListener('dblclick', openThis);
			file.addEventListener('contextmenu', event => {
				event.preventDefault();
				event.stopPropagation();
				shared.showContextMenu(event.pageX, event.pageY, {
					open: openThis,
					rename: () => { renameSubFile(file); },
					copy: () => {
						if (cutFilePath || copiedFile) {
							cutFilePath = undefined;
							copiedFile = undefined;
							copiedFileType = undefined;
							document.removeEventListener('keydown', cancelHandeler_copyAndCut);
						}
						copiedFile = path2string(folderPath) + name;
						copiedFileType = type;
					},
					cut: () => {
						if (cutFilePath || copiedFile) {
							cutFilePath = undefined;
							copiedFile = undefined;
							copiedFileType = undefined;
							document.removeEventListener('keydown', cancelHandeler_copyAndCut);
						}
						cutFilePath = path2string(folderPath) + name;
						copiedFile = cutFilePath;
						copiedFileType = type;
						document.addEventListener('keydown', cancelHandeler_copyAndCut);
						folderPathChanged();
					},
					delete: () => {
						project[type == 'folder' ? 'removeFolder' : 'removeFile'](path2string(folderPath) + name);
						folderPathChanged();
					},
				});
			});
			return file;
		}
		function folderPathChanged() {
			if (folderPath.length == 0 || project.hasFolder(folderPath.join('/'))) {
				$('#folderPathBar-path').value = ['Φ', ...folderPath, ''].join('/');
				// show folder content
				let fileGrid = $('#fileGrid');
				fileGrid.innerHTML = '';

				let pathString = path2string(folderPath);
				let pathRegexp = path2regexp(folderPath);
				let filePathList = project.searchFile(pathRegexp);
				let folderPathList = project.searchFolder(pathRegexp);
				let fileDataList = [];
				let folderNameList = folderPathList
					.map(folder => folder.replace(pathString, '').replace('/', ''))
					.filter(name => name !== '');
				filePathList.map(filePath => [filePath.replace(pathString, ''), project.getFile(filePath)]).forEach(fileData => {
					if (!fileData[0].includes('/')) {
						fileDataList.push(fileData);
					}
				});
				filePathList = [];
				folderPathList = [];
				folderNameList.forEach(folderName => {
					let fileElement = newFileElement('folder', folderName);
					let wholePath = path2string(folderPath) + folderName;
					if (cutFilePath && cutFilePath.includes(folderName) && wholePath == cutFilePath) {
						fileElement.setAttribute('cut', '');
					}
					fileGrid.appendChild(fileElement);
				});
				fileDataList.forEach(([fileName, file]) => {
					let fileTypeData = {
						[SystemFile]: 'system',
						[DataFile]: 'data',
						[ImageFile]: 'image',
					};
					if (file.type in fileTypeData) {
						let fileElement = newFileElement(fileTypeData[file.type], fileName);
						let wholePath = path2string(folderPath) + fileName;
						if (openedFilePath && openedFilePath.includes(fileName) && wholePath == openedFilePath) {
							fileElement.setAttribute('focused', '');
						}
						if (cutFilePath && cutFilePath.includes(fileName) && wholePath == cutFilePath) {
							fileElement.setAttribute('cut', '');
						}
						fileGrid.appendChild(fileElement);
					}
				});
			} else {
				folderPath = [];
				folderPathChanged();
			}
		} folderPathChanged();
		function fileModeChanged() {
			let fileMode = $('[name="fileModeSwitcher"]:checked').id.split('-')[1];
			$('#fileGrid').setAttribute('mode', fileMode);
		} fileModeChanged();
		function renameSubFile(fileElement) {
			let title = $('div.title', fileElement);
			let input = $e('input');
			if (!title) {
				$('input', fileElement)?.focus();
				return;
			};
			input.className = 'title';
			input.setAttribute('type', 'text');
			input.value = title.innerText;
			input.addEventListener('click', event => {
				event.stopPropagation();
			});
			input.addEventListener('keydown', applyHandeler);
			title.after(input);
			input.focus();
			title.remove();
			function cancelHandeler(event) {
				if (event.type == 'keydown' && event.key == 'Escape') {
					event.preventDefault();
					input.after(title);
					input.remove();
					removeHandeler();
				}
			}
			function applyHandeler(event) {
				if (event.type == 'click' || (event.type == 'keydown' && event.key == 'Enter')) {
					let newName = input.value;
					let folderPathString = path2string(folderPath);
					if (fileElement.getAttribute('type') == 'folder') {
						project.moveFolder(folderPathString + title.innerText, folderPathString + newName);
					} else {
						project.moveFile(folderPathString + title.innerText, folderPathString + newName);
					}
					removeHandeler();
					folderPathChanged();
				}
			}
			function removeHandeler() {
				window.removeEventListener('click', applyHandeler);
				document.removeEventListener('keydown', cancelHandeler);
			}
			window.addEventListener('click', applyHandeler);
			document.addEventListener('keydown', cancelHandeler);
		}
		$('#fileBackButton').addEventListener('click', () => {
			if (folderPath.length > 0) folderPath.pop();
			folderPathChanged();
		});
		$('#folderPathBar-path').addEventListener('change', () => {
			let pathText = $('#folderPathBar-path').value;
			let targetPath = pathText.split('/');
			if (targetPath[0] == 'Φ') targetPath.shift();
			if (targetPath[targetPath.length - 1] == '') targetPath.pop();
			if (targetPath.length == 0 || project.hasFolder(targetPath.join('/'))) {
				folderPath = targetPath;
			}
			folderPathChanged();
		});
		$$('[name="fileModeSwitcher"]').forEach(radio => {
			radio.addEventListener('change', () => {
				fileModeChanged();
			})
		});
		fileGrid.addEventListener('contextmenu', event => {
			event.preventDefault();
			shared.showContextMenu(event.pageX, event.pageY, {
				'new system': () => {
					let fileName = `system-${randomId()}`;
					project.getFile(path2string(folderPath) + fileName, SystemFile).content = `
					function f(t, q) {
						let q_dot = [];
						// equations of q[i] and q_dot[i] 
						return q_dot;
					}
					function render(cvs, ctx, t, q) {
						let [w, h] = [1920, 1080];
						[cvs.width, cvs.height] = [w, h];
						ctx.fillStyle = 'black';
						ctx.fillRect(0, 0, w, h);
						// draw the frame
					}
					`;
					folderPathChanged();
					let findTitle = $$('div > div.title', fileGrid).filter(title => title.innerText == fileName);
					if (findTitle.length == 1) {
						renameSubFile(findTitle[0].parentNode);
					}
				},
				paste: () => {
					if (copiedFile) {
						if (copiedFile == cutFilePath) {
							let copiedFilePathSplit = copiedFile.split('/');
							let name = copiedFilePathSplit[copiedFilePathSplit.length - 1];
							copiedFileType
							if (copiedFileType == 'folder') {
								project.moveFolder(copiedFile, path2string(folderPath) + name);
							} else {
								project.moveFile(copiedFile, path2string(folderPath) + name);
							}
							folderPathChanged();
							cutFilePath = undefined;
							copiedFile = undefined;
							copiedFileType = undefined;
							document.removeEventListener('keydown', cancelHandeler_copyAndCut);
						} else {
							// copy

						}
					}
				}
			});
		});
		function clearVar() {
			folderPath = [];
			focusedFile = undefined;
			cutFilePath = undefined;
			folderPathChanged();
		}
		return { clearVar, folderPathChanged }
	} share(fileSystem(shared));

	function attributeSystem(shared) {
		let attributePanel = $('#attributePanel');
		let methodButtons = $('#methodButtons');
		let attributePanelData = {
			system: {
				targetPath: {
					type: 'input(text)',
					label: 'data file path',
					default: `Φ/data-test`
				},
				storageMethod: {
					type: 'switch',
					label: 'storage method',
					data: ['continue', 'overwrite'],
					default: 'overwrite'
				},
				calculateMethod: {
					type: 'select',
					label: 'calculate method',
					data: Object.keys(RKMethodDict)
				},
				initialValue: {
					type: 'input(text)',
					label: 'initial value',
					default: '[]'
				},
				hValue: {
					type: 'input(float)',
					label: 'initial h(step)',
					data: [0, 100000000],
					default: 0.01
				},
				epsilonValue: {
					type: 'input(float)',
					label: 'epsilon (error allow)',
					data: [0, 100000000],
					default: 0.001
				},
				endTime: {
					type: 'input(float)',
					label: 'end time',
					data: [-1, 60 * 60 * 24 * 365 * 100],
					default: -1
				},
				outputMode: {
					type: 'select',
					label: 'output mode',
					data: ['render', 'record', 'render + record'],
					default: 'render + record'
				}
			},
			data: {
				targetPath: {
					type: 'input(text)',
					label: 'file path',
					readOnly: true
				},
				calculateMethod: {
					type: 'input(text)',
					label: 'calculate method',
					readOnly: true
				},
				initialValue: {
					type: 'input(text)',
					label: 'initial value',
					readOnly: true
				},
				hValue: {
					type: 'input(text)',
					label: 'initial h(step)',
					readOnly: true
				},
				epsilonValue: {
					type: 'input(text)',
					label: 'epsilon (error allow)',
					readOnly: true
				}
			}
		}
		let form = {};
		function tidyTargetPath(targetPath) {
			targetPath = targetPath.split('/');
			if (targetPath[0] == 'Φ') targetPath.shift();
			if (targetPath[targetPath.length - 1] == '') targetPath.pop();
			targetPath = targetPath.join('/');
			return targetPath;
		}
		function newAttributeComponent(option) {
			let component = $e('fieldset');
			let label = $e('legend');
			label.innerText = option.label;
			component.appendChild(label);
			switch (option.type.split('(')[0]) {
				case 'input':
					let subType = option.type.split('(')[1].replace(')', '');
					let input = $e('input');
					input.setAttribute('type', {
						text: 'text',
						int: 'number', float: 'number',
						color: 'color',
						date: 'date'
					}[subType]);
					function valueCheck() {
						if (subType == 'int') {
							input.value = input.value === '' ? '0' : parseInt(input.value).toString();
							let value = parseInt(input.value);
							if (option.data) {
								if (value < option.data[0]) {
									value = option.data[0].toString();
								} else if (value > option.data[1]) {
									value = option.data[1].toString();
								}
							}
						} else if (subType == 'float') {
							input.value = input.value === '' ? '0' : parseFloat(input.value).toString();
							let value = parseFloat(input.value);
							if (option.data) {
								if (value < option.data[0]) {
									value = option.data[0].toString();
								} else if (value > option.data[1]) {
									value = option.data[1].toString();
								}
							}
						}
					}
					input.addEventListener('keydown', event => {
						if (event.key == 'Enter') {
							valueCheck();
						}
					});
					input.addEventListener('change', valueCheck);
					component.getValue = function () {
						valueCheck();
						return subType == 'int' ? parseInt(input.value) :
							subType == 'float' ? parseFloat(input.value) :
								input.value;
					}
					component.setValue = function (value) {
						input.value = value.toString();
						valueCheck();
					}
					component.readOnly = function () {
						input.readOnly = true;
					}
					component.writeable = function () {
						input.readOnly = false;
					}
					if (option.readOnly) component.readOnly();
					component.addEventListener = function (eventName, func) {
						input.addEventListener(eventName, func.bind(component));
					}
					component.appendChild(input);
					break;
				case 'select':
					let select = $e('select');
					if (option.data) {
						option.data.forEach(optionContent => {
							let optionElement = $e('option');
							optionElement.value = optionContent;
							optionElement.innerText = optionContent;
							select.appendChild(optionElement);
						});
					}
					component.getValue = function () {
						return select.value;
					}
					component.setValue = function (value) {
						select.value = value;
					}
					component.readOnly = function () {
						select.disabled = true;
					}
					component.writeable = function () {
						select.disabled = false;
					}
					if (option.readOnly) component.readOnly();
					component.addEventListener = function (eventName, func) {
						select.addEventListener(eventName, func.bind(component));
					}
					component.appendChild(select);
					break;
				case 'switch':
					let switchBox = $e('div');
					switchBox.className = 'switchBox';
					let radioName = 'radioGroup-' + randomId();
					if (option.data) {
						option.data.forEach(buttonName => {
							let radio = $e('input');
							let button = $e('label');
							let radioId = 'radio-' + randomId();
							radio.id = radioId;
							radio.setAttribute('type', 'radio');
							radio.setAttribute('name', radioName);
							radio.setAttribute('value', buttonName);
							button.innerText = buttonName;
							button.setAttribute('for', radioId);
							switchBox.appendChild(radio);
							switchBox.appendChild(button);
						});
					}
					component.getValue = function () {
						return $('input[type="radio"]:checked', switchBox).getAttribute('value');
					}
					component.setValue = function (value) {
						$(`input[type="radio"][value="${value}"]`, switchBox).click();
					}
					component.addEventListener = function (eventName, func) {
						$$(`input[type="radio"]`, switchBox).forEach(radio => {
							radio.addEventListener(eventName, func.bind(component));
						});
					}
					component.appendChild(switchBox);
					break;
			}
			if (option.default) {
				component.setValue(option.default);
			}
			return component;
		}
		let job = undefined;
		function openSubFile(type, path) {
			attributePanel.innerHTML = '';
			methodButtons.innerHTML = '';
			let cvs = $('#viewCanvas');
			[cvs.width, cvs.height] = [1920, 1080];
			cvs.style.setProperty('--frameWidth', cvs.width);
			cvs.style.setProperty('--frameHeight', cvs.height);

			form = {};
			// stop the job
			if (job && !job.stoppedFlag) {
				job.stoppedFlag = true;
				job = undefined;
			}

			// attribute
			if (type in attributePanelData) {
				for (let id in attributePanelData[type]) {
					let element = newAttributeComponent(attributePanelData[type][id]);
					form[id] = element;
					attributePanel.appendChild(element);
				}
			}

			// button
			let inheritAttribute = ['calculateMethod', 'initialValue', 'hValue', 'epsilonValue'];
			switch (type) {
				case 'system':
					// attribute
					form.storageMethod.addEventListener('change', function () {
						if (this.getValue() == 'continue') {
							inheritAttribute.forEach(attributeName => { form[attributeName].readOnly(); });
							let targetPath = tidyTargetPath(form.targetPath.getValue());
							let dataFile = project.getFile(targetPath);
							if (dataFile) {
								let data;
								try {
									data = JSON.parse(dataFile.meta);
								} catch (error) { }
								if (data) {
									for (let key of inheritAttribute) {
										if (key in data) {
											form[key].setValue(data[key]);
										}
									}
								}
							}
						} else {
							inheritAttribute.forEach(attributeName => { form[attributeName].writeable(); });
						}
					});
					// button
					let systemFile = project.getFile(path);
					let systemFunction = { f: undefined, render: undefined };
					let playButton = $e('div');
					let pasteButton = $e('div');
					const systemExtendFunctionDict = {
						require: function require(moduleName) {
							return moduleName in moduleDict ? moduleDict[moduleName] : {};
						},
						stop: async function stop() { if (playButton.value) await playButtonClick(); },
						start: async function play(formValueDict) {
							if (playButton.value) await playButtonClick();
							for (let key in formValueDict) {
								if (key in form) {
									form[key].setValue(formValueDict[key]);
								}
							}
							if (!playButton.value) await playButtonClick();
						},
						counter: (function counter() {
							let value = 0;
							return {
								get: () => value,
								set: (newValue) => { value = newValue; },
								next: () => { value++; }
							};
						})()
					}
					async function playButtonClick() {
						playButton.value = !playButton.value;
						if (playButton.value) {
							playButton.innerText = 'stop';
							if (systemFile) {
								let { f, render, update } = new Function(`
									const phydev = arguments[0];
									function f(t, q) { return q; }
									function render(cvs, ctx, t, q){}
									function update(t, q){}
		
									${systemFile.content}
		
									return({f, render, update});
								`)(systemExtendFunctionDict);
								systemFunction.f = f;
								systemFunction.render = render;
								systemFunction.update = update;
							}
							if (!(systemFunction.f && systemFunction.render && systemFunction.update)) {
								alert('There are some error in this "system(.js)" code!');
								return;
							}
							let formValue = { ...form };
							for (let key in form) {
								formValue[key] = form[key].getValue();
							}

							let dataFile = project.getFile(formValue.targetPath);
							if (formValue.targetPath == '' || (dataFile && dataFile.type !== DataFile)) {
								formValue.targetPath = `data-${randomId()}`;
							}

							formValue.targetPath = tidyTargetPath(formValue.targetPath);
							form.targetPath.setValue('Φ/' + formValue.targetPath);
							if (formValue.outputMode.includes('record')) {
								project.getFile(formValue.targetPath, DataFile).meta = JSON.stringify(formValue);
							}

							// to process the overwrite or continue
							let startTime = 0;
							let lastCsv = undefined;
							if (formValue.storageMethod == 'continue') {
								let subFile = project.getFile(formValue.targetPath);
								if (subFile) {
									let data;
									try {
										data = JSON.parse(subFile.meta);
									} catch (error) { }
									if (data) {
										for (let key of inheritAttribute) {
											if (key in data) {
												form[key].setValue(data[key]);
												formValue[key] = data[key];
											}
										}
									}
								}
								let dataFile = project.getFile(formValue.targetPath);
								if (dataFile) {
									let csv = dataFile.content;
									lastCsv = csv;
									let data = csv.split('\n');
									data = data[data.length - 1].split(',').map(s => parseFloat(s));
									startTime = data.shift();
									formValue.initialValue = JSON.stringify(data);
								}
							}
							if (formValue.outputMode == 'record' && formValue.endTime >= 0) {
								job = prepareJob({
									formula: systemFunction.f,
									update: systemFunction.update,
									startTime: startTime,
									endTime: formValue.endTime,
									initialValue: JSON.parse(formValue.initialValue),
									initialH: formValue.hValue,
									epsilon: formValue.epsilonValue,
									synchronizeAndStepByStep: false,
									method: formValue.calculateMethod,
								});
								(async () => {
									let localJob = job;
									let localPlayButton = playButton;
									result = await localJob;
									if (!localJob.stoppedFlag) {
										let dataFile = project.getFile(formValue.targetPath, DataFile);
										dataFile.content = (lastCsv ? lastCsv + '\n' : '') + array2csv(result.csv);
										formValue.hValue = result.h;
										form.hValue.setValue(result.h);
										dataFile.meta = JSON.stringify(formValue);
										localPlayButton.value = false;
										localPlayButton.innerText = 'start';
										shared.folderPathChanged();
										alert('Done!');
									}
								})();
							} else {
								job = prepareJob({
									formula: systemFunction.f,
									update: systemFunction.update,
									startTime: startTime,
									endTime: formValue.endTime >= 0 ? formValue.endTime : false,
									initialValue: JSON.parse(formValue.initialValue),
									initialH: formValue.hValue,
									epsilon: formValue.epsilonValue,
									synchronizeAndStepByStep: true,
									method: formValue.calculateMethod,
								});

								let cvs = $('#viewCanvas');
								let ctx = cvs.getContext('2d');
								let dataArray = [];
								let hValue = form.hValue;
								let frame = () => { };
								let localJob = job;
								let localPlayButton = playButton;
								switch (formValue.outputMode) {
									case 'render + record':
										frame = function () {
											let result = localJob.next();
											if (result.done || localJob.stoppedFlag) {
												let dataFile = project.getFile(formValue.targetPath, DataFile);
												dataFile.content = (lastCsv ? lastCsv + '\n' : '') + array2csv(dataArray);
												formValue.hValue = hValue;
												form.hValue.setValue(hValue);
												dataFile.meta = JSON.stringify(formValue);
												[cvs.width, cvs.height] = [1920, 1080];
												cvs.style.setProperty('--frameWidth', cvs.width);
												cvs.style.setProperty('--frameHeight', cvs.height);
												if (localPlayButton.value) {
													localPlayButton.value = false;
													localPlayButton.innerText = 'start';
												}
												shared.folderPathChanged();
											} else {
												dataArray.push(result.value.row);
												hValue = result.value.h;
												let renderArgument = [...result.value.row];
												let renderTime = renderArgument.shift();
												systemFunction.render(cvs, ctx, renderTime, renderArgument);
												cvs.style.setProperty('--frameWidth', cvs.width);
												cvs.style.setProperty('--frameHeight', cvs.height);
												setTimeout(frame, 30);
											}
										}
										break;
									case 'render':
										frame = function () {
											let result = localJob.next();
											if (result.done || localJob.stoppedFlag) {
												[cvs.width, cvs.height] = [1920, 1080];
												cvs.style.setProperty('--frameWidth', cvs.width);
												cvs.style.setProperty('--frameHeight', cvs.height);
												if (localPlayButton.value) {
													localPlayButton.value = false;
													localPlayButton.innerText = 'start';
												}
											} else {
												let renderArgument = [...result.value.row];
												let renderTime = renderArgument.shift();
												systemFunction.render(cvs, ctx, renderTime, renderArgument);
												cvs.style.setProperty('--frameWidth', cvs.width);
												cvs.style.setProperty('--frameHeight', cvs.height);
												setTimeout(frame, 30);
											}
										}
										break;
									case 'record':
										frame = function () {
											let result = localJob.next();
											if (result.done || localJob.stoppedFlag) {
												let dataFile = project.getFile(formValue.targetPath, DataFile);
												dataFile.content = array2csv(dataArray);
												formValue.hValue = hValue;
												form.hValue.setValue(hValue);
												dataFile.meta = JSON.stringify(formValue);
												if (localPlayButton.value) {
													localPlayButton.value = false;
													localPlayButton.innerText = 'start';
												}
												shared.folderPathChanged();
											} else {
												dataArray.push(result.value.row);
												hValue = result.value.h;
												setTimeout(frame, 1);
											}
										}
										break;
								}
								frame();
							}
						} else {
							if (job && !job.stoppedFlag) {
								job.stoppedFlag = true;
								job = undefined;
							}
							playButton.innerText = 'start';
							let cvs = $('#viewCanvas');
							[cvs.width, cvs.height] = [1920, 1080];
							cvs.style.setProperty('--frameWidth', cvs.width);
							cvs.style.setProperty('--frameHeight', cvs.height);
						}
					}
					if (systemFile) {
						let { q0 } = new Function(`
							const phydev = arguments[0];
						    var q0 = [0];

							${systemFile.content}

							return({q0});
						`)(systemExtendFunctionDict);
						systemFunction.q0 = q0;
						form.initialValue.setValue(JSON.stringify(q0));
					}
					playButton.value = false;
					playButton.innerText = 'start';
					playButton.addEventListener('click', playButtonClick);
					pasteButton.innerText = 'paste';
					pasteButton.addEventListener('click', () => {
						navigator.clipboard.readText()
							.then(text => {
								let data;
								try {
									data = JSON.parse(text);
								} catch (error) { }
								if (data) {
									for (let key in form) {
										if (key in data) {
											form[key].setValue(data[key]);
										}
									}
								}
							});
					});
					methodButtons.appendChild(playButton);
					methodButtons.appendChild(pasteButton);
					break;
				case 'data':
					// attribute
					let dataFile = project.getFile(path);
					if (dataFile) {
						let data;
						try {
							data = JSON.parse(dataFile.meta);
						} catch (error) { }
						if (data) {
							for (let key in form) {
								if (key in data && key !== 'targetPath') {
									form[key].setValue(data[key]);
								}
							}
						}
					}
					form.targetPath.setValue('Φ/' + path);
					// button
					let copyButton = $e('div');
					copyButton.innerText = 'copy';
					copyButton.addEventListener('click', () => {
						let formValue = { ...form };
						for (let key in form) {
							formValue[key] = form[key].getValue();
						}
						navigator.clipboard.writeText(JSON.stringify(formValue));
					});
					methodButtons.appendChild(copyButton);
					break;
			}
		}
		methodButtons
		return { openSubFile };
	} share(attributeSystem(shared));

	test();
})();