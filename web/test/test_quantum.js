const keys = ['x', 'y', 'z', 'r1', 'i1', 'r2', 'i2'];
const radius = 0.2;
const influence = 0.5;
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

var q0 = [
	...[0, 0, 0, 1, 0, 0, 0],
	...[radius, radius, radius, 1 / Math.SQRT2, 0, 1 / Math.SQRT2, 0],
];
const pNum = Math.floor(q0.length / keys.length);

const THREE = phydev.require('three');
const { OrbitControls } = phydev.require('OrbitControls');
const three_scene = new THREE.Scene();
three_scene.background = new THREE.Color(0xffc354);
three_scene.fog = new THREE.Fog(0x000000, 10, 40);

const three_camera = new THREE.PerspectiveCamera(45, 1 / 1, 0.000001, 100);
const three_renderer = new THREE.WebGLRenderer();
three_renderer.setSize(frameW, frameW);
three_renderer.setPixelRatio(1);
const three_cvs = three_renderer.domElement;
const three_controls = new OrbitControls(three_camera, three_cvs);
three_camera.position.set(0, 0, 20);
three_camera.lookAt(0, 0, 0);

const three_object_list = [];

for (let i = 0; i < pNum; i++) {
	const three_group = new THREE.Group();

	const three_ball = new THREE.Mesh(
		new THREE.SphereGeometry(radius, 20, 20),
		new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff0000), transparent: true, opacity: 0.5, depthTest: true })
	);
	three_group.add(three_ball);

	const three_line = new THREE.Mesh(
		new THREE.CylinderGeometry(radius / 50, radius / 50, radius, 20),
		new THREE.MeshBasicMaterial({ color: new THREE.Color(0x000000), transparent: false, depthTest: true })
	);
	three_line.position.set(0, radius / 2, 0);
	three_group.add(three_line);

	three_scene.add(three_group);
	three_object_list.push(three_group);
}

function f(t, q) {
	console.log(q);
	const q_dot = [];
	// const pNum = Math.floor(q.length / keys.length);

	for (let i = 0; i < pNum; i++) {
		const pI = getP(q, i);
		const newState = { r1: 0, i1: 0, r2: 0, i2: 0 };
		let stateLength = 0;
		for (let j = 0; j < pNum; j++) {
			if (i == j) continue;
			const pJ = getP(q, j);
			const d = distance(pI, pJ);
			const rate = radius * 2 / d;
			stateLength += rate;
			Object.keys(newState).forEach(key => {
				newState[key] = pJ[key] * rate;
			});
		}
		if (stateLength !== 0) {
			setP(q_dot, i, {
				x: 0,
				y: 0,
				z: 0,
				...Object.fromEntries(
					Object.keys(newState)
						.map(key => [key, (pI[key] * (1 - influence) + (newState[key] / stateLength) * influence) - pI[key]])
				),
			});
		}
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
		const v = ['r1', 'i1', 'r2', 'i2'].map(key => pI[key]);
		const weight = [
			[x, 0, x, 0], [x, 0, -x, 0],
			[1, 0, 0, 0], [0, 0, 1, 0],
			[x, 0, 0, -x], [x, 0, 0, x]
		].map(u => u.map((n, i) => n * v[i]).reduce((s, n) => s + n));
		const direction = [
			weight[0] - weight[1],
			weight[2] - weight[3],
			weight[4] - weight[5]
		]
		obj.lookAt(...direction.map((n, i) => n + pI['xyz'[i]]));
	}

	three_renderer.render(three_scene, three_camera);
	ctx.drawImage(three_cvs, 0, 0);
}