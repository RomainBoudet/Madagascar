const Joi = require('joi');

// doc JOI => https://joi.dev/api/?v=17.4.0
// https://github.com/sideway/joi/blob/v17.4.0/API.md#list-of-errors


/**
 * Valide les informations reçu dans le body et envoyé par les utilisateurs
 * @name adresseSchema 
 * @group Joi - Vérifie les informations du body
 * @property {string} password - le mot de passe d'un utilisateur, doit avoir 8 caractéres au minimum, une lettre minuscule, une lettre majuscule, un nombre et un caractéres spécial parmis : (@#$%^&*)
 * @property {string} passwordConfirm - doit être identique au password
 * @property {string} prenom - Le prenom de l'utilisateur, devant contenir au minimum 2 caractéres, sans espaces.
 * @property {string} nomFamille - le nom de famille de l'utilisateur devant contenir au minimum 2 caractéres, sans espaces.
 * @property {string} email - l'adresse email d'un utilisateur doit correspondre a un format valide.
 * @return {json} messages - Un texte adapté en cas d'érreur, en json, informant l'utilisateur d'un non respect des régles du schéma de validation
 */
const adresseSchema = Joi.object().keys({
    prenom: Joi.string().trim()
        .min(2)
        .max(200)
        .required()
        .pattern(new RegExp(/^[^<>&#=+*/"|{}]*$/))
        .messages({
            'string.max': `Votre prenom doit avoir une longeur maximum de {#limit} caractéres !`,
            'string.empty': `Le champs de votre prénom ne peut être vide !`,
            'string.min': `Votre prenom doit avoir une longeur minimum de {#limit} caractéres !`,
            'string.pattern.base': 'Le format de votre nom est incorrect : Il ne doit pas être composé d\'un de ces caractéres spéciaux : [<>&#=+*/"|] !',
        }),

    nomFamille: Joi.string().trim()
        .min(2)
        .max(200)
        .required()
        .pattern(new RegExp(/^[^<>&#=+*/"|{}]*$/))
        .messages({
            'string.max': `Votre nom de famille doit avoir une longeur maximum de {#limit} caractéres !`,
            'string.empty': `Le champs de votre nom ne peut être vide !`,
            'string.min': `Votre nom doit avoir une longeur minimum de {#limit} caractéres !`,
            'string.pattern.base': 'Le format de votre nom est incorrect : Il ne doit pas être composé d\'un de ces caractéres : spéciaux [<>&#=+*/"|] !',
        }),
    ligne1: Joi.string()
        .required()
        .max(200)
        .trim()
        .pattern(new RegExp(/^[^<>&#=+*/"|{}]*$/))
        .messages({
            'string.max': `Votre adresse doit avoir une longeur maximum de {#limit} caractéres !`,
            'string.empty': `Le champs de votre adresse ne peut être vide !`,
            'string.pattern.base': 'Le format de votre adresse est incorrect',
        }),
    ligne2: Joi.string()
        .max(200)
        .trim()
        .pattern(new RegExp(/^[^<>&#=+*/"|{}]*$/))
        .messages({
            'string.max': `Votre adresse doit avoir une longeur maximum de {#limit} caractéres !`,
            'string.pattern.base': 'Le format de votre adresse est incorrect',
        }),
        ligne3: Joi.string()
        .max(200)
        .trim()
        .pattern(new RegExp(/^[^<>&#=+*/"|{}]*$/))
        .messages({
            'string.max': `Votre adresse doit avoir une longeur maximum de {#limit} caractéres !`,
            'string.pattern.base': 'Le format de votre adresse est incorrect',
        }),
    telephone: Joi.string()
        .pattern(new RegExp(/^\+[1-9]\d{10}$/))
        .required()
        .max(12)
        .messages({
            'string.max': `Votre numéro de télphone doit avoir une longeur maximum de {#limit} caractéres ! n'oublier pas de supprimer le premier 0 de votre numéro.`,
            'string.empty': `Le champs de votre numéro de téléphone ne peut être vide !`,
            'string.pattern.base': 'Le format de votre numéro de téléphone est incorrect : Il doit être composé de 12 caractéres, commencer par +33, suivi de votre numéro de téléphone portable sans le permier 0 .',
        }),
    titre: Joi.string()
        .required()
        .max(200)
        .trim()
        .messages({
            'string.max': `Le titre de votre adresse doit avoir une longeur maximum de {#limit} caractéres !`,
            'string.empty': `Le champs de votre titre d'adresse ne peut être vide !`,
        }),
        ville: Joi.string()
        .required()
        .max(500)
        .trim()
        .messages({
            'string.max': `La localité de votre adresse doit avoir une longeur maximum de {#limit} caractéres !`,
            'string.empty': `Le champs de votre localité d'adresse ne peut être vide !`,
        }),
        pays: Joi.string()
        .required()
        .max(500)
        .trim()
        .messages({
            'string.max': `Le pays de votre adresse doit avoir une longeur maximum de {#limit} caractéres !`,
            'string.empty': `Le pays de votre adresse ne peut être vide !`,
        }),

        codePostal: Joi.string()
        .pattern(new RegExp(/^[0-9]{5}$/))
        .required()
        .max(5)
        .trim()
        .messages({
            'string.max': `Votre code postal doit avoir une longeur maximum de {#limit} caractéres ! n'oublier pas de supprimer le premier 0 de votre numéro.`,
            'string.max': `Le code postale de votre adresse doit avoir une longeur maximum de {#limit} caractéres !`,
            'string.empty': `Le code postal de votre adresse ne peut être vide !`,
            'string.pattern.base': 'Le format de votre code postale est incorrect : Il doit être composé de 5 chiffres.',
        }),


});

module.exports = adresseSchema;

// source REGEX email : https://emailregex.com/
//Cette syntaxe fonctionne aussi :
//.pattern(/^(?=.*[\d])(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])[\w!@#$%^&*]{8,}$/).required()