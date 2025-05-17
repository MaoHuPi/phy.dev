const keys = ['x', 'y', 'z', 'dx', 'dy', 'dz'];
const radius = 0.2;
const influence = 0.9;
const frameW = 1080;
function getP(q, n) {
	return Object.fromEntries(keys.map((key, idx) => [key, q[n * keys.length + idx]]));
}
function setP(q_dot, n, data) {
	keys.map((key, idx) => {
		q_dot[n * keys.length + idx] = data[key];
	});
}
function distance(pA, pB) {
	return Math.sqrt((pA.x - pB.x) ** 2 + (pA.y - pB.y) ** 2 + (pA.z - pB.z) ** 2);
}
function randomP(boxWidth) {
	return [
		(Math.random() - 0.5) * boxWidth,
		(Math.random() - 0.5) * boxWidth,
		(Math.random() - 0.5) * boxWidth,
		(Math.random() - 0.5),
		(Math.random() - 0.5),
		(Math.random() - 0.5),
	];
}

const boxWidth = 50;
// var q0 = [
// 	// ...[radius * 2, 0, 0, 1, 0, 0],
// 	...[-radius * 2, 0, 0, 1, 0, 0],
// 	...[0, radius * 2, 0, 1, 0, 0],
// 	...[0, -radius * 2, 0, 1, 0, 0],
// 	...[0, 0, radius * 2, 1, 0, 0],
// 	...[0, 0, -radius * 2, 1, 0, 0],

// 	...[radius * 12, 0, 0, 1, 0, 0],
// 	// ...[radius * 10, radius * 2, 0, 0, 1, 0],
// 	...[radius * 10, -radius * 2, 0, 1, 0, 0],
// 	...[radius * 10, 0, radius * 2, 1, , 0],
// 	...[radius * 10, 0, -radius * 2, 1, , 0],

// 	...[radius * 2, 0, 0, -1, 0, 0],
// ];
// var q0 = [
// 	...[radius * 2, 0, 0, 1, 0, 0],
// 	...[-radius * 2, 0, 0, -1, 0, 0],
// 	...[0, radius * 2, 0, 0, 1, 0],
// 	...[0, -radius * 2, 0, 0, -1, 0],
// 	...[0, 0, radius * 2, 0, 0, 1],
// 	...[0, 0, -radius * 2, 0, 0, -1],
// 	// ...[0, 0, 0, 1, 1, 1],
// ];
var q0 = new Array(100).fill(0).map(() => randomP(radius * boxWidth)).flat();
const pNum = Math.floor(q0.length / keys.length);

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

const THREE = phydev.require('three');
const { OrbitControls } = phydev.require('OrbitControls');
const three_scene = new THREE.Scene();
three_scene.background = new THREE.Color(0x000000);
three_scene.fog = new THREE.Fog(0x000000, 10, 40);

const three_camera = new THREE.PerspectiveCamera(45, 1 / 1, 0.000001, 100);
const three_renderer = new THREE.WebGLRenderer();
three_renderer.setSize(frameW, frameW);
three_renderer.setPixelRatio(1);
const three_cvs = three_renderer.domElement;
const three_controls = new OrbitControls(three_camera, three_cvs);
three_camera.position.set(0, 0, 20);
three_camera.lookAt(0, 0, 0);
const three_light = new THREE.Light(0xffffff, radius * 100);
three_light.position.set(0, 0, 0);
three_scene.add(three_light);

const three_object_list = [];

for (let i = 0; i < pNum; i++) {
	const three_group = new THREE.Group();

	const three_ball = new THREE.Mesh(
		new THREE.SphereGeometry(radius, 20, 20),
		new THREE.MeshBasicMaterial({ color: new THREE.Color(0x87ceeb), transparent: true, opacity: 0.5, depthTest: true })
		// new THREE.MeshBasicMaterial({ color: new THREE.Color(0x87ceeb), depthTest: true })
	);
	three_group.add(three_ball);

	const three_line = new THREE.Mesh(
		new THREE.CylinderGeometry(radius / 50, radius / 50, radius, 20),
		new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffffff), transparent: false, depthTest: true })
	);
	three_line.position.set(0, radius / 2, 0);
	three_group.add(three_line);

	three_scene.add(three_group);
	three_object_list.push(three_group);
}

function f(t, q) {
	// console.log(q);
	const q_dot = [];
	// const pNum = Math.floor(q.length / keys.length);

	const K = 10;
	for (let i = 0; i < pNum; i++) {
		const pI = getP(q, i);
		const rotate = { dx: 0, dy: 0, dz: 0 };
		const translate = { x: 0, y: 0, z: 0 };
		for (let j = 0; j < pNum; j++) {
			if (i == j) continue;
			const pJ = getP(q, j);
			const d = distance(pI, pJ);
			const rate = radius * 2 / d;
			Object.keys(rotate).forEach(key => {
				rotate[key] += (pJ[key] - pI[key]) * rate;
			});

			let vD = ['x', 'y', 'z'].map(key => pJ[key] - pI[key]);
			if (d >= radius * 2) {
				const pID = ['dx', 'dy', 'dz'].map(key => pI[key]);
				const pJD = ['dx', 'dy', 'dz'].map(key => pJ[key]);
				vD = Vector.mul(K * Vector.dot(pID, pJD) / (Vector.len(pID) * Vector.len(pJD)) / (d ** 2), vD);
				['x', 'y', 'z'].map((key, i) => {
					translate[key] += vD[i];
				});
			} else {
				['x', 'y', 'z'].map((key, i) => {
					translate[key] -= (vD[i] / d * rate) * 0.1;
				});
			}
		}
		setP(q_dot, i, {
			...translate,
			...Object.fromEntries(
				Object.keys(rotate)
					.map(key => [key, rotate[key] * influence])
			),
		});
	}

	return q_dot;
}

function render(cvs, ctx, t, q) {
	// const pNum = Math.floor(q.length / keys.length);

	// canvas init
	let [width, height] = [frameW, frameW];
	[cvs.width, cvs.height] = [width, height];
	ctx.fillStyle = 'black';
	ctx.fillRect(0, 0, width, height);

	const x = 1 / Math.SQRT2;
	for (let i = 0; i < pNum; i++) {
		const pI = getP(q, i);
		const obj = three_object_list[i];
		obj.position.set(pI.x, pI.y, pI.z);
		obj.lookAt(pI.x + pI.dx, pI.y + pI.dy, pI.z + pI.dz);
	}

	three_renderer.render(three_scene, three_camera);
	ctx.drawImage(three_cvs, 0, 0);
}