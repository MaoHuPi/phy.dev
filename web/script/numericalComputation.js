function butcherTableau2code(name, type, butcherTableau) {
    // Argument:
    // name: string
    // type: ['explicit', 'embedded'];
    // butcherTableau: 2d array
    // 
    // References:
    // https://en.wikipedia.org/wiki/Runge%E2%80%93Kutta_methods
    // https://en.wikipedia.org/wiki/List_of_Runge%E2%80%93Kutta_methods
    let emb = type == 'embedded';
    let r = butcherTableau.length - ({ explicit: 1, embedded: 2 }[type]);
    return (`/*this code is generate from "butcherTableau2code", which was written by MaoHuPi*/
function ${name}(f/*f(x, y)*/, x0, x1/*end*/, y0, h0, epsilon, calcTimes = false) {
    function arrayScalar(n, array) { return array.map(m => n*m); }
    function arraySum(...arrayList) {
        return arrayList.reduce((s, array) => s.map((n, i) => n + array[i]));
    }
    function arrayNorm(type, array) {
        switch(type) {
            case 1:
                return array.map(n => Math.abs(n)).reduce((s, n) => s+n);
            case 2:
                return Math.sqrt(array.map(n => n**2).reduce((s, n) => s+n));
            case Infinity:
                return Math.max(...array.map(n => Math.abs(n)));
            case -Infinity:
                return Math.min(...array.map(n => Math.abs(n)));
        }
    }
    let [xList, yList] = [[], []];
    let [x, y] = [x0, y0];
    let h = h0;
    let calcCounter = 0;
    // let warningFlag = false;
    while (calcTimes !== false ? (calcCounter < calcTimes) : (x <= x1)) {
        let TE = epsilon + 1;
        let ${new Array(r).fill(0).map((_, i) => `k${i + 1}`).join(', ')};${emb ? `
        while (TE > epsilon) {` : ''}
        ${emb ? '    ' : ''}${new Array(r).fill(0).map((_, i) => `k${i + 1} = arrayScalar(h, f(x + ${butcherTableau[i][0]} * h, arraySum(${['y', ...new Array(i).fill(0).map((_, j) => `arrayScalar(${butcherTableau[i][j]}, k${j + 1})`)].join(', ')})));`).join('\n                ')}${emb ? `
            TE = arrayNorm(1, arraySum(${new Array(r).fill(0).map((_, i) => `arrayScalar(${butcherTableau[r][i + 1] - butcherTableau[r + 1][i + 1]}, k${i + 1})`).join(', ')}));
            if (TE === 0 || Number.isNaN(TE)) {
                TE = epsilon - (1e-16);
                // if(!warningFlag){
                //     console.warn(\`TE == \$\{TE\}\`);
                //     warningFlag = true;
                // }
            } else {
                h = (0.9 * h * (epsilon / TE) ** (1 / 5));
            }
        }` : ''}
        x = x + h;
        xList.push(x);
        y = arraySum(${['y', ...new Array(r).fill(0).map((_, i) => `arrayScalar(${butcherTableau[r][i + 1]}, k${i + 1})`)].join(', ')});
        yList.push(y);
        calcCounter++;
    }
    return {data: [xList, yList], h};
}`
    );
}

// eval(butcherTableau2code('RKF45', 'embedded', [
//     [0],
//     [1 / 4, 1 / 4],
//     [3 / 8, 3 / 32, 9 / 32],
//     [12 / 13, 1932 / 2197, -7200 / 2197],
//     [1, 439 / 216, -8, 3680 / 513, -845 / 4104],
//     [1 / 2, -8 / 27, 2, -3544 / 2565, 1859 / 4104, -11 / 40],
//     [, 16 / 135, 0, 6656 / 12825, 28561 / 56430, -9 / 50, 2 / 55],
//     [, 25 / 216, 0, 1408 / 2565, 2197 / 4104, -1 / 5, 0],
// ]));

// eval(butcherTableau2code('forwardEuler', 'explicit', [
//     [0],
//     [, 1]
// ]));

// let data = RKF45((t, q) => {
//     let g = 10, r = 1;
//     let q_dot = [];
//     q_dot[0] = Math.sqrt(Math.sqrt(3 * 10 * 1) ** 2 + 2 * g / r * (Math.sin(0) - Math.sin(q[0])));
//     return q_dot;
// }, 0, 1, [0], 0.001, 0.0001);
// let data = RKF45((t, q) => {
//     let q_dot = [];
//     q_dot[0] = 0.25 * q[0] * (1 - q[0] / 20);
//     return q_dot;
// }, 0, 10000, [1], 0.01, 0.001);
// data[1].map((array, i) => array.splice(0, 0, data[0][i]));
// data = data[1];
// data = data.map(row => row.join('\t')).join('\n');

const RKMethodDict = {
    'emb_RKF45': {
        type: 'embedded',
        tableau: [
            [0],
            [1 / 4, 1 / 4],
            [3 / 8, 3 / 32, 9 / 32],
            [12 / 13, 1932 / 2197, -7200 / 2197],
            [1, 439 / 216, -8, 3680 / 513, -845 / 4104],
            [1 / 2, -8 / 27, 2, -3544 / 2565, 1859 / 4104, -11 / 40],
            [, 16 / 135, 0, 6656 / 12825, 28561 / 56430, -9 / 50, 2 / 55],
            [, 25 / 216, 0, 1408 / 2565, 2197 / 4104, -1 / 5, 0],
        ]
    },
    'exp_ForwardEuler': {
        type: 'explicit',
        tableau: [
            [0],
            [, 1]
        ]
    },
    'exp_ExplicitMidpoint': {
        type: 'explicit',
        tableau: [
            [0],
            [1 / 2, 1 / 2],
            [, 0, 1]
        ]
    },
    'exp_RK4': {
        type: 'explicit',
        tableau: [
            [0],
            [1 / 2, 1 / 2],
            [1 / 2, 0, 1 / 2],
            [1, 0, 0, 1],
            [, 1 / 6, 1 / 3, 1 / 3, 1 / 6],
        ]
    },
    // 'imp_BackwardEuler': {
    //     type: 'explicit',
    //     tableau: [
    //         [1, 1],
    //         [, 1],
    //     ]
    // }
}
function prepareJob({
    formula,
    update = () => {},
    startTime = 0,
    endTime = false,
    initialValue,
    initialH = 0.1,
    epsilon = 0.01,
    synchronizeAndStepByStep = false,
    method = 'RK45',
}) {
    if (synchronizeAndStepByStep) {
        return new Function(`
        ${butcherTableau2code(method, RKMethodDict[method].type, RKMethodDict[method].tableau)}
        let {formula, update} = arguments[0];
        return (function* job(){
            let h = ${initialH};
            let time = ${startTime};
            let initialValue = ${JSON.stringify(initialValue)};
            while(${endTime !== false ? `time <= ${endTime}` : 'true'}){
                let result = ${method}(formula, time, undefined, initialValue, h, ${epsilon}, 1);
                h = result.h;
                time = result.data[0][0];
                // console.log(time);
                initialValue = result.data[1][0];
                update(time, result.data[1][0]);
                yield { row: [result.data[0][0], ...result.data[1][0]], h: result.h };
            }
            return;
        })();
        `)({ formula, update });
    } else {
        return new Function(`
        ${butcherTableau2code(method, RKMethodDict[method].type, RKMethodDict[method].tableau)}
        let {formula} = arguments[0];
        return new Promise(resolve => {
            let result = ${method}(formula, ${startTime}, ${endTime}, ${JSON.stringify(initialValue)}, ${initialH}, ${epsilon});
            result.data[1].map((array, i) => array.splice(0, 0, result.data[0][i]));
            resolve({ csv: result.data[1], h: result.h });
        });
        `)({ formula });
    }
}