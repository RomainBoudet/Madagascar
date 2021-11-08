const Livraison = require('../models/livraison');
const Transporteur = require('../models/transporteur');
const LigneCommande = require('../models/ligneCommande');
const {
    arrondi
} = require('../services/arrondi');
const {
    expression
} = require('joi');

/**
 * Une méthode qui va servir a intéragir avec le model Livraison pour les intéractions avec la BDD
 * Retourne un json
 * @name livraisonController
 * @param {Express.Request} req - l'objet représentant la requête
 * @param {Express.Response} res - l'objet représentant la réponse
 * @return {JSON}  - une donnée en format json
 */
const livraisonController = {


    newCommande: async (req, res) => {
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

            await newLivraison.save();
            res.json(newLivraison);


            const dataLigneCommande = {};

            dataLigneCommande.quantiteLivraison = req.body.quantiteLivraison;
            dataLigneCommande.idLivraison = req.body.idLivraison;
            dataLigneCommande.idCommandeLigne = req.body.idCommandeLigne;

            const newLigneCommande = new LigneCommande(dataLigneCommande);

            console.log("newLigneCommande == ", newLigneCommande);


        } catch (error) {
            console.log(`Erreur dans la méthode new du livraisonController : ${error.message}`);
            res.status(500).end();
        }
    },



    choixLivraison: async (req, res) => {
        try {


            // on insére le choix de la livraison en session, 
            // Depuis le front on envoie un entier qui fait référence a un transporteur, selon son id : 1,2,3, ou 4
            //  1 : DPD, 2 : TNT express, 3 : retrait sur place, 4 : La Poste (exemple)

            req.session.idTransporteur = Number(req.body.idTransporteur);

            //Je permet a l'utilisateur de laisser un commentaire sur la commande...
            req.session.commentaire = req.body.commentaire;

            // Concerne l'option permettant de recevoir un sms, si le client le souhaite, lorsque sa commande sera remis au transporteur.
            // on garde la donnée au chaud concernant l'envoie d'un sms et on l'enverra en BDD dans le webbhook du paiement quand on est certain de la commande et du client..
            // n'est possible que si il y a une expédition avec une livraison, donc si req.session.idTransporteur = 3 , on ne permet pas !

            //BUG 
            //! a fixer, quand champs vide, false par défault !!
            if (req.body.sendSmsWhenShipping == 'true' && req.body.idTransporteur !== 3) {
                req.session.sendSmsWhenShipping = true;
            } else {
                req.session.sendSmsWhenShipping = false;
            };

            // Je met a jour le prix du panier en prenant en compte le cout du transport

            const transporteurData = await Transporteur.findOne(req.session.idTransporteur);

            console.log("transporteur ==> ", transporteurData);

            req.session.coutTransporteur = transporteurData.fraisExpedition;

            // Je remet a jour le total dans le panier.

             // si dans la session, un coupon existe, on applique sa valeur, sinon on ignore
             if (req.session.coupon !== null && req.session.coupon !== undefined) {
                req.session.totalStripe = (req.session.totalTTC  + req.session.coutTransporteur) - req.session.coupon.montant

            } else {
                req.session.totalStripe = req.session.totalTTC  + req.session.coutTransporteur;

            }


            console.log("req.session a la sortie du choix du transporteur ==> ", req.session);

            const message = "Le choix du transporteur a bien été pris en compte."

            const totalHT = req.session.totalHT /100;
            const totalTTC = req.session.totalTTC /100;
            const totalTVA = req.session.totalTVA /100;
            const transporteur = transporteurData.nom;
            const coutTransporteur = req.session.coutTransporteur /100;
            const totalTTCAvecTransport = (req.session.totalStripe) / 100; // je le reconvertis pour le rendre lisible en euro
            const commentaire = req.session.commentaire;
            const sendSmsWhenShipping = req.session.sendSmsWhenShipping;


            return res.status(200).json({
                totalHT,
                totalTTC,
                totalTVA,
                coutTransporteur,
                transporteur,
                totalTTCAvecTransport,
                message,
                commentaire,
                sendSmsWhenShipping,
            });


        } catch (error) {
            console.trace('Erreur dans la méthode choixLivraison du livraisonController :',
                error);
                res.status(500).end();
            }

    },


    getAllLivraison: async (req, res) => {
        try {
            const livraisons = await Livraison.findAllPlus();

            if(livraisons === null ) {
                console.log("Aucunes livraisons en BDD !");
                return res.status(200).end();
            }

            res.status(200).json(livraisons);
        } catch (error) {
            console.trace('Erreur dans la méthode getAll du livraisonController :',
                error);
                res.status(500).end();
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
                res.status(500).end();
            }
    },


    getAllLigneCommande: async (req, res) => {
        try {
            const livraisons = await Livraison.findAllProduitLivrer();
            if(livraisons === null ) {
                console.log("Aucune lignes de commande en BDD !");
                return res.status(200).end();
            }
            res.status(200).json(livraisons);
        } catch (error) {
            console.trace('Erreur dans la méthode getAllLigneCommande du livraisonController :',
                error);
                res.status(500).end();
            }
    },

    getAllLivraisonByIdClient: async (req, res) => {
        try {


            if (req.session.user.privilege === 'Client' && req.session.user.idClient !== parseInt(req.params.id, 10)) {
                return res.status(403).json({
                    message: "Vous n'avez pas les droits pour accéder a cette ressource"
                })
            };


            const livraison = await Livraison.findOnePlus(req.params.id);
            
            if(livraison === null ) {
                console.log("Aucune lignes de commande en BDD !");
                return res.status(200).end();
            }

            res.status(200).json(livraison);

        } catch (error) {
            console.trace('Erreur dans la méthode getOne du livraisonController :',
                error);
                res.status(500).end();
            }
    },


    getByIdCommande: async (req, res) => {
        try {

            const livraison = await Livraison.findByIdCommande(req.params.id);

            if(livraison === null ) {
                console.log("Aucune lignes de commande en BDD !");
                return res.status(200).end();
            }
            console.log(livraison);


            if (req.session.user.privilege === 'Client' && req.session.user.idClient !== livraison.idClient) {
                return res.status(403).json({
                    message: "Vous n'avez pas les droits pour accéder a cette ressource"
                })
            };


            res.status(200).json(livraison);

        } catch (error) {
            console.trace('Erreur dans la méthode getByIdCommande du livraisonController :',
                error);
                res.status(500).end();
            }
    },

    getByIdClient: async (req, res) => {
        try {

            if (req.session.user.privilege === 'Client' && req.session.user.idClient !== parseInt(req.params.id, 10)) {
                return res.status(403).json({
                    message: "Vous n'avez pas les droits pour accéder a cette ressource"
                })
            };

            const livraisons = await Livraison.findByIdClient(req.params.id);

            if(livraisons === null ) {
                console.log("Aucune livraison pour ce client !");
                return res.status(200).end();
            }

            livraisons.map(livraison => livraison.poid = arrondi(livraison.poid));

            res.status(200).json(livraisons);

        } catch (error) {
            console.trace('Erreur dans la méthode getByIdClient du livraisonController :',
                error);
                res.status(500).end();
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

            await newLivraison.save();
            res.json(newLivraison);
        } catch (error) {
            console.log(`Erreur dans la méthode new du livraisonController : ${error.message}`);
            res.status(500).end();
        }
    },
    newLigneCommande: async (req, res) => {
        try {

            const data = {};

            data.quantiteLivraison = req.body.quantiteLivraison;
            data.idLivraison = req.body.idLivraison;
            data.idCommandeLigne = req.body.idCommandeLigne;


            const newLivraison = new LigneCommande(data);


            await newLivraison.save();
            res.status(200).json(newLivraison);
        } catch (error) {
            console.log(`Erreur dans la méthode newLigneCommande du livraisonController : ${error.message}`);
            res.status(500).end();
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

            res.status(200).json(newTransporteur);
        } catch (error) {
            console.log(`Erreur dans la méthode newTransporteur du livraisonController : ${error.message}`);
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

            const updateLivraison = await Livraison.findOne(id);

        

            if (req.session.user.privilege === 'Client' && req.session.user.idClient !== updateLivraison.idClient) {
                return res.status(403).json({
                    message: "Vous n'avez pas les droits pour accéder a cette ressource"
                })
            };

            if(updateLivraison === null ) {
                console.log("Aucune livraison pour ce client !");
                return res.status(200).end();
            }

            const reference = req.body.reference;
            const numeroSuivi = req.body.numeroSuivi;
            const URLSuivi = req.body.URLSuivi;
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

            if (URLSuivi) {
                updateLivraison.URLSuivi = URLSuivi;
                message.URLSuivi = 'Votre nouveau URLSuivi a bien été enregistré ';
            } else if (!URLsuivi) {
                message.URLSuivi = 'Votre nom de URLSuivi n\'a pas changé';
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

            res.status(200).json(message);

        } catch (error) {
            console.log(`Erreur dans la méthode update du livraisonController ${error.message}`);
            res.status(500).end();
        }
    },

    updateTransporteur: async (req, res) => {
        try {

            const {
                id
            } = req.params;

            if (Object.keys(req.body).length === 0) {
                return res.status(200).json({
                    message: 'Vous n\'avez envoyé aucune données à modifier.'
                });
            }

            const updateTransporteur = await Transporteur.findOne(id);


            if(updateTransporteur === null ) {
                console.log("Aucune livraison pour ce client !");
                return res.status(200).end();
            }

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

            res.status(200).json(message);

        } catch (error) {
            console.log(`Erreur dans la méthode updateTransporteur du livraisonController ${error.message}`);
            res.status(500).end();
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

            const updateLivraison = await LigneCommande.findOne(id);

            if(updateLivraison === null ) {
                console.log("Aucune livraison pour ce client !");
                return res.status(200).end();
            }

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

            res.status(200).json(message);

        } catch (error) {
            console.log(`Erreur dans la méthode updateLigneCommande du livraisonController ${error.message}`);
            res.status(500).end();
        }
    },


    delete: async (req, res) => {

        try {

            const livraisonInDb = await Livraison.findOne(req.params.id);


            if(livraisonInDb === null ) {
                console.log("Aucune livraison pour ce client !");
                return res.status(200).end();
            }
            const livraison = await livraisonInDb.delete();

            res.status(200).json(livraison);

        } catch (error) {
            console.trace('Erreur dans la méthode delete du livraisonController :',
                error);
            res.status(500).end();
        }
    },

    deleteTransporteur: async (req, res) => {

        try {

            const transporteurInDb = await Transporteur.findOne(req.params.id);

            if (transporteurInDb === null ) {
                console.log("Aucun transporteur n'existe avec cet identifiant !");
                return res.statut(200).end();
            }

            const transporteur = await transporteurInDb.delete();

            res.status(200).json(transporteur);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteTransporteur du livraisonController :',
                error);
            res.status(500).end();
        }
    },


}

module.exports = livraisonController;