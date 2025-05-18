// 請使用ForwardEuler算法
// 製作類似 Lenia 那樣的連續型（非二元型）數位生命
const [width, height] = [50, 50];
const pixelPerCell = 20;

function qDraw(q, qi, x, y, w, h) {
	for (let r = 0; r < h; r++) {
		for (let c = 0; c < w; c++) {
			q[(y + r) * width + (x + c)] = qi[r * w + c];
		}
	}
}

var q0 = new Array(width * height).fill(0);
const x = 1;
// qDraw(q0, [
// 	0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
// 	0, 0, 0, x, x, x, x, 0, 0, 0,
// 	0, 0, x, 0, 0, 0, 0, x, 0, 0,
// 	0, x, 0, 0, 0, 0, 0, 0, x, 0,
// 	0, x, 0, 0, 0, 0, 0, 0, x, 0,
// 	0, x, 0, 0, 0, 0, 0, 0, x, 0,
// 	0, x, 0, 0, x, x, 0, 0, x, 0,
// 	0, 0, x, x, 0, 0, 0, x, 0, 0,
// 	0, 0, 0, x, 0, x, 0, 0, 0, 0,
// 	0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
// ], 20, 20, 10, 10);
// qDraw(q0, [
// 	0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
// 	0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
// 	0, 0, 0, 0, 0, x, x, 0, 0, 0,
// 	0, x, 0, 0, x, x, 0, x, 0, 0,
// 	0, 0, x, 0, x, 0, x, x, 0, 0,
// 	0, 0, 0, x, 0, x, x, 0, 0, 0,
// 	0, x, 0, x, x, 0, 0, 0, 0, 0,
// 	0, 0, 0, 0, 0, x, 0, 0, 0, 0,
// 	0, 0, 0, x, 0, 0, x, 0, 0, 0,
// 	0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
// ], 20, 20, 10, 10);
qDraw(q0, [
	0, 0, x, x, x, x, x, x, 0, 0,
	0, 0, 0, 0, x, x, 0, 0, 0, 0,
	0, x, x, x, x, x, x, x, x, 0,
	x, x, 0, 0, x, x, 0, 0, x, x,
	x, 0, 0, 0, x, x, 0, 0, 0, x,
	x, 0, 0, 0, x, x, 0, 0, 0, x,
	x, x, 0, 0, x, x, 0, 0, x, x,
	0, x, x, x, x, x, x, x, x, 0,
	0, 0, 0, 0, x, x, 0, 0, 0, 0,
	0, 0, x, x, x, x, x, x, 0, 0,
], 20, 20, 10, 10);
// qDraw(q0, new Array(100).fill(0).map(() => Math.random() > 0.2 ? Math.random() : 0), 80, 80, 10, 10);


// const rand = [Math.random(), Math.random()*2-1, Math.random()*2-1, Math.random()*2-1, Math.random()*2-1];
// rand[2] = -Math.sign(rand[1])*Math.abs(rand[2]);
// rand[4] = -Math.sign(rand[3])*Math.abs(rand[4]);
const rand = [0.8953968891837741, -0.443118229683624, 0.9921155837461171, 0.6493293245754268, -0.8058307666596711];
console.log(rand.join(', '));

function f(t, q) {
	let q_dot = new Array(width * height).fill(0);
	for (let r = 0; r < height; r++) {
		for (let c = 0; c < width; c++) {
			let index = r * width + c;
			let value = q[index];
			let neighborSum = [[-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1]]
				.map(([dr, dc]) =>
					r + dr < width && r + dr > 0 && c + dc < height && c + dc > 0 ?
						q[index + dr * width + dc] : 0
				)
				.reduce((s, n) => s + n);

			if (value > rand[0]) { // alive
				if (neighborSum < 2 || neighborSum > 3) {
					q_dot[index] = rand[1];
				} else {
					q_dot[index] = rand[2];
				}
			} else {
				if (neighborSum > 2 && neighborSum <= 3) {
					q_dot[index] = rand[3];
				} else {
					q_dot[index] = rand[4];
				}
			}
			if (value == 0 && q_dot[index] == -1) q_dot[index] = 0;
			if (value == 1 && q_dot[index] == 1) q_dot[index] = 0;
			if (value < 0) q_dot[index] = 1;
			if (value > 1) q_dot[index] = -1;
		}
	}
	return q_dot;
}

function render(cvs, ctx, t, q) {
	[cvs.width, cvs.height] = [width, height].map(n => n * pixelPerCell);
	ctx.fillStyle = 'black';
	ctx.fillRect(0, 0, cvs.width, cvs.height);

	ctx.fillStyle = 'white';
	for (let r = 0; r < height; r++) {
		for (let c = 0; c < width; c++) {
			let value = q[r * width + c];
			if (value !== 0) {
				ctx.fillStyle = `hsl(0deg, 0%, ${Math.min(Math.max(value, 0), 1) * 100}%)`;
				ctx.fillRect(c * pixelPerCell, r * pixelPerCell, pixelPerCell, pixelPerCell);
			}
		}
	}
}