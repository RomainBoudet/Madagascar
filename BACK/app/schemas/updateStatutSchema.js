const Joi = require('joi');

// doc JOI => https://joi.dev/api/?v=17.4.0
// https://github.com/sideway/joi/blob/v17.4.0/API.md#list-of-errors


/**
 * Valide les informations reçu dans le body et envoyé par l'administrateur
 * @name updateStatutSchema 
 * @group Joi - Vérifie les informations du body
 * @property {string} commande - Un identifiant, ou une référence (chiffres séparés par des points).
 * @property {string} numeroSuivi - Le numéro de suivi fourni par le transporteur.
 * @property {string} confirmNumeroSuivi - La confirmation du numéro de suivi
 * @property {string} poid - Le poid en gramme compris entre 10 et 50 000.
 * @return {json} messages - Un texte adapté en cas d'érreur, en json, informant l'utilisateur d'un non respect des régles du schéma de validation
 */
const updateStatutSchema = Joi.object({
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
    
    statut: Joi.alternatives().try(
    
        Joi.number().integer().max(7).required().messages({
            'number.max': `Votre statut doit avoir une longeur maximum de {#limit} caractéres !`,
            'any.required': 'Le champs de votre statut ne peut être vide !',
            'number': 'Le format de votre statut est incorrect : son identifiant devrait être un chiffre',

        }),
        Joi.string().pattern(new RegExp(/^[^<>@_&#=+*/"|{}]*$/))
        .required().messages({
            'any.only': ` Seul les commandes avec comme statut :'Paiement validé', 'En cours de préparation'et 'Prêt pour expédition' peuvent être mise a jour. Pour passer au statut 'Expédié', vous devez utiliser la route dédié : admin/livraison/new`,
            'any.required': 'Le champs de votre statut ne peut être vide !',
            'string.pattern.base': 'Le format de votre commentaire est incorrect : Il ne doit pas être composé d\'un de ces caractéres spéciaux : [<>@_&#=+*/"|]',
        }),
        // Avec ce schéma ci-dessous (.valid()), on ne laisse plus s'exprimer l'API avec la distance de Leven
        /* Joi.any().valid('Paiement validé', 'En cours de préparation', 'Prêt pour expédition' )
        .required().messages({
            'any.only': ` Seul les commandes avec comme statut :'Paiement validé', 'En cours de préparation'et 'Prêt pour expédition' peuvent être mise a jour. Pour passer au statut 'Expédié', vous devez utiliser la route dédié : admin/livraison/new`,
            'any.required': 'Le champs de votre statut ne peut être vide !',
            'string.pattern.base': 'Le format de votre statut est incorrect : Il doit posséder au minimum 11 chiffres et 15 au maximum pour la poste et entre 6 et 10 pour DHL !',
        }), */
        
    ),
    confirmStatut: Joi.ref('statut'),



}).with('statut', 'confirmStatut');

module.exports = updateStatutSchema;