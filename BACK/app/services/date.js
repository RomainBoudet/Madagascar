const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
require('dayjs/locale/fr');


dayjs.locale('fr');

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Europe/Paris");

const formatLong = (date) => {
    date = dayjs(date).format('dddd D MMMM YYYY à H:mm');
    return date;
}

const formatJMA = (date) => {
    date = dayjs(date).format('DD/MM/YYYY');
    return date;
}

const formatJMAHMS = (date) => {
    date = dayjs(date).format('DD/MM/YYYY/HH:mm:ss');
    return date;
}

const formatForBack = (date) => {
    data = dayjs(date).toISOString();
    return date;
}

module.exports = {
    dayjs,
    formatJMA,
    formatLong,
    formatForBack,
    formatJMAHMS
};