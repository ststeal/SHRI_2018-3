let input = [
    require('./input/input0.json'),
    require('./input/input1.json'),
    require('./input/input2.json'),
    require('./input/input3.json')
];

const smartHouse = require('./main');

for (const data of input) {
    console.log(smartHouse(data));
}