const Panier = require('../models/panier');
const LignePanier = require('../models/lignePanier');
const Produit = require('../models/produit');

const redis = require('../services/redis');

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

//NOTE 
// Pout ignition V8, on passe tous les prix en entiers (centimes), pour qu'ignition utilise SMI 
// Si nombre a virgule ou entier de plus de 32 bits, ignition le passe en HeapNumber, archi lent !! 



const panierController = {

    // reçois un req.body.coupon comprenant le coupon a insérer dans le panier pour une mise a jour du panier et de son montant totalstripe !

    insertCoupon: async (req, res) => {
        try {
            // on vérifit que l'utilisateur est connecté
            if (req.session.user === undefined || req.session.user === null) {
                console.log("Vous devez être connecté pour pouvoir utiliser un coupon. Merci de vous connecter et de réessayer.")
                return res.status(200).json("Vous devez être connecté pour pouvoir utiliser un coupon. Merci de vous connecter et de réessayer.")
            }

            //On verifit si le coupon inséré existe
            if ((await redis.exists(`mada/coupon:${req.body.coupon}`)) === 0) {

                //ici la clé n'existe pas !

                console.log("Ce coupon n'existe pas ou n'est plus valable !");
                return res.status(200).json({
                    message: "Ce coupon n'existe pas ou n'est plus valable !"
                });

            }


            // on vérifit si le coupon existant et valide concerne notre utilisateur, ou tous les utilisateurs !
            if (existCoupon.idClient !== null && existCoupon.idClient !== undefined) {

                //ici le coupon est destiné a un client particulier et n'est pas échangeable entre clients !!
                if (existCoupon.idClient !== req.session.user.idClient) {
                    console.log("Ce coupon existe mais ne vous est pas destiné... ");
                    return res.status(200).json({
                        message: "Ce coupon existe mais ne vous est pas destiné..."
                    });
                }

            }
            //si la propriété idClient de l'objet n'existe pas alors, le coupon est valable pour tous les clients !
            //on l'insére en session!
            req.session.coupon = existCoupon;

            //! j'applique la réduction du coupon et je renvoie toutes les données mise a jour 

            //! cette suite sera a mutualisé entre get add, et delPanier !!

            const cart = req.session.cart;

            if (cart) {

                const totalHT = req.session.totalHT;
                const totalTTC = req.session.totalTTC;
                const totalTVA = req.session.totalTVA;


                // si dans la session, un coupon existe, on applique sa valeur, sinon on ignore
                if (req.session.coupon !== null && req.session.coupon !== undefined) {
                    req.session.totalStripe = (totalTTC + req.session.coutTransporteur) - req.session.coupon.montant

                } else {
                    req.session.totalStripe = totalTTC + req.session.coutTransporteur;

                }

                // si dans la session, un transporteur existe, ou un coupon de reduction existe, on applique sa valeur, sinon on ignore
                if (req.session.coutTransporteur !== null && req.session.coutTransporteur !== undefined) {

                    if (req.session.coupon !== null && req.session.coupon !== undefined) {
                        req.session.totalStripe = (totalTTC + req.session.coutTransporteur) - req.session.coupon.montant

                    } else {
                        req.session.totalStripe = totalTTC + req.session.coutTransporteur;

                    }


                } else {

                    if (req.session.coupon !== null && req.session.coupon !== undefined) {
                        req.session.totalStripe = totalTTC - req.session.coupon.montant

                    } else {
                        req.session.totalStripe = totalTTC;

                    }

                }

                const totalAPayer = req.session.totalStripe;

                console.log("req.session a la sortie du insertCoupon ==> ", req.session);


                if (req.session.coutTransporteur !== null && req.session.coutTransporteur !== undefined) {
                    const coutTransporteur = req.session.coutTransporteur;
                    // On renvoit les infos calculés au front avec les cout du transport !
                    return res.status(200).json({
                        totalHT,
                        totalTTC,
                        totalTVA,
                        coutTransporteur,
                        cart,
                        totalAPayer,
                    });

                } else {
                    // On renvoit les infos calculés au front, sans les cout du transport !
                    return res.status(200).json({
                        totalHT,
                        totalTTC,
                        totalTVA,
                        cart,
                        totalAPayer,
                    });
                }



            }



            //! si utilisation du coupon, au retour de la méthode webhook si utilisation d'un coupon, je dois supprimer ce coupon dans redis et l'indexCoupon


            return res.status(200).json("Votre panier est vide !")


        } catch (error) {
            console.trace(
                'Erreur dans la méthode insertCoupon du panierController :',
                error);
            res.status(500).end();
        }

    },

    cancelCoupon: async (req, res) => {
        try {
            // on vérifit que l'utilisateur est connecté
            if (req.session.user === undefined || req.session.user === null) {
                console.log("Vous devez être connecté pour pouvoir éffacer un coupon. Merci de vous connecter et de réessayer.");
                return res.status(200).json("Vous devez être connecté pour pouvoir éffacer un coupon. Merci de vous connecter et de réessayer.");
            }


            //! cette suite sera a mutualisé entre get add, et delPanier !!

            const cart = req.session.cart;


            if (cart) {

                const totalHT = req.session.totalHT;
                const totalTTC = req.session.totalTTC;
                const totalTVA = req.session.totalTVA;


                // si dans la session, un transporteur existe, ou un coupon de reduction existe, on applique sa valeur, sinon on ignore
                if (req.session.coutTransporteur !== null && req.session.coutTransporteur !== undefined) {

                    if (req.session.coupon !== null && req.session.coupon !== undefined) {
                        req.session.totalStripe = totalTTC + req.session.coutTransporteur;
                        delete req.session.coupon;
                        console.log("Un coupon de réduction a bien été annulé.");

                    } else {
                        req.session.totalStripe = totalTTC + req.session.coutTransporteur;
                        console.log("Aucun coupon de réduction n'est présent.");
                    }


                } else {

                    if (req.session.coupon !== null && req.session.coupon !== undefined) {
                        req.session.totalStripe = totalTTC + req.session.coupon.montant;
                        delete req.session.coupon;
                        console.log("Un coupon de réduction a bien été annulé.");

                    } else {
                        req.session.totalStripe = totalTTC;
                        console.log("Aucun coupon de réduction n'est présent.");
                    }

                }

                const totalAPayer = req.session.totalStripe;

                console.log("req.session a la sortie du cancelCoupon ==> ", req.session);


                if (req.session.coutTransporteur !== null && req.session.coutTransporteur !== undefined) {
                    const coutTransporteur = req.session.coutTransporteur;
                    // On renvoit les infos calculés au front avec les cout du transport !
                    return res.status(200).json({
                        totalHT,
                        totalTTC,
                        totalTVA,
                        coutTransporteur,
                        cart,
                        totalAPayer,
                    });

                } else {
                    // On renvoit les infos calculés au front, sans les cout du transport !
                    return res.status(200).json({
                        totalHT,
                        totalTTC,
                        totalTVA,
                        cart,
                        totalAPayer,
                    });
                }



            }

            //! si utilisation du coupon, au retour de la méthode webhook si utilisation d'un coupon, je dois supprimer ce coupon dans redis et l'indexCoupon

            return res.status(200).json("Votre panier est vide !")


        } catch (error) {
            console.trace(
                'Erreur dans la méthode cancelCoupon du panierController :',
                error);
            res.status(500).end();
        }

    },

    getPanier: async (req, res) => {

        try {
            //NOTE
            //req.session.panierViewCount = (req.session.panierViewCount || 0) + 1;

            const cart = req.session.cart;


            if (cart) {

                const totalHT = req.session.totalHT;
                const totalTTC = req.session.totalTTC;
                const totalTVA = req.session.totalTVA;
                const totalPoid = req.session.totalPoid;



                // si dans la session, un transporteur existe, ou un coupon de reduction existe, on applique sa valeur, sinon on ignore
                if (req.session.coutTransporteur !== null && req.session.coutTransporteur !== undefined) {

                    if (req.session.coupon !== null && req.session.coupon !== undefined) {
                        req.session.totalStripe = (totalTTC + req.session.coutTransporteur) - req.session.coupon.montant

                    } else {
                        req.session.totalStripe = totalTTC + req.session.coutTransporteur;

                    }


                } else {

                    if (req.session.coupon !== null && req.session.coupon !== undefined) {
                        req.session.totalStripe = totalTTC - req.session.coupon.montant

                    } else {
                        req.session.totalStripe = totalTTC;

                    }

                }

                const totalAPayer = req.session.totalStripe;

                if (req.session.coutTransporteur !== null && req.session.coutTransporteur !== undefined) {
                    const coutTransporteur = req.session.coutTransporteur;
                    // On renvoit les infos calculés au front avec les cout du transport !
                    return res.status(200).json({
                        totalHT,
                        totalTTC,
                        totalTVA,
                        totalPoid,
                        coutTransporteur,
                        cart,
                        totalAPayer,
                    });

                } else {
                    // On renvoit les infos calculés au front, sans les cout du transport !
                    return res.status(200).json({
                        totalHT,
                        totalTTC,
                        totalTVA,
                        totalPoid,
                        cart,
                        totalAPayer,
                    });
                }




            } else {
                return res.status(200).json('Votre panier est vide');
            }

        } catch (error) {
            console.trace('Erreur dans la méthode getPanier du panierController :',
                error);
            res.status(500).end();
        }


    },

    addArticlePanier: async (req, res) => {
        try {

            const articleId = parseInt(req.params.id, 10);
            // Je vérifie qu'il est en stock pour pouvoir l'ajouter au panier
            const monArticle = await Produit.findOne(articleId);

            if(monArticle === null || monArticle.id === undefined ) {
                return res.status(200).json({
                    message: "Cet article n'existe pas !"
                });
            }

            if (monArticle.stock < 1) {
                return res.status(200).json({
                    message: "Cet article n'est plus disponible !"
                });
            };

            //je verifie que mon panier existe
            if (!req.session.cart) {
                req.session.cart = [];
            }
            // je cherche dans le panier si un article existe déjà (grace à l'id)
            // si on le trouve on le récupére dans la variable article
            let article = req.session.cart.find(
                (articleDansLePanier) => articleDansLePanier.id == articleId
            );

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

                if (monArticle.quantite > monArticle.stock) {
                    return res.status(200).json("Il n'existe pas assez d'article en stock pour la quantité choisie !")
                };

                req.session.cart.push(monArticle);
                //console.log("req.session.cart aprés le 1er ajout =>", req.session.cart);

            } else {
                // Si on a trouvé l'article alors on va incrementer la qté
                if (article.quantite >= article.stock) {
                    console.log("Il n'existe pas assez d'article en stock pour la quantité choisie !");
                    return res.status(200).json("Il n'existe pas assez d'article en stock pour la quantité choisie !")
                }
                article.quantite++;
                //console.log("req.session.cart aprés ajout si l'article était déja présent =>", req.session.cart);

            }

            //! On renvoit tout ce que contient carte en mettant a jour les données du panier et les totaux.


            const cart = req.session.cart;


            if (cart) {

                //prise en charge de la réduction en construisant une nouvelle clé valeur représentant le nouveau prix avec la réduction sur lequel baser les calculs du panier.
                // Si la réduction est de 0, cette valeur sera identique au prix...
                cart.map(article => article.prixHTAvecReduc = parseFloat(arrondi((article.prixHT) * (1 - reduction))));
                //cart.map(article => article.prixHT = article.prixHT );

                totalHT1 = cart.reduce(
                    (accumulator, item) => {

                        return (accumulator || 0) + (item.prixHTAvecReduc * item.quantite)
                    }, 0
                );

                totalTTC1 = cart.reduce(
                    (accumulator, item) => {
                        return ((accumulator || 0) + ((item.prixHTAvecReduc * ((item.tva) + 1)) * item.quantite))
                    }, 0
                );

                totalTVA1 = cart.reduce(
                    (accumulator, item) => {
                        return (accumulator || 0) + ((item.prixHTAvecReduc * (item.tva)) * item.quantite)
                    }, 0
                );
                const totalPoid = cart.reduce(
                    (accumulator, item) => {
                        return (accumulator || 0) + (item.poid * item.quantite)
                    }, 0
                );

                // pour que mes valeur dans le json soit bien des chiffres ne dépassant pas deux chiffres aprés la virgule.
                const totalHT = Math.round(arrondi(totalHT1));
                const totalTTC = Math.round(arrondi(totalTTC1));
                const totalTVA = Math.round(arrondi(totalTVA1));
               // const totalPoid =  // le total des multiplications => poid d'un article x qté de cet article

                //Je les stock en session au cas ou j'en ai besoin plus tard.
                req.session.totalHT = totalHT;
                req.session.totalTTC = totalTTC;
                req.session.totalTVA = totalTVA;
                req.session.totalPoid = totalPoid;


                // si dans la session, un transporteur existe, ou un coupon de reduction existe, on applique sa valeur, sinon on ignore
                if (req.session.coutTransporteur !== null && req.session.coutTransporteur !== undefined) {

                    if (req.session.coupon !== null && req.session.coupon !== undefined) {
                        req.session.totalStripe = (totalTTC + req.session.coutTransporteur) - req.session.coupon.montant

                    } else {
                        req.session.totalStripe = totalTTC + req.session.coutTransporteur;

                    }


                } else {

                    if (req.session.coupon !== null && req.session.coupon !== undefined) {
                        req.session.totalStripe = totalTTC - req.session.coupon.montant

                    } else {
                        req.session.totalStripe = totalTTC;

                    }

                }
                const totalAPayer = req.session.totalStripe;

                console.log("req.session a la sortie du addPanier ==> ", req.session);

                if (req.session.coutTransporteur !== null && req.session.coutTransporteur !== undefined) {
                    const coutTransporteur = req.session.coutTransporteur;
                    // On renvoit les infos calculés au front avec les couts du transport !
                    return res.status(200).json({
                        totalHT,
                        totalTTC,
                        totalTVA,
                        totalPoid,
                        coutTransporteur,
                        cart,
                        totalAPayer,
                    });

                } else {
                    // On renvoit les infos calculés au front, sans les couts du transport !
                    return res.status(200).json({
                        totalHT,
                        totalTTC,
                        totalTVA,
                        totalPoid,
                        cart,
                        totalAPayer,
                    });
                }

            }
            return res.status(200).json('Votre panier est vide');



        } catch (error) {
            console.trace('Erreur dans la méthode addArticlePanier du panierController :',
                error);
            res.status(500).end();
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

            console.log('cart == ', cart);

            if (cart.length > 0) {

                console.log("on passe dedans");
                // pour tous les articles restant dans le panier, on définit a Zéro la réduction si reduction vaut "null"

                for (const article of cart) {

                    if (article.reduction === null) {

                        article.reduction = 0;

                    }
                }

                //prise en charge de la réduction en construisant une nouvelle clé valeur représentant le nouveau prix avec la réduction sur lequel baser les calculs du panier.
                // Si la réduction est de 0, cette valeur sera identique au prix...
                cart.map(article => article.prixHTAvecReduc = parseFloat(arrondi((article.prixHT) * (1 - article.reduction))));
                //cart.map(article => article.prixHT = article.prixHT );

                totalHT1 = cart.reduce(
                    (accumulator, item) => {

                        return (accumulator || 0) + (item.prixHTAvecReduc * item.quantite)
                    }, 0
                );

                totalTTC1 = cart.reduce(
                    (accumulator, item) => {
                        return ((accumulator || 0) + ((item.prixHTAvecReduc * ((item.tva) + 1)) * item.quantite))
                    }, 0
                );

                totalTVA1 = cart.reduce(
                    (accumulator, item) => {
                        return (accumulator || 0) + ((item.prixHTAvecReduc * (item.tva)) * item.quantite)
                    }, 0
                );
                const totalPoid = cart.reduce(
                    (accumulator, item) => {
                        return (accumulator || 0) + (item.poid * item.quantite)
                    }, 0
                );

                // pour que mes valeur dans le json soit bien des chiffres ne dépassant pas deux chiffres aprés la virgule.
                const totalHT = Math.round(arrondi(totalHT1));
                const totalTTC = Math.round(arrondi(totalTTC1));
                const totalTVA = Math.round(arrondi(totalTVA1));

                //Je les stock en session au cas ou j'en ai besoin plus tard.
                req.session.totalHT = totalHT;
                req.session.totalTTC = totalTTC;
                req.session.totalTVA = totalTVA;
                req.session.totalPoid = totalPoid;



                // si dans la session, un transporteur existe, ou un coupon de reduction existe, on applique sa valeur, sinon on ignore
                if (req.session.coutTransporteur !== null && req.session.coutTransporteur !== undefined) {

                    if (req.session.coupon !== null && req.session.coupon !== undefined) {
                        req.session.totalStripe = (totalTTC + req.session.coutTransporteur) - req.session.coupon.montant

                    } else {
                        req.session.totalStripe = totalTTC + req.session.coutTransporteur;

                    }


                } else {

                    if (req.session.coupon !== null && req.session.coupon !== undefined) {
                        req.session.totalStripe = totalTTC - req.session.coupon.montant

                    } else {
                        req.session.totalStripe = totalTTC;

                    }

                }

                const totalAPayer = req.session.totalStripe;

                console.log("req.session a la sortie du delPanier ==> ", req.session);

                if (req.session.coutTransporteur !== null && req.session.coutTransporteur !== undefined) {
                    const coutTransporteur = req.session.coutTransporteur;
                    // On renvoit les infos calculés au front avec les cout du transport !
                    return res.status(200).json({
                        totalHT,
                        totalTTC,
                        totalTVA,
                        totalPoid,
                        coutTransporteur,
                        cart,
                        totalAPayer,
                    });

                } else {
                    // On renvoit les infos calculés au front, sans les cout du transport !
                    return res.status(200).json({
                        totalHT,
                        totalTTC,
                        totalTVA,
                        totalPoid,
                        cart,
                        totalAPayer,
                    });
                }




            }

            return res.status(200).json({
                message: 'Votre panier est vide'
            });




        } catch (error) {
            console.trace('Erreur dans la méthode delArticlePanier du panierController :',
                error);
            res.status(500).end();
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
            res.status(500).end();
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
            res.status(500).end();
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
            res.status(500).end();
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
            res.status(500).end();
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
            res.status(500).end();
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
            res.status(500).end();
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
            res.status(500).end();
        }
    },

    getOneLignePanier: async (req, res) => {
        try {

            const client = await LignePanier.findOne(req.params.id);
            res.status(200).json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode getOne du panierController :',
                error);
            res.status(500).end();
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
            res.status(500).end();
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
            res.status(500).end();
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
            res.status(500).end();
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
            res.status(500).end();
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
            res.status(500).end();
        }
    },

}

module.exports = panierController;