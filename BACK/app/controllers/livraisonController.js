const Livraison = require('../models/livraison');
const Commande = require('../models/commande');
const Transporteur = require('../models/transporteur');
const LigneCommande = require('../models/ligneCommande');
const {
    arrondi
} = require('../services/arrondi');


const {
    formatLong,
} = require('../services/date');

const fetch = require('node-fetch');
const redis = require('../services/redis');

const tracker = require('delivery-tracker')


/**
 * Une méthode qui va servir a intéragir avec le model Livraison pour les intéractions avec la BDD
 * Retourne un json
 * @name livraisonController
 * @param {string} numeroSuivi.body - le numéro de suivi fournit par le transporteur qu'on doit fournir
 * @param {string} confirmNumeroSuivi.body - la confirmation du numéro de suivi fournit par le transporteur
 * @param {string} commande.body - l'identifiant ou la référence de commande
 * @param {number} poid.body - le poid en gramme de la livraison, si celui ci est connu...
 * @return {JSON}  - une donnée en format json
 */
const livraisonController = {

    //https://developer.laposte.fr/signup
    //https://www.npmjs.com/package/delivery-trackerhttps://www.npmjs.com/package/delivery-trackerhttps://www.npmjs.com/package/delivery-tracker 

    //TODO
    //! Créer une méthode pour suivre le statut de la commande ! Que le colis soit encore chez le marchand ou déja géré par le transporteur !
    //TODO
    //! Créer un schema Joi pour la route /admin/updateCommande ! (commandeController.updateStatut)



    newLivraison: async (req, res) => {
        try {
            // En entrée j'attend un numéro de colis, ça confirmation et une référence de commande ou un id de commande et potentiellement un poid en gramme.

            // on vérifit que la confirmation du numéro de colis est conforme !
            if (req.body.numeroSuivi !== req.body.confirmNumeroSuivi) {
                console.log("La confirmation de votre numéro de suivi doit être identique a votre numéro de suivi !");
                return res.status(200).json({
                    message: "La confirmation de votre numéro de suivi doit être identique a votre numéro de suivi !"
                })
            }

            let commandeInDb;

            const regRefCommande = /^([0-9]*[.]{1}[0-9]*)*$/; // pour une référence de commande
            const number = /^[0-9]*$/; // pour un id de commande

            // je vérifit que la commande existe et que son précédent statut est compatible avec l'update du statut "Expédié"
            // les statuts compatibles : 2 = Paiement validé, 3 = En cours de préparation, 4 = Prêt pour expédition


            if (regRefCommande.test(req.body.commande)) {

                // ici commande est une référence
                commandeInDb = await Commande.findOneCommandeLimited(req.body.commande);

            } else if (number.test(req.body.commande)) {

                // ici commande est un identifiant
                commandeInDb = await Commande.findOneLimited(req.body.commande);

            } else {
                console.log("votre commande n'a pas le format souhaité ! Elle doit avoir soit le format d'une réference soit celui d'un identifiant.");
                return res.status(200).json({
                    message: "votre commande n'a pas le format souhaité ! Elle doit avoir soit le format d'une réference soit celui d'un identifiant."
                })
            }

            // Je vérifit que le statut actuel de la commande est compatible
            if (commandeInDb === null || commandeInDb === undefined) {
                console.log("Cette référence de commande n'éxiste pas ou son statut n'est pas compatible avec une livraison. Cette commande peut-être déja expédié ou le paiement est encore en attente...");
                return res.status(200).json({
                    message: "Cette référence de commande n'éxiste pas ou son statut n'est pas compatible avec une livraison. Cette commande peut-être déja expédié ou le paiement est encore en attente..."
                })
            };

            // Si le statut de la commande n'est pas pret a être expédié, (id_commandeStatut = 4), je n'autorise pas l'insertion dans la table livraison par sécurité)
            if (Number(commandeInDb.idCommandeStatut) !== 4) {
                console.log("Le statut actuel de la commande n'est pas compatible avec l'envoie d'une livraison. Pour être compatible, celui ci doit avoir le statut 'Prêt pour expédition'");
                return res.status(200).json({
                    message: "Le statut actuel de la commande n'est pas compatible avec l'envoie d'une livraison. Pour être compatible, celui ci doit avoir le statut 'Prêt pour expédition'"
                })
            };

            // Je vérifit que le transporteur choisit n'est pas un retrait sur le marché !
            const nomTransporteur = await Transporteur.findOne(Number(commandeInDb.idTransporteur));

            if (nomTransporteur.nom === "Retrait sur le stand durant le prochain marché") {
                console.log("Le transporteur choisi pour cette commande n'est pas compatible avec une livraison. Pour être compatible, celui ci doit avoir un transporteur autre que 'Retrait sur le stand durant le prochain marché'.");
                return res.status(200).json({
                    message: "Le transporteur choisi pour cette commande n'est pas compatible avec une livraison. Pour être compatible, celui ci doit avoir un transporteur autre que 'Retrait sur le stand durant le prochain marché'."
                })
            }

            //! ici la let commandeInDb contient une commande compatible avec une insertion dans la table livraison.

            // Je vérifit le transporteur et stock son nom :
            const transporteur = await Transporteur.findOne(commandeInDb.idTransporteur);

            // https://developer.laposte.fr/products/suivi/2/documentation
            // Jeu de données => https://developer.laposte.fr/products/suivi/2/documentation#heading-2

            let dataLaposte = {};

            if (transporteur.nom === "La poste Collisimmo" || transporteur.nom === "Chronopost") {

                // Je vérifie si le numéro de colis est présent dans l'API de tracking de la poste / chronopost 

                // numero de colis : Identifiant de l'objet recherché de 11 à 15 caractères alphanumériques 

                try {
                    const laPosteResponse = await fetch(`https://api.laposte.fr/suivi/v2/idships/?lang=fr_FR`, {
                        method: 'get',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Okapi-Key': `${process.env.LAPOSTEAPISANDBOX}`,
                        }

                    });
                    dataLaposte = await laPosteResponse.json();

                    console.log(dataLaposte);

                    // je ne garde que les données de l'event et pas ceux de la timeLine, avec la date. 
                    // et je vais chercher les données correspondant au code événement dans REDIS.

                    //! je ne return rien avec un code 104, le code doit se dérouler...
                    if (Number(dataLaposte.returnCode) === 104) {
                        console.log(dataLaposte.returnMessage);
                        res.status(200).json({
                            message: `${dataLaposte.returnMessage}`
                        })
                    }

                    if (Number(dataLaposte.returnCode) === 400 || Number(dataLaposte.returnCode) === 401 || Number(dataLaposte.returnCode) === 404) {
                        console.log(dataLaposte.returnMessage);
                        return res.status(400).json({
                            message: `${dataLaposte.returnMessage}`
                        })
                    }
                    if (dataLaposte.code === 'UNAUTHORIZED') {
                        console.log(dataLaposte.message);
                        return res.status(400).json({
                            message: `${dataLaposte.code} : ${dataLaposte.message}`
                        })
                    }

                    //res.status(200).json(dataLaposte.shipment);

                } catch (error) {
                    console.log(`Erreur dans la méthode newLivraison du livraisonController, lors du fetch api.laposte : ${error.message}`);
                    res.status(500).end();
                }


                // ici si j'ai un code 104 (code FA633119313XX), la propriété shipment n'existe pas dans mon objet, mais je ne dois pas pour autant ne pas enregistrer la livraison...

                if (dataLaposte.shipment !== undefined) {

                    //console.log("dataLaposte.shipment  == ", dataLaposte.shipment);
                    const theResponse = {};
                    let url;
                    if (transporteur.nom === "Chronopost" && dataLaposte.shipment !== undefined && dataLaposte.shipment.urlDetail !== undefined) {
                        url = dataLaposte.shipment.urlDetail;
                        theResponse.url = url;
                    }

                    const event = dataLaposte.shipment.event; // event est un array

                    // dans event je dois aller chercher le 'order' le plus grand (100), extraire son label, date et code, retrouver le clé avec le code dans REDIS 
                    const statutParcel = event.find(item => item.order === 100);
                    let codeEvent;
                    try {
                        codeEvent = await redis.get(`mada/codeEvenementAPIlaposte:${statutParcel.code}`)
                    } catch (error) {
                        console.log("erreur dans la récupération du code event dans REDIS concernant l'API la poste", error);
                        return res.statut(500).end();
                    }
                    theResponse.colis = req.body.numeroSuivi;
                    theResponse.event = codeEvent;
                    theResponse.info = statutParcel.label;
                    theResponse.date = formatLong(statutParcel.date);

                    res.status(200).json(theResponse);

                    console.log(theResponse);
                }
            }

            //! ici les cas de figure ou d'autre transoprteur sont requis...

            const trackingNumber = req.body.numeroSuivi;

            if (transporteur.nom === "DHL") {

                // https://developer.dhl.com/api-reference/dgf-shipment-tracking#reference-docs-section/

                

                const DHLResponse = await fetch(`https://api.dhl.com/dgff/transportation/shipment-tracking?housebill=${trackingNumber}`, {
                    method: 'get',
                    headers: {
                        'Content-Type': 'application/json',
                        'DHL-API-Key': `${process.env.DHLAPI}`,
                    }

                });
                dataDHL = await DHLResponse.json();

                console.log("dataDHL == ", dataDHL);

            }

            stop

            if (transporteur.nom === "DPD") {


            }

            if (transporteur.nom === "TNT") {


            }

            if (transporteur.nom === "UPS") {


            }

            stop



            // je sauvegarde l'URL si elle existe
            // Je créé la réference
            // j'insére en BDD la livraison
            // j'update le statut de la commande a Envoyé dans ma bdd
            // je pique le bout de code pour envoyer un sms si l'utilisateur l'a demandé lors d'un envoi de sa commande !



            // avec le numéro de commande, je récupére l'id du transporteur, l'id du client
            // j'insére dans la table le numéro de suivi donné, l'id transporteur, l'id client, le poid si il est là, et la nouvelle référence pour la commande voulue !





            console.log(data);

            const dataLivraison = {};

            dataLivraison.reference = req.body.reference;
            dataLivraison.numeroSuivi = req.body.numeroSuivi;
            dataLivraison.URLSuivi = req.body.URLSuivi;
            dataLivraison.poid = req.body.poid;
            dataLivraison.idClient = req.body.idClient;
            dataLivraison.idCommande = req.body.idCommande;
            dataLivraison.idTransporteur = req.body.idTransporteur;
            dataLivraison.idLigneCommande = req.body.idLigneCommande;

            const newLivraison = new Livraison(dataLivraison);

            await newLivraison.save();
            res.json(newLivraison);


            const dataLigneCommande = {};

            dataLigneCommande.quantiteLivraison = req.body.quantiteLivraison;
            dataLigneCommande.idLivraison = req.body.idLivraison;
            dataLigneCommande.idCommandeLigne = req.body.idCommandeLigne;

            const newLigneCommande = new LigneCommande(dataLigneCommande);

            console.log("newLigneCommande == ", newLigneCommande);


        } catch (error) {
            console.log(`Erreur dans la méthode newLivraison du livraisonController : ${error.message}`);
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
                req.session.totalStripe = (req.session.totalTTC + req.session.coutTransporteur) - req.session.coupon.montant

            } else {
                req.session.totalStripe = req.session.totalTTC + req.session.coutTransporteur;

            }


            console.log("req.session a la sortie du choix du transporteur ==> ", req.session);

            const message = "Le choix du transporteur a bien été pris en compte."

            const totalHT = req.session.totalHT / 100;
            const totalTTC = req.session.totalTTC / 100;
            const totalTVA = req.session.totalTVA / 100;
            const transporteur = transporteurData.nom;
            const coutTransporteur = req.session.coutTransporteur / 100;
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

            if (livraisons === null) {
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
            if (livraisons === null) {
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

            if (livraison === null) {
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

            if (livraison === null) {
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

            if (livraisons === null) {
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

            if (updateLivraison === null) {
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


            if (updateTransporteur === null) {
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

            if (updateLivraison === null) {
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


            if (livraisonInDb === null) {
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

            if (transporteurInDb === null) {
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