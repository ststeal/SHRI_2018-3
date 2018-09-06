const smartHouse = require('./main');
const fs = require('fs');

let input = [
    require('./input/input0.json'),
    require('./input/input1.json'),
    require('./input/input2.json'),
    require('./input/input3.json')
];

input.forEach(function (data, index) {
    let output = smartHouse(data);
    console.log(output);
    fs.writeFile('./output/output' + index + '.txt', JSON.stringify(output, null, '\t'), function (err) {
        if (err) throw err;
        console.log('The file was created!');
    });
});
