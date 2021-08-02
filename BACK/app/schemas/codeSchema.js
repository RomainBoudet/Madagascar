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
   code: Joi.string()
     .pattern(new RegExp(/^\d{6}$/))
     .required()
     .max(6)
     .messages({
      'string.max': `Votre code doit avoir une longeur maximum de {#limit} caractéres !`,
      'string.empty': `Le champs de votre code ne peut être vide !`,
      'string.pattern.base':'Le format de votre code est incorrect, il doit être composé uniquement de chiffre',
     }),

});

 module.exports = code;