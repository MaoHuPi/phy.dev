function waitTime(second) {
	return new Promise(resolve => {
		setTimeout(() => {
			resolve();
		}, second);
	});
}

async function wait$(selector, secondEachCheck = 0.1) {
	while (true) {
		let element = $(selector);
		if (element) return element;
		await waitTime(secondEachCheck);
	}
}
let fileName = 'spinningTopWithOffsetCenterOfGravity_auto';
async function test() {
	if(fileName !== ''){
		let result = await fetch(`script/${fileName}.js`);
		let systemFile = window.project.getFile(`${fileName}.js`, SystemFile);
		systemFile.content = await result.text();
	
		let event_change = new Event('change');
		(await wait$('#folderPathBar-path')).dispatchEvent(event_change);
	
		let event_dblclick = new Event('dblclick');
		(await wait$('#fileGrid > div[type="system"]')).dispatchEvent(event_dblclick);
	
		console.log('Test project loaded!');
	}
}