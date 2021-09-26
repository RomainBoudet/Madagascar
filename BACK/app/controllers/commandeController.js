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

            if (req.session.user.privilege === 'Client') {
                return res.status(403).json({
                    message: "Vous n'avez pas les droits pour accéder a cette ressource"
                })
            };

            //! parser un email : https://medium.com/@akinremiolumide96/reading-email-data-with-node-js-cdacaa174cc7 

            //RAPPEL des statuts de commande : 1= en attente, 2 = annulée, 3 = Paiement validé, 4 = En cours de préparation, 5 = Prêt pour expedition, 6 = Expédiée, 7 = Remboursée

            //pour une API flexible on prend soit une réference de commande soit un id de commande !

            //! je fait le tri si c'est une référence de commande ou un id de commande !

            const regRefCommande = /^([0-9]*[.]{1}[0-9]*)*$/; // pour une référence de commande
            const number = /^[0-9]*$/; // pour un id de commande
            //const string = /^[a-zA-Z\s]*$/; // pour un statut sous forme de string
            const unicod = /En attente|Annulée|Paiement validé|En cours de préparation|Prêt pour expédition|Expédiée|Remboursée/;

            let commandeInDb;
            let statutInDb;
            if (regRefCommande.test(req.body.commande)) {

                commandeInDb = await Commande.findByRefCommande(req.body.commande);
                console.log(commandeInDb);

                if (commandeInDb === null || commandeInDb === undefined) {
                    res.status(200).json({
                        message: "Cette référence de commande n'éxiste pas !"
                    })
                }

            } else if (number.test(req.body.commande)) {

                commandeInDb = await Commande.findOne(req.body.commande);
                console.log(commandeInDb);

                if (commandeInDb === null || commandeInDb === undefined) {
                    res.status(200).json({
                        message: "Cette identifiant de commande n'éxiste pas !"
                    })
                }

            } else {
                return res.status(200).json({
                    message: "votre commande n'a pas le format souhaité ! Elle doit avoir soit le format d'une réference soit celui d'un identifiant."
                })
            }


            if (number.test(req.body.statut)) {

                // ici req.body.statut est un identifiant !
                statutInDb = await StatutCommande.findOne(req.body.statut);

                if (statutInDb === null || statutInDb === undefined) {
                    res.status(200).json({
                        message: "Cette identifiant de statut n'éxiste pas !"
                    })
                }
                console.log("statutInDb == ", statutInDb);


            } else if (unicod.test(req.body.statut)) {
                //ici req.body.statut est une string !
                statutInDb = await StatutCommande.findByName(req.body.statut);

                if (statutInDb === null || statutInDb === undefined) {
                    res.status(200).json({
                        message: "Cette identifiant de statut n'éxiste pas !"
                    })
                }
                console.log("statutInDb == ", statutInDb);
            } else {
                return res.status(200).json({
                    message: "votre statut n'a pas le format souhaité ! il doit avoir soit le format d'un nom de statut soit celui d'un identifiant (nombre)."
                })
            }

            console.log("commandeInDb.id  == ",commandeInDb.id);


            //! je vérifit que le statut demandé éxiste dans les deux cas !

            // je vérifit que le statut commande de mandé pour la moise a jour ne soit déja celui en place 

            // je vérifit que le statut demandé pour cette commande est le statut logique suivant !












            res.status(200).end();
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