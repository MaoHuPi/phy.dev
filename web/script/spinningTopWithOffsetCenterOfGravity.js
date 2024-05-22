var q0 = [
	20 / 180 * Math.PI, // theta 1
	20 / 180 * Math.PI, // theta 2
	// 0,
	// 0,
	0, // theta 3
	0, // omega 1
	0, // omega 2
	2 * Math.PI * 2, // omega 3
	// 0.44 // add on's weight
	0
];

function f(t, q) {
	// console.log(q);
	const g = 9.8,
		m_shaft = 0.01, r_shaft = 0.2, h_shaft = 5,
		m_ring = 0.015, r_ring = 2.5, h_ring = 2.5,
		m_add = 0.001 * q[6], r_add = 0.2,
		h = 1.5, d = (0 * 0.02438 + 0.5 * (0.001 * q[6])) / (0.02438 + (0.001 * q[6]));
	// const g = 9.8, d = (0 * 0.02438 + 0.5 * 0.001 * q[6]) / (0.02438 + 0.001 * q[6]), h = 2;
	let [s1, c1, s2, c2, s3, c3] = [Math.sin(q[0]), Math.cos(q[0]), Math.sin(q[1]), Math.cos(q[1]), Math.sin(q[2]), Math.cos(q[2])];

	// https://zh.wikipedia.org/zh-tw/%E8%BD%89%E5%8B%95%E6%85%A3%E9%87%8F%E5%88%97%E8%A1%A8
	// https://www.youtube.com/watch?v=CUDG3Ji5m10&list=PLL6Pqqra_R77Eb-Q5_v9CcBWxsPuNV-IN&index=11
	// https://www.sec.ntnu.edu.tw/uploads/asset/data/62564165381784d09345bea8/35-44.PDF
	// https://zh.wikipedia.org/zh-tw/%E7%AD%89%E6%95%88%E4%BD%8D%E8%83%BD
	let [I_xx, I_yy, I_zz] = [
		(1 / 12) * m_shaft * (3 * r_shaft ** 2 + h_shaft ** 2) + m_shaft * ((1 / 2) * h_shaft) ** 2
		+ (1 / 12) * m_ring * (3 * (r_shaft ** 2 + r_ring ** 2) + h_ring ** 2) + m_ring * h ** 2
		+ (2 / 5) * m_add * r_add ** 2 + m_add * h ** 2,
		(1 / 12) * m_shaft * (3 * r_shaft ** 2 + h_shaft ** 2) + m_shaft * ((1 / 2) * h_shaft) ** 2
		+ (1 / 12) * m_ring * (3 * (r_shaft ** 2 + r_ring ** 2) + h_ring ** 2) + m_ring * h ** 2
		+ (2 / 5) * m_add * r_add ** 2 + m_add * (h ** 2 + d ** 2),
		(1 / 2) * m_shaft * r_shaft ** 2
		+ (1 / 2) * m_ring * (r_shaft ** 2 + r_ring ** 2)
		+ (2 / 5) * m_add * r_add ** 2 + m_add * d ** 2,
	];

	// * must change
	// let m_total = m_shaft + m_ring + m_add;
	let c_z_temp = (1 / 2) * h_shaft * m_shaft + h * (m_ring + m_add);
	// let torque_mg = [m_total * g * h * c3 * s2, m_total * g * (-h * s3 * s2 + d * c2), -m_total * g * d * c3 * s2];
	let torque_mg = [-c_z_temp * g * s2 * c3, -c_z_temp * g * s2 * s3 + m_add * d * g * c2, m_add * d * g * s2 * c3];
	let torque = torque_mg;
	let tempAlpha = [
		torque[0] / I_xx - q[3] * (q[5] * c3 * s2 + q[4] * s3 * c2) + q[4] * q[5] * s3,
		torque[1] / I_yy + q[3] * (q[5] * s3 * s2 - q[4] * c3 * c2) + q[4] * q[5] * c3,
		torque[2] / I_zz + q[3] * q[4] * s2
	];

	let q_dot = [];
	q_dot[0] = q[3];
	q_dot[1] = q[4];
	q_dot[2] = q[5];
	q_dot[4] = (tempAlpha[0] - s3 * tempAlpha[1] / c3) / (c3 + s3 ** 2 / c3);
	q_dot[3] = (tempAlpha[1] + q_dot[4] * s3) / c2;
	q_dot[5] = tempAlpha[2] - q_dot[3] * c2;
	q_dot[6] = 0;
	return q_dot;
}

function render(cvs, ctx, t, q) {
	const g = 9.8,
		m_shaft = 0.01, r_shaft = 0.2, h_shaft = 5,
		m_ring = 0.015, r_ring = 2.5, h_ring = 2.5,
		m_add = 0.001 * q[6], r_add = 0.2,
		h = 1.5, d = (0 * 0.02438 + 0.5 * (0.001 * q[6])) / (0.02438 + (0.001 * q[6]));
	// const g = 9.8, d = (0 * 0.02438 + 0.5 * 0.001 * q[6]) / (0.02438 + 0.001 * q[6]), h = 2;

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

	let [width, height] = [1080 * 3, 1080];
	[cvs.width, cvs.height] = [width, height];
	ctx.fillStyle = 'black';
	ctx.fillRect(0, 0, width, height);

	let frameW = 1000;
	let _scale = 1 / h_shaft * (frameW / 2);
	let _d = d * _scale;
	let [s1, c1, s2, c2, s3, c3] = [Math.sin(q[0]), Math.cos(q[0]), Math.sin(q[1]), Math.cos(q[1]), Math.sin(q[2]), Math.cos(q[2])];

	let rot2fixed = [
		[c1 * c3 - s1 * c2 * s3, -c1 * s3 - s1 * c2 * c3, s1 * s2],
		[s1 * c3 + c1 * c2 * s3, -s1 * s3 + c1 * c2 * c3, -c1 * s2],
		[s2 * s3, s2 * c3, c2]
	];

	let shaft = Matrix.product(rot2fixed, [[0], [0], [h_shaft]]).map(([n]) => n).map(n => n * _scale);
	let m_ring_i = [
		[r_ring, 0, h],
		[0, r_ring, h],
		[-r_ring, 0, h],
		[0, -r_ring, h],
	].map(v => Matrix.product(rot2fixed, v.map(n => [n])).map(([n]) => n * _scale));
	let add = Matrix.product(rot2fixed, [d, 0, h].map(n => [n])).map(([n]) => n * _scale);

	function drawSpinningTop(axis1, axis2, o) {
		function view(point) {
			return [Math.sign(axis1) * point[Math.abs(axis1) - 1], Math.sign(axis2) * point[Math.abs(axis2) - 1]];
		}
		function drawVector(start, delta) {
			ctx.beginPath();
			ctx.moveTo(...start);
			ctx.lineTo(start[0] + delta[0], start[1] - delta[1]);
			ctx.closePath();
			ctx.stroke();
		}

		ctx.fillStyle = 'white';
		ctx.lineWidth = 5;

		_shaft = view(shaft);
		ctx.strokeStyle = 'white';
		drawVector(o, _shaft);

		_add = view(add);
		ctx.strokeStyle = 'pink';
		drawVector(o, _add);

		_m_ring_i = m_ring_i.map(n => view(n).map((n, i) => o[i] + (-1) ** i * n));
		ctx.strokeStyle = 'skyblue';
		ctx.beginPath();
		ctx.moveTo(..._m_ring_i[0]);
		ctx.lineTo(..._m_ring_i[1]);
		ctx.lineTo(..._m_ring_i[2]);
		ctx.lineTo(..._m_ring_i[3]);
		ctx.lineTo(..._m_ring_i[0]);
		ctx.closePath();
		ctx.stroke();

		// ctx.beginPath();
		// ctx.arc(o[0] + c[0], o[1] - c[1], 10, 0, Math.PI * 2);
		// ctx.closePath();
		// ctx.fill();
	}

	// x
	drawSpinningTop(2, 3, [width / 3 / 2 * 1, height / 2 + frameW / 2]);

	// y
	drawSpinningTop(-1, 3, [width / 3 / 2 * 3, height / 2 + frameW / 2]);

	// z
	drawSpinningTop(2, -1, [width / 3 / 2 * 5, height / 2]);
}