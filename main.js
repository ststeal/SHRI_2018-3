function separateRates(data) {
    let separatedArr = [];
    data.rates.forEach(function (item) {
        if (item.to < item.from) {
            for (let i = item.from; i <= 23; i++) {
                ratePush(((7 <= i) && (i < 21)) ? 'day' : 'night', i,item);
            }
            for (let i = 0; i < item.to; i++) {
                ratePush(((7 <= i) && (i < 21)) ? 'day' : 'night', i,item);
            }
        } else {
            for (let i = item.from; i < item.to; i++) {
                ratePush(((7 <= i) && (i < 21)) ? 'day' : 'night', i,item);
            }
        }
    });
    return separatedArr.sort(function (a, b) {
        return a.hour - b.hour;
    });

    function ratePush(mode, index,item) {
        separatedArr.push({
            'hour': index,
            'value': item.value,
            'mode': mode,
            'currentPower': 0,
            'devices': [],
            'maxPower': data.maxPower,
        });
    }
}

function enchantDevices(data) {
    let devices = [];
    data.devices.forEach(function (item) {
        devices.push({
            'id': item.id,
            'name': item.name,
            'power': item.power,
            'duration': item.duration,
            'mode': item.mode,
            'powdur': item.duration * item.power,
        });
    });
    devices.sort(function (a, b) {
        if (b.duration === 24) {
            return b.duration - a.duration;
        }
        if (a.duration === 24) {
            return a.duration - b.duration;
        }
        if (!!b.mode === !!a.mode) {
            if (b.powdur === a.powdur) {
                return b.power - a.power;
            } else {
                return b.powdur - a.powdur;
            }
        } else {
            return !a.mode - !b.mode;
        }
    });
    return devices;
}

function computingShedule(timeLine, devices) {
    let outputData = {
        'shedule': {},
        'consumedEnergy': {
            'devices': {}
        }
    };
    let fullValue = 0;
    devices.forEach(function (device) {

        let bestHour;
        let deviceFullValue = 0;
        let bestDeviceFullValue = 0;

        if (device.duration === 24) {
            timeLine.forEach(function (hour) {

                hour.devices.push(device.id);
                hour.currentPower += device.power;
                bestDeviceFullValue += device.power * hour.value;
                device.duration--;
                // if (hour.currentPower > hour.maxPower) {
                //     console.log('Error');
                // }

            });

        } else {
            bestDeviceFullValue = 0;
            if (device.mode) {
                timeLine.forEach(function (hour, index) {

                    if (hour.mode === device.mode) {
                        let counter = 0;
                        if (hour.currentPower + device.power <= hour.maxPower) {
                            for (let i = 0; i < device.duration; i++) {
                                let currentHour = (index + i) % timeLine.length;
                                if (timeLine[currentHour].mode === device.mode) {
                                    deviceFullValue += device.power * timeLine[currentHour].value;
                                    counter++;
                                }
                            }
                            if (counter === device.duration) {
                                if (!bestDeviceFullValue) {
                                    bestDeviceFullValue = deviceFullValue;
                                    bestHour = hour.hour;
                                    deviceFullValue = 0;
                                } else {
                                    if (deviceFullValue < bestDeviceFullValue) {
                                        bestDeviceFullValue = deviceFullValue;
                                        bestHour = hour.hour;
                                        deviceFullValue = 0;
                                    } else {
                                        deviceFullValue = 0;
                                    }
                                }
                            }
                        }
                    }

                });

            } else {
                timeLine.forEach(function (hour, index) {

                    if (hour.currentPower + device.power <= hour.maxPower) {
                        for (let i = 0; i < device.duration; i++) {
                            deviceFullValue += device.power * timeLine[(index + i) % timeLine.length].value;
                        }
                        if (!bestDeviceFullValue) {
                            bestDeviceFullValue = deviceFullValue;
                            bestHour = hour.hour;
                            deviceFullValue = 0;
                        } else {
                            if (deviceFullValue < bestDeviceFullValue) {
                                bestDeviceFullValue = deviceFullValue;
                                bestHour = hour.hour;
                                deviceFullValue = 0;
                            } else {
                                deviceFullValue = 0;
                            }
                        }
                    }

                });
            }
            if (bestHour >= 0) {
                for (let i = 0; i < device.duration; i++) {
                    let currentHour = (bestHour + i) % timeLine.length;
                    timeLine[currentHour].devices.push(device.id);
                    timeLine[currentHour].currentPower += device.power;
                }
            } else {
                console.log(device.name + ' ' + device.id + ' : не может быть размещено')
            }
        }
        fullValue += bestDeviceFullValue;
        outputData.consumedEnergy.devices[device.id] = bestDeviceFullValue * 0.001;
    });
    timeLine.forEach(function (hour, index) {
        outputData.shedule[index] = [];
        hour.devices.forEach(function (device) {
            outputData.shedule[index].push(device)
        });
    });
    outputData.consumedEnergy.value = fullValue * 0.001;
    return outputData;
}


function smart(data) {
    let timeLine = separateRates(data);
    let devicesArr = enchantDevices(data);
    console.log(devicesArr);
    console.log(timeLine);
    let output = computingShedule(timeLine, devicesArr);
    console.log(timeLine);
    return output;
}

const data1 = {
    'devices': [
        {
            'id': 'F972B82BA56A70CC579945773B6866FB',
            'name': 'Посудомоечная машина',
            'power': 950,
            'duration': 3,
            'mode': 'night'
        },
        {
            'id': 'C515D887EDBBE669B2FDAC62F571E9E9',
            'name': 'Духовка',
            'power': 2000,
            'duration': 2,
            'mode': 'day'
        },
        {
            'id': '02DDD23A85DADDD71198305330CC386D',
            'name': 'Холодильник',
            'power': 50,
            'duration': 24
        },
        {
            'id': '1E6276CC231716FE8EE8BC908486D41E',
            'name': 'Термостат',
            'power': 50,
            'duration': 24
        },
        {
            'id': '7D9DC84AD110500D284B33C82FE6E85E',
            'name': 'Кондиционер',
            'power': 850,
            'duration': 1
        }
    ],
    'rates': [
        {
            'from': 7,
            'to': 10,
            'value': 6.46
        },
        {
            'from': 10,
            'to': 17,
            'value': 5.38
        },
        {
            'from': 17,
            'to': 21,
            'value': 6.46
        },
        {
            'from': 21,
            'to': 23,
            'value': 5.38
        },
        {
            'from': 23,
            'to': 7,
            'value': 1.79
        }
    ],
    'maxPower': 2100
};
const data2 = {
    'devices': [
        {
            'id': '1',
            'name': 'Посудомоечная машина',
            'power': 950,
            'duration': 3,
            'mode': 'night'
        },
        {
            'id': '2',
            'name': 'Духовка',
            'power': 1200,
            'duration': 5,
            'mode': 'day'
        },
        {
            'id': '3',
            'name': 'Духовка2',
            'power': 500,
            'duration': 10,
            'mode': 'day'
        },
        {
            'id': '4',
            'name': 'Холодильник',
            'power': 50,
            'duration': 24
        },
        {
            'id': '5',
            'name': 'Термостат',
            'power': 50,
            'duration': 24
        },
        {
            'id': '6',
            'name': 'Термостат2',
            'power': 100,
            'duration': 24
        },
        {
            'id': '7',
            'name': 'Кондиционер',
            'power': 850,
            'duration': 1
        },
        {
            'id': '8',
            'name': 'Кондиционер',
            'power': 300,
            'duration': 1,
            'mode': 'day'
        },
        {
            'id': '9',
            'name': 'Кондиционер',
            'power': 850,
            'duration': 1
        }
    ],
    'rates': [
        {
            'from': 7,
            'to': 10,
            'value': 6.46
        },
        {
            'from': 10,
            'to': 17,
            'value': 5.38
        },
        {
            'from': 17,
            'to': 21,
            'value': 6.46
        },
        {
            'from': 21,
            'to': 23,
            'value': 5.38
        },
        {
            'from': 23,
            'to': 7,
            'value': 1.79
        }
    ],
    'maxPower': 2100
};
const data3 = {
    'devices': [
        // {
        //     'id': '1',
        //     'name': 'Посудомоечная машина',
        //     'power': 950,
        //     'duration': 3,
        //     'mode': 'night'
        // },
        // {
        //     'id': '2',
        //     'name': 'Духовка',
        //     'power': 2000,
        //     'duration': 2,
        //     'mode': 'day'
        // },
        {
            'id': '3',
            'name': 'Духовка2',
            'power': 2000,
            'duration': 4,
            'mode': 'night'
        },
        {
            'id': '4',
            'name': 'Духовка3',
            'power': 2000,
            'duration': 4,
            'mode': 'night'
        }
    ],
    'rates': [
        {
            'from': 7,
            'to': 10,
            'value': 6.46
        },
        {
            'from': 10,
            'to': 17,
            'value': 5.38
        },
        {
            'from': 17,
            'to': 21,
            'value': 6.46
        },
        {
            'from': 21,
            'to': 23,
            'value': 5.38
        },
        {
            'from': 2,
            'to': 7,
            'value': 2
        },
        {
            'from': 23,
            'to': 2,
            'value': 1.5
        }
    ],
    'maxPower': 2100
};
const data4 = {
    'devices': [

        {
            'id': '7D9DC84AD110500D284B33C82FE6E85E',
            'name': 'Кондиционер',
            'power': 850,
            'duration': 11,
            'mode': 'night'
        }
    ],
    'rates': [
        {
            'from': 7,
            'to': 10,
            'value': 6
        },
        {
            'from': 10,
            'to': 17,
            'value': 1
        },
        {
            'from': 17,
            'to': 21,
            'value': 6
        },
        {
            'from': 21,
            'to': 23,
            'value': 5
        },
        {
            'from': 23,
            'to': 7,
            'value': 2
        }
    ],
    'maxPower': 2099
};

const outData = {
    'schedule': {
        '0': ['02DDD23A85DADDD71198305330CC386D', '1E6276CC231716FE8EE8BC908486D41E', 'F972B82BA56A70CC579945773B6866FB'],
        '1': ['02DDD23A85DADDD71198305330CC386D', '1E6276CC231716FE8EE8BC908486D41E', 'F972B82BA56A70CC579945773B6866FB'],
        '2': ['02DDD23A85DADDD71198305330CC386D', '1E6276CC231716FE8EE8BC908486D41E', 'F972B82BA56A70CC579945773B6866FB'],
        '3': ['02DDD23A85DADDD71198305330CC386D', '1E6276CC231716FE8EE8BC908486D41E'],
        '4': ['02DDD23A85DADDD71198305330CC386D', '1E6276CC231716FE8EE8BC908486D41E'],
        '5': ['02DDD23A85DADDD71198305330CC386D', '1E6276CC231716FE8EE8BC908486D41E'],
        '6': ['02DDD23A85DADDD71198305330CC386D', '1E6276CC231716FE8EE8BC908486D41E'],
        '7': ['02DDD23A85DADDD71198305330CC386D', '1E6276CC231716FE8EE8BC908486D41E'],
        '8': ['02DDD23A85DADDD71198305330CC386D', '1E6276CC231716FE8EE8BC908486D41E'],
        '9': ['02DDD23A85DADDD71198305330CC386D', '1E6276CC231716FE8EE8BC908486D41E'],
        '10': ['02DDD23A85DADDD71198305330CC386D', '1E6276CC231716FE8EE8BC908486D41E', 'C515D887EDBBE669B2FDAC62F571E9E9'],
        '11': ['02DDD23A85DADDD71198305330CC386D', '1E6276CC231716FE8EE8BC908486D41E', 'C515D887EDBBE669B2FDAC62F571E9E9'],
        '12': ['02DDD23A85DADDD71198305330CC386D', '1E6276CC231716FE8EE8BC908486D41E'],
        '13': ['02DDD23A85DADDD71198305330CC386D', '1E6276CC231716FE8EE8BC908486D41E'],
        '14': ['02DDD23A85DADDD71198305330CC386D', '1E6276CC231716FE8EE8BC908486D41E'],
        '15': ['02DDD23A85DADDD71198305330CC386D', '1E6276CC231716FE8EE8BC908486D41E'],
        '16': ['02DDD23A85DADDD71198305330CC386D', '1E6276CC231716FE8EE8BC908486D41E'],
        '17': ['02DDD23A85DADDD71198305330CC386D', '1E6276CC231716FE8EE8BC908486D41E'],
        '18': ['02DDD23A85DADDD71198305330CC386D', '1E6276CC231716FE8EE8BC908486D41E'],
        '19': ['02DDD23A85DADDD71198305330CC386D', '1E6276CC231716FE8EE8BC908486D41E'],
        '20': ['02DDD23A85DADDD71198305330CC386D', '1E6276CC231716FE8EE8BC908486D41E'],
        '21': ['02DDD23A85DADDD71198305330CC386D', '1E6276CC231716FE8EE8BC908486D41E'],
        '22': ['02DDD23A85DADDD71198305330CC386D', '1E6276CC231716FE8EE8BC908486D41E'],
        '23': ['02DDD23A85DADDD71198305330CC386D', '1E6276CC231716FE8EE8BC908486D41E', '7D9DC84AD110500D284B33C82FE6E85E']
    },
    'consumedEnergy': {
        'value': 38.939,
        'devices': {
            'F972B82BA56A70CC579945773B6866FB': 5.1015,
            'C515D887EDBBE669B2FDAC62F571E9E9': 21.52,
            '02DDD23A85DADDD71198305330CC386D': 5.398,
            '1E6276CC231716FE8EE8BC908486D41E': 5.398,
            '7D9DC84AD110500D284B33C82FE6E85E': 1.5215
        }
    }
};