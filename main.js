/*
* Функция делает из интервалов тарифов один массив разбитый по часам с
* currentPower, devices, hour, maxPower, mode, value
* */
function separateRates(data) {
    let separatedArr = [];
    data.rates.forEach(function (item) {
        if (item.to < item.from) {
            for (let i = item.from; i <= 23; i++) {
                ratePush(((7 <= i) && (i < 21)) ? 'day' : 'night', i, item);
            }
            for (let i = 0; i < item.to; i++) {
                ratePush(((7 <= i) && (i < 21)) ? 'day' : 'night', i, item);
            }
        } else {
            for (let i = item.from; i < item.to; i++) {
                ratePush(((7 <= i) && (i < 21)) ? 'day' : 'night', i, item);
            }
        }
    });
    return separatedArr.sort(function (a, b) {
        return a.hour - b.hour;
    });

    function ratePush(mode, index, item) {
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

/*
* Функция сортирует девайсы по приоритету расстановки
 */
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

/*
* Функция расставляет каждый девайс на промежуток с максимально
* эффективным энергопотреблением
 */
function computingSchedule(timeLine, devices) {
    let outputData = {
        'schedule': {},
        'consumedEnergy':
            {
                'devices': {}
            }
    };
    let fullValue = 0;

    devices.forEach(function (device) {

        let bestHour;
        let deviceFullValue = 0;
        let bestDeviceFullValue = 0;

        function compareResult(hour) {
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

        if (device.duration === 24) {

            timeLine.forEach(function (hour) {
                hour.devices.push(device.id);
                hour.currentPower += device.power;
                bestDeviceFullValue += device.power * hour.value;
                device.duration--;
            });

        } else {

            timeLine.forEach(function (hour, index) {
                    let counter = 0;
                    if ((hour.currentPower + device.power) <= hour.maxPower) {
                        for (let i = 0; i < device.duration; i++) {
                            let currentHour = (index + i) % timeLine.length;
                            if (device.mode) {
                                if ((timeLine[currentHour].currentPower + device.power <= timeLine[currentHour].maxPower) &&
                                    (timeLine[currentHour].mode === device.mode)) {
                                    deviceFullValue += device.power * timeLine[currentHour].value;
                                    counter++;
                                }
                            } else {
                                if (timeLine[currentHour].currentPower + device.power <= timeLine[currentHour].maxPower) {
                                    deviceFullValue += device.power * timeLine[currentHour].value;
                                    counter++;
                                }
                            }
                        }
                    }
                    if (counter === device.duration) {
                        compareResult(hour);
                    }
                }
            );

            if (bestHour !== undefined) {
                for (let i = 0; i < device.duration; i++) {
                    let currentHour = (bestHour + i) % timeLine.length;
                    timeLine[currentHour].devices.push(device.id);
                    timeLine[currentHour].currentPower += device.power;
                }
            } else {
                console.log(device.name + ' ' + device.id + ' : can\'t be placed')
            }
        }

        fullValue += bestDeviceFullValue;
        outputData.consumedEnergy.devices[device.id] = bestDeviceFullValue * 0.001;
    })
    ;
    timeLine.forEach(function (hour, index) {
        outputData.schedule[index] = [];
        hour.devices.forEach(function (device) {
            outputData.schedule[index].push(device)
        });
    });
    outputData.consumedEnergy.value = fullValue * 0.001;
    return outputData;
}

/*
* Результирующая функция
 */
function smartHouse(data) {
    let timeLine = separateRates(data);
    let devicesArr = enchantDevices(data);
    console.log(devicesArr);
    console.log(timeLine);
    let output = computingSchedule(timeLine, devicesArr);
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
            'id': 'washup',
            'name': 'Посудомоечная машина',
            'power': 950,
            'duration': 3,
            'mode': 'night'
        },
        {
            'id': 'duhovka',
            'name': 'Духовка',
            'power': 1500,
            'duration': 2,
            'mode': 'day'
        },
        {
            'id': 'refrejerator',
            'name': 'Холодильник',
            'power': 50,
            'duration': 23
        },
        {
            'id': 'termostat',
            'name': 'Термостат',
            'power': 50,
            'duration': 22
        },
        {
            'id': 'kondei',
            'name': 'Кондиционер',
            'power': 850,
            'duration': 1
        },
        {
            'id': 'paialnik',
            'name': 'Паяльник',
            'power': 1500,
            'duration': 7,
            'mode': 'day'
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
    'maxPower': 2099
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