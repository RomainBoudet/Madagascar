const Joi = require('joi');

// doc JOI => https://joi.dev/api/?v=17.4.0

/**
 * Valide les informations reçu dans le body et envoyé par les clients
 * @name refundSchema 
 * @group Joi - Vérifie les informations du body
 * @property {string} email - l'email qu'un client utilise pour se connecter, ne doit pas être identique a un autre email. 
 * @property {string} password - le mot de passe d'un utilisateur, doit avoir 8 caractéres au minimum, une lettre minuscule, une lettre majuscule, un nombre et un caractéres spécial parmis : (@#$%^&*)
 * @return {json} messages - Un texte adapté a l'érreur en json, informant l'utilisateur d'un non respect des régles du schéma de validation
 */
const refundSchema = Joi.object({
    /* email: Joi.string()
        .max(200)
        .pattern(new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/))
        .messages({
            'any.required': `Le champs de votre email ne peut être vide !`,
            'string.max': `Votre email doit avoir une longeur maximum de {#limit} caractéres !`,
            'string.empty': `Le champs de votre email ne peut être vide !`,
            'string.pattern.base': 'Le format de votre email est incorrect',
        }),


    idClient: Joi.number()
        .integer()
        .positive()
        .messages({
            'any.number': 'Le champs de votre idClient doit être un chiffre !',
            'number.empty': 'Le champs de votre idClient doit être un chiffre !',
            'any.required': 'Le champs de votre idClient ne peut être vide !',
            'number.positive': 'Le champs de  idClient code doit être un chiffre positif !',

        }), */

    commande: Joi.string()
        .required()
        .regex(/^([0-9]+[.]{1}[0-9]+[.]{1}[0-9]+[.]{1}[0-9]+[.]{1}[0-9]+){1}([.]{1}[0-9]+[.]{1}[0-9]+)*$/)
        .messages({
            'any.required': `Le champs de votre commande ne peut être vide !`,
            'string.empty': `Le champs de votre commande ne peut être vide !`,
            'string.pattern.base': 'Le format de votre commande est incorrect',
        }),

    montant: Joi.number()
        .positive()
        .messages({
            'any.number': 'Le champs de votre montant doit être un chiffre !',
            'number.empty': 'Le champs de votre montant doit être un chiffre !',
            'any.required': 'Le champs de votre montant ne peut être vide !',
            'number.positive': 'Le champs de  montant code doit être un chiffre positif !',

        }),



});
//}).xor('email', 'idClient');

module.exports = refundSchema;