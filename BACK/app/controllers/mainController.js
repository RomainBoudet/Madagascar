const port = process.env.PORT || 5000;
const consol = require('../services/colorConsole');
const Shop = require('../models/shop');
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







  getAllShop: async (req, res) => {
    try {
      const clients = await Shop.findAll();

      res.status(200).json(clients);
    } catch (error) {
      console.trace('Erreur dans la méthode getAllShop du mainController :',
        error);
      res.status(500).end();
    }
  },
  getOneShop: async (req, res) => {
    try {

      const client = await Shop.findOne(req.params.id);
      res.json(client);

    } catch (error) {
      console.trace('Erreur dans la méthode getOneShop du mainController :',
        error);
      res.status(500).end();
    }
  },
  newShop: async (req, res) => {
    try {

      const data = {};

      data.nom = req.body.nom;
      data.adresse1 = req.body.adresse1;
      data.adresse2 = req.body.adresse2;
      data.adresse3 = req.body.adresse3;
      data.codePostal = req.body.codePostal;
      data.ville = req.body.ville;
      data.pays = req.body.pays;
      data.logo = req.body.logo;
      data.texteIntro = req.body.texteIntro;
      data.emailContact = req.body.emailContact;
      data.telephone = req.body.telephone;

      const newClient = new Shop(data);
      await newClient.save();
      res.json(newClient);
    } catch (error) {
      console.log(`Erreur dans la méthode newShop du mainController: ${error.message}`);
      res.status(500).end();
    }
  },

  updateShop: async (req, res) => {
    try {

      const {
        id
      } = req.params;

      if (Object.keys(req.body).length === 0) {
        return res.status(200).json({message: 'Vous n\'avez envoyé aucune données à modifier.'});
    }

      const updateClient = await Shop.findOne(id);

      const nom = req.body.nom;
      const adresse1 = req.body.adresse1;
      const adresse2 = req.body.adresse2;
      const adresse3 = req.body.adresse3;
      const codePostal = req.body.codePostal;
      const ville = req.body.ville;
      const pays = req.body.pays;
      const logo = req.body.logo;
      const texteInfo = req.body.texteInfo;
      const emailContact = req.body.emailContact;
      const telephone = req.body.telephone;

      let userMessage = {};

      if (nom) {
        updateClient.nom = nom;
        userMessage.nom = 'Votre nouveau nom de site a bien été enregistré ';
      } else if (!nom) {
        userMessage.nom = 'Votre nom de site n\'a pas changé';
      }


      if (adresse1) {
        updateClient.adresse1 = adresse1;
        userMessage.adresse1 = 'Votre nouveau adresse1 a bien été enregistré ';
      } else if (!adresse1) {
        userMessage.adresse1 = 'Votre adresse1 n\'a pas changé';
      }

      if (adresse2) {
        updateClient.adresse2 = adresse2;
        userMessage.adresse2 = 'Votre nouveau adresse2 a bien été enregistré ';
      } else if (!adresse2) {
        userMessage.adresse2 = 'Votre adresse2 n\'a pas changé';
      }

      if (adresse3) {
        updateClient.adresse3 = adresse3;
        userMessage.adresse3 = 'Votre nouveau adresse3 a bien été enregistré ';
      } else if (!adresse3) {
        userMessage.adresse3 = 'Votre adresse3 n\'a pas changé';
      }
      if (codePostal) {
        updateClient.codePostal = adresse2;
        userMessage.codePostal = 'Votre nouveau codePostal a bien été enregistré ';
      } else if (!codePostal) {
        userMessage.codePostal = 'Votre codePostal n\'a pas changé';
      }
      if (ville) {
        updateClient.ville = ville;
        userMessage.ville = 'Votre nouveau ville a bien été enregistré ';
      } else if (!ville) {
        userMessage.ville = 'Votre ville n\'a pas changé';
      }
      if (pays) {
        updateClient.pays = pays;
        userMessage.pays = 'Votre nouveau pays a bien été enregistré ';
      } else if (!pays) {
        userMessage.pays = 'Votre pays n\'a pas changé';
      }
      if (logo) {
        updateClient.logo = logo;
        userMessage.logo = 'Votre nouveau logo a bien été enregistré ';
      } else if (!logo) {
        userMessage.logo = 'Votre logo n\'a pas changé';
      }
      if (texteInfo) {
        updateClient.texteInfo = texteInfo;
        userMessage.texteInfo = 'Votre nouveau texteInfo a bien été enregistré ';
      } else if (!texteInfo) {
        userMessage.texteInfo = 'Votre texteInfo n\'a pas changé';
      }
      if (emailContact) {
        updateClient.emailContact = emailContact;
        userMessage.emailContact = 'Votre nouveau emailContact a bien été enregistré ';
      } else if (!emailContact) {
        userMessage.emailContact = 'Votre emailContact n\'a pas changé';
      }
      if (telephone) {
        updateClient.telephone = telephone;
        userMessage.telephone = 'Votre nouveau telephone a bien été enregistré ';
      } else if (!telephone) {
        userMessage.telephone = 'Votre telephone n\'a pas changé';
      }



      await updateClient.update();

      res.json(userMessage);

    } catch (error) {
      console.log(`Erreur dans la méthode  updateShop du mainController : ${error.message}`);
      res.status(500).end();
    }
  },

  deleteShop: async (req, res) => {

    try {

      const clientInDb = await Shop.findOne(req.params.id);

      const client = await clientInDb.delete();

      res.json(client);

    } catch (error) {
      console.trace('Erreur dans la méthode deleteShop du mainController :',
        error);
      res.status(500).end();
    }
  },
















};

module.exports = mainController;