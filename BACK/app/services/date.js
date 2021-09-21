const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const isoWeek = require('dayjs/plugin/isoWeek');
dayjs.extend(isoWeek)
require('dayjs/locale/fr');

const Holidays = require('date-holidays');
const hd = new Holidays('fr');


dayjs.locale('fr');

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Europe/Paris");

const formatLong = (date) => {
    date = dayjs(date).format('dddd D MMMM YYYY à H:mm');
    return date;
}

const formatLongSeconde = (date) => {
    date = dayjs(date).format('dddd D MMMM YYYY à H:mm:ss');
    return date;
}

const formatLongSansHeure = (date) => {
    date = dayjs(date).format('dddd D MMMM YYYY');
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

const formatJMAHMSsecret = (date) => {
    date = dayjs(date).format('DDMMYYYYHHmmss');
    return date;
}

const formatCoupon = (date) => {
    date = dayjs(date).format('DDMMHHmmssSSS');
    return date;
}

const formatForBack = (date) => {
    data = dayjs(date).toISOString();
    return date;
}

function addWeekdays(date, days) {
    date = dayjs(date);
    while (days > 0) {
        date = date.add(1, 'days');
        // On décrémente "days" seulement si on est un jour de la semaine. Et seulement si c'est pas un jour férié !
        if ((date.isoWeekday() !== 6 && date.isoWeekday() !== 7) && hd.isHoliday(date) === false) {
            days -= 1;
        }
        
    }
    date = dayjs(date).format('dddd D MMMM');
    return date;
}
//Quelque package qui pourrait aidé a l'avenir...
//https://www.npmjs.com/package/dayjs-business-time    //https://www.npmjs.com/package/date-holidays

module.exports = {
    dayjs,
    addWeekdays,
    formatLongSeconde,
    formatJMA,
    formatLong,
    formatForBack,
    formatJMAHMS,
    formatJMAHMSsecret,
    formatCoupon,
    formatLongSansHeure
};