var q0 = [
	5 / 180 * Math.PI, // theta 1
	5 / 180 * Math.PI, // theta 2
	0, // theta 3
	0, // omega 1
	0, // omega 2
	2 * Math.PI * 100, // omega 3
];

function f(t, q) {
	const g = 9.81; // 重力加速度
	const h = 2; // 陀螺重心高度 (m)
	const d = 0.0001; // 陀螺重心與旋轉軸的距離 (m)
	const R_c = 0.03; // 圓柱體半徑 (m)
	const L_c = 0.1; // 圓柱體高度 (m)
	const M_c = 0.4; // 圓柱體質量 (kg)
	const R_s = 0.02; // 球體半徑 (m)
	const M_s = 100; // 球體質量 (kg)
	const theta_1 = q[0]; // 歐拉角方位角 (rad)
	const theta_2 = q[1]; // 歐拉角極角 (rad)
	const theta_3 = q[2]; // 自轉角 (rad)
	const theta_1_dot = q[3]; // 歐拉角方位角速度 (rad/s)
	const theta_2_dot = q[4]; // 歐拉角極角速度 (rad/s)
	const theta_3_dot = q[5]; // 自轉角速度 (rad/s)
	const k_f = 0.001; // 摩擦力係數
	const k_a = 0.0001; // 空氣阻力係數

	const criticalAngle = Math.PI / 2;

	// 檢查陀螺是否倒下
	if (Math.abs(theta_2) >= criticalAngle) {
		return [0, 0, 0, 0, 0, 0];
	}

	// 圓柱體的轉動慣量
	const I_3c = 0.5 * M_c * Math.pow(R_c, 2);
	const I_1c = (0.25 * M_c * Math.pow(R_c, 2)) + (1 / 12 * M_c * Math.pow(L_c, 2));
	const I_2c = I_1c;

	// 球體的轉動慣量
	const I_s = (2 / 5) * M_s * Math.pow(R_s, 2);
	const I_1s = I_s + M_s * Math.pow(d, 2);
	const I_2s = I_1s;
	const I_3s = I_s;

	// 總轉動慣量
	const I1 = I_1c + I_1s;
	const I2 = I_2c + I_2s;
	const I3 = I_3c + I_3s;

	// 質心位置
	const x_c = d * Math.sin(theta_2) * Math.cos(theta_3);
	const y_c = d * Math.sin(theta_2) * Math.sin(theta_3);
	const z_c = h + d * Math.cos(theta_2);

	// 重力向量
	const Fz = -(M_c + M_s) * g; // 重力只在z方向上有分量

	// 重力矩（由質心提供）
	const torque_gravity_x = y_c * Fz;
	const torque_gravity_y = -x_c * Fz;
	const torque_gravity_z = 0; // 假設沒有其他方向的力矩

	// 摩擦力矩和空氣阻力矩
	const torque_friction_1 = -k_f * theta_1_dot;
	const torque_friction_2 = -k_f * theta_2_dot;
	const torque_friction_3 = -k_f * theta_3_dot;

	const torque_air_1 = -k_a * theta_1_dot;
	const torque_air_2 = -k_a * theta_2_dot;
	const torque_air_3 = -k_a * theta_3_dot;

	// 使用歐拉方程計算角加速度
	const theta_1_doubledot = ((I2 - I3) * theta_2_dot * theta_3_dot + torque_gravity_x + torque_friction_1 + torque_air_1) / I1;
	const theta_2_doubledot = ((I3 - I1) * theta_3_dot * theta_1_dot + torque_gravity_y + torque_friction_2 + torque_air_2) / I2;
	const theta_3_doubledot = ((I1 - I2) * theta_1_dot * theta_2_dot + torque_gravity_z + torque_friction_3 + torque_air_3) / I3;

	return [q[3], q[4], q[5], theta_1_doubledot, theta_2_doubledot, theta_3_doubledot];
}

function render(cvs, ctx, t, q) {
	const g = 9.81; // 重力加速度
	const h = 0.1; // 陀螺重心高度 (m)
	const d = 0.05; // 陀螺重心與旋轉軸的距離 (m)
	const R_c = 0.03; // 圓柱體半徑 (m)
	const L_c = 0.1; // 圓柱體高度 (m)
	const M_c = 0.4; // 圓柱體質量 (kg)
	const R_s = 0.02; // 球體半徑 (m)
	const M_s = 0.1; // 球體質量 (kg)
	const theta_1 = q[0]; // 歐拉角方位角 (rad)
	const theta_2 = q[1]; // 歐拉角極角 (rad)
	const theta_3 = q[2]; // 自轉角 (rad)
	const theta_1_dot = q[3]; // 歐拉角方位角速度 (rad/s)
	const theta_2_dot = q[4]; // 歐拉角極角速度 (rad/s)
	const theta_3_dot = q[5]; // 自轉角速度 (rad/s)
	const k_f = 0.01; // 摩擦力係數
	const k_a = 0.01; // 空氣阻力係數

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
	}

	const R1 = [
		[Math.cos(q[0]), -Math.sin(q[0]), 0],
		[Math.sin(q[0]), Math.cos(q[0]), 0],
		[0, 0, 1]
	];

	const R2 = [
		[1, 0, 0],
		[0, Math.cos(q[1]), -Math.sin(q[1])],
		[0, Math.sin(q[1]), Math.cos(q[1])]
	];

	const R3 = [
		[Math.cos(q[2]), -Math.sin(q[2]), 0],
		[Math.sin(q[2]), Math.cos(q[2]), 0],
		[0, 0, 1]
	];

	// 先應用 R3，再應用 R2，最後應用 R1
	_a3 = mm(R1, mm(R2, mm(R3, [0, 0, h]))).map(n => n / h * _h);;
	_c = mm(R1, mm(R2, mm(R3, [d, 0, h]))).map(n => n / h * _h);;
	// console.log(_a3, _c);
	console.log(t);

	function mm(matrix, vector) {
		return [
			matrix[0][0] * vector[0] + matrix[0][1] * vector[1] + matrix[0][2] * vector[2],
			matrix[1][0] * vector[0] + matrix[1][1] * vector[1] + matrix[1][2] * vector[2],
			matrix[2][0] * vector[0] + matrix[2][1] * vector[1] + matrix[2][2] * vector[2]
		];
	}

	// x
	drawSpinningTop(2, 3, [width / 3 / 2 * 1, height / 2 + frameW / 2], _a3, _c);

	// y
	drawSpinningTop(-1, 3, [width / 3 / 2 * 3, height / 2 + frameW / 2], _a3, _c);

	// z
	drawSpinningTop(2, -1, [width / 3 / 2 * 5, height / 2], _a3, _c);
}