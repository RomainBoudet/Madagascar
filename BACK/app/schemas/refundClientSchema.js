const Joi = require('joi');

// doc JOI => https://joi.dev/api/?v=17.4.0

/**
 * Valide les informations reçu dans le body et envoyé par les clients
 * @name refundClientSchema 
 * @group Joi - Vérifie les informations du body
 * @property {string} email - l'email qu'un client utilise pour se connecter, ne doit pas être identique a un autre email. 
 * @property {string} password - le mot de passe d'un utilisateur, doit avoir 8 caractéres au minimum, une lettre minuscule, une lettre majuscule, un nombre et un caractéres spécial parmis : (@#$%^&*)
 * @return {json} messages - Un texte adapté a l'érreur en json, informant l'utilisateur d'un non respect des régles du schéma de validation
 */
const refundClientSchema = Joi.object({

    commande: Joi.string()
        .required()
        .regex(/^[0-9\.]*$/)
        .messages({
            'any.required': `Le champs de votre référence commande ne peut être vide !`,
            'string.empty': `Le champs de votre référence commande ne peut être vide !`,
            'string.pattern.base': 'Le format de votre référence commande est incorrect',
        }),


});

module.exports = refundClientSchema;