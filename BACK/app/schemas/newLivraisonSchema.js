const Joi = require('joi');

// doc JOI => https://joi.dev/api/?v=17.4.0
// https://github.com/sideway/joi/blob/v17.4.0/API.md#list-of-errors


/**
 * Valide les informations reçu dans le body et envoyé par l'administrateur
 * @name newLivraisonSchema 
 * @group Joi - Vérifie les informations du body
 * @property {string} commande - Un identifiant, ou une référence (chiffres séparés par des points).
 * @property {string} numeroSuivi - Le numéro de suivi fourni par le transporteur.
 * @property {string} confirmNumeroSuivi - La confirmation du numéro de suivi
 * @property {string} poid - Le poid en gramme compris entre 10 et 50 000.
 * @return {json} messages - Un texte adapté en cas d'érreur, en json, informant l'utilisateur d'un non respect des régles du schéma de validation
 */
const newLivraisonSchema = Joi.object({
    commande: Joi.alternatives().try(
        Joi.number().integer().required().messages({
            'string.empty': `Le champs de votre commande ne peut être vide !`,
            'any.required': 'Le champs de votre commande ne peut être vide !',
            'number': 'Le format de votre commande est incorrect : son identifiant devrait être un chiffre',

        }),
        Joi.string().regex(/^([0-9]+[.]{1}[0-9]+[.]{1}[0-9]+[.]{1}[0-9]+[.]{1}[0-9]+){1}([.]{1}[0-9]+[.]{1}[0-9]+)*$/).required().messages({
            'string.empty': `Le champs de votre commande ne peut être vide !`,
            'any.required': 'Le champs de votre commande ne peut être vide !',
            'string.pattern.base': 'Le format de votre commande est incorrect : il ne respecte pas la structure d\'une référénce',

        }),
    ),
    // 11 a 15 caractéres alpha pour la poste !!
    // DHL ? fake data a 9...  Noté 10 max sur leur site !
    // attention ici le message d'érreur en cas de non match d'un des 2 cas ne sera pas personalisé !
    numeroSuivi: Joi.alternatives().try(
        Joi.string()
        .pattern(new RegExp(/^[a-zA-Z0-9/]{11,15}$/))
        .required()
        .messages({
            'string.empty': `Le champs de votre numero de suivi ne peut être vide !`,
            'any.required': 'Le champs de votre numero de suivi ne peut être vide !',
            'string.pattern.base': 'Le format de votre numero de suivi est incorrect : Il doit posséder au minimum 11 chiffres et 15 au maximum pour la poste et entre 6 et 10 pour DHL !',
        }),
        Joi.string()
        .pattern(new RegExp(/^[a-zA-Z0-9/]{6,10}$/))
        .required()
        .messages({
            'string.empty': `Le champs de votre numero de suivi ne peut être vide !`,
            'any.required': 'Le champs de votre numero de suivi ne peut être vide !',
            'string.pattern.base': 'Le format de votre numero de suivi est incorrect : Il doit posséder au minimum 11 chiffres et 15 au maximum pour la poste et entre 6 et 10 pour DHL !',
        }),
    ),

    confirmNumeroSuivi: Joi.ref('numeroSuivi'),

    poid: Joi.number()
        .min(10)
        .integer()
        .positive()
        .max(50000)
        .required()
        .messages({
            'any.number': 'Le champs de votre poid doit être un chiffre !',
            'number.empty': 'Le champs de votre poid doit être un chiffre !',
            'any.required': 'Le champs de votre poid ne peut être vide !',
            'number.max': 'Le champs de votre poid ne peut être supérieur a {#limit} !',
            'number.min': 'Le champs de votre poid ne peut être inférieur a {#limit} !',
            'number.positive': 'Le champs de votre poid ne peut être inférieur a zéro !',

        }),



}).with('numeroSuivi', 'confirmNumeroSuivi');

module.exports = newLivraisonSchema;