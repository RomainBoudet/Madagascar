const Joi = require('joi');

// doc JOI => https://joi.dev/api/?v=17.4.0
// https://github.com/sideway/joi/blob/v17.4.0/API.md#list-of-errors


/**
 * Valide les informations reçu dans le body et envoyé par les utilisateurs
 * @name resetPwdSchema 
 * @group Joi - Vérifie les informations du body
 * @property {string} pseudo - le pseudo qu'un utilisateur utilise pour se connecter, ne doit pas être identique a un autre pseudo et contenir au minimum 3 caractéres et 40 au maximum, sans espace. 
 * @property {string} password - le mot de passe d'un utilisateur, doit avoir 8 caractéres au minimum, une lettre minuscule, une lettre majuscule, un nombre et un caractéres spécial parmis : (@#$%^&*)
 * @property {string} PasswordConfirm - doit être identique au newPassword
 * @return {json} messages - Un texte adapté en cas d'érreur, en json, informant l'utilisateur d'un non respect des régles du schéma de validation
 */

 const resetPwdSchema = Joi.object({
    pseudo: Joi.string()
    .min(3).max(40)
    .pattern(/^\S{3,}$/)
    .alphanum()
    .required()
    .messages({
    'string.empty': `Le champs de votre pseudo ne peut être vide !`,
     'string.min': `Votre pseudo doit doit avoir un minimum de {#limit} caractéres!`,
     'string.max': ` Votre pseudo doit doit avoir un maximum de {#limit} caractéres !`,
     'string.pattern.base':' Le format de votre pseudo est incorrect : il doit contenir au minimum 3 caractéres et ne pas être composé d\'espaces !',
     'string.alphanum': 'Votre pseudo ne doit contenir que des caractéres alpha-numériques',
   }),
   newPassword: Joi.string()
     .pattern(new RegExp(/^(?=.*[\d])(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])[\w!@#$%^&*]{8,}$/))
     .required()
     .messages({
      'string.empty': `Le champs de votre password ne peut être vide !`,
      'string.pattern.base':'Le format de votre mot de passe est incorrect : Il doit contenir au minimum 8 caractéres avec minimum, un chiffre, une lettre majuscule, une lettre minuscule et un carctére spécial parmis : ! @ # $% ^ & * ',
     }),
     passwordConfirm: Joi.ref('newPassword'),


}).with('newPassword', 'passwordConfirm');

 module.exports = resetPwdSchema;