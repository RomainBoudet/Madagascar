const Joi = require('joi');

// doc JOI => https://joi.dev/api/?v=17.4.0
// https://github.com/sideway/joi/blob/v17.4.0/API.md#list-of-errors


/**
 * Valide les informations reçu dans le body et envoyé par les utilisateurs
 * @name userUpdateSchema 
 * @group Joi - Vérifie les informations du body
 * @property {string} pseudo - le pseudo qu'un utilisateur utilise pour se connecter, ne doit pas être identique a un autre pseudo et contenir au minimum 3 caractéres et 40 au maximum, sans espace. 
 * @property {string} password - le mot de passe d'un utilisateur, doit avoir 8 caractéres au minimum, une lettre minuscule, une lettre majuscule, un nombre et un caractéres spécial parmis : (@#$%^&*)
 * @property {string} newPasswordConfirm - doit être identique au newPassword
 * @property {string} newPassword - Le nouveau password chois par l'utilisateur
 * @property {string} fisrtName - Le firstname de l'utilisateur, devant contenir au minimum 2 caractéres, sans espaces.
 * @property {string} lastName - le lastname de l'utilisateur devant contenir au minimum 2 caractéres, sans espaces.
 * @property {string} emailAddress - l'adresse email d'un utilisateur doit correspondre a un format valide.
 * @return {json} messages - Un texte adapté en cas d'érreur, en json, informant l'utilisateur d'un non respect des régles du schéma de validation
 */
const userUpdateSchema = Joi.object({
  firstName: Joi.string()
      .min(2)
      .alphanum()
      .pattern(/^\S{2,}$/)
      .messages({
        'string.min': `Votre prenom doit avoir une longeur minimum de {#limit} caractéres !`,
        'string.pattern.base':'Le format de votre prénom est incorrect : il doit contenir au minimum 2 caractéres et ne pas être composé d\'espaces !',
        'string.alphanum': 'Votre prénom ne doit contenir que des caractéres alpha-numériques',
      }),
  lastName: Joi.string()
      .min(2)
      .alphanum()
      .pattern(/^\S{2,}$/)
      .messages({
        'string.min': `Votre nom doit avoir une longeur minimum de {#limit} caractéres !`,
        'string.pattern.base':'Le format de votre nom est incorrect : il doit contenir au minimum 2 caractéres et ne pas être composé d\'espaces ! ',
        'string.alphanum': 'Votre nom de famille ne doit contenir que des caractéres alpha-numériques',
      }),
  emailAddress: Joi.string()
     .pattern(new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/))
      .messages({
        'string.pattern.base':'Le format de votre email est incorrect',
      }),
  pseudo: Joi.string()
     .min(3).max(40)
     .pattern(/^\S{3,}$/)
     .alphanum()
     .messages({
      'string.min': `Votre pseudo doit doit avoir un minimum de {#limit} caractéres!`,
      'string.max': ` Votre pseudo doit doit avoir un maximum de {#limit} caractéres !`,
      'string.pattern.base':' Le format de votre pseudo est incorrect : il doit contenir au minimum 3 caractéres et ne pas être composé d\'espaces !',
      'string.alphanum': 'Votre pseudo ne doit contenir que des caractéres alpha-numériques',
    }),
  password: Joi.string()
     .pattern(new RegExp(/^(?=.*[\d])(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])[\w!@#$%^&*]{8,}$/))
     .required()
     .messages({
      'string.empty': `Votre mot de passe est nécéssaire pour une mise a jour de votre profil`,
      'string.pattern.base':'Le format de votre mot de passe est incorrect : Il doit contenir au minimum 8 caractéres avec minimum, un chiffre, une lettre majuscule, une lettre minuscule et un carctére spécial parmis : ! @ # $% ^ & * ',
     }),
  newPassword: Joi.string()
  .pattern(new RegExp(/^(?=.*[\d])(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])[\w!@#$%^&*]{8,}$/))
  .messages({
   'string.pattern.base':'Le format de votre mot de passe est incorrect : Il doit contenir au minimum 8 caractéres avec minimum, un chiffre, une lettre majuscule, une lettre minuscule et un carctére spécial parmis : ! @ # $% ^ & * ',
  }),
  newPasswordConfirm: Joi.ref('newPassword'),
  avatar: Joi.string().messages({
    'string.dataUri':'Le chemin menant a l\'image de votre avatar est incorrect',
   }),

  /* avatar: Joi.when('$requestType', { is: 'PATCH', then: Joi.string() .dataUri().messages({
    'string.dataUri':'Le chemin menant a l\'image de votre avatar est incorrect',
   }) }), */
}).with('newPassword', 'newPasswordConfirm');

module.exports = userUpdateSchema;

// source REGEX email : https://emailregex.com/

//! Il faudra améliorer la REGEX pour ne pas laisser passer un firsname Lastname avec que des espaces...
//! .pattern(new RegExp(/^[^\s]$/))  => accept aucun espace / Nous on veut tous les espace que tu veux mais au moins 2 caracteres autres et pas d'espaces autour de ce deux caractéres...

//Cette syntaxe fonctionne aussi :
//.pattern(/^(?=.*[\d])(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])[\w!@#$%^&*]{8,}$/).required()
