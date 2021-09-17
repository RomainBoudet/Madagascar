const Joi = require('joi');

/**
 * Valide les informations reçu dans le body et envoyé par les utilisateurs
 * @name addProductSchema
 * @group Joi - Vérifie les informations du body
 * @property {string} title - le titre qu'un produit doit avoir
 * @property {string} description - le contenu de l'produit, celui-ci est obligatioire et doit avoir au minimum 15 caractères
 * @property {int} authorId - l'id de l'auteur de l'produit
 * @property {int} tagId - l'id de la catégorie à laquelle appartient l'produit
 * @return {json} messages - Un texte adapté a l'érreur en json, informant l'utilisateur d'un non respect des régles du schéma de validation
 */
const addProductSchema = Joi.object({
  title: Joi.string().when('$requestType', { is: 'POST', then: Joi.required() }),
  description: Joi.string().min(15).when('$requestType', { is: 'POST', then: Joi.required() }),
  authorId: Joi.number().integer().positive().when('$requestType', { is: 'POST', then: Joi.required() }),
  tagId: Joi.number().integer().positive().when('$requestType', { is: 'POST', then: Joi.required() }),
});

module.exports = addProductSchema;
