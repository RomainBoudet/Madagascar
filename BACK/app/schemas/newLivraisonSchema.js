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
            'number': 'Le format de votre commande est incorrect : sonidentifiant devrait être un chiffre',

        }),
        Joi.string().regex(/^([0-9]*[.]{1}[0-9]*)*$/).required().messages({
            'string.empty': `Le champs de votre commande ne peut être vide !`,
            'any.required': 'Le champs de votre commande ne peut être vide !',
            'string.pattern.base': 'Le format de votre commande est incorrect : il ne respecte pas la structure d\'une référénce',

        }),
    ),

    numeroSuivi: Joi.string()
        .min(2)
        .max(200)
        .pattern(new RegExp(/^[a-zA-Z0-9/]{5,30}$/))
        .required()
        .messages({
            'string.max': `Votre numeroSuivi doit avoir une longeur maximum de {#limit} caractéres !`,
            'string.empty': `Le champs de votre numeroSuivi ne peut être vide !`,
            'string.min': `Votre numeroSuivi doit avoir une longeur minimum de {#limit} caractéres !`,
            'any.required': 'Le champs de votre numeroSuivi ne peut être vide !',
            'string.pattern.base': 'Le format de votre numeroSuivi est incorrect : Il doit posséder au minimum 5 chiffres et / ou lettres !',
        }),

    confirmNumeroSuivi: Joi.string()
        .min(2)
        .max(200)
        .pattern(new RegExp(/^[a-zA-Z0-9/]{5,30}$/))
        .required()
        .messages({
            'string.max': `Votre numeroSuivi doit avoir une longeur maximum de {#limit} caractéres !`,
            'string.empty': `Le champs de votre numeroSuivi ne peut être vide !`,
            'string.min': `Votre numeroSuivi doit avoir une longeur minimum de {#limit} caractéres !`,
            'any.required': 'Le champs de votre numeroSuivi ne peut être vide !',
            'string.pattern.base': 'Le format de votre numeroSuivi est incorrect : Il doit posséder au minimum 5 chiffres et / ou lettres !',
        }),

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
