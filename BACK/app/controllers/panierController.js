const Panier = require('../models/panier');
const LignePanier = require('../models/lignePanier');
const Produit = require('../models/produit');
const {
    arrondi
} = require('../services/arrondi');

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

    getPanier: async (req, res) => {

        try {
            //NOTE
            //req.session.panierViewCount = (req.session.panierViewCount || 0) + 1;

            const cart = req.session.cart;

            // let totalHT = 0;
            // let totalTTC = 0;
            let coutTransporteur = 9.15; // prix d'un Collisimo pour la France jusqu'a deux kilos.

            if (cart) {

                //prise en charge de la réduction en construisant une nouvelle clé valeur représentant le nouveau prix avec la réduction sur lequel baser les calculs du panier. Si la réduction est de 0, cette valeur sera identique au prix...
                cart.map(article => article.prixHTAvecReduc = parseFloat(arrondi(article.prix * (1 - article.reduction))));

                totalHT1 = cart.reduce(
                    (accumulator, item) => {

                        return (accumulator || 0) + (item.prixHTAvecReduc * item.quantite)
                    }, 0
                );

                totalTTC1 = cart.reduce(
                    (accumulator, item) => {
                        return ((accumulator || 0) + ((item.prixHTAvecReduc * (parseFloat(item.tva) + 1)) * item.quantite))
                    }, 0
                );

                totalTVA1 = cart.reduce(
                    (accumulator, item) => {
                        return (accumulator || 0) + ((item.prixHTAvecReduc * parseFloat(item.tva)) * item.quantite)
                    }, 0
                );
                // pour que mes valeur dans le json soit bien des chiffre ne dépassant pas deux chiffres aprés la virgule.
                const totalHT = Number(arrondi(totalHT1));
                const totalTTC = Number(arrondi(totalTTC1));
                const totalTVA = Number(arrondi(totalTVA1));

                //NOTE
                //UPDATE
                // A sa création .toFixed() semblait troncquer et non arrondir  ATENTION
                // la bonne maniére de reduire a 2 chiffre apres la virgule ==> (Math.round(number * 100)/100).toFixed(2);

                //Je les stock en session au cas ou j'en ai besoin plus tard.
                req.session.totalHT = totalHT;
                req.session.totalTTC = totalTTC;
                req.session.totalTVA = totalTVA;
                req.session.coutTransporteur = coutTransporteur;


                //! ATTENTION avec le .toFixed()  ==>> 0.1 + 0.2 === 0.3 returning false car Les nombres à virgule flottante ne peuvent pas représenter toutes les décimales avec précision en binaire
                req.session.totalStripe = parseInt(totalTTC * 100) + parseInt(coutTransporteur * 100); // je convertit en centimes et Entier pour STRIPE
                // On renvoit les infos calculés au front !
                res.status(200).json({
                    totalHT,
                    totalTTC,
                    totalTVA,
                    coutTransporteur,
                    cart,
                });

            } else {
                res.status(200).json('Votre panier est vide');
            }

        } catch (error) {
            console.trace('Erreur dans la méthode getPanier du panierController :',
                error);
            res.status(500).json(error.message);
        }


    },

    addArticlePanier: async (req, res) => {
        try {

            console.log("req.session a l'entrée du addPanier ==> ", req.session);

            const articleId = parseInt(req.params.id, 10);
            // Je vérifie qu'il est en stock pour pouvoir l'ajouter au panier
            const monArticle = await Produit.findOne(articleId);
            if (monArticle.stock < 1) {
                return res.json("Cet article n'est plus disponible !")
            };

            //je verifie qu'il existe
            if (!req.session.cart) {
                req.session.cart = [];
            }
            // je cherche dans le panier si un article existe déjà (grace à l'id)
            // si on le trouve on le récupére dans la variable article
            let article = req.session.cart.find(
                (articleDansLePanier) => articleDansLePanier.id == articleId
            );

            //TODO
            // je dois vérifier ici que la réduction a bien le statut actif en base de données. et qu'on ne considére que les reduction avec le statut actif ici !  

            console.log("mon artcile ==>>  ", monArticle);

            let reduction;

            if (monArticle.reduction === null) {

                reduction = 0;

            } else if (monArticle.reduction > 0) {

                reduction = monArticle.reduction

            } else {
                reduction = 0;
            }






            if (!article) {
                // Si article est vide, le panier ne contient pas encore cette article
                // donc on va chercher les info de l'article en BDD puis on l'ajoute au panier avec une qty de 1

                //const monArticle = await Produit.findOne(articleId);
                monArticle.quantite = 1;
                monArticle.tva = parseFloat(monArticle.tva);
                reduction = parseFloat(reduction); // pas vraiment utile, il sort de Postgres casté en Float...
                monArticle.prix = parseFloat(monArticle.prix);

                console.log("monArticle.stock =>", monArticle.stock);
                console.log("monArticle.quantite =>", monArticle.quantite);

                if (monArticle.quantite > monArticle.stock) {
                    return res.status(200).json("Il n'existe pas assez d'article en stock pour la quantité choisie !")
                };

                req.session.cart.push(monArticle);
                console.log("req.session.cart aprés le 1er ajout =>", req.session.cart);

            } else {
                // Si on a trouvé l'article alors on va incrementer la qté
                if (article.quantite >= article.stock) {
                    console.log("Il n'existe pas assez d'article en stock pour la quantité choisie !");
                    return res.status(200).json("Il n'existe pas assez d'article en stock pour la quantité choisie !")
                }
                article.quantite++;
                console.log("req.session.cart aprés ajout si l'article était déja présent =>", req.session.cart);

            }

            //! On renvoit tout ce que contient carte en mettant a jour les données du panier et les totaux.


            const cart = req.session.cart;

            //let totalHT = 0;
            //let totalTTC = 0;
            let coutTransporteur = 9.15; // prix d'un Collisimo pour la France jusqu'a deux kilos.

            if (cart) {

                //prise en charge de la réduction en construisant une nouvelle clé valeur représentant le nouveau prix avec la réduction sur lequel baser les calculs du panier.
                // Si la réduction est de 0, cette valeur sera identique au prix...
                cart.map(article => article.prixHTAvecReduc = parseFloat(arrondi(article.prix * (1 - reduction))));

                totalHT1 = cart.reduce(
                    (accumulator, item) => {

                        return (accumulator || 0) + (item.prixHTAvecReduc * item.quantite)
                    }, 0
                );

                totalTTC1 = cart.reduce(
                    (accumulator, item) => {
                        return ((accumulator || 0) + ((item.prixHTAvecReduc * (parseFloat(item.tva) + 1)) * item.quantite))
                    }, 0
                );

                totalTVA1 = cart.reduce(
                    (accumulator, item) => {
                        return (accumulator || 0) + ((item.prixHTAvecReduc * parseFloat(item.tva)) * item.quantite)
                    }, 0
                );
                // pour que mes valeur dans le json soit bien des chiffres ne dépassant pas deux chiffres aprés la virgule.
                const totalHT = Number(arrondi(totalHT1));
                const totalTTC = Number(arrondi(totalTTC1));
                const totalTVA = Number(arrondi(totalTVA1));

                //Je les stock en session au cas ou j'en ai besoin plus tard.
                req.session.totalHT = totalHT;
                req.session.totalTTC = totalTTC;
                req.session.totalTVA = totalTVA;
                req.session.coutTransporteur = coutTransporteur;


                //! ATTENTION avec le .toFixed()  ==>> 0.1 + 0.2 === 0.3 returning false car Les nombres à virgule flottante ne peuvent pas représenter toutes les décimales avec précision en binaire
                req.session.totalStripe = parseInt(totalTTC * 100) + parseInt(coutTransporteur * 100); // je convertit en centimes et Entier pour STRIPE
                // On renvoit les infos calculés au front !
                res.status(200).json({
                    totalHT,
                    totalTTC,
                    totalTVA,
                    coutTransporteur,
                    cart,
                });

                console.log("req.session a la sortie du addPanier ==> ", req.session);


            }


        } catch (error) {
            console.trace('Erreur dans la méthode addArticlePanier du panierController :',
                error);
            res.status(500).json(error.message);
        }

    },


    delArticlePanier: async (req, res) => {
        try {

            console.log("req.session a l'entrée du delPanier ==> ", req.session);


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

            //! On renvoit tout ce que contient carte en mettant a jour les données du panier et les totaux.


            const cart = req.session.cart;

            //let totalHT = 0;
            //let totalTTC = 0;
            let coutTransporteur = 9.15; // prix d'un Collisimo pour la France jusqu'a deux kilos.

            if (cart) {

                //prise en charge de la réduction en construisant une nouvelle clé valeur représentant le nouveau prix avec la réduction sur lequel baser les calculs du panier. Si la réduction est de 0, cette valeur sera identique au prix...
                cart.map(article => article.prixHTAvecReduc = parseFloat(arrondi(article.prix * (1 - article.reduction))));

                totalHT1 = cart.reduce(
                    (accumulator, item) => {

                        return (accumulator || 0) + (item.prixHTAvecReduc * item.quantite)
                    }, 0
                );

                totalTTC1 = cart.reduce(
                    (accumulator, item) => {
                        return ((accumulator || 0) + ((item.prixHTAvecReduc * (parseFloat(item.tva) + 1)) * item.quantite))
                    }, 0
                );

                totalTVA1 = cart.reduce(
                    (accumulator, item) => {
                        return (accumulator || 0) + ((item.prixHTAvecReduc * parseFloat(item.tva)) * item.quantite)
                    }, 0
                );
                // pour que mes valeur dans le json soit bien des chiffres ne dépassant pas deux chiffres aprés la virgule.
                const totalHT = Number(arrondi(totalHT1));
                const totalTTC = Number(arrondi(totalTTC1));
                const totalTVA = Number(arrondi(totalTVA1));

                //Je les stock en session au cas ou j'en ai besoin plus tard.
                req.session.totalHT = totalHT;
                req.session.totalTTC = totalTTC;
                req.session.totalTVA = totalTVA;
                req.session.coutTransporteur = coutTransporteur;


                //! ATTENTION avec le .toFixed()  ==>> 0.1 + 0.2 === 0.3 returning false car Les nombres à virgule flottante ne peuvent pas représenter toutes les décimales avec précision en binaire
                req.session.totalStripe = parseInt(totalTTC * 100) + parseInt(coutTransporteur * 100); // je convertit en centimes et Entier pour STRIPE
                // On renvoit les infos calculés au front !
                res.status(200).json({
                    totalHT,
                    totalTTC,
                    totalTVA,
                    coutTransporteur,
                    cart,
                });

                console.log("req.session a la sortie du delPanier ==> ", req.session);


            }

        } catch (error) {
            console.trace('Erreur dans la méthode delArticlePanier du panierController :',
                error);
            res.status(500).json(error.message);
        }

    },


    //! GESTION DU PANIER EN BDD (et non plus en session)-----------------------------------


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

            if ((req.session.user.privilege === 'Administrateur' || req.session.user.privilege === 'Client') && req.session.user.idClient !== client.idClient) {
                return res.status(403).json({
                    message: "Vous n'avez pas les droits pour accéder a cette ressource"
                })
            };

            res.status(200).json(client);

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
            res.status(200).json(client);

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
            res.status(200).json(newClient);
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

            if (Object.keys(req.body).length === 0) {
                return res.status(200).json({
                    message: 'Vous n\'avez envoyé aucune données à modifier.'
                });
            }

            const updateClient = await Panier.findOne(id);

            if ((req.session.user.privilege === 'Administrateur' || req.session.user.privilege === 'Client') && req.session.user.idClient !== updateClient.idClient) {
                return res.status(403).json({
                    message: "Vous n'avez pas les droits pour accéder a cette ressource"
                })
            };


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

            res.status(200).json(userMessage);

        } catch (error) {
            console.log(`Erreur lors de l'enregistrement du nouveau panier: ${error.message}`);
            res.status(500).json(error.message);
        }
    },




    delete: async (req, res) => {

        try {

            const clientInDb = await Panier.findOne(req.params.id);

            if ((req.session.user.privilege === 'Administrateur' || req.session.user.privilege === 'Client') && req.session.user.idClient !== clientInDb.idClient) {
                return res.status(403).json({
                    message: "Vous n'avez pas les droits pour accéder a cette ressource"
                })
            };

            const client = await clientInDb.delete();

            res.status(200).json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode delete du panierController :',
                error);
            res.status(500).json(error.message);
        }
    },


    deleteByIdClient: async (req, res) => {

        try {

            const clientsInDb = await Panier.findByIdClient(req.params.id);


            if ((req.session.user.privilege === 'Administrateur' || req.session.user.privilege === 'Client') && req.session.user.idClient !== clientsInDb[0].idClient) {
                return res.status(403).json({
                    message: "Vous n'avez pas les droits pour accéder a cette ressource"
                })
            };


            await clientsInDb[0].deleteByIdClient();

            //NOTE
            //a on vraiment de rendre au front ce qui a été supprimé...?
            res.status(200).json(clientsInDb);

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
            res.status(200).json(client);

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
            res.status(200).json(client);

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
            res.status(200).json(newClient);
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

            res.status(200).json(userMessage);

        } catch (error) {
            console.log(`Erreur lors de l'enregistrement du nouveau panier: ${error.message}`);
            res.status(500).json(error.message);
        }
    },

    deleteLignePanier: async (req, res) => {

        try {

            const clientInDb = await LignePanier.findOne(req.params.id);

            const client = await clientInDb.delete();

            res.status(200).json(client);

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


            res.status(200).json(arrayDeleted[0]);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteLignePanierByIdPanier du panierController :',
                error);
            res.status(500).json(error.message);
        }
    },

}

module.exports = panierController;