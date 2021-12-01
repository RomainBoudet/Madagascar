const Livraison = require('../models/livraison');
const Commande = require('../models/commande');
const Transporteur = require('../models/transporteur');
const LigneCommande = require('../models/ligneCommande');
const Twillio = require('../models/twillio');
const Adresse = require('../models/adresse');
const Shop = require('../models/shop');
const crypto = require('crypto');
const {
    arrondi
} = require('../services/arrondi');


const {
    formatLong,
    formatJMA,
} = require('../services/date');

const {
    transportCost
} = require('../services/transportCost');

const fetch = require('node-fetch');
const redis = require('../services/redis');


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

            const regRefCommande = /^([0-9]+[.]{1}[0-9]+[.]{1}[0-9]+[.]{1}[0-9]+[.]{1}[0-9]+){1}([.]{1}[0-9]+[.]{1}[0-9]+)*$/; // pour une référence de commande
            ///^[0-9]+[.]{1}[0-9]+[.]{1}[0-9]+[.]{1}[0-9]+[.]{1}[0-9]+([.]{1}[0-9]+[.]{1}[0-9]+){2,}$/
            const number = /^[0-9]+$/; // pour un id de commande

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

            // Je vérifis que le transporteur choisit n'est pas un retrait sur le marché !
            const transporteur = await Transporteur.findOne(Number(commandeInDb.idTransporteur));

            if (transporteur.nom === "Retrait sur le stand") {
                console.log("Le transporteur choisi pour cette commande n'est pas compatible avec une livraison. Pour être compatible, celui ci doit avoir un transporteur autre que 'Retrait sur le stand'.");
                return res.status(200).json({
                    message: "Le transporteur choisi pour cette commande n'est pas compatible avec une livraison. Pour être compatible, celui ci doit avoir un transporteur autre que 'Retrait sur le stand'."
                })
            }


            const trackingNumber = req.body.numeroSuivi; //=> le numéro de suivi que l'on inserera dans les API des transporteurs !

            const theResponse = {};
            theResponse.colis = req.body.numeroSuivi;
            theResponse.transporteur = transporteur.nom;

            let dataLaposte = {};
            let dataDHL = {};


            //https://developer.laposte.fr/signup 
            // https://developer.laposte.fr/products/suivi/2/documentation
            // Jeu de données => https://developer.laposte.fr/products/suivi/2/documentation#heading-2

            // exemple numéro tracking : GF111111110NZ  //  ZZ111111110NZ (chronopost)
            // 5S11111111110 (colis)  6P01007508742 (colis)  // 1K36275770836 (colis)  
            //! LAPOSTE

            if (transporteur.nom === "La poste Collisimmo" || transporteur.nom.includes('Chronopost')) {

                // Je vérifie si le numéro de colis est présent dans l'API de tracking de la poste / chronopost 
                // numero de colis : Identifiant de l'objet recherché de 11 à 15 caractères alphanumériques 

                try {
                    const laPosteResponse = await fetch(`https://api.laposte.fr/suivi/v2/idships/${trackingNumber}?lang=fr_FR`, {
                        method: 'get',
                        headers: {
                            'Accept': 'application/json',
                            'X-Okapi-Key': `${process.env.LAPOSTEAPI}`,
                        }

                    });
                    dataLaposte = await laPosteResponse.json();

                } catch (error) {
                    console.log(`Erreur dans la méthode newLivraison du livraisonController, lors du fetch api.laposte : ${error.message}`);
                }

                // Je vais chercher les données correspondant au code événement dans REDIS.
                // Je ne return rien avec un code 104, le code doit se dérouler...

                console.log("dataLaposte ligne 147 du livraisonController ==>>> ", dataLaposte);

                if (dataLaposte && dataLaposte !== undefined && dataLaposte !== null) {


                    if (Number(dataLaposte.returnCode) === 104) {
                        //console.log(dataLaposte.returnMessage);
                        theResponse.infoTransporteur = `message LaPoste / Chronopost : ${dataLaposte.returnMessage}`;
                    }

                    if (Number(dataLaposte.returnCode) === 101) {
                        //console.log(dataLaposte.returnMessage);                        
                        return res.status(200).json({
                            infoTransporteur: `message LaPoste / Chronopost : ${dataLaposte.returnMessage}`,
                            info: "Cette nouvelle livraison n'a pas été enregistrée !",
                        })
                    }

                    if (Number(dataLaposte.returnCode) === 400) {
                        //console.log(dataLaposte.returnMessage);

                        return res.status(200).json({
                            infoTransporteur: `message LaPoste / Chronopost : ${dataLaposte.returnMessage}`,
                            info: "Cette nouvelle livraison n'a pas été enregistrée !",
                        })
                    }
                    if (Number(dataLaposte.returnCode) === 401) {

                        return res.status(200).json({
                            infoTransporteur: `message LaPoste / Chronopost : ${dataLaposte.returnMessage}`,
                            info: "Cette nouvelle livraison n'a pas été enregistrée !",

                        })

                    }
                    if (Number(dataLaposte.returnCode) === 404) {

                        return res.status(200).json({
                            infoTransporteur: `message LaPoste / Chronopost : ${dataLaposte.returnMessage}`,
                            info: "Cette nouvelle livraison n'a pas été enregistrée !",

                        })


                    }
                    if (dataLaposte.code === 'UNAUTHORIZED') {
                        console.log('Aucune clé OKAPI pour l\'API la Poste ne semble présente...');
                        theResponse.infoTransporteur = `message LaPoste / Chronopost : ${dataLaposte.code} : ${dataLaposte.message}`;
                    } else {
                        //Même si j'ai pas de réponse de l'API je fourni une URL pour que l'utilisateur puisse a l'avenir vérifier l'état de sa commande via le site web du transporteur
                        theResponse.url = `https://www.laposte.fr/outils/suivre-vos-envois?code=${trackingNumber}`;

                    }
                }


                // ici si j'ai un code 104 (code FA633119313XX), la propriété shipment n'existe pas dans mon objet, mais je ne dois pas pour autant ne pas enregistrer la livraison...

                //console.log("dataLaposte ==>> ", dataLaposte);
                //console.log("dataLaposte.shipment ==>> ", dataLaposte.shipment);


                if (dataLaposte.shipment && dataLaposte.shipment !== undefined && dataLaposte.shipment !== null) {

                    if (dataLaposte.shipment.urlDetail !== undefined && dataLaposte.shipment.urlDetail !== null) {
                        // ici je fais le choix de rentrer dans mon if meme si l'info est érroné, que le transporteur est la poste collisimo mais que le numéro de colis est un n° Chronopost, on aura l'url provenant de cronopost !
                        theResponse.url = dataLaposte.shipment.urlDetail;

                    }

                    const statutParcel = dataLaposte.shipment.event[0]; // event est un array

                    let codeEvent;
                    try {
                        codeEvent = await redis.get(`mada/codeEvenementAPIlaposte:${statutParcel.code}`)
                    } catch (error) {
                        console.log("erreur dans la récupération du code event dans REDIS concernant l'API la poste", error);
                    }

                    if (codeEvent !== undefined && codeEvent !== null) {
                        theResponse.event = `${statutParcel.label} / ${codeEvent}`;
                    } else {
                        theResponse.event = statutParcel.label;
                    }


                }
            }

            //! DHL Cette partie de code pourrais être supprimer... Elle reste cependant fonctionelle si le schéma accept de laisser passer les formats numéro de suivi DHL

            if (transporteur.nom === "DHL") {

                // https://developer.dhl.com/api-reference/shipment-tracking#reference-docs-section/
                //https://developer.dhl.com/api-reference/shipment-tracking#get-started-section/
                // exemple de tracking number : 7777777770
                // 7777777 => shipment Cancelled
                let DHLResponse;
                try {

                    // rates limit pour cette API : 250 call per day et 1 call par seconde
                    DHLResponse = await fetch(`https://api-eu.dhl.com/track/shipments?trackingNumber=${trackingNumber}`, {
                        method: 'get',
                        headers: {
                            'Content-Type': 'application/json',
                            'DHL-API-Key': `${process.env.DHLAPI}`,
                        },

                    });

                    dataDHL = await DHLResponse.json();


                } catch (error) {
                    console.log("erreur dans la récupération des données du numéro de suivi dans l'API DHL", error);
                }

                // Si on a bien une valeur au retour du call de l4API DHL :
                if (dataDHL && dataDHL !== undefined && dataDHL !== null) {

                    if (dataDHL.status === 404) {

                        /* {
                            title: 'No result found',
                            status: 404,
                            detail: 'No shipment with given tracking number found.'
                            } */

                        console.log("message DHL : Pour information, DHL ne reconnait pas ce numéro de suivi de colis ! Aucun envoie n'est présent pour ce numéro de suivi.");
                        theResponse.url = `https://www.dhl.com/fr-fr/home/tracking/tracking-express.html?submit=1&tracking-id=${trackingNumber}`;
                        theResponse.infoTransporteur = `message DHL : Pour information, DHL ne reconnait pas ce numéro de suivi de colis ! Aucun envoie n'est présent pour ce numéro de suivi.`;

                    } else if (dataDHL.status === 400) {

                        /* {
                             title: 'Invalid input',
                             status: 400,
                             detail: 'Input is invalid: Invalid tracking number - illegal length of number.'
                           } */

                        console.log("Pour information, DHL ne reconnait pas ce numéro de suivi de colis ! Le numéro de suivi du colis est invalide !");

                        theResponse.infoTransporteur = `message DHL : Pour information, DHL ne reconnait pas ce numéro de suivi de colis ! Le numéro de suivi du colis est invalide !`;

                    } else {

                        theResponse.event = dataDHL.shipments[0].status.description;
                        theResponse.url = `https://www.dhl.com/fr-fr/home/tracking/tracking-express.html?submit=1&tracking-id=${trackingNumber}`;

                    }

                } else {
                    //Même si j'ai pas de réponse de l'API je fourni une URL pour que l'utilisateur puisse a l'avenir vérifier l'état de sa commande via le site web du transporteur
                    theResponse.url = `https://www.dhl.com/fr-fr/home/tracking/tracking-express.html?submit=1&tracking-id=${trackingNumber}`;
                    theResponse.infoTransporteur = `message DHL : Pour information, DHL ne reconnait pas ce numéro de suivi de colis ! Aucun envoie n'est présent pour ce numéro de suivi.`;

                }

            }
            //  DPD =>  pas d'API connu...? / TNT => API qui ne fonctionne que en XML, intégration peu claire... / UPS => API inexploitable gratuitement demande un compte pro avec justification ...


            const dataLivraison = {};

            // pour une référence unique. Le package uuid V4 permetrait un véritable numéro unique...
            dataLivraison.reference = crypto.randomBytes(16).toString("hex");
            dataLivraison.numeroSuivi = req.body.numeroSuivi;
            dataLivraison.URLSuivi = theResponse.url;

            if (req.body.poid !== undefined && req.body.poid !== null) {
                dataLivraison.poid = req.body.poid;
            }
            dataLivraison.idClient = commandeInDb.idClient;
            dataLivraison.idCommande = commandeInDb.id;
            dataLivraison.idTransporteur = commandeInDb.idTransporteur;

            let theNewLivraison;
            try {
                const newLivraison = new Livraison(dataLivraison);
                theNewLivraison = await newLivraison.save();
            } catch (error) {
                console.log("Erreur lors de l'insertion d'une nouvelle livraison dans la méthode nexLivraison dans le livraisonController : ", error);
                return res.status(500).end();
            }

            //! On update le numéro de livraison dans la table ligne_commande !
            let allLigneCommandes;
            try {
                allLigneCommandes = await LigneCommande.findByIdCommande(commandeInDb.id);
            } catch (error) {
                console.log("Erreur lors de la recherche des ligne de commande selon la commande dans la méthode nexLivraison dans le livraisonController : ", error);
                return res.status(500).end();
            }

            // Pour toutes les data dans le tableaux, on boucle dessus et on update la valeur idLivraison dans la table ligne_commande 
            const dataLigneCommande = {};
            try {

                for (const item of allLigneCommandes) {

                    dataLigneCommande.idLivraison = theNewLivraison.id;
                    dataLigneCommande.id = item.id;

                    const newLigneCommande = new LigneCommande(dataLigneCommande);
                    await newLigneCommande.updateLivraison();

                }
            } catch (error) {
                console.log("Erreur lors de la mise a jour d'une nouvelle ligne de commande dans la méthode newLivraison dans le livraisonController : ", error);
                return res.status(500).end();
            }


            //! On change le statut de la commande dans la table statut_commande !
            //TODO ne plus passer les statuts par leur identifiant dans la table commande, probléme en cas de modif du fichier de seeding, prendre le nom serait préférable !
            try {
                const newUpdateStatut = new Commande({
                    idCommandeStatut: 5,
                    id: commandeInDb.id,
                });
                const newStatut = await newUpdateStatut.updateStatutCommande();

            } catch (error) {
                console.log("Erreur lors de la mise a jour d'un statut de commande dans la méthode newLivraison dans le livraisonController : ", error);
                return res.status(500).end();
            }

            //! On envoie un sms si l'utilisateur l'a demandé lors de sa commande !

            if (commandeInDb.sendSmsShipping === true) {

                // Je vérifit que le client a bien renseigné un numéro de téléphone !

                let client;
                try {
                    client = await Adresse.findByEnvoiTrue(commandeInDb.idClient);

                } catch (error) {
                    console.trace('Erreur dans la recherche du téléphone du client dans la méthode newLivraison du livraisonController :',
                        error);
                    return res.status(500).end();
                }

                if (client === null || client.telephone === null || client.telephone === undefined) {
                    console.log(`Aucun numéro de téléphone ou client pour cet identifiant ! Aucun sms n'a été envoyé pour confirmation d'envoie au client identifiant ${updateDone.idClient}...`);
                    return res.status(500).end();
                }

                const tel = client.telephone;

                // je recupére les infos de Twilio
                let dataTwillio;
                let twilio;
                try {
                    dataTwillio = await Twillio.findFirst();
                    twilio = require('twilio')(dataTwillio.accountSid, dataTwillio.authToken);

                } catch (error) {
                    console.trace('Erreur dans la recherche des infos Twilio dans la méthode newLivraison du livraisonController :',
                        error);
                    return res.status(500).end();
                }

                // je récupére les infos sur la commande ! 
                let commande;
                try {

                    commande = await Commande.findViewCommande(commandeInDb.id);
                } catch (error) {
                    console.trace('Erreur dans la recherche des infos de la commande dans la méthode newLivraison du livraisonController :',
                        error);
                    return res.status(500).end();
                }

                const articles = [];
                commande.map(article => (`${articles.push(article.produit_nom+"x"+article.quantite_commande+"/"+article.taille+"/"+article.couleur)}`));
                const articlesachat = articles.join('.');

                let shop;
                try {
                    shop = await Shop.findFirst(); // les données du premier enregistrement de la table shop... Cette table a pour vocation un unique enregistrement..
                } catch (error) {
                    console.trace('Erreur dans la recherche des infos de Mada Shop dans la méthode newLivraison du livraisonController :',
                        error);
                    return res.status(500).end();
                }

                twilio.messages.create({
                        body: ` Votre commande ${shop.nom} contenant ${articlesachat} effectué le ${formatJMA(commande[0].date_achat)} a bien été envoyé via ${commande[0].transporteur} ce ${formatLong(commande[0].updatedDate)} !`,
                        from: dataTwillio.twillioNumber,
                        to: tel,

                    })
                    .then(theResponse.sms = "Un sms a bien été envoyé au client pour cette expédition !").then(message => console.log(`SMS bien envoyé a ${tel} depuis ${dataTwillio.twillioNumber} avec pour sid :${message.sid}`));

            }


            theResponse.info = "Cette nouvelle livraison a bien été enregistrée !";

            res.status(200).json(theResponse);

        } catch (error) {
            console.log(`Erreur dans la méthode newLivraison du livraisonController : ${error.message}`);
            return res.status(500).end();
        }
    },



    choixLivraison: async (req, res) => {
        try {
            // on insére le choix de la livraison en session, 
            // Depuis le front on envoie un entier qui fait référence a un transporteur, selon son id : 1,2,3, ou 4
            //  1 : DPD, 2 : TNT express, 3 : retrait sur place, 4 : La Poste (exemple)
            let transporteurData;
            try {
                transporteurData = await Transporteur.findOneName(req.body.nomTransporteur);

            } catch (error) {
                console.log("Erreur dans la récupération des données Transporteur dans le livraisonController", error)
                return res.status(500).end();
            }

            if(transporteurData === null) {
                console.log("Ce transporteur n'existe pas !");
                return res.status(500).end();
            }

            req.session.nomTransporteur = transporteurData.nom;

            //Je permet a l'utilisateur de laisser un commentaire sur la commande...
            req.session.commentaire = req.body.commentaire;

            // Concerne l'option permettant de recevoir un sms, si le client le souhaite, lorsque sa commande sera remis au transporteur.
            // on garde la donnée au chaud concernant l'envoie d'un sms et on l'enverra en BDD dans le webbhook du paiement quand on est certain de la commande et du client..
            // n'est possible que si il y a une expédition avec une livraison, donc si req.session.nomTransporteur = 'Retrait sur le stand' , on ne permet pas !

            if (req.body.sendSmsWhenShipping === 'true' && req.body.nomTransporteur !== 'Retrait sur le stand') {
                req.session.sendSmsWhenShipping = true;
            } else {
                req.session.sendSmsWhenShipping = false;
            };


            // Je met a jour le prix du panier en prenant en compte le cout du transport
            // Calcul des Frais transporteur selon le poid total et le nom du transporteur !
            //! On pourrait envisager de rajouter 300 grammes pour l'emballage avant le calcul du cout du transport.
            // const poid = req.session.totalPoid + 300; 
            // const price = await transportCost(poid, req.session.nomTransporteur);

            const price = await transportCost(req.session.totalPoid, req.session.nomTransporteur); // en centimes !

            req.session.coutTransporteur = price;

            // Je remet a jour le total dans le panier.

            // si dans la session, un coupon existe, on applique sa valeur, sinon on ignore
            if (req.session.coupon !== null && req.session.coupon !== undefined) {
                req.session.totalStripe = (req.session.totalTTC + req.session.coutTransporteur) - req.session.coupon.montant

            } else {
                req.session.totalStripe = req.session.totalTTC + req.session.coutTransporteur;

            }

            const message = "Le choix du transporteur a bien été pris en compte.";
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

    //! Useless...
    /*  new: async (req, res) => {
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
     }, */


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