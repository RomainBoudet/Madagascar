const express = require('express');
const cleanPass = express();
const validator = require('validator');


cleanPass.use((req, res, next) => {



    for (let prop in req.body) {
        req.body[prop] = validator.trim(req.body[prop]);
        req.body[prop] = validator.blacklist(req.body[prop], ['>']);
        req.body[prop] = validator.blacklist(req.body[prop], ['<']);
        req.body[prop] = validator.blacklist(req.body[prop], ['"']);
        req.body[prop] = validator.blacklist(req.body[prop], ['/']);
        req.body[prop] = validator.blacklist(req.body[prop], ['|']);
        req.body[prop] = validator.blacklist(req.body[prop], ['{']);
        req.body[prop] = validator.blacklist(req.body[prop], ['}']);
        req.body[prop] = validator.blacklist(req.body[prop], ['[']);
        req.body[prop] = validator.blacklist(req.body[prop], [']']);
        req.body[prop] = validator.blacklist(req.body[prop], ['=']);
        req.body[prop] = validator.blacklist(req.body[prop], ['_']);

    }
    next();

    /* le password doit contenir => @#$%^&* */
    // je laisse les + pour le format E 164 des phones number



});

module.exports = cleanPass;