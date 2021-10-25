const express = require('express');
const cleanPass = express();
const validator = require('validator');

const capitalize = (string) => string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
const capitalizeNotForceLowerCase = (string) => string.charAt(0).toUpperCase() + string.slice(1); //Que pour la ligne d'adresse, si celle çi contient des noms propres, l'utilisateur peut les mettre en majuscule...



//module installé comme MW dans l'index !
//! Non utilisé, fait planter la vérification de la signature de STRIPE dans le webhook du payment !! "Expected a string but received a number"

cleanPass.use((req, res, next) => {


    for (let prop in req.body) {
        //req.body[prop] = validator.trim(req.body[prop]);

        req.body[prop] = validator.blacklist(req.body[prop], ['>']);
        req.body[prop] = validator.blacklist(req.body[prop], ['<']);
        //req.body[prop] = validator.blacklist(req.body[prop], ['"']);
        //req.body[prop] = validator.blacklist(req.body[prop], ['/']); // besoin pour les URL...
        //req.body[prop] = validator.blacklist(req.body[prop], ['|']);
        //req.body[prop] = validator.blacklist(req.body[prop], ['{']);
        //req.body[prop] = validator.blacklist(req.body[prop], ['}']);
        //req.body[prop] = validator.blacklist(req.body[prop], ['[']);
        //req.body[prop] = validator.blacklist(req.body[prop], [']']);
        //req.body[prop] = validator.blacklist(req.body[prop], ['=']);

    }
    //Je formate quelque entrées pour que ca soit propre en BDD...

    /* if (req.body.pays) {
        req.body.pays = req.body.pays.toUpperCase();
    }
    if (req.body.prenom) {
        req.body.prenom = capitalize(req.body.prenom);
    }
    if (req.body.nomFamille) {
        req.body.nomFamille = capitalize(req.body.nomFamille);
    }
    if (req.body.ligne1) {
        req.body.ligne1 = capitalizeNotForceLowerCase(req.body.ligne1);
    }
    if (req.body.ligne2) {
        req.body.ligne2 = capitalize(req.body.ligne2);
    }
    if (req.body.ligne3) {
        req.body.ligne3 = capitalize(req.body.ligne3);
    }
    if (req.body.titre) {
        req.body.titre = capitalize(req.body.titre);
    }
    if (req.body.ville) {
        req.body.ville = capitalize(req.body.ville);
    } */



    next();

    /* le password doit contenir => @#$%^&* */
    // je laisse les + pour le format E 164 des phones number



});

module.exports = cleanPass;