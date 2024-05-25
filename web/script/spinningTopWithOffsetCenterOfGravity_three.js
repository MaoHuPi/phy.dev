// initial value

var q0 = [
	20 / 180 * Math.PI, // theta 1
	20 / 180 * Math.PI, // theta 2
	0, // theta 3
	0, // omega 1
	0, // omega 2
	2 * Math.PI * 10, // omega 3
	0.5 // ball's weight
];

// functional class

class Vector {
	static mul(s, v) {
		return v.map(n => s * n);
	}
	static add(a, b) {
		return a.map((n, i) => n + b[i]);
	}
	static dot(a, b) {
		return a.map((n, i) => n * b[i]).reduce((s, n) => s + n);
	}
	static crs(a, b) {
		return [
			a[1] * b[2] - a[2] * b[1],
			a[2] * b[0] - a[0] * b[2],
			a[0] * b[1] - a[1] * b[0]
		];
	}
	static len(v) {
		return Math.sqrt(v.map(n => n ** 2).reduce((s, n) => s + n));
	}
	static hat(v) {
		let len = this.len(v);
		return v.map(n => n / len);
	}
}
class Matrix {
	static det(matrix) {
		let dimension = matrix.length;
		let indexList = new Array(dimension).fill(0).map((_, i) => i);
		if (dimension == 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
		return [...indexList].map((_, i) => {
			let temp = matrix.map(row => [...row]);
			temp.splice(0, 1);
			temp.forEach(row => row.splice(i, 1));
			return (-1) ** i * matrix[0][i] * this.det(temp);
		}).reduce((s, n) => s + n);
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
	static pro(matrix1, matrix2) {
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

// system constance

const g = 9.8, mu_k = 0.8,
	m_shaft = 0.008, r_shaft = 0.2, h_shaft = 4.5,
	m_nib = 0.002, r_nib = r_shaft, h_nib = 0.5,
	m_ring = 0.015, r_ring = 2.5, h_ring = 2.5,
	h = 2.8, r_ball = 0.2;
const frameW = 1080,
	_scale = 1 / h_shaft * (frameW / 2);

// scene construct

const THREE = require['three'];
const { OrbitControls } = require['OrbitControls'];
const three_scene = new THREE.Scene();
three_scene.background = new THREE.Color(0xffc354);
three_scene.fog = new THREE.Fog(0x000000, 10, 40);

const three_camera = new THREE.PerspectiveCamera(45, 1 / 1, 0.000001, 100);
const three_renderer = new THREE.WebGLRenderer();
three_renderer.setSize(frameW, frameW);
three_renderer.setPixelRatio(1);
const three_cvs = three_renderer.domElement;
const three_controls = new OrbitControls(three_camera, three_cvs);

const three_object_list = [];

const three_nib = new THREE.Mesh(
	new THREE.CylinderGeometry(r_shaft, r_shaft/2, h_nib, 20),
	new THREE.MeshBasicMaterial({ color: new THREE.Color(0x000000), depthTest: false })
);
three_scene.add(three_nib);
three_object_list.push(three_nib);

const three_shaft = new THREE.Mesh(
	new THREE.CylinderGeometry(r_shaft, r_shaft, h_shaft, 20),
	new THREE.MeshBasicMaterial({ color: new THREE.Color(0x795548), depthTest: false })
);
three_scene.add(three_shaft);
three_object_list.push(three_shaft);

const three_ring = new THREE.Mesh(
	new THREE.CylinderGeometry(r_ring, r_ring, h_ring, 20),
	new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff9800), transparent: true, opacity: 0.5, depthTest: false })
);
three_scene.add(three_ring);
three_object_list.push(three_ring);

const three_ball = new THREE.Mesh(
	new THREE.SphereGeometry(r_ball, 20, 20),
	new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff0000), depthTest: false })
);
three_scene.add(three_ball);
three_object_list.push(three_ball);

const three_line = new THREE.Mesh(
	new THREE.CylinderGeometry(r_shaft / 4, r_shaft / 4, r_ring - r_shaft * 2, 20),
	new THREE.MeshBasicMaterial({ color: new THREE.Color(0x000000), transparent: true, opacity: 0.95, depthTest: false })
);
three_scene.add(three_line);
three_object_list.push(three_line);
const line_rotation_matrix = new THREE.Matrix4();
line_rotation_matrix.set(
	1, 0, 0, 0,
	0, 0, -1, 0,
	0, 1, 0, 0,
	0, 0, 0, 1
);
three_line.applyMatrix4(line_rotation_matrix);

// main method

function f(t, q) {
	// ref:
	// https://zh.wikipedia.org/zh-tw/%E8%BD%89%E5%8B%95%E6%85%A3%E9%87%8F%E5%88%97%E8%A1%A8
	// https://www.youtube.com/watch?v=CUDG3Ji5m10&list=PLL6Pqqra_R77Eb-Q5_v9CcBWxsPuNV-IN&index=11
	// https://www.sec.ntnu.edu.tw/uploads/asset/data/62564165381784d09345bea8/35-44.PDF
	// https://zh.wikipedia.org/zh-tw/%E7%AD%89%E6%95%88%E4%BD%8D%E8%83%BD

	// argument process
	let m_ball = 0.001 * q[6],
		d = (0 * 0.02438 + 0.5 * (0.001 * q[6])) / (0.02438 + (0.001 * q[6])),
		m_total = m_nib + m_shaft + m_ring + m_ball;
	let [s1, c1, s2, c2, s3, c3] = [Math.sin(q[0]), Math.cos(q[0]), Math.sin(q[1]), Math.cos(q[1]), Math.sin(q[2]), Math.cos(q[2])];

	// I
	let [I_xx_bar, I_yy_bar, I_zz_bar, I_xz_bar] = [
		(1 / 6) * m_nib * (r_shaft ** 2 + 3 * h_nib ** 2) + (1 / 12) * m_shaft * (h_shaft ** 2 + 3 * r_shaft ** 2) + m_shaft * (h_nib + (1 / 2) * h_shaft) ** 2 + (1 / 12) * m_ring * (h_ring ** 2 + 3 * r_ring ** 2) + m_ring * h ** 2 + (2 / 5) * m_ball * r_ball ** 2 + m_ball * h ** 2,
		(1 / 6) * m_nib * (r_shaft ** 2 + 3 * h_nib ** 2) + (1 / 12) * m_shaft * (h_shaft ** 2 + 3 * r_shaft ** 2) + m_shaft * (h_nib + (1 / 2) * h_shaft) ** 2 + (1 / 12) * m_ring * (h_ring ** 2 + 3 * r_ring ** 2) + m_ring * h ** 2 + (2 / 5) * m_ball * r_ball ** 2 + m_ball * (d ** 2 + h ** 2),
		(1 / 3) * m_nib * r_shaft ** 2 + (1 / 2) * m_shaft * r_shaft ** 2 + (1 / 2) * m_ring * r_ring ** 2 + (2 / 5) * m_ball * r_ball ** 2 + m_ball * d ** 2,
		-m_ball * d * h
	];
	let theta_bar = Math.atan2(-2 * I_xz_bar / Math.sqrt((I_xx_bar - I_zz_bar) ** 2 + (2 * I_xz_bar) ** 2), (I_xx_bar - I_zz_bar) / Math.sqrt((I_xx_bar - I_zz_bar) ** 2 + (2 * I_xz_bar) ** 2)) / 2;
	let [s_bar, c_bar] = [Math.sin(theta_bar), Math.cos(theta_bar)];
	let [I_xx, I_yy, I_zz] = [
		I_xx_bar * c_bar ** 2 + I_zz_bar * s_bar ** 2 - I_xz_bar * Math.sin(2 * theta_bar),
		I_yy_bar,
		I_xx_bar * s_bar ** 2 + I_zz_bar * c_bar ** 2 + I_xz_bar * Math.sin(2 * theta_bar)
	];

	// torque_mg
	let [cm_total_x, cm_total_z] = [
		m_ball / m_total * c_bar - ((2 / 3) * m_nib * h_nib + m_shaft * (h_nib + (1 / 2) * h_shaft) + h * (m_ring + m_ball)) / m_total * s_bar,
		m_ball / m_total * s_bar + ((2 / 3) * m_nib * h_nib + m_shaft * (h_nib + (1 / 2) * h_shaft) + h * (m_ring + m_ball)) / m_total * c_bar,
	]
	let torque_mg = [-s2 * c3 * cm_total_z, s2 * s3 * cm_total_z - c2 * cm_total_x, s2 * c3 * cm_total_x].map(n => n * -m_total * g);

	// torque_fk
	let z_axis = [s2 * s3, s2 * c3, c2], z_bar_axis = [-s_bar, 0, c_bar];
	let c_z = -s2 * s3 * s_bar + c2 * c_bar;
	let r_tdp = Vector.add(
		z_bar_axis.map(n => n * (r_shaft ** 2 / (4 * h_nib) * (1 / c_z ** 2 - 1))),
		Vector.crs(z_bar_axis, Vector.crs(z_bar_axis, z_axis)).map(n => n * (r_shaft ** 2 / (2 * h_nib) * (Math.sqrt(1 - c_z ** 2) / c_z)))
	)
	let omega = [q[3] * s3 * s2 + q[4] * c3, q[3] * c3 * s2 - q[4] * s3, q[3] * c2 + q[5]];
	let v_tdp = Vector.crs(omega, r_tdp);
	let f_k = Vector.mul(-mu_k * m_total * g, Vector.hat(Vector.add(v_tdp, Vector.mul(-Vector.dot(v_tdp, z_axis), z_axis))));
	let torque_fk = Vector.crs(r_tdp, f_k);
	if (Math.acos(c_z) > Math.PI / 2 - Math.atan(r_ring / (h - h_ring / 2))) return new Array(7).fill(0);

	// torque_fk_i
	let f_k_i = Vector.mul(-1, f_k);
	let torque_fk_i = Vector.crs([cm_total_x, 0, cm_total_z], f_k_i);

	// tempAlpha
	let torque = Vector.add(Vector.add(torque_mg, torque_fk), torque_fk_i);
	let tempAlpha = [
		torque[0] / I_xx - q[3] * (q[5] * c3 * s2 + q[4] * s3 * c2) + q[4] * q[5] * s3,
		torque[1] / I_yy + q[3] * (q[5] * s3 * s2 - q[4] * c3 * c2) + q[4] * q[5] * c3,
		torque[2] / I_zz + q[3] * q[4] * s2
	];

	// dot
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
	// argument process
	let m_ball = 0.001 * q[6],
		d = (0 * 0.02438 + 0.5 * (0.001 * q[6])) / (0.02438 + (0.001 * q[6])),
		m_total = m_nib + m_shaft + m_ring + m_ball;
	let [s1, c1, s2, c2, s3, c3] = [Math.sin(q[0]), Math.cos(q[0]), Math.sin(q[1]), Math.cos(q[1]), Math.sin(q[2]), Math.cos(q[2])];

	// canvas init
	let [width, height] = [frameW * 3, frameW];
	[cvs.width, cvs.height] = [width, height];
	ctx.fillStyle = 'black';
	ctx.fillRect(0, 0, width, height);

	// theta_bar
	let [I_xx_bar, I_yy_bar, I_zz_bar, I_xz_bar] = [
		(1 / 6) * m_nib * (r_shaft ** 2 + 3 * h_nib ** 2) + (1 / 12) * m_shaft * (h_shaft ** 2 + 3 * r_shaft ** 2) + m_shaft * (h_nib + (1 / 2) * h_shaft) ** 2 + (1 / 12) * m_ring * (h_ring ** 2 + 3 * r_ring ** 2) + m_ring * h ** 2 + (2 / 5) * m_ball * r_ball ** 2 + m_ball * h ** 2,
		(1 / 6) * m_nib * (r_shaft ** 2 + 3 * h_nib ** 2) + (1 / 12) * m_shaft * (h_shaft ** 2 + 3 * r_shaft ** 2) + m_shaft * (h_nib + (1 / 2) * h_shaft) ** 2 + (1 / 12) * m_ring * (h_ring ** 2 + 3 * r_ring ** 2) + m_ring * h ** 2 + (2 / 5) * m_ball * r_ball ** 2 + m_ball * (d ** 2 + h ** 2),
		(1 / 3) * m_nib * r_shaft ** 2 + (1 / 2) * m_shaft * r_shaft ** 2 + (1 / 2) * m_ring * r_ring ** 2 + (2 / 5) * m_ball * r_ball ** 2 + m_ball * d ** 2,
		-m_ball * d * h
	];
	let theta_bar = Math.atan2(-2 * I_xz_bar / Math.sqrt((I_xx_bar - I_zz_bar) ** 2 + (2 * I_xz_bar) ** 2), (I_xx_bar - I_zz_bar) / Math.sqrt((I_xx_bar - I_zz_bar) ** 2 + (2 * I_xz_bar) ** 2)) / 2;
	let [s_bar, c_bar] = [Math.sin(theta_bar), Math.cos(theta_bar)];
	let bar2rot = [
		[c_bar, 0, -s_bar],
		[0, 1, 0],
		[s_bar, 0, c_bar]
	];

	// rotate matrix
	let rot2fixed = [
		[c1 * c3 - s1 * c2 * s3, -c1 * s3 - s1 * c2 * c3, s1 * s2],
		[s1 * c3 + c1 * c2 * s3, -s1 * s3 + c1 * c2 * c3, -c1 * s2],
		[s2 * s3, s2 * c3, c2]
	];
	let bar2fixed = Matrix.pro(rot2fixed, bar2rot);
	let three_rotate = [
		[bar2fixed[1][1], bar2fixed[1][2], bar2fixed[1][0], 0],
		[bar2fixed[2][1], bar2fixed[2][2], bar2fixed[2][0], 0],
		[bar2fixed[0][1], bar2fixed[0][2], bar2fixed[0][0], 0],
		[0, 0, 0, 1]
	], three_rotate_inv = Matrix.inv(three_rotate);
	let three_rotateMatrix = new THREE.Matrix4();
	three_rotateMatrix.set(...three_rotate.flat());
	let three_rotateMatrix_inv = new THREE.Matrix4();
	three_rotateMatrix_inv.set(...three_rotate_inv.flat());

	let object_position_list = [
		[0, 0, (1 / 2) * h_nib],
		[0, 0, h_nib + (1 / 2) * h_shaft],
		[0, 0, h],
		[d, 0, h],
		[r_ring / 2, 0, h]
	].map(v => Matrix.pro(bar2fixed, v.map(n => [n])).map(([n]) => n));

	function drawSpinningTop(axis, o) {
		switch (axis) {
			case 'x':
				three_camera.position.set(0, 2, 20);
				three_camera.lookAt(0, 2, 0);
				break;
			case 'y':
				three_camera.position.set(20, 2, 0);
				three_camera.lookAt(0, 2, 0);
				break;
			case 'z':
				three_camera.position.set(0, 20, 0);
				three_camera.lookAt(0, 0, 0);
				break;
		}
		three_object_list.map((object, i) => {
			object.applyMatrix4(three_rotateMatrix);
			let pos = object_position_list[i];
			object.position.set(pos[1], pos[2], pos[0]);
		});
		three_renderer.render(three_scene, three_camera);
		ctx.drawImage(three_cvs, ...o);
		three_object_list.map((object, i) => {
			object.position.set(0, 0, 0);
			object.applyMatrix4(three_rotateMatrix_inv);
		});
	}

	drawSpinningTop('x', [width / 3 * 0, 0]);
	drawSpinningTop('y', [width / 3 * 1, 0]);
	drawSpinningTop('z', [width / 3 * 2, 0]);
}