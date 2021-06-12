const {
  createLogger,
  format,
  transports
} = require('winston');
const appRoot = require('app-root-path')
const chalk = require('chalk');
const path = require('path');
const express = require('express');
const logger = express();
const geoip = require('geoip-lite');

//Ici un module que je peux activer a volonté, pour mettre en forme les logs. 
const formatter = () =>
  format.printf(info => {
    return chalk.magenta`${info.level}: ${info.message}`;
  });

//! les logs sont présent dans le dossier logs, a la racine du dossier BACK. 
//! les log ont été exclu de git. Chaque fois que l'on clone le projet, le fichier de logs est vide.


/**
 * Logger module.
 * @module services/logger
 */

//Mon premier logger qui va enregistrer beaucoup de chose dans le fichier de log

//lié au package winston, qui se charge d'enregistrer les logs là ou on lui dit..
const logg = createLogger({
  transports: [
    new transports.File({
      // on configure le lieu de stockage, son format et son niveau
      filename: path.join(appRoot.path, 'logs', 'error.log'),
      level: 'error',
      format: format.combine(format.timestamp(), formatter(false))
    }),
    new transports.File({
      filename: path.join(appRoot.path, 'logs', 'combined.log'),
      format: format.combine(format.timestamp(), formatter(false))
    }),
  ]
});

// mon second logger qui va juste retransmettre certaines infos en console, mais plus light que ce qui est enregistré, pour ne par surcharger la console !

const log = createLogger({
  transports: [
    new transports.Console({
      level: 'info',
      format: format.combine(format.timestamp(), formatter(true))
    })
  ]
});



//on en fait un MW qui sera utilisable avec un app.use dans l'index.
logger.use((req, res, next) => {

  const now = new Date(); // l'instant exact de la requête dans un format qui m'écorche pas les yeux ;)
  const options = {
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "numeric"
  };

  const dat = (now.toLocaleDateString("fr", options)) + " " + now.toLocaleTimeString() + " " + now.getMilliseconds();
  const date = dat.charAt(0).toUpperCase() + dat.slice(1);

  //pour avoir des données sur la localisation de l'utilisateur si dispo... (en prod pas en local)
  const ip = req.ip;
  const geo = geoip.lookup(ip);


  //Les informations qui seront envoyé au fichier de log dans le dossier log, bien complet
  //Deux options, selon si on a l'ip du user.
  if (geo === null) {
    logg.info(`Date de la connexion :${date} *** Adresse ip : ${req.ip} *** host : ${req.headers.host} *** URL demandée : ${req.url} *** Les données du user-agent :${req.headers['user-agent']} *** le language accépté : ${req.headers["accept-language"]} *** (absence de donnée géo)`);
  } else {
    logg.info(`Date de la connexion :${date} *** Adresse ip : ${req.ip} *** host : ${req.headers.host} *** Méthode + URL demandée : ${req.method} + ${req.url} *** Les données du user-agent :${req.headers['user-agent']} *** le language accépté : ${req.headers["accept-language"]} *** pays : ${geo.country} *** ville : ${geo.city}*** timezone : ${geo.timezone} *** longitude/lattitude : ${geo.ll}`);
  }

  //Le second message qui va juste être envoyé en console, assez light, pour ne pas surcharger la console
  log.info(`Date de la connexion : ${date} *** Adresse ip : ${req.ip} *** ${req.headers.host}${req.url} * ${req.method}`);

  // systématiquement et inconditionnellement
  next();
})

module.exports = logger;