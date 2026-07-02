import { util, Path } from 'fabric';

const pathData = {
    type: 'path',
    path: [['M', 0, 0], ['L', 10, 10]],
    stroke: 'red',
    strokeWidth: 2
};

async function test() {
    try {
        const objects = await util.enlivenObjects([pathData]);
        console.log("Success:", objects.length);
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
