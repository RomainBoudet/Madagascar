const Joi = require('joi');

// doc JOI => https://joi.dev/api/?v=17.4.0
// https://github.com/sideway/joi/blob/v17.4.0/API.md#list-of-errors


/**
 * Valide les informations reçu dans le body et envoyé par les utilisateurs
 * @name choixLivraisonSchema 
 * @group Joi - Vérifie les informations du body
 * @property {string} idTransporteur - l'identifiant d'un transporteur en BDD : chiffre allant de 1 a 4.
 * @return {json} messages - Un texte adapté en cas d'érreur, en json, informant l'utilisateur d'un non respect des régles du schéma de validation
 */
const choixLivraisonSchema = Joi.object({


    idTransporteur: Joi.number()
    .integer()
    .positive()
    .min(1)
    .max(5)
    .required()
    .messages({
        'any.number': 'Le champs de votre idTransporteur doit être un chiffre !',
        'number.empty': 'Le champs de votre idTransporteur doit être un chiffre !',
        'any.required': 'Le champs de votre idTransporteur ne peut être vide !',
        'number.max': 'Le champs de votre idTransporteur ne peut être supérieur a 4 !',
        'number.positive': 'Le champs de votre idTransporteur ne peut être inférieur a zéro !',

    }),

    commentaire: Joi.string()
    .pattern(new RegExp(/^[^<>&#=+*/"|{}]*$/))
    .max(500)
    .allow(null, '')
    .messages({
        'string.max': `Votre commentaire doit avoir une longeur maximum de {#limit} caractéres !`,
        'string.pattern.base': 'Le format de votre commentaire est incorrect : Il ne doit pas être composé d\'un de ces caractéres spéciaux : [<>&#=+*/"|]',
    }),
    
    sendSmsWhenShipping: Joi.boolean().sensitive()
        .messages({
            'boolean.base': `Seule les valeurs true ou false seront accéptées.`,
        }),



});

module.exports = choixLivraisonSchema;

// source REGEX email : https://emailregex.com/
//Cette syntaxe fonctionne aussi :
//.pattern(/^(?=.*[\d])(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])[\w!@#$%^&*]{8,}$/).required()
//.boolean().invalid(false) ou  .pattern(new RegExp(/^(?i)(true)$/))