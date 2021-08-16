const Joi = require('joi');

// doc JOI => https://joi.dev/api/?v=17.4.0
// https://github.com/sideway/joi/blob/v17.4.0/API.md#list-of-errors


/**
 * Valide les informations reçu dans le body et envoyé par les utilisateurs
 * @name transporteurSchema 
 * @group Joi - Vérifie les informations du body
 * @property {string} password - le mot de passe d'un utilisateur, doit avoir 8 caractéres au minimum, une lettre minuscule, une lettre majuscule, un nombre et un caractéres spécial parmis : (@#$%^&*)
 * @property {string} passwordConfirm - doit être identique au password
 * @property {string} prenom - Le prenom de l'utilisateur, devant contenir au minimum 2 caractéres, sans espaces.
 * @property {string} nomFamille - le nom de famille de l'utilisateur devant contenir au minimum 2 caractéres, sans espaces.
 * @property {string} email - l'adresse email d'un utilisateur doit correspondre a un format valide.
 * @return {json} messages - Un texte adapté en cas d'érreur, en json, informant l'utilisateur d'un non respect des régles du schéma de validation
 */
const transporteurSchema = Joi.object({
    nom: Joi.string()
        .pattern(new RegExp(/^[^<>&#=+*/"|{}]*$/))
        .required()
        .max(200)
        .messages({
            'string.max': `Votre nom doit avoir une longeur maximum de {#limit} caractéres !`,
            'string.empty': `Le champs de votre nom ne peut être vide !`,
            'any.required': 'Le champs de votre nom ne peut être vide !',
            'string.pattern.base': 'Le format de votre nom est incorrect : Il ne doit pas être composé d\'un de ces caractéres spéciaux : [<>&#=+*/"|] !',

        }),

    description: Joi.string()
        .min(2)
        .pattern(new RegExp(/^[^<>&#=+*/"|{}]*$/))
        .required()
        .messages({
            'string.empty': `Le champs de votre description ne peut être vide !`,
            'string.min': `Votre description doit avoir une longeur minimum de {#limit} caractéres !`,
            'any.required': 'Le champs de votre description ne peut être vide !',
            'string.pattern.base': 'Le format de votre description est incorrect : Il ne doit pas être composé d\'un de ces caractéres spéciaux : [<>&#=+*/"|] !',
        }),

    fraisExpedition: Joi.number()
        .positive()
        .max(100)
        .required()
        .messages({
            'number.required': 'Le champs de votre fraisExpedition doit être un chiffre !',
            'any.required': 'Le champs de votre fraisExpedition ne peut être vide !',
            'number.max': 'Le champs de votre fraisExpedition ne peut être supérieur a 100 !',
            'number.positive': 'Le champs de votre fraisExpedition ne peut être inférieur a zéro !',


        }),

    estimeArrive: Joi.number()
        .positive()
        .integer()
        .required()
        .messages({
            'number.required': 'Le champs de votre estimeArrive doit être un chiffre !',
            'number.required': 'Le champs de votre estimeArrive ne peut être vide !',
            'any.required': 'Le champs de votre estimeArrive ne peut être vide !',
            'number.positive': 'Le champs de votre estimeArrive ne peut être inférieur a zéro !',

        }),

    logo: Joi.string()
        .max(200)
       // .pattern(new RegExp(/^\https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)\$/))
        .messages({
            'string.empty': `Le champs de votre logo ne peut être vide !`,
            'string.max': `Votre logo doit avoir une longeur maximum de {#limit} caractéres !`,
            'string.pattern.base': 'Le format de votre logo est incorrect',
        }),

});

module.exports = transporteurSchema;

// source REGEX email : https://emailregex.com/
//Cette syntaxe fonctionne aussi :
//.pattern(/^(?=.*[\d])(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])[\w!@#$%^&*]{8,}$/).required()