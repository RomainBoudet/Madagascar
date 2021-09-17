const Joi = require('joi');

// doc JOI => https://joi.dev/api/?v=17.4.0
// https://github.com/sideway/joi/blob/v17.4.0/API.md#list-of-errors


/**
 * Valide les informations reçu dans le body et envoyé par les utilisateurs
 * @name code 
 * @group Joi - Vérifie les informations du body
 * @property {string} code - Le code a 6 chiffres envoyé par Twillio
 * @return {json} messages - Un texte adapté en cas d'érreur, en json, informant l'utilisateur d'un non respect des régles du schéma de validation
 */
const code = Joi.object({
  code: Joi.number()
    .integer()
    .positive()
    .min(6)
    .max(6)
    .required()
    .messages({
      'any.number': 'Le champs de votre code doit être un chiffre !',
      'number.empty': 'Le champs de votre code doit être un chiffre !',
      'any.required': 'Le champs de votre code ne peut être vide !',
      'number.max': 'Le champs de votre code ne peut être supérieur a 6 !',
      'number.positive': 'Le champs de votre code doit être un chiffre positif !',

    }),

});

module.exports = code;