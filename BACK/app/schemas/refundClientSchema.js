const Joi = require('joi');

// doc JOI => https://joi.dev/api/?v=17.4.0

/**
 * Valide les informations reçu dans le body et envoyé par les clients
 * @name refundClientSchema 
 * @group Joi - Vérifie les informations du body
 * @return {json} messages - Un texte adapté a l'érreur en json, informant l'utilisateur d'un non respect des régles du schéma de validation
 */
const refundClientSchema = Joi.object({

    commande: Joi.string()
        .required()
        .regex(/^[0-9\.]*$/)
        .messages({
            'any.required': `Le champs de votre référence commande ne peut être vide !`,
            'string.empty': `Le champs de votre référence commande ne peut être vide !`,
            'string.pattern.base': 'Le format de votre référence commande est incorrect',
        }),


});

module.exports = refundClientSchema;