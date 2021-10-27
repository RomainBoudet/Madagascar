const Joi = require('joi');

// doc JOI => https://joi.dev/api/?v=17.4.0
// https://github.com/sideway/joi/blob/v17.4.0/API.md#list-of-errors


/**
 * Valide les informations reçu dans le body et envoyé par les utilisateurs
 * @name coupon 
 * @group Joi - Vérifie les informations du body
 * @property {string} code - Le code a 6 chiffres envoyé par Twillio
 * @return {json} messages - Un texte adapté en cas d'érreur, en json, informant l'utilisateur d'un non respect des régles du schéma de validation
 */
const coupon = Joi.object({
    ttl: Joi.number()
        .integer()
        .positive()
        .min(1)
        .max(365)
        .required()
        .messages({
            'any.number': 'Le champs de votre ttl doit être un chiffre !',
            'number.empty': 'Le champs de votre ttl doit être un chiffre !',
            'any.required': 'Le champs de votre ttl ne peut être vide !',
            'number.max': 'Le champs de votre ttl ne peut être supérieur a 1 an !',
            'number.min': 'Le champs de votre ttl ne peut être inférieur 1 journée !',
            'number.positive': 'Le champs de votre ttl doit être un chiffre positif !',
        }),

    postfix: Joi.string()
        .alphanum()
        .min(1)
        .max(10)
        .required()
        .messages({
            'string.max': `Votre postfix doit avoir une longeur maximum de {#limit} caractéres !`,
            'string.empty': `Le champs de votre postfix ne peut être vide !`,
            'string.min': `Votre postfix doit avoir une longeur minimum de {#limit} caractéres !`,
            'any.required': 'Le champs de votre postfix ne peut être vide !',
        }),

    prefix: Joi.string()
        .alphanum()
        .min(1)
        .max(10)
        .required()
        .messages({
            'string.max': `Votre prefix doit avoir une longeur maximum de {#limit} caractéres !`,
            'string.empty': `Le champs de votre prefix ne peut être vide !`,
            'string.min': `Votre prefix doit avoir une longeur minimum de {#limit} caractéres !`,
            'any.required': 'Le champs de votre prefix ne peut être vide !',
        }),

    montant: Joi.string()
        .regex(/^\d+(\,\d{0,2})?$/)
        .required()
        .messages({
            'string.pattern.base': "Le format de votre montant est incorrect. Dans le cas d'un chiffre a virgule, merci d'utiliser une virgule comme séparateur"
        }),

    idClient: Joi.number()
        .integer()
        .positive()
        .messages({
            'any.number': 'Le champs de votre montant doit être un chiffre !',
            'number.empty': 'Le champs de votre montant doit être un chiffre !',
            'any.required': 'Le champs de votre montant ne peut être vide !',
            'number.positive': 'Le champs de votre montant doit être un chiffre positif !',
        }),

});

module.exports = coupon