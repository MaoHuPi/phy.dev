function str(string) { return string.replaceAll(' ', '').replaceAll('-', '+-').split('+'); }
function add(list1, list2) {
	return [...list1, ...list2];
}
function sum(...multiList) { return multiList.flat(); }
function mul(list1, list2) {
	return list1.map(u => list2.map(v => {
		let sign = (u[0] == '-' ? '-' : '+') + (v[0] == '-' ? '-' : '+');
		switch (sign) {
			case '++':
			case '-+':
				return `${u}*${v}`;
			case '+-':
				return `${v}*${u}`;
			case '--':
				return `${u.substring(1)}*${v.substring(1)}`;
		}
	})).flat();
}
function neg(list) { return mul(['-1'], list); }
function pro(...multiList) {
	return multiList.reduce((s, list) => s === undefined ? list : mul(s, list));
}
function pow(list, exp) { return pro(...new Array(exp).fill(list)); }
function tidy(list) {
	let entryCount = {};
	list.map(entry => {
		let ne = entry[0] == '-';
		if (ne) entry = entry.substring(1);
		entry = entry.replaceAll('*1*', '*').split('*');
		let scalar = 1;
		let segmentCount = {};
		entry.forEach(segment => {
			if (/^[+-]?([0-9]*[.])?[0-9]+$/.test(segment)) {
				scalar *= parseFloat(segment);
			} else {
				segment = segment.split('^');
				if (segment.length > 1) {
					let segment_0 = segment.shift();
					exp = segment.reverse().map(n => parseFloat(n)).reduce((s, n) => s ? n ** s : n);
					segment = [segment_0];
				} else exp = 1;
				if (!(segment[0] in segmentCount)) segmentCount[segment[0]] = 0;
				segmentCount[segment[0]] += exp;
			}
		});
		return [
			(ne ? '-' : '') + scalar.toString(),
			Object.entries(segmentCount)
				.sort((a, b) => a[0].charCodeAt() - b[0].charCodeAt())
				.map(pair => pair[1] == 1 ? pair[0] : `${pair[0]}^${pair[1]}`)
				.join('*')
		];
	}).forEach(entry => {
		if (!(entry[1] in entryCount)) entryCount[entry[1]] = 0;
		entryCount[entry[1]] += parseFloat(entry[0]);
	});
	return Object.entries(entryCount)
		.sort((a, b) => a[1] - b[1])
		.map(pair => pair[1] == 1 ? pair[0] : `${pair[1]}*${pair[0]}`);
}

(() => {
	let a = neg(str('x + y + z')),
		b = neg(str('a^2 + b^2 + c^2 - x*y - y*z - z*x')),
		c = neg(str('x*y*z + 2*a*b*c - c^2*x - a^2*z - b^2*y'));

	let A = sum(pro(['2'], a, a, a), pro(['-9'], a, b), mul(['27'], c));
	let B = sum(neg(mul(a, a)), mul(['3'], b));

	let delta = mul([...mul(mul(A, A), ['(1/4)']), ...mul(mul(B, B), B)], ['(1/729)']);
	delta = tidy(delta);
	console.log(delta);
})();