/* 
 * 2025 (c) MaoHuPi
 * 模擬自 分科週衝刺(物理) 第七回 第14題
 * 此檔案用以紀錄初始條件微小誤差所造成的臨界值發散問題，正確的模擬結果請見 example/adiabaticProcess.phy
 */

const [width, height] = [1080, 1080];

let R = 0.082,
	C_p = 5 / 2 * R,
	C_v = 3 / 2 * R,
	m = 0.3,
	n = 1,
	A = 1,
	L = 1,
	P_omega = 0 <= 10 ? 0.03 : 0;
let balanceT0 = (L / 2) * (L - L / 2) ** (-C_p / C_v); // 1.5874010519681996
/* x, x_dot, T_a */
var q0 = [0.5, 0, 1.5874010519681994/* a little bit smaller then balanceT0 */];
// var q0 = [0.5, 0, balanceT0];

function f(t, q) {
	let R = 0.082,
		C_p = 5 / 2 * R,
		C_v = 3 / 2 * R,
		m = 0.3,
		n = 1,
		A = 1,
		L = 1,
		P_omega = 0;

	let q_dot = [q[1], 0, 0];
	q_dot[1] = n * R / m * q[2] / q[0] - n * R / m * (L - q[0]) ** (-C_p / C_v) - q[1] * 0.0625441971 /* A mysterious number that keeps the system from crashing — but any number greater than it will cause a crash(diverge in a glance). */; // x double dot
	// q_dot[1] = n * R / m * q[2] / q[0] - n * R / m * (L - q[0]) ** (-C_p / C_v) - q[1] * 1; // x double dot
	q_dot[2] = P_omega / n / C_v - R / C_v * q[1] / q[0] * q[2]; // T_a dot

	return q_dot;
}

function heatToColor(heat, min, max) {
	let t = Math.min(Math.max((heat - min) / (max - min), 0), 1);
	let from = [0.44, -0.04, -0.12],
		to = [0.45, 0.15, 0.1];
	return `oklab(${from.map((n, i) => n + t * (to[i] - n)).join(' ')} / 0.5)`;
}

function render(cvs, ctx, t, q) {
	[cvs.width, cvs.height] = [width, height];
	ctx.fillStyle = 'black';
	ctx.fillRect(0, 0, cvs.width, cvs.height);

	let R = 0.082,
		C_p = 5 / 2 * R,
		C_v = 3 / 2 * R,
		m = 0.3,
		n = 1,
		A = 1,
		L = 1,
		P_omega = t <= 10 ? 0.03 : 0;

	ctx.font = '40px Courier New';
	ctx.textBaseline = 'middle';
	ctx.fillStyle = 'white';
	ctx.textAlign = 'left';
	// let text = [
	// 	't: ' + t,
	// 	'T_a: ' + q[2],
	// 	'T_b: ' + q[3],
	// 	'x: ' + q[0],
	// 	'E: ' + (n * C_v * (q[2] + q[3]) + 1 / 2 * m * q[1] ** 2).toString()
	// ];
	let text = q.map((n, i) => i + ': ' + n);
	text.map((row, i) => ctx.fillText(row, 150, 1080 - 100 - 40 * (text.length - i)));

	let boxWidth = 1080 / 2, boxHeight = 1080 / 3,
		boxLeft = 1080 / 4,
		boxTop = (100 + (1080 - 100 - 40 * text.length)) / 2 - boxHeight / 2,
		boardX = boxLeft + boxWidth * q[0] / L;
	ctx.lineWidth = 10;
	ctx.lineJoin = 'round';
	// container rooms
	ctx.fillStyle = heatToColor(q[2], 0, 5);
	ctx.fillRect(boxLeft, boxTop, boardX - boxLeft, boxHeight);
	ctx.fillStyle = heatToColor(q[3], 0, 5);
	ctx.fillRect(boardX, boxTop, boxLeft + boxWidth - boardX, boxHeight);
	// heating resistance
	let resistanceMargin = 25,
		resistanceLength = 200,
		resistanceTop = boxTop + boxHeight / 2 - resistanceLength / 2;
	ctx.strokeStyle = P_omega > 0 ? '#ff5722' : 'gray';
	ctx.beginPath();
	ctx.moveTo(boxLeft - resistanceMargin, resistanceTop);
	ctx.lineTo(boxLeft + resistanceMargin, resistanceTop);
	ctx.lineTo(boxLeft + resistanceMargin, resistanceTop + resistanceLength);
	ctx.lineTo(boxLeft - resistanceMargin, resistanceTop + resistanceLength);
	ctx.stroke();
	// box
	ctx.strokeStyle = '#be8f50';
	ctx.strokeRect(boxLeft, boxTop, boxWidth, boxHeight);
	// separation board
	ctx.strokeStyle = '#ffc354';
	ctx.beginPath();
	ctx.moveTo(boardX, boxTop + ctx.lineWidth / 2);
	ctx.lineTo(boardX, boxTop + boxHeight - ctx.lineWidth / 2);
	ctx.stroke();
	// label
	ctx.fillStyle = 'white';
	ctx.textAlign = 'center';
	ctx.fillText('a', (boxLeft + boardX) / 2, boxTop + boxHeight / 2);
	ctx.fillText('b', (boxLeft + boxWidth + boardX) / 2, boxTop + boxHeight / 2);
	// title
	ctx.fillStyle = 'gray';
	ctx.textAlign = 'center';
	ctx.fillText('模擬自 分科週衝刺(物理) 第七回 第14題', 1080 / 2, 100);
}
