var q0 = [
	1 / 180 * Math.PI, // theta 1
	1 / 180 * Math.PI, // theta 2
	0, // theta 3
	0, // omega 1
	0, // omega 2
	2 * Math.PI * 10, // omega 3
];

function f(t, q) {
	const m = 2, g = 9.8, d = 2, h = 5;
	let edge = Math.PI / 2;
	if (q[0] >= edge || q[0] <= -edge || q[1] >= edge || q[1] <= -edge) { return [0, 0, 0, 0, 0, 0]; }
	let q_dot = [q[3], q[4], q[5], 0, 0, 0];
	let [s1, c1, s2, c2, s3, c3] = [Math.sin(q[0]), Math.cos(q[0]), Math.sin(q[1]), Math.cos(q[1]), Math.sin(q[2]), Math.cos(q[2])];
	let [cx, cy, cz] = [d * c2 * c3 + h * s2, -d * s1 * s2 * c3 + d * c1 * s3 + h * s1 * c2, -d * c1 * s2 * c3 - d * s1 * s3 + h * c1 * c2];
	q_dot[3] = (g * cy + (m * g * cx * s1 * s2) / (c2 * (1 - 2 * c1 ** 2))) / (cy ** 2 + cz ** 2);
	q_dot[4] = ((g * cx * c1) / (1 - 2 * c1 ** 2)) / (2 * s1 * c1 * cy * cz + s1 ** 2 * c1 ** 2 * (cy ** 2 + cz ** 2) + cx ** 2 + s1 ** 4 * cy ** 2 + c1 ** 4 * cz ** 2);
	q_dot[5] = (-(g * cx * s1) / (c2 * (1 - 2 * c1 ** 2))) / (d ** 2);
	return q_dot;
}

function render(cvs, ctx, t, q) {
	const m = 2, g = 9.8, d = 2, h = 5;

	let [width, height] = [1080 * 3, 1080];
	[cvs.width, cvs.height] = [width, height];
	ctx.fillStyle = 'black';
	ctx.fillRect(0, 0, width, height);

	let [s1, c1, s2, c2, s3, c3] = [Math.sin(q[0]), Math.cos(q[0]), Math.sin(q[1]), Math.cos(q[1]), Math.sin(q[2]), Math.cos(q[2])];
	let [cx, cy, cz] = [d * c2 * c3 + h * s2, -d * s1 * s2 * c3 + d * c1 * s3 + h * s1 * c2, -d * c1 * s2 * c3 - d * s1 * s3 + h * c1 * c2];
	let frameW = 1000;
	let _d = frameW / 2;
	let _h = h / d * _d;
	let [_cx, _cy, _cz] = [cx, cy, cz].map(n => n / d * _d);
	let _a3 = [s2, s1 * c2, c1 * c2].map(n => n * _d);

	function drawSpinningTop(o, a) {
		ctx.strokeStyle = 'white';
		ctx.lineWidth = 5;

		ctx.beginPath();
		ctx.moveTo(...o);
		ctx.lineTo(o[0] + a[0], o[1] - a[1]);
		ctx.stroke();
	}

	// x
	drawSpinningTop([width / 3 / 2 * 1, height / 2 + frameW / 2], [_a3[1], _a3[2]]);

	// y
	drawSpinningTop([width / 3 / 2 * 3, height / 2 + frameW / 2], [-_a3[0], _a3[2]]);

	// z
	drawSpinningTop([width / 3 / 2 * 5, height / 2], [_a3[1], -_a3[0]]);
}