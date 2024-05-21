// 此系統在設計上便有所錯誤，因為對力矩作線性拆分會使得在「軸間角極大時」出現「拆分後的向量長之和遠大於原力矩向量長」之結果。
// 導致陀螺在朝「非正x、y軸」倒下時出現theta_3越轉越快的問題。

var q0 = [
	1 / 180 * Math.PI, // theta 1
	1 / 180 * Math.PI, // theta 2
	0, // theta 3
	0, // omega 1
	0, // omega 2
	2 * Math.PI * 8, // omega 3
];
// var q0 = [0, 0, 0, 0, 0, 0];

function f(t, q) {
	const mu_k = 0.4, g = 9.8, d = (0 * 0.02438 + 0.5 * 0.00137) / (0.02438 + 0.00137), h = 2;
	let edge = Math.PI / 2;
	if (q[0] >= edge || q[0] <= -edge || q[1] >= edge || q[1] <= -edge) { return [0, 0, 0, 0, 0, 0]; }
	let q_dot = [q[3], q[4], q[5], 0, 0, 0];
	let [s1, c1, s2, c2, s3, c3] = [Math.sin(q[0]), Math.cos(q[0]), Math.sin(q[1]), Math.cos(q[1]), Math.sin(q[2]), Math.cos(q[2])];
	let [cx, cy, cz] = [d * c2 * c3 + h * s2, -d * s1 * s2 * c3 + d * c1 * s3 + h * s1 * c2, -d * c1 * s2 * c3 - d * s1 * s3 + h * c1 * c2];

	function d_f(c_theta_z) {
		return 0.2 * Math.sin(Math.acos(c_theta_z));
	}

	// 重力 => 力矩 => 角加速度
	let d1_square = cy ** 2 + cz ** 2;
	let d2_square = 2 * s1 * c1 * cy * cz + s1 ** 2 * c1 ** 2 * (cy ** 2 + cz ** 2) + cx ** 2 + s1 ** 4 * cy ** 2 + c1 ** 4 * cz ** 2;
	let d3_square = d ** 2;
	q_dot[3] = (g * (cx * s1 * s2 / c2 + cy)) / d1_square;
	q_dot[4] = (g * cx * c1) / d2_square;
	q_dot[5] = (g * cx * s1 / c2) / d3_square;

	// 摩擦力 => 力矩 => 角加速度
	// let alpha_fk_same = (q[3] == 0 && q[4] == 0 && q[5] == 0) ? 0 : -d_f(c1 * c2) * mu_k * g / Math.sqrt(q[3] ** 2 * d1_square ** 2 + q[4] ** 2 * d2_square ** 2 + q[5] ** 2 * d3_square ** 2 - 2 * q[3] * q[5] * d1_square * d3_square * s2);
	// q_dot[3] += q[3] * alpha_fk_same;
	// q_dot[4] += q[4] * alpha_fk_same;
	// q_dot[5] += q[5] * alpha_fk_same;

	// console.log(t, q);
	return q_dot;
}

function render(cvs, ctx, t, q) {
	const mu_k = 0.4, g = 9.8, d = (0 * 0.02438 + 0.5 * 0.00137) / (0.02438 + 0.00137), h = 2;

	let [width, height] = [1080 * 3, 1080];
	[cvs.width, cvs.height] = [width, height];
	ctx.fillStyle = 'black';
	ctx.fillRect(0, 0, width, height);

	let frameW = 1000;
	let _h = frameW / 2;
	let _d = d / h * _h;
	let [s1, c1, s2, c2, s3, c3] = [Math.sin(q[0]), Math.cos(q[0]), Math.sin(q[1]), Math.cos(q[1]), Math.sin(q[2]), Math.cos(q[2])];
	let _a3 = [s2, s1 * c2, c1 * c2].map(n => n * _h);
	let _c = [_d * c2 * c3 + _h * s2, -_d * s1 * s2 * c3 + _d * c1 * s3 + _h * s1 * c2, -_d * c1 * s2 * c3 - _d * s1 * s3 + _h * c1 * c2];

	function drawSpinningTop(axis1, axis2, o, a, c) {
		function view(point) {
			return [Math.sign(axis1) * point[Math.abs(axis1) - 1], Math.sign(axis2) * point[Math.abs(axis2) - 1]];
		}
		function drawVector(start, delta) {
			ctx.beginPath();
			ctx.moveTo(...start);
			ctx.lineTo(start[0] + delta[0], start[1] - delta[1]);
			ctx.stroke();
		}

		ctx.fillStyle = 'white';
		ctx.lineWidth = 5;

		a = view(a);
		ctx.strokeStyle = 'white';
		drawVector(o, a);

		c = view(c);
		ctx.strokeStyle = 'pink';
		drawVector(o, c);

		ctx.beginPath();
		ctx.arc(o[0] + c[0], o[1] - c[1], 10, 0, Math.PI * 2);
		ctx.closePath();
		ctx.fill();

		(() => {
			// tau
			let [cx, cy, cz] = [d * c2 * c3 + h * s2, -d * s1 * s2 * c3 + d * c1 * s3 + h * s1 * c2, -d * c1 * s2 * c3 - d * s1 * s3 + h * c1 * c2];
			let d1_square = cy ** 2 + cz ** 2;
			let d2_square = 2 * s1 * c1 * cy * cz + s1 ** 2 * c1 ** 2 * (cy ** 2 + cz ** 2) + cx ** 2 + s1 ** 4 * cy ** 2 + c1 ** 4 * cz ** 2;
			let d3_square = d ** 2;
			let q_dot = [];
			q_dot[3] = (g * (cx * s1 * s2 / c2 + cy)) / d1_square;
			q_dot[4] = (g * cx * c1) / d2_square;
			q_dot[5] = (g * cx * s1 / c2) / d3_square;

			scale = n => n / h * _h * 0.05;

			ctx.strokeStyle = '#ff8888';
			drawVector(o, view([-q_dot[3] * d1_square, 0, 0].map(scale)));
			ctx.strokeStyle = '#88ff88';
			drawVector(o, view([0, q_dot[4] * d2_square * c1, -q_dot[4] * d2_square * s1].map(scale)));
			ctx.strokeStyle = '#8888ff';
			drawVector(o, view([q_dot[5] * d3_square * s2, q_dot[5] * d3_square * s1 * c2, q_dot[5] * d3_square * c1 * c2].map(scale)));
			ctx.strokeStyle = '#dddddd';
			drawVector(o, view([-g * cy, g * cx, 0].map(scale)));
			// console.log([-q_dot[3] * d1_square + q_dot[5] * d3_square * s2, q_dot[4] * d2_square * c1 + q_dot[5] * d3_square * s1 * c2, -q_dot[4] * d2_square * s1 + q_dot[5] * d3_square * c1 * c2]);
			// console.log([-g * cy, g * cx, 0]);
		})();
	}

	// x
	drawSpinningTop(2, 3, [width / 3 / 2 * 1, height / 2 + frameW / 2], _a3, _c);

	// y
	drawSpinningTop(-1, 3, [width / 3 / 2 * 3, height / 2 + frameW / 2], _a3, _c);

	// z
	drawSpinningTop(2, -1, [width / 3 / 2 * 5, height / 2], _a3, _c);
}