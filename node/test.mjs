import * as childProcess from 'child_process';
import * as util from 'util';
const asyncExec = util.promisify(childProcess.exec);

let valueList = (
    (min, max, step, div) => new Array(Math.round((max - min) / step) + 1)
        .fill(0)
        .map((_, i) => min + step * i)
        .map(n => n / div)
)(1, 20, 1, 10);
for (let i = 0; i < valueList.length * 2; i++) {
    await asyncExec(`node calcSystemFile.mjs -s ./spinningTopWithOffsetCenterOfGravity_calc.js -m emb_RKF45 -q [0.08726646259971647,0.08726646259971647,0,0,0,62.83185307179586,0,0,0,0,${valueList[i%valueList.length]},${i < valueList.length ? '0.5' : '0'}] -h 0.01 -e 0.001 -E 120 -o ./data_${i < valueList.length ? 'offset' : 'center'}_${valueList[i%valueList.length]}g.csv`);
    console.log(`"./data_${i < valueList.length ? 'offset' : 'center'}_${valueList[i%valueList.length]}g.csv" done!`);
}