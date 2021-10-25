const Produit = require('../models/produit');
const Caracteristique = require('../models/caracteristique');
const Stock = require('../models/stock');
const Fournisseur = require('../models/fournisseur');
const Fournie = require('../models/fournie');
const Reduction = require('../models/reduction');
const Tva = require('../models/tva');
const Image = require('../models/image');
const Categorie = require('../models/categorie');
const SousCategorie = require('../models/sousCategorie');
const SsCatImage = require('../models/ssCatImage');
const CategorieImage = require('../models/categorieImage');


const {arrondi} = require ('../services/arrondi');

/**
 * Une méthode qui va servir a intéragir avec le model Produit pour les intéractions avec la BDD
 * Retourne un json
 * @name produitController
 * @method produitController
 * @param {Express.Request} req - l'objet représentant la requête
 * @param {Express.Response} res - l'objet représentant la réponse
 * @return {JSON}  - une donnée en format json
 */
const produitController = {


    getAll: async (req, res) => {
        try {

            const produits = await Produit.findAll();

            produits.map(produit => produit.prixHTAvecReduc = arrondi((produit.prixHT/100) * (1 - produit.reduction)));
            produits.map(produit => produit.prixTTC = arrondi(produit.prixHTAvecReduc * ((produit.tva) + 1)));
            produits.map(produit => produit.prixHT = produit.prixHT / 100);


            res.status(200).json(produits);
        } catch (error) {
            console.trace('Erreur dans la méthode getAll du produitController :',
                error);
            res.status(500).end();
        }
    },

    getOne: async (req, res) => {
        try {


            const produit = await Produit.findOnePlus(req.params.id);
            
            produit.prixHTAvecReduc = arrondi((produit.prixHT/100) * (1 - produit.reduction));
            produit.prixTTC = arrondi(produit.prixHTAvecReduc * ((produit.tva) + 1));
            produit.prixHT = produit.prixHT / 100;


            console.log(`les données compléte du produit id ${produit.id} avec le nom ${produit.produit} ont bien été retourné au Front !`);
            res.status(200).json(produit);

        } catch (error) {
            console.trace('Erreur dans la méthode getOne du produitController :',
                error);
            res.status(500).end();
        }
    },




    articleByCategorieId: async (req, res) => {
        try {
            const produits = await Produit.findByCategorieId(req.params.id);


            produits.map(produit => produit.prixHTAvecReduc = arrondi((produit.prixht/100) * (1 - produit.reduction)));
            produits.map(produit => produit.tva = parseFloat(produit.tva));
            produits.map(produit => produit.reduction = parseFloat(produit.reduction));
            produits.map(produit => produit.prix = produit.prixht / 100);
            produits.map(produit => produit.prixTTC = arrondi(produit.prixHTAvecReduc * ((produit.tva) + 1)));

            res.status(200).json(produits);
        } catch (error) {
            console.trace('Erreur dans la méthode articleByCategorie du produitController :',
                error);
            res.status(500).end();
        }
    },







    //! PRODUIT 




    new: async (req, res) => {
        try {

            const data = {};

            data.nom = req.body.nom;
            data.description = req.body.description;
            data.prixHT = req.body.prixHT;
            data.idCategorie = req.body.idCategorie;
            data.idTVA = req.body.idTVA;
            data.idReduction = req.body.idReduction;
            console.log("dans le controller req.body vaut ==>> ", req.body);


            const newProduit = new Produit(data);
            await newProduit.save();
            res.json(newProduit);
        } catch (error) {
            console.log(`Erreur dans la méthode new du produitController : ${error.message}`);
            res.status(500).end();
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

            const updateProduit = await Produit.findOne(id);


            const nom = req.body.nom;
            const description = req.body.description;
            const prixHT = req.body.prixHT;
            const idCategorie = req.body.idCategorie;
            const idTVA = req.body.idTVA;
            const idReduction = req.body.idReduction

            let message = {};

            if (nom) {
                updateProduit.nom = nom;
                message.nom = 'Votre nouveau nom a bien été enregistré ';
            } else if (!nom) {
                message.nom = 'Votre nom n\'a pas changé';
            }


            if (description) {
                updateProduit.description = description;
                message.description = 'Votre nouveau description a bien été enregistré ';
            } else if (!description) {
                message.description = 'Votre nom de description n\'a pas changé';
            }


            if (prixHT) {
                updateProduit.prixHT = prixHT;
                message.prixHT = 'Votre nouveau prixHT a bien été enregistré ';
            } else if (!prixHT) {
                message.prixHT = 'Votre prixHT n\'a pas changé';
            }


            if (idCategorie) {
                updateProduit.idCategorie = idCategorie;
                message.idCategorie = 'Votre nouveau idCategorie a bien été enregistré ';
            } else if (!idCategorie) {
                message.idCategorie = 'Votre idCategorie n\'a pas changé';
            }

            if (idTVA) {
                updateProduit.idTVA = idTVA;
                message.idTVA = 'Votre nouveau idTVA a bien été enregistré ';
            } else if (!idTVA) {
                message.idTVA = 'Votre idTVA n\'a pas changé';
            }

            if (idReduction) {
                updateProduit.idReduction = idReduction;
                message.idReduction = 'Votre nouveau idReduction a bien été enregistré ';
            } else if (!idReduction) {
                message.idReduction = 'Votre idReduction n\'a pas changé';
            }


            await updateProduit.update();

            res.json(message);

        } catch (error) {
            console.log(`Erreur dans la methode update du produitController ${error.message}`);
            res.status(500).end();
        }
    },




    delete: async (req, res) => {

        try {

            const produitInDb = await Produit.findOne(req.params.id);

            const produit = await produitInDb.delete();

            res.json(produit);

        } catch (error) {
            console.trace('Erreur dans la méthode delete du produitController :',
                error);
            res.status(500).end();
        }
    },




    //! CARACTERISTIQUE //////////////////////////////////////////////////////////////////////////////////////////////////////



    getAllCaracteristique: async (req, res) => {
        try {
            const produits = await Caracteristique.findAll();

            res.status(200).json(produits);
        } catch (error) {
            console.trace('Erreur dans la méthode getAllCaracteristique du produitController :',
                error);
            res.status(500).end();
        }
    },

    getOneCaracteristique: async (req, res) => {
        try {

            const produit = await Caracteristique.findOne(req.params.id);
            res.json(produit);

        } catch (error) {
            console.trace('Erreur dans la méthode getOneCaracteristique du produitController :',
                error);
            res.status(500).end();
        }
    },



    getCaracteristiqueByIdProduit: async (req, res) => {
        try {

            const produit = await Caracteristique.findByIdProduit(req.params.id);
            res.json(produit);

        } catch (error) {
            console.trace('Erreur dans la méthode getCaracteristiqueByIdProduit du produitController :',
                error);
            res.status(500).end();
        }
    },

    newCaracteristique: async (req, res) => {
        try {

            const data = {};

            data.couleur = req.body.couleur;
            data.taille = req.body.taille;
            data.idProduit = req.body.idProduit;

            const newProduit = new Caracteristique(data);
            await newProduit.save();
            res.json(newProduit);
        } catch (error) {
            console.log(`Erreur dans la méthode newCaracteristique du produitController : ${error.message}`);
            res.status(500).end();
        }
    },

    updateCaracteristique: async (req, res) => {
        try {

            const {
                id
            } = req.params;

            if (Object.keys(req.body).length === 0) {
                return res.status(200).json({
                    message: 'Vous n\'avez envoyé aucune données à modifier.'
                });
            }

            const updateProduit = await Caracteristique.findOne(id);


            const couleur = req.body.couleur;
            const taille = req.body.taille;
            const idProduit = req.body.idProduit;

            let message = {};

            if (couleur) {
                updateProduit.couleur = couleur;
                message.couleur = 'Votre nouveau couleur a bien été enregistré ';
            } else if (!couleur) {
                message.couleur = 'Votre couleur n\'a pas changé';
            }


            if (taille) {
                updateProduit.taille = taille;
                message.taille = 'Votre nouveau taille a bien été enregistré ';
            } else if (!taille) {
                message.taille = 'Votre nom de taille n\'a pas changé';
            }


            if (idProduit) {
                updateProduit.idProduit = idProduit;
                message.idProduit = 'Votre nouveau idProduit a bien été enregistré ';
            } else if (!idProduit) {
                message.idProduit = 'Votre idProduit n\'a pas changé';
            }


            await updateProduit.update();

            res.json(message);

        } catch (error) {
            console.log(`Erreur dans la methode updateCaracteristique du produitController ${error.message}`);
            res.status(500).end();
        }
    },




    deleteCaracteristique: async (req, res) => {

        try {

            const produitInDb = await Caracteristique.findOne(req.params.id);

            const produit = await produitInDb.delete();

            res.json(produit);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteCaracteristique du produitController :',
                error);
            res.status(500).end();
        }
    },

    deleteCaracteristiqueByIdProduit: async (req, res) => {

        try {

            const produitsInDb = await Caracteristique.findByIdProduit(req.params.id);
            const arrayDeleted = [];
            for (const produitInDb of produitsInDb) {

                const produit = await produitInDb.deleteByIdProduit();
                arrayDeleted.push(produit);
            }

            res.json(arrayDeleted[0]);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteCaracteristiqueByIdProduit du produitController :',
                error);
            res.status(500).end();
        }
    },




    //! STOCK ///////////////////////////////////////////////////////////////////////////////////////////////



    getAllStock: async (req, res) => {
        try {
            const produits = await Stock.findAll();

            res.status(200).json(produits);
        } catch (error) {
            console.trace('Erreur dans la méthode getAllStock du produitController :',
                error);
            res.status(500).end();
        }
    },

    getOneStock: async (req, res) => {
        try {

            const produit = await Stock.findOne(req.params.id);
            res.json(produit);

        } catch (error) {
            console.trace('Erreur dans la méthode getOneStock du produitController :',
                error);
            res.status(500).end();
        }
    },



    getStockByIdProduit: async (req, res) => {
        try {

            const produit = await Stock.findByIdProduit(req.params.id);
            res.json(produit);

        } catch (error) {
            console.trace('Erreur dans la méthode getStockByIdProduit du produitController :',
                error);
            res.status(500).end();
        }
    },

    newStock: async (req, res) => {
        try {

            const data = {};

            data.quantite = req.body.quantite;
            data.idProduit = req.body.idProduit;

            const newProduit = new Stock(data);
            await newProduit.save();
            res.json(newProduit);
        } catch (error) {
            console.log(`Erreur dans la méthode newStock du produitController : ${error.message}`);
            res.status(500).end();
        }
    },

    updateStock: async (req, res) => {
        try {

            const {
                id
            } = req.params;

            if (Object.keys(req.body).length === 0) {
                return res.status(200).json({
                    message: 'Vous n\'avez envoyé aucune données à modifier.'
                });
            }

            const updateProduit = await Stock.findOne(id);


            const quantite = req.body.quantite;
            const idProduit = req.body.idProduit;

            let message = {};

            if (quantite) {
                updateProduit.quantite = quantite;
                message.quantite = 'Votre nouveau quantite a bien été enregistré ';
            } else if (!quantite) {
                message.quantite = 'Votre quantite n\'a pas changé';
            }

            if (idProduit) {
                updateProduit.idProduit = idProduit;
                message.idProduit = 'Votre nouveau idProduit a bien été enregistré ';
            } else if (!idProduit) {
                message.idProduit = 'Votre idProduit n\'a pas changé';
            }


            await updateProduit.update();

            res.json(message);

        } catch (error) {
            console.log(`Erreur dans la methode updateStock du produitController ${error.message}`);
            res.status(500).end();
        }
    },




    deleteStock: async (req, res) => {

        try {

            const produitInDb = await Stock.findOne(req.params.id);

            const produit = await produitInDb.delete();

            res.json(produit);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteStock du produitController :',
                error);
            res.status(500).end();
        }
    },

    deleteStockByIdProduit: async (req, res) => {

        try {

            const produitsInDb = await Stock.findByIdProduit(req.params.id);
            const arrayDeleted = [];
            for (const produitInDb of produitsInDb) {

                const produit = await produitInDb.deleteByIdProduit();
                arrayDeleted.push(produit);
            }

            res.json(arrayDeleted[0]);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteStockByIdProduit du produitController :',
                error);
            res.status(500).end();
        }
    },

    //! FOURNISSEUR /////////////////////////////////////////////////////////////////////////////////////////////////////////


    getAllFournisseur: async (req, res) => {
        try {
            const produits = await Fournisseur.findAll();

            res.status(200).json(produits);
        } catch (error) {
            console.trace('Erreur dans la méthode getAllFournisseur du produitController :',
                error);
            res.status(500).end();
        }
    },

    getOneFournisseur: async (req, res) => {
        try {

            const produit = await Fournisseur.findOne(req.params.id);
            res.json(produit);

        } catch (error) {
            console.trace('Erreur dans la méthode getOneFournisseur du produitController :',
                error);
            res.status(500).end();
        }
    },

    newFournisseur: async (req, res) => {
        try {

            const data = {};

            data.nom = req.body.nom;
            data.logo = req.body.logo;

            const newProduit = new Fournisseur(data);
            await newProduit.save();
            res.json(newProduit);
        } catch (error) {
            console.log(`Erreur dans la méthode newFournisseur du produitController : ${error.message}`);
            res.status(500).end();
        }
    },

    updateFournisseur: async (req, res) => {
        try {

            const {
                id
            } = req.params;

            if (Object.keys(req.body).length === 0) {
                return res.status(200).json({
                    message: 'Vous n\'avez envoyé aucune données à modifier.'
                });
            }

            const updateProduit = await Fournisseur.findOne(id);


            const nom = req.body.nom;
            const logo = req.body.logo;

            let message = {};

            if (nom) {
                updateProduit.nom = nom;
                message.nom = 'Votre nouveau nom a bien été enregistré ';
            } else if (!nom) {
                message.nom = 'Votre nom n\'a pas changé';
            }

            if (logo) {
                updateProduit.logo = logo;
                message.logo = 'Votre nouveau logo a bien été enregistré ';
            } else if (!logo) {
                message.logo = 'Votre logo n\'a pas changé';
            }


            await updateProduit.update();

            res.json(message);

        } catch (error) {
            console.log(`Erreur dans la methode updateFournisseur du produitController ${error.message}`);
            res.status(500).end();
        }
    },




    deleteFournisseur: async (req, res) => {

        try {

            const produitInDb = await Fournisseur.findOne(req.params.id);

            const produit = await produitInDb.delete();

            res.json(produit);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteFournisseur du produitController :',
                error);
            res.status(500).end();
        }
    },



    //! TABLE DE LIAISON : FOUNIE ///////////////////////////////////////////////////////////////////////////////




    getAllFournie: async (req, res) => {
        try {
            const clients = await Fournie.findAll();

            res.status(200).json(clients);
        } catch (error) {
            console.trace('Erreur dans la méthode getAllFournie du produitController :',
                error);
            res.status(500).end();
        }
    },
    getOneFournie: async (req, res) => {
        try {

            const client = await Fournie.findOne(req.params.id);
            res.json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode getOneFournie du produitController :',
                error);
            res.status(500).end();
        }
    },
    newFournie: async (req, res) => {
        try {

            const data = {};

            data.idFournisseur = req.body.idFournisseur;
            data.idProduit = req.body.idProduit;

            const newClient = new Fournie(data);
            await newClient.save();
            res.json(newClient);
        } catch (error) {
            console.log(`Erreur dans la méthode newFournie du produitController: ${error.message}`);
            res.status(500).end();
        }
    },

    updateFournie: async (req, res) => {
        try {

            const {
                id
            } = req.params;

            if (Object.keys(req.body).length === 0) {
                return res.status(200).json({
                    message: 'Vous n\'avez envoyé aucune données à modifier.'
                });
            }

            const updateClient = await Fournie.findOne(id);

            const idFournisseur = req.body.idFournisseur;
            const idProduit = req.body.idProduit;

            let userMessage = {};

            if (idFournisseur) {
                updateClient.idFournisseur = idFournisseur;
                userMessage.idFournisseur = 'Votre nouveau idFournisseur de Fournie a bien été enregistré ';
            } else if (!idFournisseur) {
                userMessage.idFournisseur = 'Votre idFournisseur de Fournie n\'a pas changé';
            }
            if (idProduit) {
                updateClient.idProduit = idProduit;
                userMessage.idProduit = 'Votre nouveau idProduit de Fournie a bien été enregistré ';
            } else if (!idProduit) {
                userMessage.idProduit = 'Votre idProduit de Fournie n\'a pas changé';
            }

            await updateClient.update();

            res.json(userMessage);

        } catch (error) {
            console.log(`Erreur dans la méthode updateFournie du produitController : ${error.message}`);
            res.status(500).end();
        }
    },

    deleteFournie: async (req, res) => {

        try {

            const clientInDb = await Fournie.findOne(req.params.id);

            const client = await clientInDb.delete();

            res.json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteFournie du produitController :',
                error);
            res.status(500).end();
        }
    },



    //! REDUCTION ///////////////////////////////////////////////////////////////////////////////////////////////


    getAllReduction: async (req, res) => {
        try {
            const produits = await Reduction.findAll();

            res.status(200).json(produits);
        } catch (error) {
            console.trace('Erreur dans la méthode getAllReduction du produitController :',
                error);
            res.status(500).end();
        }
    },

    getOneReduction: async (req, res) => {
        try {

            const produit = await Reduction.findOne(req.params.id);
            res.json(produit);

        } catch (error) {
            console.trace('Erreur dans la méthode getOneReduction du produitController :',
                error);
            res.status(500).end();
        }
    },

    newReduction: async (req, res) => {
        try {

            const data = {};

            data.nom = req.body.nom;
            data.pourcentageReduction = req.body.pourcentageReduction;
            data.actif = req.body.actif;
            data.periodeReduction = req.body.periodeReduction;

            const newProduit = new Reduction(data);
            await newProduit.save();
            res.json(newProduit);
        } catch (error) {
            console.log(`Erreur dans la méthode newReduction du produitController : ${error.message}`);
            res.status(500).end();
        }
    },

    updateReduction: async (req, res) => {
        try {

            const {
                id
            } = req.params;


            if (Object.keys(req.body).length === 0) {
                return res.status(200).json({
                    message: 'Vous n\'avez envoyé aucune données à modifier.'
                });
            }
            const updateProduit = await Reduction.findOne(id);


            const nom = req.body.nom;
            const pourcentageReduction = req.body.pourcentageReduction;
            const actif = req.body.actif;
            const periodeReduction = req.body.periodeReduction;

            let message = {};

            if (nom) {
                updateProduit.nom = nom;
                message.nom = 'Votre nouveau nom a bien été enregistré ';
            } else if (!nom) {
                message.nom = 'Votre nom n\'a pas changé';
            }

            if (pourcentageReduction) {
                updateProduit.pourcentageReduction = pourcentageReduction;
                message.pourcentageReduction = 'Votre nouveau pourcentageReduction a bien été enregistré ';
            } else if (!pourcentageReduction) {
                message.pourcentageReduction = 'Votre pourcentageReduction n\'a pas changé';
            }

            if (actif) {
                updateProduit.actif = actif;
                message.actif = 'Votre nouveau actif a bien été enregistré ';
            } else if (!actif) {
                message.actif = 'Votre actif n\'a pas changé';
            }

            if (periodeReduction) {
                updateProduit.periodeReduction = periodeReduction;
                message.periodeReduction = 'Votre nouveau periodeReduction a bien été enregistré ';
            } else if (!periodeReduction) {
                message.periodeReduction = 'Votre periodeReduction n\'a pas changé';
            }


            await updateProduit.update();

            res.json(message);

        } catch (error) {
            console.log(`Erreur dans la methode updateReduction du produitController ${error.message}`);
            res.status(500).end();
        }
    },

    deleteReduction: async (req, res) => {

        try {

            const produitInDb = await Reduction.findOne(req.params.id);

            const produit = await produitInDb.delete();

            res.json(produit);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteReduction du produitController :',
                error);
            res.status(500).end();
        }
    },




    //! TVA ////////////////////////////////////////////////////////////////////////////////////////////////////////////


    getAllTva: async (req, res) => {
        try {
            const produits = await Tva.findAll();

            res.status(200).json(produits);
        } catch (error) {
            console.trace('Erreur dans la méthode getAllTva du produitController :',
                error);
            res.status(500).end();
        }
    },

    getOneTva: async (req, res) => {
        try {

            const produit = await Tva.findOne(req.params.id);
            res.json(produit);

        } catch (error) {
            console.trace('Erreur dans la méthode getOneTva du produitController :',
                error);
            res.status(500).end();
        }
    },

    newTva: async (req, res) => {
        try {

            const data = {};

            data.nom = req.body.nom;
            data.taux = req.body.taux;
            data.periodeTVA = req.body.periodeTVA;


            const newProduit = new Tva(data);
            await newProduit.save();
            res.json(newProduit);
        } catch (error) {
            console.log(`Erreur dans la méthode newTva du produitController : ${error.message}`);
            res.status(500).end();
        }
    },

    updateTva: async (req, res) => {
        try {

            const {
                id
            } = req.params;

            if (Object.keys(req.body).length === 0) {
                return res.status(200).json({
                    message: 'Vous n\'avez envoyé aucune données à modifier.'
                });
            }

            const updateProduit = await Tva.findOne(id);


            const nom = req.body.nom;
            const taux = req.body.taux;
            const periodeTVA = req.body.periodeTVA;


            let message = {};

            if (nom) {
                updateProduit.nom = nom;
                message.nom = 'Votre nouveau nom a bien été enregistré ';
            } else if (!nom) {
                message.nom = 'Votre nom n\'a pas changé';
            }

            if (taux) {
                updateProduit.taux = taux;
                message.taux = 'Votre nouveau taux a bien été enregistré ';
            } else if (!taux) {
                message.taux = 'Votre taux n\'a pas changé';
            }

            if (periodeTVA) {
                updateProduit.periodeTVA = periodeTVA;
                message.aperiodeTVA = 'Votre nouveau periodeTVA a bien été enregistré ';
            } else if (!periodeTVA) {
                message.periodeTVA = 'Votre periodeTVA n\'a pas changé';
            }




            await updateProduit.update();

            res.json(message);

        } catch (error) {
            console.log(`Erreur dans la methode updateTva du produitController ${error.message}`);
            res.status(500).end();
        }
    },

    deleteTva: async (req, res) => {

        try {

            const produitInDb = await Tva.findOne(req.params.id);

            const produit = await produitInDb.delete();

            res.json(produit);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteTva du produitController :',
                error);
            res.status(500).end();
        }
    },






    //! IMAGE //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



    getAllImage: async (req, res) => {
        try {
            const produits = await Image.findAll();

            res.status(200).json(produits);
        } catch (error) {
            console.trace('Erreur dans la méthode getAllImage du produitController :',
                error);
            res.status(500).end();
        }
    },

    getOneImage: async (req, res) => {
        try {

            const produit = await Image.findOne(req.params.id);
            res.json(produit);

        } catch (error) {
            console.trace('Erreur dans la méthode getOneImage du produitController :',
                error);
            res.status(500).end();
        }
    },



    getImageByIdProduit: async (req, res) => {
        try {

            const produit = await Image.findByIdProduit(req.params.id);
            res.json(produit);

        } catch (error) {
            console.trace('Erreur dans la méthode getImageByIdProduit du produitController :',
                error);
            res.status(500).end();
        }
    },

    newImage: async (req, res) => {
        try {

            const data = {};

            data.nom = req.body.nom;
            data.ordre = req.body.ordre;
            data.URL = req.body.URL;
            data.idProduit = req.body.idProduit;

            const newProduit = new Image(data);
            await newProduit.save();
            res.json(newProduit);
        } catch (error) {
            console.log(`Erreur dans la méthode newImage du produitController : ${error.message}`);
            res.status(500).end();
        }
    },

    updateImage: async (req, res) => {
        try {

            const {
                id
            } = req.params;

            if (Object.keys(req.body).length === 0) {
                return res.status(200).json({
                    message: 'Vous n\'avez envoyé aucune données à modifier.'
                });
            }

            const updateProduit = await Image.findOne(id);


            const nom = req.body.nom;
            const ordre = req.body.ordre;
            const URL = req.body.URL;
            const idProduit = req.body.idProduit;

            let message = {};

            if (nom) {
                updateProduit.nom = nom;
                message.nom = 'Votre nouveau nom a bien été enregistré ';
            } else if (!nom) {
                message.nom = 'Votre nom n\'a pas changé';
            }


            if (ordre) {
                updateProduit.ordre = ordre;
                message.ordre = 'Votre nouveau ordre a bien été enregistré ';
            } else if (!ordre) {
                message.ordre = 'Votre nom de ordre n\'a pas changé';
            }

            if (URL) {
                updateProduit.URL = URL;
                message.URL = 'Votre nouveau URL a bien été enregistré ';
            } else if (!URL) {
                message.URL = 'Votre nom de URL n\'a pas changé';
            }

            if (idProduit) {
                updateProduit.idProduit = idProduit;
                message.idProduit = 'Votre nouveau idProduit a bien été enregistré ';
            } else if (!idProduit) {
                message.idProduit = 'Votre idProduit n\'a pas changé';
            }


            await updateProduit.update();

            res.json(message);

        } catch (error) {
            console.log(`Erreur dans la methode updateImage du produitController ${error.message}`);
            res.status(500).end();
        }
    },




    deleteImage: async (req, res) => {

        try {

            const produitInDb = await Image.findOne(req.params.id);

            const produit = await produitInDb.delete();

            res.json(produit);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteImage du produitController :',
                error);
            res.status(500).end();
        }
    },

    deleteImageByIdProduit: async (req, res) => {

        try {

            const produitsInDb = await Image.findByIdProduit(req.params.id);
            const arrayDeleted = [];
            for (const produitInDb of produitsInDb) {

                const produit = await produitInDb.deleteByIdProduit();
                arrayDeleted.push(produit);
            }

            res.json(arrayDeleted[0]);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteImageByIdProduit du produitController :',
                error);
            res.status(500).end();
        }
    },


    //! CATEGORIE ////////////////////////////////////////////////////////////////////////////////////////

    getAllCategorie: async (req, res) => {
        try {
            const produits = await Categorie.findAll();

            res.status(200).json(produits);
        } catch (error) {
            console.trace('Erreur dans la méthode getAllCategorie du produitController :',
                error);
            res.status(500).end();
        }
    },

    getOneCategorie: async (req, res) => {
        try {

            const produit = await Categorie.findOne(req.params.id);
            res.status(200).json(produit);

        } catch (error) {
            console.trace('Erreur dans la méthode getOneCategorie du produitController :',
                error);
            res.status(500).end();
        }
    },

    newCategorie: async (req, res) => {
        try {

            const data = {};

            data.nom = req.body.nom;
            data.description = req.body.description;
            data.ordre = req.body.ordre;


            const newProduit = new Categorie(data);
            await newProduit.save();
            res.status(200).json(newProduit);
        } catch (error) {
            console.log(`Erreur dans la méthode newCategorie du produitController : ${error.message}`);
            res.status(500).end();
        }
    },

    updateCategorie: async (req, res) => {
        try {

            const {
                id
            } = req.params;

            if (Object.keys(req.body).length === 0) {
                return res.status(200).json({
                    message: 'Vous n\'avez envoyé aucune données à modifier.'
                });
            }

            const updateProduit = await Categorie.findOne(id);


            const nom = req.body.nom;
            const description = req.body.description;
            const ordre = req.body.ordre;

            let message = {};

            if (nom) {
                updateProduit.nom = nom;
                message.nom = 'Votre nouveau nom a bien été enregistré ';
            } else if (!nom) {
                message.nom = 'Votre nom n\'a pas changé';
            }

            if (description) {
                updateProduit.description = description;
                message.description = 'Votre nouveau description a bien été enregistré ';
            } else if (!description) {
                message.description = 'Votre description n\'a pas changé';
            }

            if (ordre) {
                updateProduit.ordre = ordre;
                message.ordre = 'Votre nouveau ordre a bien été enregistré ';
            } else if (!ordre) {
                message.ordre = 'Votre ordre n\'a pas changé';
            }

            await updateProduit.update();

            res.status(200).json(message);

        } catch (error) {
            console.log(`Erreur dans la methode updateCategorie du produitController ${error.message}`);
            res.status(500).end();
        }
    },

    deleteCategorie: async (req, res) => {

        try {

            const produitInDb = await Categorie.findOne(req.params.id);

            const produit = await produitInDb.delete();

            res.status(200).json(produit);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteCategorie du produitController :',
                error);
            res.status(500).end();
        }
    },


    //! SOUS CATEGORIE ///////////////////////////////////////////////////////////////////////////////////////////////////////////


    getAllSousCategorie: async (req, res) => {
        try {
            const sousCategories = await SousCategorie.findAll();

            res.status(200).json(sousCategories);
        } catch (error) {
            console.trace('Erreur dans la méthode getAllSousCategorie du produitController :',
                error);
            res.status(500).end();
        }
    },
    getOneSousCategorie: async (req, res) => {
        try {

            const sousCategorie = await SousCategorie.findOne(req.params.id);
            res.json(sousCategorie);

        } catch (error) {
            console.trace('Erreur dans la méthode getOneSousCategorie du produitController :',
                error);
            res.status(500).end();
        }
    },
    getSousCategorieByIdCategorie: async (req, res) => {
        try {

            const sousCategorie = await SousCategorie.findByIdCategorie(req.params.id);
            res.json(sousCategorie);

        } catch (error) {
            console.trace('Erreur dans la méthode getSousCategorieByIdSousCategorie du produitController :',
                error);
            res.status(500).end();
        }
    },
    newSousCategorie: async (req, res) => {
        try {

            const data = {};

            data.nom = req.body.nom;
            data.description = req.body.description;
            data.idCategorie = req.body.idCategorie;

            const newSousCategorie = new SousCategorie(data);
            await newSousCategorie.save();
            res.json(newSousCategorie);
        } catch (error) {
            console.log(`Erreur dans la méthode newSousCategorie du produitController : ${error.message}`);
            res.status(500).end();
        }
    },
    updateSousCategorie: async (req, res) => {
        try {

            const {
                id
            } = req.params;

            if (Object.keys(req.body).length === 0) {
                return res.status(200).json({
                    message: 'Vous n\'avez envoyé aucune données à modifier.'
                });
            }

            const updateSousCategorie = await SousCategorie.findOne(id);

            const nom = req.body.nom;
            const description = req.body.description;
            const idCategorie = req.body.idCategorie;

            let message = {};

            if (nom) {
                updateSousCategorie.nom = nom;
                message.nom = 'Votre nouveau nom a bien été enregistré ';
            } else if (!nom) {
                message.nom = 'Votre nom n\'a pas changé';
            }
            if (description) {
                updateSousCategorie.description = description;
                message.description = 'Votre nouveau description a bien été enregistré ';
            } else if (!description) {
                message.description = 'Votre nom de description n\'a pas changé';
            }
            if (idCategorie) {
                updateSousCategorie.idCategorie = idCategorie;
                messageidCategoriee = 'Votre nouveau idCategorie a bien été enregistré ';
            } else if (!idCategorie) {
                message.idCategorie = 'Votre idCategorie n\'a pas changé';
            }


            await updateSousCategorie.update();
            res.json(message);

        } catch (error) {
            console.log(`Erreur dans la methode updateSousCategorie du produitController ${error.message}`);
            res.status(500).end();
        }
    },
    deleteSousCategorie: async (req, res) => {
        try {
            const sousCategorieInDb = await SousCategorie.findOne(req.params.id);
            const sousCategorie = await sousCategorieInDb.delete();

            res.json(sousCategorie);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteSousCategorie du produitController :',
                error);
            res.status(500).end();
        }
    },
    deleteSousCategorieByIdCategorie: async (req, res) => {

        try {
            const sousCategoriesInDb = await SousCategorie.findByIdCategorie(req.params.id);
            const arrayDeleted = [];
            for (const sousCategorieInDb of sousCategoriesInDb) {

                const sousCategorieHistoConn = await sousCategorieInDb.deleteByIdCategorie();
                arrayDeleted.push(sousCategorieHistoConn);
            }
            res.json(arrayDeleted[0]);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteSousCategorieByIdSousCategorie du produitController :',
                error);
            res.status(500).end();
        }
    },



    //! SOUS CATEGORIE IMAGE ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    getAllSsCatImage: async (req, res) => {
        try {
            const produits = await SsCatImage.findAll();

            res.status(200).json(produits);
        } catch (error) {
            console.trace('Erreur dans la méthode getAllSsCatImage du produitController :',
                error);
            res.status(500).end();
        }
    },

    getOneSsCatImage: async (req, res) => {
        try {

            const produit = await SsCatImage.findOne(req.params.id);
            res.json(produit);

        } catch (error) {
            console.trace('Erreur dans la méthode getOneSsCatImage du produitController :',
                error);
            res.status(500).end();
        }
    },



    getSsCatImageByIdSsCat: async (req, res) => {
        try {

            const produit = await SsCatImage.findByIdSsCat(req.params.id);
            res.json(produit);

        } catch (error) {
            console.trace('Erreur dans la méthode getSsCatImageByIdProduit du produitController :',
                error);
            res.status(500).end();
        }
    },

    newSsCatImage: async (req, res) => {
        try {

            const data = {};
            data.nom = req.body.nom;
            data.URL = req.body.URL;
            data.idSousCategorie = req.body.idSousCategorie;

            const newProduit = new SsCatImage(data);
            await newProduit.save();
            res.json(newProduit);
        } catch (error) {
            console.log(`Erreur dans la méthode newSsCatImage du produitController : ${error.message}`);
            res.status(500).end();
        }
    },

    updateSsCatImage: async (req, res) => {
        try {

            const {
                id
            } = req.params;

            if (Object.keys(req.body).length === 0) {
                return res.status(200).json({
                    message: 'Vous n\'avez envoyé aucune données à modifier.'
                });
            }

            const updateProduit = await SsCatImage.findOne(id);

            const nom = req.body.nom;
            const URL = req.body.URL;
            const idSousCategorie = req.body.idSousCategorie;

            let message = {};

            if (nom) {
                updateProduit.nom = nom;
                message.nom = 'Votre nouveau nom a bien été enregistré ';
            } else if (!nom) {
                message.nom = 'Votre nom n\'a pas changé';
            }

            if (URL) {
                updateProduit.URL = URL;
                message.URL = 'Votre nouveau URL a bien été enregistré ';
            } else if (!URL) {
                message.URL = 'Votre nom de URL n\'a pas changé';
            }

            if (idSousCategorie) {
                updateProduit.idSousCategorie = idSousCategorie;
                message.idSousCategorie = 'Votre nouveau idSousCategorie a bien été enregistré ';
            } else if (!idSousCategorie) {
                message.idSousCategorie = 'Votre idSousCategorie n\'a pas changé';
            }


            await updateProduit.update();

            res.json(message);

        } catch (error) {
            console.log(`Erreur dans la methode updateSsCatImage du produitController ${error.message}`);
            res.status(500).end();
        }
    },




    deleteSsCatImage: async (req, res) => {

        try {

            const produitInDb = await SsCatImage.findOne(req.params.id);

            const produit = await produitInDb.delete();

            res.json(produit);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteSsCatImage du produitController :',
                error);
            res.status(500).end();
        }
    },

    deleteSsCatImageByIdSsCat: async (req, res) => {

        try {

            const produitsInDb = await SsCatImage.findByIdSsCat(req.params.id);
            const arrayDeleted = [];
            for (const produitInDb of produitsInDb) {

                const produit = await produitInDb.deleteByIdSsCat();
                arrayDeleted.push(produit);
            }

            res.json(arrayDeleted[0]);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteSsCatImageByIdProduit du produitController :',
                error);
            res.status(500).end();
        }
    },

    //! CATEGORIE IMAGE ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



    getAllCategorieImage: async (req, res) => {
        try {
            const produits = await CategorieImage.findAll();

            res.status(200).json(produits);
        } catch (error) {
            console.trace('Erreur dans la méthode getAllCategorieImage du produitController :',
                error);
            res.status(500).end();
        }
    },

    getOneCategorieImage: async (req, res) => {
        try {

            const produit = await CategorieImage.findOne(req.params.id);
            res.json(produit);

        } catch (error) {
            console.trace('Erreur dans la méthode getOneCategorieImage du produitController :',
                error);
            res.status(500).end();
        }
    },



    getCategorieImageByIdCategorie: async (req, res) => {
        try {

            const produit = await CategorieImage.findByIdCategorie(req.params.id);
            res.json(produit);

        } catch (error) {
            console.trace('Erreur dans la méthode getCategorieImageByIdProduit du produitController :',
                error);
            res.status(500).end();
        }
    },

    newCategorieImage: async (req, res) => {
        try {

            const data = {};
            data.nom = req.body.nom;
            data.URL = req.body.URL;
            data.idCategorie = req.body.idCategorie;

            const newProduit = new CategorieImage(data);
            await newProduit.save();
            res.json(newProduit);
        } catch (error) {
            console.log(`Erreur dans la méthode newCategorieImage du produitController : ${error.message}`);
            res.status(500).end();
        }
    },

    updateCategorieImage: async (req, res) => {
        try {

            const {
                id
            } = req.params;

            if (Object.keys(req.body).length === 0) {
                return res.status(200).json({
                    message: 'Vous n\'avez envoyé aucune données à modifier.'
                });
            }

            const updateProduit = await CategorieImage.findOne(id);

            const nom = req.body.nom;
            const URL = req.body.URL;
            const idCategorie = req.body.idCategorie;

            let message = {};

            if (nom) {
                updateProduit.nom = nom;
                message.nom = 'Votre nouveau nom a bien été enregistré ';
            } else if (!nom) {
                message.nom = 'Votre nom n\'a pas changé';
            }

            if (URL) {
                updateProduit.URL = URL;
                message.URL = 'Votre nouveau URL a bien été enregistré ';
            } else if (!URL) {
                message.URL = 'Votre nom de URL n\'a pas changé';
            }

            if (idCategorie) {
                updateProduit.idCategorie = idCategorie;
                message.idCategorie = 'Votre nouveau idCategorie a bien été enregistré ';
            } else if (!idCategorie) {
                message.idCategorie = 'Votre idCategorie n\'a pas changé';
            }


            await updateProduit.update();

            res.json(message);

        } catch (error) {
            console.log(`Erreur dans la methode updateCategorieImage du produitController ${error.message}`);
            res.status(500).end();
        }
    },




    deleteCategorieImage: async (req, res) => {

        try {

            const produitInDb = await CategorieImage.findOne(req.params.id);

            const produit = await produitInDb.delete();

            res.json(produit);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteCategorieImage du produitController :',
                error);
            res.status(500).end();
        }
    },

    deleteCategorieImageByIdCategorie: async (req, res) => {

        try {

            const produitsInDb = await CategorieImage.findByIdCategorie(req.params.id);
            const arrayDeleted = [];
            for (const produitInDb of produitsInDb) {

                const produit = await produitInDb.deleteByIdCategorie();
                arrayDeleted.push(produit);
            }

            res.json(arrayDeleted[0]);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteCategorieImageByIdProduit du produitController :',
                error);
            res.status(500).end();
        }
    },





}

module.exports = produitController;