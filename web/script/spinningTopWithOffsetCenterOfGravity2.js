var q0 = [
	1 / 180 * Math.PI, // theta 1
	1 / 180 * Math.PI, // theta 2
	0, // theta 3
	0, // omega 1
	0, // omega 2
	2 * Math.PI * 8, // omega 3
];

function f(t, q) {
	class Matrix {
		static det(matrix) {
			let dimension = matrix.length;
			let indexList = new Array(dimension).fill(0).map((_, i) => i);
			if (dimension == 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
			return ([...indexList].map((_, i) => [...indexList].map((_, j) => matrix[(i + j) % dimension][j]).reduce((s, n) => s * n)).reduce((s, n) => s + n)
				- [...indexList].map((_, i) => [...indexList].map((_, j) => matrix[(dimension + i - j) % dimension][j]).reduce((s, n) => s * n)).reduce((s, n) => s + n));
		}
		static inv(matrix) {
			let dimension = matrix.length;
			let indexList = new Array(dimension).fill(0).map((_, i) => i);
			let _det = this.det(matrix);
			console.log(_det);
			return [...indexList].map((_, i) => [...indexList].map((_, j) => {
				let i_list = [...indexList], j_list = [...indexList];
				i_list.splice(j, 1);
				j_list.splice(i, 1);
				return ((i + j) % 2 == 0 ? 1 : -1) * this.det(i_list.map(i_index => j_list.map(j_index => matrix[i_index][j_index]))) / _det;
			}));
		}
		static product(matrix1, matrix2) {
			if (matrix1[0].length !== matrix2.length) return;
			let length = matrix2.length;
			let row = matrix1.length;
			let column = matrix2[0].length;
			return new Array(row).fill(0)
				.map((_, i) => new Array(column).fill(0)
					.map((_, j) => new Array(length).fill(0)
						.map((_, k) => matrix1[i][k] * matrix2[k][j]).reduce((s, n) => s + n)));
		}
	}

	const mu_k = 0.4, g = 9.8, d = (0 * 0.02438 + 0.5 * 0.00137) / (0.02438 + 0.00137), h = 2;
	let edge = Math.PI / 2;
	if (q[0] >= edge || q[0] <= -edge || q[1] >= edge || q[1] <= -edge) { return [0, 0, 0, 0, 0, 0]; }
	let q_dot = [0, 0, 0, 0, 0, 0];
	let [s1, c1, s2, c2, s3, c3] = [Math.sin(q[0]), Math.cos(q[0]), Math.sin(q[1]), Math.cos(q[1]), Math.sin(q[2]), Math.cos(q[2])];
	let [cx, cy, cz] = [d * c2 * c3 + h * s2, -d * s1 * s2 * c3 + d * c1 * s3 + h * s1 * c2, -d * c1 * s2 * c3 - d * s1 * s3 + h * c1 * c2];

	// 重力 => 力矩 => 總角加速度 => 分角加速度
	let tau_div_m = [-g * cy, g * cx, 0];
	let I_div_m = [
		[cy ** 2 + cz ** 2, -cx * cy, -cx * cz], 
		[-cy * cx, cx ** 2 + cz ** 2, -cy * cz], 
		[-cz * cx, -cz * cy, cx ** 2 + cy ** 2]
	];
	let I_div_m_inv = Matrix.inv(I_div_m);
	let alpha = Matrix.product(I_div_m_inv, tau_div_m.map(n => [n])).map(([n]) => n);
	[q_dot[3], q_dot[4], q_dot[5]] = alpha;

	// [
	// 	[-1, 0, s2],
	// 	[0, c1, s1 * c2],
	// 	[0, -s1, c1 * c2],
	// ]
	q_dot[2] = (q[4] + (q[5] * c1 / s1)) / (s1 * c2 + (c1 ** 2 * c2 / s1));
	q_dot[0] = q_dot[2] * s2 - q[3];
	q_dot[1] = (q_dot[2] * c1 * c2 - q[5]) / s1;

	console.table(I_div_m);
	console.table(I_div_m_inv);
	console.log('---');
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
			scale = n => n / h * _h * 0.05;
			ctx.strokeStyle = '#ff8888';
			drawVector(o, view([q[3], q[4], q[5]].map(scale)));
		})();
	}

	// x
	drawSpinningTop(2, 3, [width / 3 / 2 * 1, height / 2 + frameW / 2], _a3, _c);

	// y
	drawSpinningTop(-1, 3, [width / 3 / 2 * 3, height / 2 + frameW / 2], _a3, _c);

	// z
	drawSpinningTop(2, -1, [width / 3 / 2 * 5, height / 2], _a3, _c);
}