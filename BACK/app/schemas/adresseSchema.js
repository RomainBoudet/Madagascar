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
    password: Joi.string()
        //.pattern(new RegExp(/^(?=.*[\d])(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])[\w!@#$%^&*]{8,}$/)) => je veux tomber sur l'érreur d'authentification..
        .required()
        .max(200)
        .messages({
            'string.max': `Votre mot de passe doit avoir une longeur maximum de {#limit} caractéres !`,
            'string.empty': `Le champs de votre mot de passe ne peut être vide !`,
            'any.required': 'Le champs de votre mot de passe ne peut être vide !',
        }),

    prenom: Joi.string().trim()
        .min(2)
        .max(200)
        .pattern(new RegExp(/^[^<>&#=+*/"|{}]*$/))
        .messages({
            'string.max': `Votre prenom doit avoir une longeur maximum de {#limit} caractéres !`,
            'string.empty': `Le champs de votre prénom ne peut être vide !`,
            'string.min': `Votre prenom doit avoir une longeur minimum de {#limit} caractéres !`,
            'any.required': 'Le champs de votre prenom ne peut être vide !',
            'string.pattern.base': 'Le format de votre nom est incorrect : Il ne doit pas être composé d\'un de ces caractéres spéciaux : [<>&#=+*/"|] !',
        }),

    nomFamille: Joi.string().trim()
        .min(2)
        .max(200)
        .pattern(new RegExp(/^[^<>&#=+*/"|{}]*$/))
        .messages({
            'any.required': 'Le champs de votre nom de famille ne peut être vide !',
            'string.max': `Votre nom de famille doit avoir une longeur maximum de {#limit} caractéres !`,
            'string.empty': `Le champs de votre nom ne peut être vide !`,
            'string.min': `Votre nom doit avoir une longeur minimum de {#limit} caractéres !`,
            'string.pattern.base': 'Le format de votre nom est incorrect : Il ne doit pas être composé d\'un de ces caractéres : spéciaux [<>&#=+*/"|] !',
        }),

    ligne1: Joi.string()
        .max(200)
        .trim()
        .pattern(new RegExp(/^[^<>&#=+*/"|{}]*$/))
        .messages({
            'any.required': 'Le champs de votre premiére ligne d\'adresse ne peut être vide !',
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
        .max(12)
        .messages({
            'any.required': 'Le champs de votre numéro de télephone ne peut être vide ! Il pourra être utilisé par le transporteur seulement.',
            'string.max': `Votre numéro de télphone doit avoir une longeur maximum de {#limit} caractéres ! n'oublier pas de supprimer le premier 0 de votre numéro.`,
            'string.empty': `Le champs de votre numéro de téléphone ne peut être vide !`,
            'string.pattern.base': 'Le format de votre numéro de téléphone est incorrect : Il doit être composé de 12 caractéres, commencer par +33, suivi de votre numéro de téléphone portable sans le permier 0 .',
        }),


    titre: Joi.string()
        .max(200)
        .trim()
        .messages({
            'any.required': 'Le champs de votre titre d\'adresse ne peut être vide !',
            'string.max': `Le titre de votre adresse doit avoir une longeur maximum de {#limit} caractéres !`,
            'string.empty': `Le champs de votre titre d'adresse ne peut être vide !`,
        }),

    ville: Joi.string()
        .max(500)
        .trim()
        .messages({
            'any.required': 'Le champs de votre ville ne peut être vide !',
            'string.max': `La localité de votre adresse doit avoir une longeur maximum de {#limit} caractéres !`,
            'string.empty': `Le champs de votre localité d'adresse ne peut être vide !`,
        }),


    pays: Joi.string()
        .max(500)
        .trim()
        .messages({
            'any.required': 'Le champs de votre pays ne peut être vide !',
            'string.max': `Le pays de votre adresse doit avoir une longeur maximum de {#limit} caractéres !`,
            'string.empty': `Le pays de votre adresse ne peut être vide !`,
        }),


    codePostal: Joi.string()
        .pattern(new RegExp(/^[0-9]{5}$/))
        .max(5)
        .trim()
        .messages({
            'any.required': 'Le champs de votre code postal ne peut être vide !',
            'string.max': `Votre code postal doit avoir une longeur maximum de {#limit} caractéres ! n'oublier pas de supprimer le premier 0 de votre numéro.`,
            'string.max': `Le code postale de votre adresse doit avoir une longeur maximum de {#limit} caractéres !`,
            'string.empty': `Le code postal de votre adresse ne peut être vide !`,
            'string.pattern.base': 'Le format de votre code postale est incorrect : Il doit être composé de 5 chiffres.',
        }),
    envoie: Joi.string()
        .pattern(new RegExp(/^[Tt][Rr][Uu][Ee]$/))
        //.boolean().invalid(false) // impossible de trouver la syntaxe pour personnaliser le message d'érreur dans la doc...
        .messages({
            'string.empty': `La valeure de ce bouton radio ne peut être vide !`,
            'string.pattern.base': 'La valeur de ce champs ne peut que être true si le champs existe',
        }),


});

module.exports = adresseSchema;

// source REGEX email : https://emailregex.com/
//Cette syntaxe fonctionne aussi :
//.pattern(/^(?=.*[\d])(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])[\w!@#$%^&*]{8,}$/).required()