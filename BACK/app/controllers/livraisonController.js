const Livraison = require('../models/livraison');
const Transporteur = require('../models/transporteur');
const LigneLivraison = require('../models/ligneLivraison');
const {
    arrondi
} = require('../services/arrondi');

/**
 * Une méthode qui va servir a intéragir avec le model Livraison pour les intéractions avec la BDD
 * Retourne un json
 * @name livraisonController
 * @param {Express.Request} req - l'objet représentant la requête
 * @param {Express.Response} res - l'objet représentant la réponse
 * @return {JSON}  - une donnée en format json
 */
const livraisonController = {


    getAll: async (req, res) => {
        try {
            const livraisons = await Livraison.findAll();

            livraisons.map(livraison => livraison.poid = Number(livraison.poid));

            res.status(200).json(livraisons);
        } catch (error) {
            console.trace('Erreur dans la méthode getAll du livraisonController :',
                error);
            res.status(500).json(error.message);
        }
    },

    getAllTransporteur: async (req, res) => {
        try {
            const transporteurs = await Transporteur.findAll();

            transporteurs.map(transporteur => delete transporteur.createdDate);
            transporteurs.map(transporteur => delete transporteur.updatedDate);
            transporteurs.map(transporteur => transporteur.fraisExpedition = arrondi(transporteur.fraisExpedition));

            res.status(200).json(transporteurs);
        } catch (error) {
            console.trace('Erreur dans la méthode getAllTransporteur du livraisonController :',
                error);
            res.status(500).json(error.message);
        }
    },


    getAllLigneLivraison: async (req, res) => {
        try {
            const livraisons = await LigneLivraison.findAll();

            res.status(200).json(livraisons);
        } catch (error) {
            console.trace('Erreur dans la méthode getAllLigneLivraison du livraisonController :',
                error);
            res.status(500).json(error.message);
        }
    },

    getOne: async (req, res) => {
        try {

            const livraison = await Livraison.findOne(req.params.id);
            res.json(livraison);

        } catch (error) {
            console.trace('Erreur dans la méthode getOne du livraisonController :',
                error);
            res.status(500).json(error.message);
        }
    },
    getOneLigneLivraison: async (req, res) => {
        try {

            const livraison = await LigneLivraison.findOne(req.params.id);
            res.json(livraison);

        } catch (error) {
            console.trace('Erreur dans la méthode getOneLigneLivraison du livraisonController :',
                error);
            res.status(500).json(error.message);
        }
    },


    getByIdCommande: async (req, res) => {
        try {

            const livraison = await Livraison.findByIdCommande(req.params.id);
            res.json(livraison);

        } catch (error) {
            console.trace('Erreur dans la méthode getByIdCommande du livraisonController :',
                error);
            res.status(500).json(error.message);
        }
    },

    getByIdClient: async (req, res) => {
        try {

            const livraison = await Livraison.findByIdClient(req.params.id);
            res.json(livraison);

        } catch (error) {
            console.trace('Erreur dans la méthode getByIdClient du livraisonController :',
                error);
            res.status(500).json(error.message);
        }
    },


    getLigneLivraisonByIdLivraison: async (req, res) => {
        try {

            const livraison = await LigneLivraison.findByIdLivraison(req.params.id);
            res.json(livraison);

        } catch (error) {
            console.trace('Erreur dans la méthode getLigneLivraisonByIdLivraison du livraisonController :',
                error);
            res.status(500).json(error.message);
        }
    },







    new: async (req, res) => {
        try {

            const data = {};

            data.reference = req.body.reference;
            data.numeroSuivi = req.body.numeroSuivi;
            data.URLSuivi = req.body.URLSuivi;
            data.poid = req.body.poid;
            data.idClient = req.body.idClient;
            data.idCommande = req.body.idCommande;
            data.idTransporteur = req.body.idTransporteur;

            const newLivraison = new Livraison(data);
            console.log(req.body);
            console.log('newLivraison ==>> ', newLivraison);

            await newLivraison.save();
            res.json(newLivraison);
        } catch (error) {
            console.log(`Erreur dans la méthode new du livraisonController : ${error.message}`);
            res.status(500).json(error.message);
        }
    },
    newLigneLivraison: async (req, res) => {
        try {

            const data = {};

            data.quantiteLivraison = req.body.quantiteLivraison;
            data.idLivraison = req.body.idLivraison;
            data.idCommandeLigne = req.body.idCommandeLigne;


            const newLivraison = new LigneLivraison(data);


            await newLivraison.save();
            res.json(newLivraison);
        } catch (error) {
            console.log(`Erreur dans la méthode newLigneLivraison du livraisonController : ${error.message}`);
            res.status(500).json(error.message);
        }
    },

    newTransporteur: async (req, res) => {
        try {

            const data = {};
            data.nom = req.body.nom;
            data.description = req.body.description;
            data.fraisExpedition = req.body.fraisExpedition;
            data.estimeArrive = req.body.estimeArrive;
            data.logo = req.body.logo;
            data.idClient = req.body.idClient;
            data.idCommande = req.body.idCommande;
            data.idTransporteur = req.body.idTransporteur;

            data.fraisExpedition = arrondi(data.fraisExpedition);
            data.estimeArrive = arrondi(data.estimeArrive);


            const newTransporteur = new Transporteur(data);
            await newTransporteur.save();

            res.json(newTransporteur);
        } catch (error) {
            console.log(`Erreur dans la méthode newTransporteur du livraisonController : ${error.message}`);
            res.status(500).json(error.message);
        }
    },

    update: async (req, res) => {
        try {

            const {
                id
            } = req.params;

            if (Object.keys(req.body).length === 0) {
                return res.status(200).json({message: 'Vous n\'avez envoyé aucune données à modifier.'});
            }

            const updateLivraison = await Livraison.findOne(id);

            const reference = req.body.reference;
            const numeroSuivi = req.body.numeroSuivi;
            const URLsuivi = req.body.URLsuivi;
            const poid = req.body.poid;
            const idClient = req.body.idClient;
            const idCommande = req.body.idCommande;
            const idTransporteur = req.body.idTransporteur;

            let message = {};

            if (reference) {
                updateLivraison.reference = reference;
                message.reference = 'Votre nouveau reference a bien été enregistré ';
            } else if (!reference) {
                message.reference = 'Votre reference n\'a pas changé';
            }

            if (numeroSuivi) {
                updateLivraison.numeroSuivi = numeroSuivi;
                message.numeroSuivi = 'Votre nouveau numeroSuivi a bien été enregistré ';
            } else if (!numeroSuivi) {
                message.numeroSuivi = 'Votre numeroSuivi n\'a pas changé';
            }

            if (URLsuivi) {
                updateLivraison.URLsuivi = URLsuivi;
                message.URLsuivi = 'Votre nouveau URLsuivi a bien été enregistré ';
            } else if (!URLsuivi) {
                message.URLsuivi = 'Votre nom de URLsuivi n\'a pas changé';
            }


            if (poid) {
                updateLivraison.poid = poid;
                message.poid = 'Votre nouveau poid a bien été enregistré ';
            } else if (!poid) {
                message.poid = 'Votre poid n\'a pas changé';
            }

            if (idCommande) {
                updateLivraison.idCommande = idCommande;
                message.idCommande = 'Votre nouveau idCommande a bien été enregistré ';
            } else if (!idCommande) {
                message.idCommande = 'Votre idCommande n\'a pas changé';
            }


            if (idClient) {
                updateLivraison.idClient = idClient;
                message.idClient = 'Votre nouveau idClient a bien été enregistré ';
            } else if (!idClient) {
                message.idClient = 'Votre idClient n\'a pas changé';
            }


            if (idTransporteur) {
                updateLivraison.idTransporteur = idTransporteur;
                message.idTransporteur = 'Votre nouveau idTransporteur a bien été enregistré ';
            } else if (!idTransporteur) {
                message.idTransporteur = 'Votre nom de idransporteur n\'a pas changé';
            }


            await updateLivraison.update();

            res.json(message);

        } catch (error) {
            console.log(`Erreur dans la méthode update du livraisonController ${error.message}`);
            res.status(500).json(error.message);
        }
    },

    updateTransporteur: async (req, res) => {
        try {

            const {
                id
            } = req.params;

            if (Object.keys(req.body).length === 0) {
                return res.status(200).json({message: 'Vous n\'avez envoyé aucune données à modifier.'});
            }

                const updateTransporteur = await Transporteur.findOne(id);


            const nom = req.body.nom;
            const description = req.body.description;
            const fraisExpedition = req.body.fraisExpedition;
            const estimeArrive = req.body.estimeArrive;
            const logo = req.body.logo;

            let message = {};

            if (nom) {
                updateTransporteur.nom = nom;
                message.nom = 'Votre nouveau nomTransporteur a bien été enregistré ';
            } else if (!nom) {
                message.nom = 'Votre nom de nomTransporteur n\'a pas changé';
            }
            if (description) {
                updateTransporteur.description = description;
                message.description = 'Votre nouveau description a bien été enregistré ';
            } else if (!description) {
                message.description = 'Votre description n\'a pas changé';
            }
            if (fraisExpedition) {
                updateTransporteur.fraisExpedition = fraisExpedition;
                message.fraisExpedition = 'Votre nouveau fraisExpedition a bien été enregistré ';
            } else if (!fraisExpedition) {
                message.fraisExpedition = 'Votre fraisExpedition n\'a pas changé';
            }

            if (estimeArrive) {
                updateTransporteur.estimeArrive = estimeArrive;
                message.estimeArrive = 'Votre nouveau estimeArrive a bien été enregistré ';
            } else if (!estimeArrive) {
                message.estimeArrive = 'Votre estimeArrive n\'a pas changé';
            }

            if (logo) {
                updateTransporteur.logo = logo;
                message.logo = 'Votre nouveau logo a bien été enregistré ';
            } else if (!logo) {
                message.logo = 'Votre logo n\'a pas changé';
            }


            await updateTransporteur.update();

            res.json(message);

        } catch (error) {
            console.log(`Erreur dans la méthode updateTransporteur du livraisonController ${error.message}`);
            res.status(500).json(error.message);
        }
    },


    updateLigneLivraison: async (req, res) => {
        try {

            const {
                id
            } = req.params;

            if (Object.keys(req.body).length === 0) {
                return res.status(200).json({message: 'Vous n\'avez envoyé aucune données à modifier.'});
            }

            const updateLivraison = await LigneLivraison.findOne(id);


            const quantiteLivraison = req.body.quantiteLivraison;
            const idLivraison = req.body.idLivraison;
            const idCommandeLigne = req.body.idCommandeLigne;


            let message = {};

            if (quantiteLivraison) {
                updateLivraison.quantiteLivraison = quantiteLivraison;
                message.quantiteLivraison = 'Votre nouveau quantiteLivraison a bien été enregistré ';
            } else if (!quantiteLivraison) {
                message.quantiteLivraison = 'Votre quantiteLivraison n\'a pas changé';
            }


            if (idLivraison) {
                updateLivraison.idLivraison = idLivraison;
                message.idLivraison = 'Votre nouveau idLivraison a bien été enregistré ';
            } else if (!idLivraison) {
                message.idLivraison = 'Votre nom de idLivraison n\'a pas changé';
            }


            if (idCommandeLigne) {
                updateLivraison.idCommandeLigne = idCommandeLigne;
                message.idCommandeLigne = 'Votre nouveau idCommandeLigne a bien été enregistré ';
            } else if (!idCommandeLigne) {
                message.idCommandeLigne = 'Votre idCommandeLigne n\'a pas changé';
            }

            console.log("updateLivraison dans le controller ==>>", updateLivraison);

            await updateLivraison.update();

            res.json(message);

        } catch (error) {
            console.log(`Erreur dans la méthode updateLigneLivraison du livraisonController ${error.message}`);
            res.status(500).json(error.message);
        }
    },


    delete: async (req, res) => {

        try {

            const livraisonInDb = await Livraison.findOne(req.params.id);

            const livraison = await livraisonInDb.delete();

            res.json(livraison);

        } catch (error) {
            console.trace('Erreur dans la méthode delete du livraisonController :',
                error);
            res.status(500).json(error.message);
        }
    },

    deleteTransporteur: async (req, res) => {

        try {

            const transporteurInDb = await Transporteur.findOne(req.params.id);

            const transporteur = await transporteurInDb.delete();

            res.json(transporteur);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteTransporteur du livraisonController :',
                error);
            res.status(500).json(error.message);
        }
    },


    deleteLigneLivraison: async (req, res) => {

        try {

            const livraisonInDb = await LigneLivraison.findOne(req.params.id);

            const livraison = await livraisonInDb.delete();

            res.json(livraison);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteLigneLivraison du livraisonController :',
                error);
            res.status(500).json(error.message);
        }
    },

    deleteByIdClient: async (req, res) => {

        try {

            const livraisonsInDb = await Livraison.findByIdClient(req.params.id);
            const arrayDeleted = [];
            for (const livraisonInDb of livraisonsInDb) {

                const livraison = await livraisonInDb.deleteByIdClient();
                arrayDeleted.push(livraison);
            }


            res.json(arrayDeleted[0]);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteByIdClient du livraisonController :',
                error);
            res.status(500).json(error.message);
        }
    },

    deleteByIdCommande: async (req, res) => {

        try {

            const livraisonsInDb = await Livraison.findByIdCommande(req.params.id);
            const arrayDeleted = [];
            for (const livraisonInDb of livraisonsInDb) {

                const livraison = await livraisonInDb.deleteByIdCommande();
                arrayDeleted.push(livraison);
            }


            res.json(arrayDeleted[0]);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteByIdCommande du livraisonController :',
                error);
            res.status(500).json(error.message);
        }
    },
    deleteLigneLivraisonByIdLivraison: async (req, res) => {

        try {

            const livraisonsInDb = await LigneLivraison.findByIdLivraison(req.params.id);
            const arrayDeleted = [];
            for (const livraisonInDb of livraisonsInDb) {

                const livraison = await livraisonInDb.deleteByIdLivraison();
                arrayDeleted.push(livraison);
            }


            res.json(arrayDeleted[0]);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteLigneLivraisonByIdLivraison du livraisonController :',
                error);
            res.status(500).json(error.message);
        }
    },




}

module.exports = livraisonController;