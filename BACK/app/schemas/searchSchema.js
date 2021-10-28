const Joi = require('joi');

// doc JOI => https://joi.dev/api/?v=17.4.0

/**
 * Valide les informations reçu dans le body et envoyé par les utilisateurs
 * @name search 
 * @group Joi - Vérifie les informations du body
 * @property {string} code - Le code a 6 chiffres envoyé par Twillio
 * @return {json} messages - Un texte adapté en cas d'érreur, en json, informant l'utilisateur d'un non respect des régles du schéma de validation
 */
const search = Joi.object({
    search: Joi.string()
        .max(200)
        .pattern(new RegExp(/^[^<>&#=+*"|{}]*$/))
        .required()
        .messages({
            'string.max': `Votre recherche doit avoir une longeur maximum de {#limit} caractéres !`,
            'string.empty': `Le champs de votre recherche ne peut être vide !`,
            'string.pattern.base': 'Le format de votre recherche est incorrect',
            'any.required':'Le champs de votre recherche ne peut être vide !',

        }),

});

module.exports = search;