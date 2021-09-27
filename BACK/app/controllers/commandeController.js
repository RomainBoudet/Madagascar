const Commande = require('../models/commande');
const StatutCommande = require('../models/statutCommande');
const LigneCommande = require('../models/ligneCommande');
const ProduitRetour = require('../models/produitRetour');

const {
    distance,
    closest
} = require('fastest-levenshtein');


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

            // ici je n'autorise que certain statut a être updaté ! 
            // les statuts : 2 = Paiement validé, 3 = En cours de préparation, 4 = Prêt pour expédition, 5 = Expédiée,
            // par mesure de sécurité et pour plus de liberté, j'autorise néanmoins le Developpeur a changé tout statut comme il le souhaite ! 


            if (req.session.user.privilege === 'Client') {
                return res.status(403).json({
                    message: "Vous n'avez pas les droits pour accéder a cette ressource"
                })
            };
            //! parser un email : https://medium.com/@akinremiolumide96/reading-email-data-with-node-js-cdacaa174cc7 

            //RAPPEL des statuts de commande : 1 = En attente, 2 = Paiement validé, 3 = En cours de préparation, 4 = Prêt pour expédition, 5 = Expédiée, 6 = Remboursée, 7 = Annulée;

            //pour une API flexible on prend soit une réference de commande soit un id de commande et soit le nom d'un statut soit sont id !
            // et on autorise l'admin a faire 3 faute par statut, on on le corrige automatiquement ! sinon on lui propose le plus proche statut existant... Merci Levenshtein !

            //! je fait le tri si c'est une référence de commande ou un id de commande !

            const regRefCommande = /^([0-9]*[.]{1}[0-9]*)*$/; // pour une référence de commande
            const number = /^[0-9]*$/; // pour un id de commande
            const notNumber = /[^0-9]+/; // a utiliser pour discriminer le statut de commande en format string. 



            // on vérifit que la confirmation de statut est conforme au statut !
            // sécurité supplémentaire de Joi..
            if (req.body.statut !== req.body.confirmStatut) {
                console.log("La confirmation de votre statut doit être identique a votre statut !");
                return res.status(200).json({
                    message: "La confirmation de votre statut doit être identique a votre statut !"
                })
            }

            let commandeInDb;
            let statutInDb;



            if (req.session.user.privilege === 'Developpeur') {
              
                if (regRefCommande.test(req.body.commande)) {
                    // ici commande est une référence
                    commandeInDb = await Commande.findOneCommande(req.body.commande);
    
                    if (commandeInDb === null || commandeInDb === undefined) {
                        console.log("Cette référence de commande n'éxiste pas !");
                        return res.status(200).json({
                            message: "Cette référence de commande n'éxiste pas !"
                        })
                    }
    
                } else if (number.test(req.body.commande)) {
                    // ici commande est un identifiant
                    commandeInDb = await Commande.findOne(req.body.commande);
    
                    if (commandeInDb === null || commandeInDb === undefined) {
                        console.log("Cette identifiant de commande n'éxiste pas !");
                        return res.status(200).json({
                            message: "Cette identifiant de commande n'éxiste pas !"
                        })
                    }
    
                } else {
                    console.log("votre commande n'a pas le format souhaité ! Elle doit avoir soit le format d'une réference soit celui d'un identifiant.");
                    return res.status(200).json({
                        message: "votre commande n'a pas le format souhaité ! Elle doit avoir soit le format d'une réference soit celui d'un identifiant."
                    })
                }
    
    
                if (number.test(req.body.statut)) {
    
                    // ici req.body.statut est un identifiant !
                    statutInDb = await StatutCommande.findOne(req.body.statut);
    
                    // Je vérifis que le statut proposé pour update existe !
                    if (statutInDb === null || statutInDb === undefined) {
                        console.log("Cette identifiant de statut n'éxiste pas !")
                        return res.status(200).json({
                            message: "Cette identifiant de statut n'éxiste pas !"
                        })
                    }
                    // J'avertit l'admin si le statut qu'il souhaiterais mettre a jour est déja le statut existant !
                    if (Number(req.body.statut) === commandeInDb.idCommandeStatut) {
                        console.log("Le statut proposé pour cette commande est déja celui existant !")
                        return res.status(200).json({
                            message: "Le statut proposé pour cette commande est déja celui existant !"
                        })
                    }
                    // J'avertit l'admin si sa mise a jour ne suit pas un ordre logique... si il a sauté des étapes..
                    // simple avertissement, on ne "return" pas !
                    if (Number(req.body.statut) !== (commandeInDb.idCommandeStatut + 1)) {
                        console.log("Votre mise a jour de statut ne suit pas l'ordre logique... ")
                        res.status(200).json({
                            message: `Votre mise a jour de statut ne suit pas l'ordre logique... vous êtes passé de ${commandeInDb.idCommandeStatut} à ${req.body.statut}  (RAPPEL: 1 = En attente, 2 = Paiement validé, 3 = En cours de préparation, 4 = Prêt pour expédition, 5 = Expédiée, 6 = Remboursée, 7 = Annulée)`
                        })
                    }
    
    
                } else if (notNumber.test(req.body.statut)) {
    
                    // je construit un tableau composé de mes statut, dynamiquement !
                    const arrayStatut = [];
                    let allStatuts;
                    try {
                        allStatuts = await StatutCommande.findAll();
                        for (const item of allStatuts) {
                            arrayStatut.push(item.statut);
                        }
    
                    } catch (error) {
                        console.log(`erreur dans la méthode upDateSatut du CommandeController ! lors de la recherche de tous les statuts ! ${error}`);
                        return res.statut(500).end();
                    }
    
                    // Ici j'ai une string sans chiffre dans le formulaire, j'utilise la distance de Levenshtein pour réorienter une potentielle érreur de l'admin !
                    // Je calcul toutes les distance de Levenstein entre le mot proposé et ceux de mon tableau et je prends la plus petite. 
                    let arrayDistance = [];
                    for (const item of arrayStatut) {
                        const theDistance = distance(req.body.statut, item);
                        arrayDistance.push(theDistance);
                        //console.log("theDistance == ", theDistance);
                    }
    
                    const isDistInf3 = (element) => element <= 3;
                    const indexSmallDistance = arrayDistance.findIndex(isDistInf3);
                    // console.log("indexSmallDistance == ", indexSmallDistance);
    
                    // si indexSmallDistance vaut -1 alors aucun match !!
                    if (indexSmallDistance === -1 || indexSmallDistance === undefined) {
    
                        // Je prospose néanmoins a l'admin le mot le plus proche possible de sa demande !
                        const closeWord = closest(req.body.statut, arrayStatut);
                        console.log(`Aucun statut existant ne correspond a votre demande de statut, vouliez-vous indiqué le statut : '${closeWord}' ?`);
                        return res.status(200).json({
                            message: `Aucun statut existant ne correspond a votre demande de statut, vouliez-vous indiqué le statut : '${closeWord}' ?`
                        })
                    }
    
                    // ici indexSmallDistance est forcemment inférieur a 3 ou moins, on convertit le statut entrée par l'admin en statut existant le plus proche !  
                    req.body.statut = arrayStatut[indexSmallDistance];
    
                    // J'avertit l'admin si le statut qu'il souhaiterais mettre a jour est déja le statut existant !
                    if (req.body.statut === commandeInDb.statut) {
                        console.log("Le statut proposé pour cette commande est déja celui existant !")
                        return res.status(200).json({
                            message: "Le statut proposé pour cette commande est déja celui existant !"
                        })
                    }
    
                    // j'avertit l'admin si ca mise a jour ne suit pas un ordre logique... si il a sauté des étapes..
                    // simple avertissement, on ne "return" pas !
                    const isStatut = (element) => element === req.body.statut;
                    const indexStatut = arrayStatut.findIndex(isStatut);
    
                    const isStatut2 = (element) => element === commandeInDb.statut;
                    const indexStatutCommande = arrayStatut.findIndex(isStatut2);
    
                    if (indexStatut !== (indexStatutCommande + 1)) {
                        console.log("commandeInDb.statut == ", commandeInDb.statut);
                        console.log("Votre mise a jour de statut ne suit pas l'ordre logique... ")
                        res.status(200).json({
                            message: `Votre mise a jour de statut ne suit pas l'ordre logique... vous êtes passé de '${commandeInDb.statut}' à '${req.body.statut}'  (RAPPEL: 1 = En attente, 2 = Paiement validé, 3 = En cours de préparation, 4 = Prêt pour expédition, 5 = Expédiée, 6 = Remboursée, 7 = Annulée)`
                        })
                    }
    
    
                    // je dois ici retrouver l'objet du tableau allStatuts contentant la valeur de req.body.statut dans un de ces objets
                    statutInDb = allStatuts.find(element => element.statut === req.body.statut);
    
    
                    // par défault je ne devrais jamais rentrer dans ce else, soit statut est un nombre, soit il est pas un nombre, pas de 3ieme choix !
                } else {
                    console.log("votre statut n'a pas le format souhaité ! il doit avoir soit le format d'un nom de statut soit celui d'un identifiant (nombre).");
                    return res.status(200).json({
                        message: "votre statut n'a pas le format souhaité ! il doit avoir soit le format d'un nom de statut soit celui d'un identifiant (nombre)."
                    })
                }


            } else {

                //! Ici dans le role administrateur, toutes les commande selon leurs statuts ne peuvent être updaté !
                //! seuls ces statuts sont autorisé a être modifiés : 2 = Paiement validé, 3 = En cours de préparation, 4 = Prêt pour expédition, 5 = Expédiée,

                if (regRefCommande.test(req.body.commande)) {
                    // ici commande est une référence
                    commandeInDb = await Commande.findOneCommandeLimited(req.body.commande);
    
                    if (commandeInDb === null || commandeInDb === undefined) {
                        console.log("Cette référence de commande n'éxiste pas ou son statut n'est pas compatible avec une mise a jour manuel !");
                        return res.status(200).json({
                            message: "Cette référence de commande n'éxiste pas ou son statut n'est pas compatible avec une mise a jour manuel !"
                        })
                    }
    
                } else if (number.test(req.body.commande)) {
                    // ici commande est un identifiant
                    commandeInDb = await Commande.findOneLimited(req.body.commande);
    
                    if (commandeInDb === null || commandeInDb === undefined) {
                        console.log("Cette référence de commande n'éxiste pas ou son statut n'est pas compatible avec une mise a jour manuel !");
                        return res.status(200).json({
                            message: "Cette référence de commande n'éxiste pas ou son statut n'est pas compatible avec une mise a jour manuel !"
                        })
                    }
    
                } else {
                    console.log("votre commande n'a pas le format souhaité ! Elle doit avoir soit le format d'une réference soit celui d'un identifiant.");
                    return res.status(200).json({
                        message: "votre commande n'a pas le format souhaité ! Elle doit avoir soit le format d'une réference soit celui d'un identifiant."
                    })
                }
    
    
                if (number.test(req.body.statut)) {
    
                    // ici req.body.statut est un identifiant !
                    statutInDb = await StatutCommande.findOneLimited(req.body.statut);
    
                    // Je vérifis que le statut proposé pour update existe !
                    if (statutInDb === null || statutInDb === undefined) {
                        console.log("votre commande n'a pas le format souhaité ! Elle doit avoir soit le format d'une réference soit celui d'un identifiant.")
                        return res.status(200).json({
                            message: "votre commande n'a pas le format souhaité ! Elle doit avoir soit le format d'une réference soit celui d'un identifiant."
                        })
                    }
                    // J'avertit l'admin si le statut qu'il souhaiterais mettre a jour est déja le statut existant !
                    if (Number(req.body.statut) === commandeInDb.idCommandeStatut) {
                        console.log("Le statut proposé pour cette commande est déja celui existant !")
                        return res.status(200).json({
                            message: "Le statut proposé pour cette commande est déja celui existant !"
                        })
                    }
                    // j'avertit l'admin si sa mise a jour ne suit pas un ordre logique... si il a sauté des étapes..
                    // simple avertissement, on ne "return" pas !
                    if (Number(req.body.statut) !== (commandeInDb.idCommandeStatut + 1)) {
                        console.log("Votre mise a jour de statut ne suit pas l'ordre logique... ")
                        res.status(200).json({
                            message: `Votre mise a jour de statut ne suit pas l'ordre logique... vous êtes passé de ${commandeInDb.idCommandeStatut} à ${req.body.statut}  (RAPPEL: 1 = En attente, 2 = Paiement validé, 3 = En cours de préparation, 4 = Prêt pour expédition, 5 = Expédiée, 6 = Remboursée, 7 = Annulée)`
                        })
                    }
    
    
                } else if (notNumber.test(req.body.statut)) {
    
                    // je construit un tableau composé de mes statut, dynamiquement !
                    const arrayStatut = [];
                    let allStatuts;
                    try {
                        allStatuts = await StatutCommande.findAllLimited();
                        for (const item of allStatuts) {
                            arrayStatut.push(item.statut);
                        }
    
                    } catch (error) {
                        console.log(`erreur dans la méthode upDateSatut du CommandeController ! lors de la recherche de tous les statuts ! ${error}`);
                        return res.statut(500).end();
                    }
    
                    // Ici j'ai une string sans chiffre dans le formulaire, j'utilise la distance de Levenshtein pour réorienter une potentielle érreur de l'admin !
                    // Je calcul toutes les distance de Levenstein entre le mot proposé et ceux de mon tableau et je prends la plus petite. 
                    let arrayDistance = [];
                    for (const item of arrayStatut) {
                        const theDistance = distance(req.body.statut, item);
                        arrayDistance.push(theDistance);
                        //console.log("theDistance == ", theDistance);
                    }
    
                    const isDistInf3 = (element) => element <= 3;
                    const indexSmallDistance = arrayDistance.findIndex(isDistInf3);
                    // console.log("indexSmallDistance == ", indexSmallDistance);
    
                    // si indexSmallDistance vaut -1 alors aucun match !!
                    if (indexSmallDistance === -1 || indexSmallDistance === undefined) {
    
                        // Je prospose néanmoins a l'admin le mot le plus proche possible de sa demande !
                        const closeWord = closest(req.body.statut, arrayStatut);
                        console.log(`Aucun statut existant ne correspond a votre demande de statut, vouliez-vous indiqué le statut : '${closeWord}' ?`);
                        return res.status(200).json({
                            message: `Aucun statut existant ne correspond a votre demande de statut, vouliez-vous indiqué le statut : '${closeWord}' ?`
                        })
                    }
    
                    // ici indexSmallDistance est forcemment inférieur a 3 ou moins, on convertit le statut entrée par l'admin en statut existant le plus proche !  
                    req.body.statut = arrayStatut[indexSmallDistance];
    
                    // J'avertit l'admin si le statut qu'il souhaiterais mettre a jour est déja le statut existant !
                    if (req.body.statut === commandeInDb.statut) {
                        console.log("Le statut proposé pour cette commande est déja celui existant !")
                        return res.status(200).json({
                            message: "Le statut proposé pour cette commande est déja celui existant !"
                        })
                    }
    
                    // j'avertit l'admin si ca mise a jour ne suit pas un ordre logique... si il a sauté des étapes..
                    // simple avertissement, on ne "return" pas !
                    const isStatut = (element) => element === req.body.statut;
                    const indexStatut = arrayStatut.findIndex(isStatut);
    
                    const isStatut2 = (element) => element === commandeInDb.statut;
                    const indexStatutCommande = arrayStatut.findIndex(isStatut2);
    
                    if (indexStatut !== (indexStatutCommande + 1)) {
                        console.log("commandeInDb.statut == ", commandeInDb.statut);
                        console.log("Votre mise a jour de statut ne suit pas l'ordre logique... ")
                        res.status(200).json({
                            message: `Votre mise a jour de statut ne suit pas l'ordre logique... vous êtes passé de '${commandeInDb.statut}' à '${req.body.statut}'  (RAPPEL: 1 = En attente, 2 = Paiement validé, 3 = En cours de préparation, 4 = Prêt pour expédition, 5 = Expédiée, 6 = Remboursée, 7 = Annulée)`
                        })
                    }
    
    
                    // je dois ici retrouver l'objet du tableau allStatuts contentant la valeur de req.body.statut dans un de ces objets
                    statutInDb = allStatuts.find(element => element.statut === req.body.statut);
    
    
                    // par défault je ne devrais jamais rentrer dans ce else, soit statut est un nombre, soit il est pas un nombre, pas de 3ieme choix !
                } else {
                    console.log("votre statut n'a pas le format souhaité ! il doit avoir soit le format d'un nom de statut soit celui d'un identifiant (nombre).");
                    return res.status(200).json({
                        message: "votre statut n'a pas le format souhaité ! il doit avoir soit le format d'un nom de statut soit celui d'un identifiant (nombre)."
                    })
                }

            }
            

            console.log("statutInDb  == ", statutInDb);
            console.log("commandeInDb  == ", commandeInDb);
          
            // j'insére cet update en BDD !
            const data = {
                idCommandeStatut: statutInDb.id,
                id: commandeInDb.id,
            }

            const newUpdate = new Commande(data);
            const updateDone = await newUpdate.updateStatutCommande();

            console.log("updateDone == ", updateDone);


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