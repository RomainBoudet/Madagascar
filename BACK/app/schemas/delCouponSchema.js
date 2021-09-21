const Joi = require('joi');

// doc JOI => https://joi.dev/api/?v=17.4.0
// https://github.com/sideway/joi/blob/v17.4.0/API.md#list-of-errors


/**
 * Valide les informations reçu dans le body et envoyé par les utilisateurs
 * @name delCoupon 
 * @group Joi - Vérifie les informations du body
 * @property {string} code - Le code a 6 chiffres envoyé par Twillio
 * @return {json} messages - Un texte adapté en cas d'érreur, en json, informant l'utilisateur d'un non respect des régles du schéma de validation
 */
const delCoupon = Joi.object({

    coupon: Joi.string()
        .regex(/^[0-9A-Za-z\-]*$/)
        .required()
        .messages({
            'any.required': 'Le champs de votre coupon ne peut être vide !',
            'string.pattern.base': 'Le format de votre coupon commande ne peut contenir que des caractéres alphanuméric et des "-"',

        }),

});

module.exports = delCoupon