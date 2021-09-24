const Commande = require('../models/commande');
const StatutCommande = require('../models/statutCommande');
const LigneCommande = require('../models/ligneCommande');
const ProduitRetour = require('../models/produitRetour');


/**
 * Une méthode qui va servir a intéragir avec le model Commande pour les intéractions avec la BDD
 * Retourne un json
 * @name commandeController
 * @param {Express.Request} req - l'objet représentant la requête
 * @param {Express.Response} res - l'objet représentant la réponse
 * @return {JSON}  - une donnée en format json
 */
const commandeController = {


    //! une méthode permettant de changer le statut d'une commande afin de suivre l'evolution d'une commande pour le client !


    updateStatut: async (req, res) => {
        try {
            // recois en body une commande et le statut que l'on voudrais lui attribuer ! 
            // recois ca par sms et par mail !?









            const commandes = await Commande.findAll();

            res.status(200).json(commandes);
        } catch (error) {
            console.trace('Erreur dans la méthode  updateStatut du commandeController :',
                error);
            res.status(500).end();
        }
    },

    getAll: async (req, res) => {
        try {
            const commandes = await Commande.findAll();

            res.status(200).json(commandes);
        } catch (error) {
            console.trace('Erreur dans la méthode getAll du commandeController :',
                error);
            res.status(500).json(error.message);
        }
    },
    getAllLigneCommande: async (req, res) => {
        try {
            const commandes = await LigneCommande.findAll();

            res.status(200).json(commandes);
        } catch (error) {
            console.trace('Erreur dans la méthode getAllLigneCommande du commandeController :',
                error);
            res.status(500).json(error.message);
        }
    },

    getAllStatutCommande: async (req, res) => {
        try {
            const commandes = await StatutCommande.findAll();

            res.status(200).json(commandes);
        } catch (error) {
            console.trace('Erreur dans la méthode getAllStatutCommande du commandeController :',
                error);
            res.status(500).json(error.message);
        }
    },




    getOne: async (req, res) => {
        try {

            const commande = await Commande.findOne(req.params.id);
            res.json(commande);

        } catch (error) {
            console.trace('Erreur dans la méthode getOne du commandeController :',
                error);
            res.status(500).json(error.message);
        }
    },
    getOneLigneCommande: async (req, res) => {
        try {

            const commande = await LigneCommande.findOne(req.params.id);
            res.json(commande);

        } catch (error) {
            console.trace('Erreur dans la méthode getOneLigneCommande du commandeController :',
                error);
            res.status(500).json(error.message);
        }
    },

    getOneStatutCommande: async (req, res) => {
        try {

            const commande = await StatutCommande.findOne(req.params.id);
            res.json(commande);

        } catch (error) {
            console.trace('Erreur dans la méthode getOneStatutCommande du commandeController :',
                error);
            res.status(500).json(error.message);
        }
    },


    getByIdClient: async (req, res) => {
        try {

            const commande = await Commande.findByIdClient(req.params.id);
            res.json(commande);

        } catch (error) {
            console.trace('Erreur dans la méthode getByIdClient du commandeController :',
                error);
            res.status(500).json(error.message);
        }
    },
    getLigneCommandeByIdCommande: async (req, res) => {
        try {

            const commande = await LigneCommande.findByIdCommande(req.params.id);
            res.json(commande);

        } catch (error) {
            console.trace('Erreur dans la méthode getLigneCommandeByIdCommande du commandeController :',
                error);
            res.status(500).json(error.message);
        }
    },






    new: async (req, res) => {
        try {

            const data = {};

            data.reference = req.body.reference;
            data.commentaire = req.body.commentaire;
            data.idCommandeStatut = req.body.idCommandeStatut;
            data.idClient = req.body.idClient;



            const newCommande = new Commande(data);

            await newCommande.save();
            res.json(newCommande);
        } catch (error) {
            console.log(`Erreur dans la méthode new du commandeController : ${error.message}`);
            res.status(500).json(error.message);
        }
    },
    newLigneCommande: async (req, res) => {
        try {

            const data = {};

            data.quantiteCommande = req.body.quantiteCommande;
            data.idProduit = req.body.idProduit;
            data.idCommande = req.body.idCommande;

            const newCommande = new LigneCommande(data);

            await newCommande.save();
            res.json(newCommande);
        } catch (error) {
            console.log(`Erreur dans la méthode newLigneCommande du commandeController : ${error.message}`);
            res.status(500).json(error.message);
        }
    },
    newStatutCommande: async (req, res) => {
        try {

            const data = {};

            data.statut = req.body.statut;
            data.description = req.body.description;


            const newCommande = new StatutCommande(data);

            await newCommande.save();
            res.json(newCommande);
        } catch (error) {
            console.log(`Erreur dans la méthode newStatutCommande du commandeController : ${error.message}`);
            res.status(500).json(error.message);
        }
    },

    update: async (req, res) => {
        try {

            const {
                id
            } = req.params;

            if (Object.keys(req.body).length === 0) {
                return res.status(200).json({
                    message: 'Vous n\'avez envoyé aucune données à modifier.'
                });
            }

            const updateCommande = await Commande.findOne(id);


            const reference = req.body.reference;
            const commentaire = req.body.commentaire;
            const idCommandeStatut = req.body.idCommandeStatut;
            const idClient = req.body.idClient;


            let message = {};

            if (reference) {
                updateCommande.reference = reference;
                message.reference = 'Votre nouveau reference a bien été enregistré ';
            } else if (!reference) {
                message.reference = 'Votre reference n\'a pas changé';
            }


            if (commentaire) {
                updateCommande.commentaire = commentaire;
                message.commentaire = 'Votre nouveau commentaire a bien été enregistré ';
            } else if (!commentaire) {
                message.commentaire = 'Votre nom de commentaire n\'a pas changé';
            }


            if (idCommandeStatut) {
                updateCommande.idCommandeStatut = idCommandeStatut;
                message.idCommandeStatut = 'Votre nouveau idCommandeStatut a bien été enregistré ';
            } else if (!idCommandeStatut) {
                message.idCommandeStatut = 'Votre idCommandeStatut n\'a pas changé';
            }


            if (idClient) {
                updateCommande.idClient = idClient;
                message.idClient = 'Votre nouveau idClient a bien été enregistré ';
            } else if (!idClient) {
                message.idClient = 'Votre idClient n\'a pas changé';
            }

            await updateCommande.update();

            res.json(message);

        } catch (error) {
            console.log(`Erreur dans la methode update du commandeController ${error.message}`);
            res.status(500).json(error.message);
        }
    },
    updateLigneCommande: async (req, res) => {
        try {

            const {
                id
            } = req.params;

            if (Object.keys(req.body).length === 0) {
                return res.status(200).json({
                    message: 'Vous n\'avez envoyé aucune données à modifier.'
                });
            }

            const updateCommande = await LigneCommande.findOne(id);


            const quantiteCommande = req.body.quantiteCommande;
            const idProduit = req.body.idProduit;
            const idCommande = req.body.idCommande;


            let message = {};

            if (quantiteCommande) {
                updateCommande.quantiteCommande = quantiteCommande;
                message.quantiteCommande = 'Votre nouveau quantiteCommande a bien été enregistré ';
            } else if (!quantiteCommande) {
                message.quantiteCommande = 'Votre quantiteCommande n\'a pas changé';
            }


            if (idProduit) {
                updateCommande.idProduit = idProduit;
                message.idProduit = 'Votre nouveau idProduit a bien été enregistré ';
            } else if (!idProduit) {
                message.idProduit = 'Votre idProduit n\'a pas changé';
            }


            if (idCommande) {
                updateCommande.idCommande = idCommande;
                message.idCommande = 'Votre nouveau idCommande a bien été enregistré ';
            } else if (!idCommande) {
                message.idCommande = 'Votre idCommande n\'a pas changé';
            }



            await updateCommande.update();

            res.json(message);

        } catch (error) {
            console.log(`Erreur dans la methode updateLigneCommande du commandeController ${error.message}`);
            res.status(500).json(error.message);
        }
    },

    updateStatutCommande: async (req, res) => {
        try {

            const {
                id
            } = req.params;

            if (Object.keys(req.body).length === 0) {
                return res.status(200).json({
                    message: 'Vous n\'avez envoyé aucune données à modifier.'
                });
            }

            const updateCommande = await StatutCommande.findOne(id);


            const statut = req.body.statut;
            const description = req.body.description;


            let message = {};

            if (statut) {
                updateCommande.statut = statut;
                message.statut = 'Votre nouveau statut a bien été enregistré ';
            } else if (!statut) {
                message.statut = 'Votre statut n\'a pas changé';
            }


            if (description) {
                updateCommande.description = description;
                message.description = 'Votre nouveau description a bien été enregistré ';
            } else if (!description) {
                message.description = 'Votre nom de description n\'a pas changé';
            }


            await updateCommande.update();

            res.json(message);

        } catch (error) {
            console.log(`Erreur dans la methode updateStatutCommande du commandeController ${error.message}`);
            res.status(500).json(error.message);
        }
    },





    delete: async (req, res) => {

        try {

            const commandeInDb = await Commande.findOne(req.params.id);

            const commande = await commandeInDb.delete();

            res.json(commande);

        } catch (error) {
            console.trace('Erreur dans la méthode delete du commandeController :',
                error);
            res.status(500).json(error.message);
        }
    },
    deleteLigneCommande: async (req, res) => {

        try {

            const commandeInDb = await LigneCommande.findOne(req.params.id);

            const commande = await commandeInDb.delete();

            res.json(commande);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteLigneCommande du commandeController :',
                error);
            res.status(500).json(error.message);
        }
    },

    deleteStatutCommande: async (req, res) => {

        try {

            const commandeInDb = await StatutCommande.findOne(req.params.id);

            const commande = await commandeInDb.delete();

            res.json(commande);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteStatutCommande du commandeController :',
                error);
            res.status(500).json(error.message);
        }
    },


    deleteByIdClient: async (req, res) => {

        try {

            const commandesInDb = await Commande.findByIdClient(req.params.id);
            const arrayDeleted = [];
            for (const commandeInDb of commandesInDb) {

                const commande = await commandeInDb.deleteByIdClient();
                arrayDeleted.push(commande);
            }


            res.json(arrayDeleted[0]);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteByIdClient du commandeController :',
                error);
            res.status(500).json(error.message);
        }
    },
    deleteLigneCommandeByIdCommande: async (req, res) => {

        try {

            const commandesInDb = await LigneCommande.findByIdCommande(req.params.id);
            const arrayDeleted = [];
            for (const commandeInDb of commandesInDb) {

                const commande = await commandeInDb.deleteByIdCommande();
                arrayDeleted.push(commande);
            }


            res.json(arrayDeleted[0]);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteLigneCommandeByIdCommande du commandeController :',
                error);
            res.status(500).json(error.message);
        }
    },

    //! PRODUIT RETOUR

    getAllProduitRetour: async (req, res) => {
        try {
            const commandes = await ProduitRetour.findAll();

            res.status(200).json(commandes);
        } catch (error) {
            console.trace('Erreur dans la méthode getAllProduitRetour du commandeController :',
                error);
            res.status(500).json(error.message);
        }
    },
    getOneProduitRetour: async (req, res) => {
        try {

            const commande = await ProduitRetour.findOne(req.params.id);
            res.json(commande);

        } catch (error) {
            console.trace('Erreur dans la méthode getOneProduitRetour du commandeController :',
                error);
            res.status(500).json(error.message);
        }
    },
    newProduitRetour: async (req, res) => {
        try {

            const data = {};

            data.quantite = req.body.quantite;
            data.commentaire = req.body.commentaire;
            data.idCommandeLigne = req.body.idCommandeLigne;


            const newCommande = new ProduitRetour(data);

            await newCommande.save();
            res.json(newCommande);
        } catch (error) {
            console.log(`Erreur dans la méthode newProduitRetour du commandeController : ${error.message}`);
            res.status(500).json(error.message);
        }
    },
    updateProduitRetour: async (req, res) => {
        try {

            const {
                id
            } = req.params;

            if (Object.keys(req.body).length === 0) {
                return res.status(200).json({
                    message: 'Vous n\'avez envoyé aucune données à modifier.'
                });
            }

            const updateCommande = await ProduitRetour.findOne(id);


            const quantite = req.body.quantite;
            const commentaire = req.body.commentaire;
            const idCommandeLigne = req.body.idCommandeLigne;


            let message = {};

            if (quantite) {
                updateCommande.quantite = quantite;
                message.quantite = 'Votre nouveau quantite a bien été enregistré ';
            } else if (!quantite) {
                message.quantite = 'Votre quantite n\'a pas changé';
            }


            if (commentaire) {
                updateCommande.commentaire = commentaire;
                message.commentaire = 'Votre nouveau commentaire a bien été enregistré ';
            } else if (!commentaire) {
                message.commentaire = 'Votre commentaire n\'a pas changé';
            }


            if (idCommandeLigne) {
                updateCommande.idCommandeLigne = idCommandeLigne;
                message.idCommandeLigne = 'Votre nouveau idCommandeLigne a bien été enregistré ';
            } else if (!idCommandeLigne) {
                message.idCommandeLigne = 'Votre idCommandeLigne n\'a pas changé';
            }


            await updateCommande.update();

            res.json(message);

        } catch (error) {
            console.log(`Erreur dans la methode updateProduitRetour du commandeController ${error.message}`);
            res.status(500).json(error.message);
        }
    },
    deleteProduitRetour: async (req, res) => {

        try {

            const commandeInDb = await ProduitRetour.findOne(req.params.id);

            const commande = await commandeInDb.delete();

            res.json(commande);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteProduitRetour  du commandeController :',
                error);
            res.status(500).json(error.message);
        }
    },



}

module.exports = commandeController;