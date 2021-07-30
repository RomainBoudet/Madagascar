const Joi = require('joi');

// doc JOI => https://joi.dev/api/?v=17.4.0
// https://github.com/sideway/joi/blob/v17.4.0/API.md#list-of-errors


/**
 * Valide les informations reçu dans le body et envoyé par les utilisateurs
 * @name userUpdateSchema 
 * @group Joi - Vérifie les informations du body
 * @property {string} password - le mot de passe d'un utilisateur, doit avoir 8 caractéres au minimum, une lettre minuscule, une lettre majuscule, un nombre et un caractéres spécial parmis : (@#$%^&*)
 * @property {string} newPasswordConfirm - doit être identique au newPassword
 * @property {string} newPassword - Le nouveau password chois par l'utilisateur
 * @property {string} prenom - Le prenom de l'utilisateur, devant contenir au minimum 2 caractéres, sans espaces.
 * @property {string} nomFamille - le nomFamille de l'utilisateur devant contenir au minimum 2 caractéres, sans espaces.
 * @property {string} email - l'adresse email d'un utilisateur doit correspondre a un format valide.
 * @return {json} messages - Un texte adapté en cas d'érreur, en json, informant l'utilisateur d'un non respect des régles du schéma de validation
 */
const userUpdateSchema = Joi.object({
  prenom: Joi.string()
    .min(2)
    .max(200)
    .pattern(new RegExp(/^[^<>&#=+*/"|{}]*$/))
    .messages({
      'string.min': `Votre prenom doit avoir une longeur minimum de {#limit} caractéres !`,
      'string.max': `Votre prenom doit avoir une longeur maximum de {#limit} caractéres !`,
      'string.pattern.base': 'Le format de votre prénom est incorrect : il doit contenir au minimum 2 caractéres et ne pas être composé d\'espaces !',
      'string.alphanum': 'Votre prénom ne doit contenir que des caractéres alpha-numériques',
    }),
  nomFamille: Joi.string()
    .min(2)
    .max(200)
    .pattern(new RegExp(/^[^<>&#=+*/"|{}]*$/))
    .messages({
      'string.max': `Votre nom de famille doit avoir une longeur maximum de {#limit} caractéres !`,
      'string.min': `Votre nom doit avoir une longeur minimum de {#limit} caractéres !`,
      'string.pattern.base': 'Le format de votre nom est incorrect : il doit contenir au minimum 2 caractéres et ne pas être composé d\'espaces ! ',
      'string.alphanum': 'Votre nom de famille ne doit contenir que des caractéres alpha-numériques',
    }),
  email: Joi.string()
    .max(200)
    .pattern(new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/))
    .messages({
      'string.max': `Votre email doit avoir une longeur maximum de {#limit} caractéres !`,
      'string.pattern.base': 'Le format de votre email est incorrect',
    }),
  password: Joi.string()
    .max(200)
    .pattern(new RegExp(/^(?=.*[\d])(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])[\w!@#$%^&*]{8,}$/))
    .required()
    .messages({
      'string.max': `Votre mot de passe doit avoir une longeur maximum de {#limit} caractéres !`,
      'string.empty': `Votre mot de passe est nécéssaire pour une mise a jour de votre profil`,
      'string.pattern.base': 'Le format de votre mot de passe est incorrect : Il doit contenir au minimum 8 caractéres avec minimum, un chiffre, une lettre majuscule, une lettre minuscule et un carctére spécial parmis : ! @ # $% ^ & * ',
    }),
  
  newPassword: Joi.string()
    .max(200)
    .pattern(new RegExp(/^(?=.*[\d])(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])[\w!@#$%^&*]{8,}$/))
    .messages({
      'string.max': `Votre mot de passe doit avoir une longeur maximum de {#limit} caractéres !`,
      'string.pattern.base': 'Le format de votre mot de passe est incorrect : Il doit contenir au minimum 8 caractéres avec minimum, un chiffre, une lettre majuscule, une lettre minuscule et un carctére spécial parmis : ! @ # $% ^ & * ',
      'any.ref':'La confiration du mot de passe et le nouveau mot de passe ne sont pas identique !'
    }),
  newPasswordConfirm: Joi.ref('newPassword')
 
  
}).with('newPassword', 'newPasswordConfirm');

module.exports = userUpdateSchema;

// source REGEX email : https://emailregex.com/

//Cette syntaxe fonctionne aussi :
//.pattern(/^(?=.*[\d])(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])[\w!@#$%^&*]{8,}$/).required()