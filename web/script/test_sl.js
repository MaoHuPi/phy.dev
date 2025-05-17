const [width, height] = [1000, 1000];
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
qDraw(q0, [
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, x, 0, x, 1, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
], 40, 40, 10, 10);
// qDraw(q0, new Array(100).fill(0).map(() => Math.random() > 0.2 ? Math.random() : 0), 80, 80, 10, 10);

const outerRange = new Array(25).fill(0).map((_, r) => new Array(25).fill(0).map((_, c) => [r-12, c-12])).flat().filter(([x, y]) => Math.sqrt(x**2 + y**2) <= 12);

function f(t, q) {
	let q_dot = new Array(width * height).fill(0);
	for (let r = 0; r < height; r++) {
		for (let c = 0; c < width; c++) {
			let index = r * width + c;
			let value = q[index];

			let kOuter = (outerRange
				.map(([dr, dc]) =>
					r + dr < width && r + dr > 0 && c + dc < height && c + dc > 0 ?
						q[index + dr * width + dc] : 0
				)
				.reduce((s, n) => s + n))/outerRange.length;
			let kInner = ([[-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1]]
				.map(([dr, dc]) =>
					r + dr < width && r + dr > 0 && c + dc < height && c + dc > 0 ?
						q[index + dr * width + dc] : 0
				)
				.reduce((s, n) => s + n) + value)/9;

			if (kInner >= 0.5) { // alive
				if (kOuter < 0.26 || kOuter > 0.46) {
					q_dot[index] = 0;
				} else {
					q_dot[index] = -1;
				}
			} else {
				if (kOuter < 0.27 || kOuter > 0.36) {
					q_dot[index] = 1;
				} else {
					q_dot[index] = 0;
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