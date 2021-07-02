const Joi = require('joi');

// doc JOI => https://joi.dev/api/?v=17.4.0

/**
 * Valide les informations reçu dans le body et envoyé par les utilisateurs
 * @name userLoginSchema 
 * @group Joi - Vérifie les informations du body
 * @property {string} pseudo - le pseudo qu'un utilisateur utilise pour se connecter, ne doit pas être identique a un autre pseudo et contenir au minimum 3 caractéres et 40 au maximum, sans espace. 
 * @property {string} password - le mot de passe d'un utilisateur, doit avoir 8 caractéres au minimum, une lettre minuscule, une lettre majuscule, un nombre et un caractéres spécial parmis : (@#$%^&*)
 * @return {json} messages - Un texte adapté a l'érreur en json, informant l'utilisateur d'un non respect des régles du schéma de validation
 */
const userLoginSchema = Joi.object({
  pseudo: Joi.string()
      .min(3)
      .max(40)
      .required()
      .alphanum()
      .messages({
        'string.empty': `Le champs de votre pseudo ne peut être vide !`,
        'string.min': `Votre pseudo doit doit avoir un minimum de {#limit} caractéres!`,
        'string.max': `Votre pseudo doit doit avoir un maximum de {#limit} caractéres !`,
        'string.alphanum': 'Votre pseudo ne doit contenir que des caractéres alpha-numériques',
      }),
  password: Joi.string()
      .pattern(new RegExp(/^(?=.*[\d])(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])[\w!@#$%^&*]{8,}$/))
      .required()
      .messages({
        'string.pattern.base':'Le format de votre mot de passe est incorrect : Il doit contenir au minimum 8 caractéres avec minimum, un chiffre, une lettre majuscule, une lettre minuscule et un carctére spécial parmis : ! @ # $% ^ & *',
      }),
});

module.exports = userLoginSchema;
