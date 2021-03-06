// doc JOI => https://joi.dev/api/?v=17.4.0

const Joi = require('joi');

const verifyEmailSchema = Joi.object({
    userId: Joi.number().integer().positive()
        .required()
        .messages({
            'any.required': `L'URL doit contenir un userId pour être valide!`,
        }),
    token: Joi.string()
        .pattern(new RegExp(/^[A-Za-z0-9_./-]{15,}$/))
        .required()
        .messages({
            'any.required':'L\'URL doit contenir un token pour être valide!',
            'string.empty': `L'URL doit contenir un token pour être valide!`,
            'string.pattern.base':'Votre format de token est incorrect !',
        }),

}).with('userId', 'token');

module.exports = verifyEmailSchema;