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
    tll: Joi.number()
        .integer()
        .positive()
        .min(1000)
        .max(31536000000)
        .required()
        .messages({
            'any.number': 'Le champs de votre ttl doit être un chiffre !',
            'number.empty': 'Le champs de votre ttl doit être un chiffre !',
            'any.required': 'Le champs de votre ttl ne peut être vide !',
            'number.max': 'Le champs de votre ttl ne peut être supérieur a 6 !',
            'number.positive': 'Le champs de votre ttl doit être un chiffre positif !',
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
    isActive: Joi.boolean().sensitive()
        .messages({
            'boolean.base': `Seule les valeurs true ou false seront accéptées.`,
        }),



});

module.exports = coupon