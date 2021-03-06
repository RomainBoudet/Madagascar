const Joi = require('joi');

// doc JOI => https://joi.dev/api/?v=17.4.0
// https://github.com/sideway/joi/blob/v17.4.0/API.md#list-of-errors


/**
 * Valide les informations reçu dans le body et envoyé par les utilisateurs
 * @name userSigninSchema 
 * @group Joi - Vérifie les informations du body
 * @property {string} password - le mot de passe d'un utilisateur, doit avoir 8 caractéres au minimum, une lettre minuscule, une lettre majuscule, un nombre et un caractéres spécial parmis : (@#$%^&*)
 * @property {string} passwordConfirm - doit être identique au password
 * @property {string} prenom - Le prenom de l'utilisateur, devant contenir au minimum 2 caractéres, sans espaces.
 * @property {string} nomFamille - le nom de famille de l'utilisateur devant contenir au minimum 2 caractéres, sans espaces.
 * @property {string} email - l'adresse email d'un utilisateur doit correspondre a un format valide.
 * @return {json} messages - Un texte adapté en cas d'érreur, en json, informant l'utilisateur d'un non respect des régles du schéma de validation
 */
const userSigninSchema = Joi.object().keys({
  prenom: Joi.string().trim()
    .min(2)
    .max(200)
    .required()
    .pattern(new RegExp(/^[^<>&#=+*/"|{}]*$/))
    .messages({
      'any.required':'le champs de votre prénom ne peut être vide ',
      'string.max': `Votre prenom doit avoir une longeur maximum de {#limit} caractéres !`,
      'string.empty': `Le champs de votre prénom ne peut être vide !`,
      'string.min': `Votre prenom doit avoir une longeur minimum de {#limit} caractéres !`,
      'string.pattern.base': 'Le format de votre nom est incorrect : Il ne doit pas être composé d\'un de ces caractéres spéciaux : [<>&#=+*/"|] !',
    }),

  nomFamille: Joi.string().trim()
    .min(2)
    .max(200)
    .required()
    .pattern(new RegExp(/^[^<>&#=+*/"|{}]*$/))
    .messages({
      'any.required':'le champs de votre nom de famille ne peut être vide ',
      'string.max': `Votre nom de famille doit avoir une longeur maximum de {#limit} caractéres !`,
      'string.empty': `Le champs de votre nom ne peut être vide !`,
      'string.min': `Votre nom doit avoir une longeur minimum de {#limit} caractéres !`,
      'string.pattern.base': 'Le format de votre nom est incorrect : Il ne doit pas être composé d\'un de ces caractéres : spéciaux [<>&#=+*/"|] !',
    }),
  email: Joi.string()
    .required()
    .max(200)
    .trim()
    .pattern(new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/))
    .messages({
      'any.required':'Le champs de votre email ne peut être vide ',
      'string.max': `Votre email doit avoir une longeur maximum de {#limit} caractéres !`,
      'string.empty': `Le champs de votre email ne peut être vide !`,
      'string.pattern.base': 'Le format de votre email est incorrect',
    }),
  password: Joi.string()
    .pattern(new RegExp(/^(?=.*[\d])(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])[\w!@#$%^&*]{8,}$/))
    .required()
    .max(200)
    .trim()
    .messages({
      'object.with' : 'Le champs de confirmation de votre mot de passe ne correspond pas avec votre mot de passe !',
      'any.required':'le champs de votre mot de passe ne peut être vide ',
      'string.empty': `Le champs de votre email ne peut être vide !`,
      'string.max': `Votre mot de passe doit avoir une longeur maximum de {#limit} caractéres !`,
      'string.pattern.base': 'Le format de votre mot de passe est incorrect : Il doit contenir au minimum 8 caractéres avec minimum, un chiffre, une lettre majuscule, une lettre minuscule et un carctére spécial parmis : ! @ # $% ^ & * ',
    }),
     passwordConfirm: Joi.string()
     //.valid(Joi.ref('password')).required().strict() ok,  mais comment on reprend l'érreur par défault ?
    .pattern(new RegExp(/^(?=.*[\d])(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])[\w!@#$%^&*]{8,}$/))
    .max(200)
    .trim()
    .messages({
      'object.with' : 'Le champs de confirmation de votre mot de passe ne correspond pas avec votre mot de passe !',
      'any.required':'le champs de la confirmation de votre mot de passe ne peut être vide ',
      'string.empty': `Le champs la confirmation de de votre email ne peut être vide !`,
      'string.max': `La confirmation de votre mot de passe doit avoir une longeur maximum de {#limit} caractéres !`,
      'string.pattern.base': 'Le format de la confirmation de votre mot de passe est incorrect : Il doit contenir au minimum 8 caractéres avec minimum, un chiffre, une lettre majuscule, une lettre minuscule et un carctére spécial parmis : ! @ # $% ^ & * ',
    }), 
  //passwordConfirm: Joi.ref('password'),

}).with('password', 'passwordConfirm');

module.exports = userSigninSchema;

// source REGEX email : https://emailregex.com/
//Cette syntaxe fonctionne aussi :
//.pattern(/^(?=.*[\d])(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])[\w!@#$%^&*]{8,}$/).required()