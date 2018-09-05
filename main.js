/**
 * Создание массива с тарифами по часам
 * @param {Object} data Входящие данные умного дома
 * @returns {Array} separatedArr Массив тарифов по часам
 */
function separateRates(data) {
    let separatedArr = [];
    data.rates.forEach(function (item) {
        let to = item.to;
        if (item.to < item.from) {
            to += 24;
        }
        for (let i = item.from; i < to; i++) {
            let hour = i % 24;
            let mode = ((7 <= hour) && (hour < 21)) ? 'day' : 'night';
            separatedArr[hour] = {
                hour,
                mode,
                'value': item.value,
                'currentPower': 0,
                'devices': [],
                'maxPower': data.maxPower,
            };
        }
    });
    return separatedArr;
}

/**
 * Создание массива с приоритетно отсортированными устройствами для расстановки в расписание
 * @param data {Object} Входящие данные умного дома
 * @returns {Array} Массив устройств остсортированный по приоритету расстановки
 */
function enchantDevices(data) {
    return data.devices.map(function (item) {
        return Object.assign({}, item, {
            'powdur': item.duration * item.power
        });
    }).sort(function (a, b) {
        if (b.duration === 24) {
            return 1;
        }
        if (a.duration === 24) {
            return -1;
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
}

/**
 * Поиск самого эффективного часа для началого расстановки расписания работы устройства
 * @param {Array} timeLine Массив тарифов по часам
 * @param {Object} device Устройство
 * @returns {Number} bestHour Самый эффективный час для начала расстановки
 */
function findBestHour(timeLine, device) {
    if (device.duration === 24) {
        return 0;
    }

    let bestDeviceFullValue = 0;
    let bestHour;
    timeLine.forEach(function (hour, index) {
        let deviceFullValue = 0;
        let allowed = true;
        if ((hour.currentPower + device.power) > hour.maxPower) {
            return;
        }
        for (let i = 0; i < device.duration; i++) {
            let currentHour = (index + i) % timeLine.length;
            if (device.mode && timeLine[currentHour].mode !== device.mode) {
                allowed = false;
                break;
            }
            if (timeLine[currentHour].currentPower + device.power <= timeLine[currentHour].maxPower) {
                deviceFullValue += device.power * timeLine[currentHour].value;
            } else {
                allowed = false;
                break;
            }
        }
        if (!allowed) {
            return;
        }
        if (!bestDeviceFullValue || deviceFullValue < bestDeviceFullValue) {
            bestDeviceFullValue = deviceFullValue;
            bestHour = hour.hour;
        }
    });
    return bestHour;
}

/**
 * Формирование расписания работы устройств
 * @param {Array} timeLine Массив тарифов по часам
 * @param {Array} devices Массив устройств остсортированный по приоритету расстановки
 * @returns {Object} outputData Расписание работы устройств и их потребляемая мощность
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
        let bestHour = findBestHour(timeLine, device);
        let resultDeviceValue = 0;
        if (bestHour !== undefined) {
            for (let i = 0; i < device.duration; i++) {
                let currentHour = (bestHour + i) % timeLine.length;
                timeLine[currentHour].devices.push(device.id);
                timeLine[currentHour].currentPower += device.power;
                resultDeviceValue += device.power * timeLine[currentHour].value;
            }
        } else {
            console.log(device.name + ' ' + device.id + ' : can\'t be placed')
        }
        resultDeviceValue *= 0.001;
        fullValue += resultDeviceValue;
        outputData.consumedEnergy.devices[device.id] = resultDeviceValue;
    });

    timeLine.forEach(function (hour, index) {
        outputData.schedule[index] = hour.devices;
    });
    outputData.consumedEnergy.value = fullValue;
    return outputData;
}

/**
 * Результирующая функция
 * @param {Object} data Входящие данные умного дома
 * @returns {Object} Расписание работы устройств и их потребляемая мощность
 */

function smartHouse(data) {
    let timeLine = separateRates(data);
    let devicesArr = enchantDevices(data);
    return computingSchedule(timeLine, devicesArr);
}

module.exports = smartHouse;

