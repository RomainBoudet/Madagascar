const Joi = require('joi');

// doc JOI => https://joi.dev/api/?v=17.4.0
// https://github.com/sideway/joi/blob/v17.4.0/API.md#list-of-errors


/**
 * Valide les informations reçu dans le body et envoyé par les utilisateurs
 * @name livraisonPostSchema 
 * @group Joi - Vérifie les informations du body
 * @property {string} password - le mot de passe d'un utilisateur, doit avoir 8 caractéres au minimum, une lettre minuscule, une lettre majuscule, un nombre et un caractéres spécial parmis : (@#$%^&*)
 * @property {string} passwordConfirm - doit être identique au password
 * @property {string} prenom - Le prenom de l'utilisateur, devant contenir au minimum 2 caractéres, sans espaces.
 * @property {string} nomFamille - le nom de famille de l'utilisateur devant contenir au minimum 2 caractéres, sans espaces.
 * @property {string} email - l'adresse email d'un utilisateur doit correspondre a un format valide.
 * @return {json} messages - Un texte adapté en cas d'érreur, en json, informant l'utilisateur d'un non respect des régles du schéma de validation
 */
const livraisonPostSchema = Joi.object({
    reference: Joi.string()
        .required()
        .max(200)
        .pattern(new RegExp(/^[a-zA-Z0-9/]{5,}$/))
        .pattern(new RegExp(/^[^<>&#=+*"|{}]*$/))
        .required()
        .messages({
            'string.max': `Votre reference doit avoir une longeur maximum de {#limit} caractéres !`,
            'string.empty': `Le champs de votre reference ne peut être vide !`,
            'any.required': 'Le champs de votre reference ne peut être vide !',
            'string.pattern.base': 'Le format de votre reference est incorrect : Il ne doit pas être composé d\'un de ces caractéres : spéciaux [<>&#=+*"|] et posséder au minimum 5 chiffres ou lettres !',

        }),

    numeroSuivi: Joi.string()
        .min(2)
        .max(200)
        .pattern(new RegExp(/^[a-zA-Z0-9/]{4,}$/))
        .required()
        .pattern(new RegExp(/^[^<>&#=+*"|{}]*$/))
        .messages({
            'string.max': `Votre numeroSuivi doit avoir une longeur maximum de {#limit} caractéres !`,
            'string.empty': `Le champs de votre numeroSuivi ne peut être vide !`,
            'string.min': `Votre numeroSuivi doit avoir une longeur minimum de {#limit} caractéres !`,
            'any.required': 'Le champs de votre numeroSuivi ne peut être vide !',
            'string.pattern.base': 'Le format de votre numeroSuivi est incorrect : Il ne doit pas être composé d\'un de ces caractéres : spéciaux [<>&#=+*"|] et posséder au minimum 5 chiffres ou lettres !',
        }),

    URLSuivi: Joi.string()
        .required()
        .max(200)
        .regex(/^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/)
        .messages({
            'any.required': 'Le champs de votre  URLSuivi ne peut être vide !',
            'string.max': `Votre  URLSuivi doit avoir une longeur maximum de {#limit} caractéres !`,
            'string.empty': `Le champs de votre  URLSuivi ne peut être vide !`,
            'string.pattern.base': 'Le format de votre  URLSuivi est incorrect',
        }),

    poid: Joi.number()
    .greater(0.5)
    .precision(2)
    .positive()
    .max(100)
    .required()
    .messages({
        'any.number': 'Le champs de votre poid doit être un chiffre !',
        'number.empty': 'Le champs de votre poid doit être un chiffre !',
        'any.required': 'Le champs de votre poid ne peut être vide !',
        'number.max': 'Le champs de votre poid ne peut être supérieur a 100 !',
        'number.positive': 'Le champs de votre poid ne peut être inférieur a zéro !',

    }),

    idClient: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
        'any.number': 'Le champs de votre  idClient doit être un chiffre !',
        'number.empty': 'Le champs de votre  idClient doit être un chiffre !',
        'any.required': 'Le champs de votre  idClient ne peut être vide !',
        'number.max': 'Le champs de votre  idClient ne peut être supérieur a 100 !',
        'number.positive': 'Le champs de votre  idClient ne peut être inférieur a zéro !',

    }),

    idCommande: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
        'any.number': 'Le champs de votre   idCommande doit être un chiffre !',
        'number.empty': 'Le champs de votre   idCommande doit être un chiffre !',
        'any.required': 'Le champs de votre   idCommande ne peut être vide !',
        'number.max': 'Le champs de votre   idCommande ne peut être supérieur a 100 !',
        'number.positive': 'Le champs de votre   idCommande ne peut être inférieur a zéro !',

    }),
    idTransporteur: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
        'any.number': 'Le champs de votre  idTransporteur doit être un chiffre !',
        'number.empty': 'Le champs de votre  idTransporteur doit être un chiffre !',
        'any.required': 'Le champs de votre  idTransporteur ne peut être vide !',
        'number.max': 'Le champs de votre  idTransporteur ne peut être supérieur a 100 !',
        'number.positive': 'Le champs de votre  idTransporteur ne peut être inférieur a zéro !',

    }),


    

});

module.exports = livraisonPostSchema;

// source REGEX email : https://emailregex.com/
//Cette syntaxe fonctionne aussi :
//.pattern(/^(?=.*[\d])(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])[\w!@#$%^&*]{8,}$/).required()
//.boolean().invalid(false) ou  .pattern(new RegExp(/^(?i)(true)$/))