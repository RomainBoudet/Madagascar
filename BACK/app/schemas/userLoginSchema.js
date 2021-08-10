const Joi = require('joi');

// doc JOI => https://joi.dev/api/?v=17.4.0

/**
 * Valide les informations reçu dans le body et envoyé par les clients
 * @name userLoginSchema 
 * @group Joi - Vérifie les informations du body
 * @property {string} email - l'email qu'un client utilise pour se connecter, ne doit pas être identique a un autre email. 
 * @property {string} password - le mot de passe d'un utilisateur, doit avoir 8 caractéres au minimum, une lettre minuscule, une lettre majuscule, un nombre et un caractéres spécial parmis : (@#$%^&*)
 * @return {json} messages - Un texte adapté a l'érreur en json, informant l'utilisateur d'un non respect des régles du schéma de validation
 */
const userLoginSchema = Joi.object({
  email: Joi.string()
    .required()
    .max(200)
     .pattern(new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/))
      .messages({
        'any.required': `Le champs de votre email ne peut être vide !`,
        'string.max': `Votre email doit avoir une longeur maximum de {#limit} caractéres !`,
        'string.empty': `Le champs de votre email ne peut être vide !`,
        'string.pattern.base':'Le format de votre email est incorrect',
      }),
  password: Joi.string()
      .pattern(new RegExp(/^(?=.*[\d])(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])[\w!@#$%^&*]{8,}$/))
      .required()
      .max(200)
      .messages({
        'any.required': `Le champs de votre mot de passe ne peut être vide !`,
        'string.max': `Votre mot de passe doit avoir une longeur maximum de {#limit} caractéres !`,
        'string.empty': `Le champs de votre mot de passe ne peut être vide !`,
        'string.pattern.base':'Le format de votre mot de passe est incorrect : Il doit contenir au minimum 8 caractéres avec minimum, un chiffre, une lettre majuscule, une lettre minuscule et un carctére spécial parmis : ! @ # $% ^ & *',
      }),
});

module.exports = userLoginSchema;
