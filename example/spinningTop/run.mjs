import * as childProcess from 'child_process';
import * as util from 'util';
import * as fs from 'node:fs';
import * as basic from '../../node/ref/basic.mjs';

const asyncExec = util.promisify(childProcess.exec);

// calculate
async function calculate() {
    const valueList = (
        (min, max, step, div) => new Array(Math.round((max - min) / step) + 1)
            .fill(0)
            .map((_, i) => min + step * i)
            .map(n => n / div)
    )(10, 14, 1, 10);
    for (let i = 0; i < valueList.length * 2; i++) {
        // if (i % 2 == 1) continue;
        const ballMass = valueList[Math.floor(i / 2)];
        await asyncExec(`node ../../node/calcSystemFile.mjs -s ./system/spinningTopWithOffsetCenterOfGravity_calc.js -m emb_RKF45 -q [0.08726646259971647,0.08726646259971647,0,0,0,62.83185307179586,0,0,0,0,${ballMass},${i % 2 == 0 ? '0.5' : '0'}] -h 0.01 -e 0.002 -E ${i % 2 == 0 ? 60 / ballMass : 70 / ballMass} -o ./data/data_${i % 2 == 0 ? 'offset' : 'center'}_${valueList[Math.floor(i / 2)]}g.csv`);
        console.log(`"./data/data_${i % 2 == 0 ? 'offset' : 'center'}_${ballMass}g.csv" done!`);
    }
}
await calculate();

// process
async function process() {
    const valueList = (
        (min, max, step, div) => new Array(Math.round((max - min) / step) + 1)
            .fill(0)
            .map((_, i) => min + step * i)
            .map(n => n / div)
    )(4, 14, 1, 10);
    const analysis = [['ball mass', 'offset time', 'center time']];
    for (let i = 0; i < valueList.length; i++) {
        analysis[i + 1] = [valueList[i], '', ''];
        ['offset', 'center'].forEach(type => {
            const filePath = `./data/data_${type}_${valueList[i]}g.csv`;
            console.log(filePath);
            try {
                let dataContent = fs.readFileSync(filePath, 'utf8');
                let rows = dataContent.split('\n').splice(0, 120000);
                dataContent = null;
                let lastIndex = rows
                    .map(row => row.replace(',', '<|>').split('<|>')[1])
                    .reduce((count, data) => [typeof count === 'string' ? (count == data ? 0 : 1) : count[0] + (count[1] == data ? 0 : 1), data])[0];
                if (lastIndex == rows.length - 1) {
                    analysis[i + 1][type == 'offset' ? 1 : 2] = '';
                } else {
                    analysis[i + 1][type == 'offset' ? 1 : 2] = rows[lastIndex].split(',')[0];
                }
                rows = null;
                lastIndex = null;
            } catch (error) {
                analysis[i + 1][type == 'offset' ? 1 : 2] = '';
            }
        });
    }
    fs.writeFileSync('./data/data_analysis.csv', basic.array2csv(analysis));
}
await process();

// https://stackoverflow.com/questions/8557624/how-i-trigger-the-system-bell-in-nodejs
childProcess.exec('1..3 | %{ [console]::beep(1000, 500) }', { shell: 'powershell.exe' });