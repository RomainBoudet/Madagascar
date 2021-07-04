const port = process.env.PORT || 5000;
const consol = require('../services/colorConsole');
/**
 * Le controller chargé de centraliser les appels a la base de données concernant l'acceuil du site
 */
const mainController = {
  /**
   * Méthode chargé d'aller chercher les informations relatives à la page d'acceuil
   * @param {Express.Response} res - l'objet représentant la réponse
   */
  init: async (_, res) => {
    try {

      consol.controller("La doc OPEN API Swagger a été demandé ! ")
      res.redirect(`https://localhost:${port}/api-docs#/`)



    } catch (error) {
      console.trace('Erreur dans la méthode init du mainController :', error);
      res.status(500).json(error);
    }
  },
};

module.exports = mainController;