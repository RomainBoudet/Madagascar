const Joi = require('joi');

// doc JOI => https://joi.dev/api/?v=17.4.0
// https://github.com/sideway/joi/blob/v17.4.0/API.md#list-of-errors


/**
 * Valide les informations reçu dans le body et envoyé par les utilisateurs
 * @name choixLivraisonSchema 
 * @group Joi - Vérifie les informations du body
 * @property {string} nomTransporteur - l'identifiant d'un transporteur en BDD : chiffre allant de 1 a 4.
 * @return {json} messages - Un texte adapté en cas d'érreur, en json, informant l'utilisateur d'un non respect des régles du schéma de validation
 */
const choixLivraisonSchema = Joi.object({


    nomTransporteur: Joi.any().valid('La poste Colissimo', 'Chronopost Chrono Relais 13', 'Retrait sur le stand', 'Chronopost Chrono13', 'Chronopost Shop2Shop')
    .required().messages({
        'any.only': ` Seules les transporteur avec comme nom : 'La poste Collisimmo', 'Chronopost Chrono Relais 13', 'Retrait sur le stand', 'Chronopost Chrono13', 'Chronopost Shop2Shop' peuvent être inséré.`,
        'any.required': 'Le champs de votre choix de transporteur ne peut pas être vide !',
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
