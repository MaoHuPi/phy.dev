import fs from 'node:fs';
import * as basic from './ref/basic.mjs';
import * as numericalComputation from './ref/numericalComputation.mjs';

const form = {
	system: {
		key: ['-i', '-s', '--system'],
		value: './system.js'
	},
	out: {
		key: ['-o', '--out'],
		value: './data-test.csv'
	},
	method: {
		key: ['-m', '--method'],
		value: 'emb_RKF45'
	},
	q0: {
		key: ['-q', '--q0'],
		value: false
	},
	h0: {
		key: ['-h', '--h0'],
		value: '0.01'
	},
	epsilon: {
		key: ['-e', '--epsilon'],
		value: '0.001'
	},
	end: {
		key: ['-E', '--end'],
		value: '60'
	}
}

let fieldName = false;
process.argv.forEach(fieldString => {
	let fieldValue = false;
	let isName = false;
	if (fieldString.includes('=')) {
		let fieldArray = fieldString.split('=');
		fieldString = fieldArray.shift();
		fieldValue = fieldArray.join('=');
	}
	for (let name in form) {
		if (form[name].key.includes(fieldString)) {
			fieldName = name;
			isName = true;
			break;
		}
	}
	if (isName && fieldValue !== false) {
		form[fieldName].value = fieldValue;
		fieldName = false;
	} else if (!isName && fieldName !== false) {
		form[fieldName].value = fieldString;
		fieldName = false;
	}
});
// console.log(Object.fromEntries(Object.entries(form).map(([name, dict]) => [name, dict.value])));

let systemCode;
try {
	systemCode = fs.readFileSync(form.system.value, 'utf8');
} catch (error) {
	console.error(`[Phy Dev Error] Can not load the system file "${form.system.value}" correctly!`);
	console.error(error);
	process.exit(1);
}
const systemVar = new Function(`
	var q0 = [0];
	function parse(q){ return q; }
	function f(t, q) { return q; }

	${systemCode}

	return({ q0, parse, f });
`)();
if (form.q0.value === false) form.q0.value = JSON.stringify(systemVar.q0);
if (systemVar.q0 === undefined || systemVar.parse === undefined || systemVar.f === undefined) {
	process.exit(1);
}
let job = numericalComputation.prepareJob({
	formula: systemVar.f,
	update: systemVar.update,
	startTime: 0,
	endTime: form.end.value,
	initialValue: systemVar.parse(JSON.parse(form.q0.value)),
	initialH: form.h0.value,
	epsilon: form.epsilon.value,
	synchronizeAndStepByStep: false,
	method: form.method.value,
});
let result = await job;
try {
	fs.writeFileSync(form.out.value, basic.array2csv(result.csv));
} catch (error) {
	console.error(`[Phy Dev Error] Fail to write the output data file at "${form.out.value}"!`);
	console.error(error);
}