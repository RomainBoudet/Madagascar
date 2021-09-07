const Joi = require('joi');

// doc JOI => https://joi.dev/api/?v=17.4.0
// https://github.com/sideway/joi/blob/v17.4.0/API.md#list-of-errors


/**
 * Valide les informations reçu dans le body et envoyé par les utilisateurs
 * @name smsChoiceSchema 
 * @group Joi - Vérifie les informations du body
 * @property {string} code - Le code a 6 chiffres envoyé par Twillio
 * @return {json} messages - Un texte adapté en cas d'érreur, en json, informant l'utilisateur d'un non respect des régles du schéma de validation
 */
const smsChoiceSchema = Joi.object({
    true: Joi.boolean().valid(true).sensitive()
        .messages({
            'boolean.base': `Seule les valeurs true ou false seront accéptées.`,
        }),
    false: Joi.boolean().valid(false).sensitive()
        .messages({
            'boolean.base': `Seule les valeurs true ou false seront accéptées.`,
        }),

}).xor('true', 'false');

module.exports = smsChoiceSchema;