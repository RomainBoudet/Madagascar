const Joi = require('joi');

// doc JOI => https://joi.dev/api/?v=17.4.0
// https://github.com/sideway/joi/blob/v17.4.0/API.md#list-of-errors


/**
 * Valide les informations reçu dans le body et envoyé par les utilisateurs
 * @name phoneNumber 
 * @group Joi - Vérifie les informations du body
 * @property {string} phoneNumber - Le numéro de téléphone d'un administrateur
 * @return {json} messages - Un texte adapté en cas d'érreur, en json, informant l'utilisateur d'un non respect des régles du schéma de validation
 */
 const phoneNumber = Joi.object({
   phoneNumber: Joi.string()
     .pattern(new RegExp(/^\+[1-9]\d{10}$/))
     .required()
     .max(12)
     .messages({
      'any.required':'le champs de votre numéro de téléphone ne peut être vide',
      'string.max': `Votre numéro de télphone doit avoir une longeur maximum de {#limit} caractéres ! n'oublier pas de supprimer le premier 0 de votre numéro.`,
      'string.empty': `Le champs de votre numéro de téléphone ne peut être vide !`,
      'string.pattern.base':'Le format de votre numéro de téléphone est incorrect : Il doit être composé de 12 caractéres, commencer par +33, suivi de votre numéro de téléphone portable sans le permier 0 .',
     }),


});

 module.exports = phoneNumber;