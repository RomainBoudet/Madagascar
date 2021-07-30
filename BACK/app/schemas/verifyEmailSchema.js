const Joi = require('joi');


const verifyEmailSchema = Joi.object({
  email: Joi.string()
    .max(200)
    .pattern(new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/))
    .required()
    .messages({
      'string.max': `Votre email doit avoir une longeur maximum de {#limit} caractéres !`,
      'string.empty': `Le champs email ne peut être vide.`,
      'string.pattern.base': 'Votre format d\'email est incorrect !',
    }),
});

module.exports = verifyEmailSchema;