const Panier = require('../models/panier');
const LignePanier = require('../models/lignePanier');
const Produit = require('../models/produit');



/**
 * Une méthode qui va servir a intéragir avec le model Panier pour les intéractions avec la BDD 
 * Retourne un json
 * @name panierController
 * @method panierController
 * @param {Express.Request} req - l'objet représentant la requête
 * @param {Express.Response} res - l'objet représentant la réponse
 * @return {JSON}  - une donnée en format json
 */
const panierController = {

    /* getPanier: async (req, res) => {

        try {
            req.session.panierViewCount = (req.session.panierViewCount || 0) + 1;

            // if (!req.session.cart) {
             //   req.session.cart = [];
           // } 

            const cart = req.session.cart;

            let taxFreeTotal = 0;
            let tva = 0;
            let total = 0;
            let coutTransporteur = 9.99;

            if (cart) {
                taxFreeTotal = cart.reduce(
                    (accumulator, item) => {
                        return (accumulator || 0) + (item.price * item.quantity)
                    },
                    0
                );

                tva = Math.round(taxFreeTotal * 0.2 * 100) / 100;
                total = Math.round((taxFreeTotal + tva + coutTransporteur) * 100) / 100;
            }

            res.status(200).json(clients);
        } catch (error) {
            console.trace('Erreur dans la méthode getPanier du panierController :',
                error);
            res.status(500).json(error.message);
        }


    }, */

    addArticlePanier: async (req, res) => {
        try {

            // je recupére l'id de l'article à ajouter au panier
            const articleId = parseInt(req.params.id, 10);
            //je verifie qu'il existe
            if (!req.session.cart) {
                // s'il n'éxiste pas je 'linitialise avec un tableau vide
                req.session.cart = [];
            }
            console.log("req.session avant l'ajout d'un article => ",req.session);
            // je cherche dans le panier si un article existe déjà (grace à l'id)
            // si on le trouve on le récupére dans la variable article
            let article = req.session.cart.find(
                (articleDansLePanier) => articleDansLePanier.id == articleId
            );

            if (!article) {
                // Si article est vide, le panier ne contient pas encore cette article
                // donc on va chercher les info de l'article en BDD puis on l'ajoute au panier avec une qty de 1

                const monArticle = await Produit.findOne(articleId);
                console.log("monArticle ==> ", monArticle);
                monArticle.quantite = 1;
                req.session.cart.push(monArticle);
                console.log("req.session.cart aprés le 1er ajout =>",req.session.cart);
                res.json(`L'article avec l'id ${articleId} a bien été placé dans votre paner !`)

            } else {
                // Si on a trouvé l'article alors on va incrementer la qté
                article.quantite++;
                console.log("req.session.cart aprés ajout si l'article était déja présent =>",req.session.cart);
                res.json(`L'article avec l'id ${articleId} a bien été ajouté a votre paner !`)
            }

        } catch (error) {
            console.trace('Erreur dans la méthode addArticlePanier du panierController :',
                error);
            res.status(500).json(error.message);
        }

    },


    delArticlePanier: async (req, res) => {
        try {

            const articleId = parseInt(req.params.id, 10);

            if (!req.session.cart) {
                req.session.cart = [];
            }

            let monArticle = req.session.cart.find(
                (articleDansLePanier) => articleDansLePanier.id == articleId
            );

            if (monArticle) {
                monArticle.quantite--;
            }

            // Je fais le ménage et ne garde que les items dont la quantité est superieur à 0
            req.session.cart = req.session.cart.filter(
                (articleDansLePanier) => articleDansLePanier.quantite > 0
            );

            res.json(`un article avec l'id ${articleId} a bien été supprimer de votre panier si il était présent !`)
            console.log("req.session.cart aprés une supression d'article =>",req.session.cart);

        } catch (error) {
            console.trace('Erreur dans la méthode delArticlePanier du panierController :',
                error);
            res.status(500).json(error.message);
        }

    },




























    getAll: async (req, res) => {
        try {
            const clients = await Panier.findAll();

            res.status(200).json(clients);
        } catch (error) {
            console.trace('Erreur dans la méthode getAllUser du panierController :',
                error);
            res.status(500).json(error.message);
        }
    },

    getOne: async (req, res) => {
        try {

            const client = await Panier.findOne(req.params.id);
            res.json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode getOne du panierController :',
                error);
            res.status(500).json(error.message);
        }
    },

    getByIdClient: async (req, res) => {
        try {
            console.log(req.params);
            const client = await Panier.findByIdClient(req.params.id);
            res.json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode getByIdClient du panierController :',
                error);
            res.status(500).json(error.message);
        }
    },





    new: async (req, res) => {
        try {

            const data = {};

            data.total = req.body.total;
            data.idClient = req.body.idClient;

            console.log("req.body ==> ", req.body);
            const newClient = new Panier(data);
            await newClient.save();
            res.json(newClient);
        } catch (error) {
            console.log(`Erreur lors de l'enregistrement du nouveau panier: ${error.message}`);
            res.status(500).json(error.message);
        }
    },

    update: async (req, res) => {
        try {

            const {
                id
            } = req.params;

            const updateClient = await Panier.findOne(id);


            const total = req.body.total;
            const idClient = req.body.idClient;

            let userMessage = {};

            if (total) {
                updateClient.total = total;
                userMessage.total = 'Votre nouveau total a bien été enregistré ';
            } else if (!total) {
                userMessage.total = 'Votre total n\'a pas changé';
            }


            if (idClient) {
                updateClient.idClient = idClient;
                userMessage.idClient = 'Votre nouveau idClient a bien été enregistré ';
            } else if (!idClient) {
                userMessage.idClient = 'Votre idClient n\'a pas changé';
            }

            await updateClient.update();

            res.json(userMessage);

        } catch (error) {
            console.log(`Erreur lors de l'enregistrement du nouveau panier: ${error.message}`);
            res.status(500).json(error.message);
        }
    },




    delete: async (req, res) => {

        try {

            const clientInDb = await Panier.findOne(req.params.id);

            const client = await clientInDb.delete();

            res.json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode delete du panierController :',
                error);
            res.status(500).json(error.message);
        }
    },


    deleteByIdClient: async (req, res) => {

        try {

            const clientsInDb = await Panier.findByIdClient(req.params.id);
            const arrayDeleted = [];
            for (const clientInDb of clientsInDb) {

                const clientHistoConn = await clientInDb.deleteByIdClient();
                arrayDeleted.push(clientHistoConn);
            }
            res.json(arrayDeleted[0]);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteByIdClien du panierController :',
                error);
            res.status(500).json(error.message);
        }
    },



    //! Ligne Panier//////////////////





    getAllLignePanier: async (req, res) => {
        try {
            const clients = await LignePanier.findAll();

            res.status(200).json(clients);
        } catch (error) {
            console.trace('Erreur dans la méthode getAllUser du panierController :',
                error);
            res.status(500).json(error.message);
        }
    },

    getOneLignePanier: async (req, res) => {
        try {

            const client = await LignePanier.findOne(req.params.id);
            res.json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode getOne du panierController :',
                error);
            res.status(500).json(error.message);
        }
    },

    getLignePanierByIdClient: async (req, res) => {
        try {
            console.log(req.params);
            const client = await LignePanier.findByIdPanier(req.params.id);
            res.json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode getByIdClient du panierController :',
                error);
            res.status(500).json(error.message);
        }
    },

    newLignePanier: async (req, res) => {
        try {

            const data = {};

            data.quantite = req.body.quantite;
            data.idProduit = req.body.idProduit;
            data.idPanier = req.body.idPanier;

            const newClient = new LignePanier(data);
            await newClient.save();
            res.json(newClient);
        } catch (error) {
            console.log(`Erreur dans la méthode newLignePanier du panierController : ${error.message}`);
            res.status(500).json(error.message);
        }
    },

    updateLignePanier: async (req, res) => {
        try {

            const {
                id
            } = req.params;

            const updateClient = await LignePanier.findOne(id);


            const quantite = req.body.quantite;
            const idProduit = req.body.idProduit;
            const idPanier = req.body.idPanier;

            let userMessage = {};

            if (quantite) {
                updateClient.quantite = quantite;
                userMessage.quantite = 'Votre nouveau quantite a bien été enregistré ';
            } else if (quantite) {
                userMessage.quantite = 'Votre quantite n\'a pas changé';
            }


            if (idProduit) {
                updateClient.idProduit = idProduit;
                userMessage.idProduit = 'Votre nouveau idProduit a bien été enregistré ';
            } else if (!idProduit) {
                userMessage.idProduit = 'Votre idProduit n\'a pas changé';
            }
            if (idPanier) {
                updateClient.idPanier = idPanier;
                userMessage.idPanier = 'Votre nouveau idPanier a bien été enregistré ';
            } else if (!idPanier) {
                userMessage.idPanier = 'Votre idPanier n\'a pas changé';
            }

            await updateClient.update();

            res.json(userMessage);

        } catch (error) {
            console.log(`Erreur lors de l'enregistrement du nouveau panier: ${error.message}`);
            res.status(500).json(error.message);
        }
    },

    deleteLignePanier: async (req, res) => {

        try {

            const clientInDb = await LignePanier.findOne(req.params.id);

            const client = await clientInDb.delete();

            res.json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteLignePanier du panierController :',
                error);
            res.status(500).json(error.message);
        }
    },


    deleteLignePanierByIdPanier: async (req, res) => {

        try {

            const clientsInDb = await LignePanier.findByIdPanier(req.params.id);
            const arrayDeleted = [];
            for (const clientInDb of clientsInDb) {

                const clientHistoConn = await clientInDb.deleteByIdPanier();
                arrayDeleted.push(clientHistoConn);
            }


            res.json(arrayDeleted[0]);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteLignePanierByIdPanier du panierController :',
                error);
            res.status(500).json(error.message);
        }
    },

}

module.exports = panierController;