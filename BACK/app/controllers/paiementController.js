const Paiement = require('../models/paiement');
const Adresse = require('../models/adresse');
const Commande = require('../models/commande');
const StatutCommande = require('../models/statutCommande');
const LigneCommande = require('../models/ligneCommande');
const Transporteur = require('../models/transporteur');
const Shop = require('../models/shop');
const Twillio = require('../models/twillio');
const Stock = require('../models/stock');
const Client = require('../models/client');
const AdminPhone = require('../models/adminPhone');
const AdminVerifEmail = require('../models/adminVerifEmail');



//Nécéssaire pour retrouver les donnée de session dans la méthode du webhook avec le cookie de session !
const redisSession = require('redis');
const session = require('express-session');
let RedisStore = require('connect-redis')(session);
let redisClient = redisSession.createClient();
const sessionStore = new RedisStore({
    client: redisClient
});

const {
    promisify
} = require('util');

const {
    capitalize
} = require('../middlewares/sanitizer');

const {
    formatLong,
    formatJMAHMSsecret,
    dayjs,
    formatLongSansHeure,
    addWeekdays,
} = require('../services/date');

const {
    adresseEnvoieFormatHTML,
    adresseEnvoieFormat
} = require('../services/adresse');

const validator = require('validator');

const stripe = require('stripe')(process.env.STRIPE_TEST_KEY);
const endpointSecret = process.env.SECRETENDPOINT;
const endpointSecretSEPA = process.env.SECRETENDPOINTSEPA;
const endpointSecretrefund = process.env.SECRETENDPOINTREFUND;
const endpointSecretrefundUpdate = process.env.SECRETENDPOINTREFUNDUPDATE;


const redis = require('../services/redis');

const path = require('path');
const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const countrynames = require('countrynames');
/* const {
    Client
} = require('pg'); */
var helpers = require('handlebars-helpers')();

//Config MAIL a sortid du controller ...
//Sendgrid ou MailGun serait préférable en prod...
//https://medium.com/how-tos-for-coders/send-emails-from-nodejs-applications-using-nodemailer-mailgun-handlebars-the-opensource-way-bf5363604f54
const transporter = nodemailer.createTransport({
    host: process.env.HOST,
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD_EMAIL,
    },
});

// Config pour les templates et le moteur handlebars lié a Nodemailer
const options = {
    viewEngine: {
        extName: ".hbs",
        partialsDir: path.resolve(__dirname, "./views"),
        defaultLayout: false
    },
    extName: ".hbs",
    viewPath: path.resolve(__dirname, "../views"),
};





/**
 * Une méthode qui va servir a intéragir avec le model Paiement pour les intéractions avec la BDD
 * Retourne un json
 * @name paiementController
 * @param {Express.Request} req - l'objet représentant la requête
 * @param {Express.Response} res - l'objet représentant la réponse
 * @return {JSON}  - une donnée en format json
 */
const paiementController = {



    cgv: async (req, res) => {
        try {

            //le user a accecepté les CGV
            // je vérifie si req.session.user.cookie existe déja et si sa valeur est déja 'true'
            //console.log('req.session.user ==> ', req.session.user.cgv);

            if (req.session.user !== undefined && req.session.cgv === 'true') {
                console.log("Les Conditions Générales de Ventes ont déja été accéptés.")
                return res.status(200).json("Les Conditions Générales de Ventes ont déja été accéptés.")
            } else(
                req.session.cgv = 'true')

            console.log("req.session a la sortie des cgv ==> ", req.session);

            console.log("req.signedCookies['connect.sid'] ==>> ", req.signedCookies['connect.sid']); // Valeur a insérer en dur dans la méthode insertSessionForWebhook pour tester la méthode webhookpaiement

            return res.status(200).json("Les Conditions Générales de Ventes ont été accéptés.")


        } catch (error) {
            console.trace(
                'Erreur dans la méthode CGV du paiementController :',
                error);
            res.status(500).json(error.message);
        }

    },
    //! différent moyen de paiement possible : https://dashboard.stripe.com/settings/payments

    //STRIPE processus complet = https://stripe.com/docs/connect/collect-then-transfer-guide?platform=web 
    // comprendre les différent type de paiement sur STRIP : https://stripe.com/docs/payments/payment-intents/migration/charges 
    // API PaymentIntent a privilégier sur API Charge !

    //! Mesure de protection a mettre en place contre les testeurs de CB :
    //! reCAPTCHA de Google (https://developers.google.com/recaptcha/intro)
    //! Limiter le nombre de nouveaux clients pouvant être créés par une même adresse IP par jour. => API rateLimiter !
    //! Limiter le nombre de cartes pouvant être associées à un seul client

    paiementCB: async (req, res) => {
        try {

            // Méthode a metre en lien avec le bouton ""payer par carte bancaire"" avant que l'utilisateur ne rentre ses coordonnées bancaires.


            //Pour payer, l'utilisateur doit avoir :
            console.log("la session en amont du paiement ==> ", req.session);

            // été authentifié
            if (!req.session.user) {
                console.log("Le client ne s'est pas authentifié !")
                return res.status(200).json({
                    message: "Merci de vous connecter afin de finaliser votre paiement."
                })
            }
            // avoir accepté les CGV
            if (req.session.cgv !== 'true') {
                console.log("Les Conditions Générales de Ventes n'ont pas été accéptés.")
                return res.status(200).json({
                    message: "Les Conditions Générales de Ventes n'ont pas été accéptés. Merci de les accéptés afin de finaliser votre paiement."
                })
            }
            // avoir un montant de panier supérieur a 0.
            if (req.session.totalTTC == 0 || req.session.totalTTC === undefined) {
                return res.status(200).json({
                    message: "Pour effectuer un paiement vous devez avoir des articles dans votre panier."
                })
            }


            // Avoir choisi un transporteur 

            if (req.session.idTransporteur === undefined) {

                return res.status(200).json({
                    message: "Pour  finaliser votre paiement, merci de choisir un mode de livraison parmis ceux proposé ."
                })
            }

            // et avoir une adresse de livraison définit (et non seulement une adresse de facturation) OU choisi le retrait sur place.
            const isEnvoieOk = await Adresse.findByEnvoie(req.session.user.idClient);
            if (!isEnvoieOk && req.session.idTransporteur != 3) {
                return res.status(200).json({
                    message: "Pour effectuer un paiement, vous devez avoir enregistré une adresse de livraison en plus de votre adresse de facturation ou choisir le mode de livraison : 'Retrait sur le stand'."
                })
            }


            //je construit ce que je vais passer comme metadata
            const articles = [];
            req.session.cart.map(article => (`${articles.push(article.produit+' / ' + 'idArticle = ' + article.id + ' /' + ' prix HT avec reduction: '+article.prixHTAvecReduc+'€'+' / '+' Qte: '+article.quantite)}`));
            articlesBought = articles.join(', ');


            //Je vérifie si le client est déja venu tenter de payer sa commande
            if (req.session.IdPaymentIntentStripe) {
                //Si oui, je met a jour le montant dans l'objet payementIntent qui existe déja, via la méthode proposé par STRIPE
                //https://stripe.com/docs/api/payment_intents/update?lang=node

                await stripe.paymentIntents.update(
                    req.session.IdPaymentIntentStripe, {
                        metadata: {
                            articles: articlesBought,
                            amount: req.session.totalStripe,
                        },
                        amount: req.session.totalStripe,
                    }
                );


            } else {

                // Si il n'existe pas, je dois avant tout, le créer
                //https://stripe.com/docs/payments/payment-intents

                // Je récupére les info STRIPE du client via REDIS 
                const idClientStripe = await redis.get(`mada/clientStripe:${req.session.user.email}`);
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: req.session.totalStripe, // total en centimes et en Integer
                    currency: 'eur',
                    customer: idClientStripe,
                    payment_method_types: ['card'],
                    setup_future_usage: 'on_session',
                    receipt_email: req.session.user.email,
                    statement_descriptor: 'Madagascar Shop', // Le libellé de relevé bancaire qui apparait sur le relevé des client => 22 caractéres . si mis en dynamique, concaténer au prefix du libellé dans le dashboard https://stripe.com/docs/payments/payment-intents
                    metadata: {
                        date: `${formatLong(new Date())}`,
                        articles: articlesBought,
                        client: `${req.session.user.prenom} ${req.session.user.nomFamille}`,
                        idClient: req.session.idClient,
                        email: req.session.user.email,
                        session: req.sessionID,
                        amount: req.session.totalStripe,
                        ip: req.ip,
                    },


                });

                req.session.IdPaymentIntentStripe = paymentIntent.id;
                req.session.clientSecret = paymentIntent.client_secret;



            }

            console.log("la clé secrete pour un paiement CB a bien été envoyé en session !");

            res.status(200).end();


        } catch (error) {
            const errorMessage = process.env.NODE_ENV === 'production' ?
                'Erreur serveur.' :
                `Erreur dans la méthode paiementCB du paiementController : ${error.message})`


            res.status(500).json(errorMessage);
            console.trace(error);
        }

    },


    // IBAN test => https://stripe.com/docs/testing#sepa-direct-debit 
    //AT611904300234573201 (Le statut du PaymentIntent passe de processing à succeeded.)
    //AT321904300235473204	Le statut du PaymentIntent passe de processing à succeeded après 3 minutes.

    //Learn to accept SEPA Direct Debit payments. =>  https://stripe.com/docs/payments/sepa-debit/accept-a-payment#web-create-payment-intent 

    paiementSEPA: async (req, res) => {
        try {

            // Méthode a metre en lien avec le bouton ""payer par carte bancaire"" avant que l'utilisateur ne rentre ses coordonnées bancaires.


            //Pour payer, l'utilisateur doit avoir :
            console.log("la session en amont du paiement ==> ", req.session);

            // été authentifié
            if (!req.session.user) {
                console.log("Le client ne s'est pas authentifié !")
                return res.status(200).json({
                    message: "Merci de vous connecter afin de finaliser votre paiement."
                })
            }
            // avoir accepté les CGV
            if (req.session.cgv !== 'true') {
                console.log("Les Conditions Générales de Ventes n'ont pas été accéptés.")
                return res.status(200).json({
                    message: "Les Conditions Générales de Ventes n'ont pas été accéptés. Merci de les accéptés afin de finaliser votre paiement."
                })
            }
            // avoir un montant de panier supérieur a 0.
            if (req.session.totalTTC == 0 || req.session.totalTTC === undefined) {
                return res.status(200).json({
                    message: "Pour effectuer un paiement vous devez avoir des articles dans votre panier."
                })
            }


            // Avoir choisi un transporteur 

            if (req.session.idTransporteur === undefined) {

                return res.status(200).json({
                    message: "Pour  finaliser votre paiement, merci de choisir un mode de livraison parmis ceux proposé ."
                })
            }

            // et avoir une adresse de livraison définit (et non seulement une adresse de facturation) OU choisi le retrait sur place.
            const isEnvoieOk = await Adresse.findByEnvoie(req.session.user.idClient);
            if (!isEnvoieOk && req.session.idTransporteur != 3) {
                return res.status(200).json({
                    message: "Pour effectuer un paiement, vous devez avoir enregistré une adresse de livraison en plus de votre adresse de facturation ou choisir le mode de livraison : 'Retrait sur le stand'."
                })
            }


            //je construit ce que je vais passer comme metadata
            const articles = [];
            req.session.cart.map(article => (`${articles.push(article.produit+' / ' + 'idArticle = ' + article.id + ' /' + ' prix HT avec reduction: '+article.prixHTAvecReduc+'€'+' / '+' Qte: '+article.quantite)}`));
            articlesBought = articles.join(', ');


            //Je vérifie si le client est déja venu tenter de payer sa commande
            if (req.session.IdPaymentIntentStripeSEPA) {
                //Si oui, je met a jour le montant dans l'objet payementIntent qui existe déja, via la méthode proposé par STRIPE
                //https://stripe.com/docs/api/payment_intents/update?lang=node

                await stripe.paymentIntents.update(
                    req.session.IdPaymentIntentStripeSEPA, {
                        metadata: {
                            articles: articlesBought,
                            amount: req.session.totalStripe,
                        },
                        amount: req.session.totalStripe,
                    }
                );


            } else {

                // Si il n'existe pas, je dois avant tout, le créer
                //https://stripe.com/docs/payments/payment-intents

                // Je récupére les info STRIPE du client via REDIS 
                const idClientStripe = await redis.get(`mada/clientStripe:${req.session.user.email}`);
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: req.session.totalStripe, // total en centimes et en Integer
                    currency: 'eur',
                    customer: idClientStripe,
                    payment_method_types: ['sepa_debit'],
                    setup_future_usage: 'off_session',
                    receipt_email: req.session.user.email,
                    statement_descriptor: 'Madagascar Shop', // Le libellé de relevé bancaire qui apparait sur le relevé des client => 22 caractéres . si mis en dynamique, concaténer au prefix du libellé dans le dashboard https://stripe.com/docs/payments/payment-intents
                    metadata: {
                        integration_check: 'sepa_debit_accept_a_payment',
                        date: `${formatLong(new Date())}`,
                        articles: articlesBought,
                        client: `${req.session.user.prenom} ${req.session.user.nomFamille}`,
                        idClient: req.session.idClient,
                        email: req.session.user.email,
                        session: req.sessionID,
                        amount: req.session.totalStripe,
                        ip: req.ip,
                    },


                });

                req.session.IdPaymentIntentStripeSEPA = paymentIntent.id;
                req.session.clientSecretSEPA = paymentIntent.client_secret;



            }

            console.log("la clé secrete pour un paiement SEPA a bien été envoyé en session !");

            res.status(200).end();


        } catch (error) {
            const errorMessage = process.env.NODE_ENV === 'production' ?
                'Erreur serveur.' :
                `Erreur dans la méthode paiementSEPA du paiementController : ${error.message})`


            res.status(500).json(errorMessage);
            console.trace(error);
        }

    },



    // https://stripe.com/docs/js/payment_methods/create_payment_method et surtout : https://stripe.com/docs/js/payment_intents/confirm_card_payment
    // https://stripe.com/docs/connect/collect-then-transfer-guide?platform=web : 

    //https://stripe.com/docs/ips  //https://stripe.com/docs/webhooks/signatures

    //https://stripe.com/docs/webhooks/build
    //https://stripe.com/docs/api/events/types 


    //NOTE 
    //!ce webhook est contacté par 3 type d'évenement, définit dans le dashBoard STRIPE, qu'il proviennent d'un payement CB ou SEPA :
    /*
        payment_intent.succeeded
        payment_intent.canceled
        payment_intent.payment_failed */


    webhookpaiement: async (req, res) => {
        try {

            //je verifis la signature STRIPE et je récupére la situation du paiement.
            const sig = req.headers['stripe-signature'];

            let event;

            try {
                event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
            } catch (err) {
                return res.status(400).json(`Webhook erreur de la récupération de l'event depuis STRIPE`);
            }

            // je récupére les infos de la CB ou du virement SEPA
            const paymentIntent = event.data.object;
            const paymentData = event.data.object.charges.data[0].payment_method_details;

            console.log("paymentIntent ==>> ", paymentIntent);
            console.log("paymentData ==>> ", paymentData);
            console.log("event ==>> ", event);

            // Ici req.session ne vaut rien car c'est stripe qui contact ce endpoint. Je récupére donc la session pour savoir ce que le client vient de commander.
            // avec mes metadata passé a la création du payment intent
            sessionStore.get(paymentIntent.metadata.session, async function (err, theSession) {

                let session;
                session = theSession;
                //ici si paymentData.type === "sepa_debit" alors session doit provenir de REDIS ! ... car toutes les données de l'achat ont été supprimé de la session apres intention paiement SEPA
                if (paymentData.type === "sepa_debit") {

                    session = await redis.get(`mada/sessionSEPA_Attente_Validation_PaymentIntentId:${paymentIntent.id}`).then(JSON.parse);

                };

                //Si le paiement à bien été effectué et reçu (SEPA ou CB) :
                if (event.type === 'payment_intent.succeeded' && event.data.object.amount_received === Number(event.data.object.metadata.amount)) {


                    try {

                        let resultCommande;
                        let articlesBought;

                        // Si le paiement est réalisé par SEPA les données ont déja été inséré lors de l'event payment_intent.processing
                        if (paymentData.type !== "sepa_debit") {


                            //! je met a jour les stocks suite au produits achetés avec succés !!
                            try {
                                for (const item of session.cart) {
                                    console.log(`On met a jour les stock pour l'item ${item.produit}`);
                                    const updateProduit = await Stock.findOne(item.id);
                                    updateProduit.quantite -= item.quantite; //( updateProduit.quantite = updateProduit.quantite - item.quantite)
                                    await updateProduit.update();
                                    console.log("stock bien mis a jour");

                                }
                            } catch (error) {
                                console.log(`Erreur lors de la mise a jour des stock dans la methode Webhook du paiementController : ${error.message}`);
                                console.trace(error);
                                res.status(500).end();
                            }


                            //! insérer l'info en BDD dans la table commande !

                            try {

                                //je construit ce que je vais passer comme donnée de reférence..
                                const articles = [];
                                session.cart.map(article => (`${articles.push(article.id+"."+article.quantite)}`));
                                articlesBought = articles.join('.');

                                const dataCommande = {};

                                const referenceCommande = `${session.user.idClient}.${session.totalStripe}.${formatJMAHMSsecret(new Date())}.${articlesBought}`;

                                dataCommande.reference = referenceCommande;
                                //RAPPEL des statuts de commande : 1= en attente, 2 = annulée, 3 = Paiement validé, 4 = En cour de préparation, 5 = Prêt pour expedition, 6 = Expédiée
                                dataCommande.idCommandeStatut = 3;
                                dataCommande.idClient = session.user.idClient;

                                if (session.commentaire && session.commentaire !== '') {
                                    dataCommande.commentaire = session.commentaire
                                };
                                if (session.sendSmsWhenShipping == 'true') {
                                    //const isTrueSet = (session.sendSmsWhenShipping === 'true');
                                    dataCommande.sendSmsShipping = session.sendSmsWhenShipping
                                };


                                const newCommande = new Commande(dataCommande);
                                resultCommande = await newCommande.save();

                                //console.log("resultCommande ==>> ", resultCommande);

                            } catch (error) {
                                console.log(`Erreur dans la méthode d'insertion de la commande dans la methode Webhook du paiementController : ${error.message}`);
                                console.trace(error);
                                res.status(500).end();
                            }

                            //! Insérer l'info en BDD dabns la table ligne commande 
                            try {
                                //Je boucle sur chaque produit commandé dans le cart...
                                for (const article of session.cart) {

                                    const dataLigneCommande = {};
                                    dataLigneCommande.quantiteCommande = article.quantite;
                                    dataLigneCommande.idProduit = article.id;
                                    dataLigneCommande.idCommande = resultCommande.id;

                                    const newLigneCommande = new LigneCommande(dataLigneCommande);
                                    await newLigneCommande.save();

                                }
                            } catch (error) {
                                console.log(`Erreur dans la méthode d'insertion des ligne de commandes dans la methode Webhook du paiementController : ${error.message}`);
                                console.trace(error);
                                res.status(500).end();
                            }

                        }


                        if (paymentData.type === "sepa_debit") {

                            //même si je ne dois pas insérer de new commande pour l'event SEPA, je dois néanmoins mettre a jour le status de la commande a paiement validé.
                            resultCommande = session.resultCommande; //en provenance de REDIS !
                            articlesBought = session.articlesBought; //''

                            const updateStatus = new Commande({
                                idCommandeStatut: 3,
                                id: resultCommande.id
                            })

                            //et je redéfinis resultCommande une fois bien mis a jour, pour que les données soient a jours dans les mail et sms !
                            resultCommande = await updateStatus.updateStatutCommande();


                        }

                        //! Insérer l'info en BDD dabns la table paiement !

                        let referencePaiement;
                        let methode;
                        let moyenPaiementDet;
                        let origine;

                        //paymentIntent.id

                        try {

                            const dataPaiement = {};


                            if (paymentData.type === "card") {

                                referencePaiement = `${paymentData.card.exp_month}${paymentData.card.exp_year}${paymentData.card.last4}.${session.user.idClient}.${session.totalStripe}.${formatJMAHMSsecret(new Date())}.${articlesBought}`;

                                methode = `moyen_de_paiement:${paymentData.type}/_marque:_${paymentData.card.brand}/_type_de_carte:_${paymentData.card.funding}/_pays_origine:_${paymentData.card.country}/_mois_expiration:_${paymentData.card.exp_month}/_annee_expiration:_${paymentData.card.exp_year}/_4_derniers_chiffres:_${paymentData.card.last4}`;

                                moyenPaiementDet = `${paymentData.card.brand} ${paymentData.card.funding}`;

                                origine = countrynames.getName(paymentData.card.country);

                                dataPaiement.derniersChiffres = paymentData.card.last4;


                            } else if (paymentData.type === "sepa_debit") {

                                referencePaiement = `${paymentData.sepa_debit.bank_code}.${paymentData.sepa_debit.last4}.${session.user.idClient}.${session.totalStripe}.${formatJMAHMSsecret(new Date())}.${articlesBought}`;

                                methode = `moyen_de_paiement:${paymentData.type}/_code_banque:_${paymentData.sepa_debit.bank_code}/_pays_origine:_${paymentData.sepa_debit.country}/_4_derniers_chiffres:_${paymentData.sepa_debit.last4}`;

                                moyenPaiementDet = paymentData.sepa_debit.bank_code;

                                origine = countrynames.getName(paymentData.sepa_debit.country);

                            }


                            dataPaiement.reference = referencePaiement;
                            dataPaiement.methode = methode;
                            dataPaiement.montant = session.totalTTC;
                            dataPaiement.idCommande = resultCommande.id;
                            dataPaiement.paymentIntent = paymentIntent.id;
                            dataPaiement.moyenPaiement = paymentData.type;
                            dataPaiement.moyenPaiementDetail = moyenPaiementDet;
                            dataPaiement.origine = origine;


                            const newPaiement = new Paiement(dataPaiement);
                            await newPaiement.save();

                        } catch (error) {
                            console.log(`Erreur dans la méthode d'insertion du paiement dans la methode Webhook du paiementController : ${error.message}`);
                            console.trace(error);
                            res.status(500).end();
                        }


                        //! Envoyer un mail au client lui résumant le paiment bien validé, statut de sa commande et lui rappelant ses produits récemment achetés.
                        let transporteurData;
                        let statutCommande;
                        let contexte;
                        let shop;


                        try {


                            transporter.use('compile', hbs(options));

                            // je récupére les infos du transporteur choisi pour insérer les infos dans le mail.
                            transporteurData = await Transporteur.findOne(session.idTransporteur);
                            statutCommande = await StatutCommande.findOne(resultCommande.idCommandeStatut);
                            shop = await Shop.findOne(1); // les données du premier enregistrement de la table shop... Cette table a pour vocation un unique enregistrement...

                            // Nombre de commande déja passé par ce client ?
                            const commandes = await Commande.findByIdClient(session.user.idClient);
                            const commandeLenght = commandes.length - 1; // on enléve la commande récente..

                            // car estimeArriveNumber (le délai) peut être une string ou un number...:/

                            contexte = {
                                commandeLenght,
                                nom: session.user.nomFamille,
                                prenom: session.user.prenom,
                                email: session.user.email,
                                refCommande: resultCommande.reference,
                                statutCommande: statutCommande.statut,
                                nomTransporteur: transporteurData.nom,
                                idTransporteur: Number(session.idTransporteur),
                                adresse: await adresseEnvoieFormat(session.user.idClient),
                                montant: (session.totalStripe) / 100,
                                shopNom: shop.nom,
                                dataArticles: session.cart,
                                commentaire: resultCommande.commentaire,
                                sendSmsWhenShipping: session.sendSmsWhenShipping,
                                paiementType: paymentData.type,
                                ip: req.ip,

                            }

                            if (Number(session.idTransporteur) === 3) {
                                contexte.delai = transporteurData.estimeArriveNumber // ici une string et non un number...
                            } else {
                                // contexte.delai = capitalize(formatLongSansHeure(dayjs().add(transporteurData.estimeArriveNumber, 'day')))
                                contexte.delai = capitalize(addWeekdays(Date.now(), transporteurData.estimeArriveNumber));
                            }


                            let subject;
                            if (paymentData.type === "card") {
                                contexte.marqueCB = paymentData.card.brand;
                                contexte.pays = countrynames.getName(paymentData.card.country);
                                subject = `Votre commande sur le site d'artisanat Malgache ${shop.nom} ✅ `;
                            } else if (paymentData.type === "sepa_debit") {
                                contexte.dateAchat = `${formatLong(resultCommande.dateAchat)}`,
                                    contexte.codeBanque = paymentData.sepa_debit.bank_code;
                                contexte.pays = countrynames.getName(paymentData.sepa_debit.country);
                                subject = `Votre commande a été validé sur le site d'artisanat Malgache ${shop.nom} ✅ `;

                            }


                            // l'envoie d'email définit par l'object "transporter"
                            const info = await transporter.sendMail({
                                from: process.env.EMAIL, //l'envoyeur
                                to: session.user.email,
                                subject, // le sujet du mail
                                text: `Bonjour ${session.user.prenom} ${session.user.nomFamille}, nous vous remercions de votre commande sur le site d'artisanat Malgache ${shop.nom} .`,
                                /* attachement:[
                                    {filename: 'picture.JPG', path: './picture.JPG'}
                                ] */
                                template: 'apresAchat',
                                context: contexte,

                            });
                            console.log(`Un email de confirmation d'achat à bien envoyé a ${session.user.prenom} ${session.user.nomFamille} via l'adresse email: ${session.user.email} : ${info.response}`);


                        } catch (error) {
                            console.log(`Erreur dans la méthode d'envoie d'un mail au client aprés achat dans la methode Webhook du paiementController : ${error.message}`);
                            console.trace(error);
                            res.status(500).end();
                        }


                        //! Envoyer un mail a l'admin lui informant d'une nouvelle commande, lui résumant le paiment bien validé, lui rappelant les produit a emballé et l'adresse d'expéditeur !.
                        try {
                            //NOTE 
                            // Ici on envoi un email a tous les Admin en BDD qui ont vérifié leur email et choisi de recevoir un email a chaque nouvelle commande et au mail qui est sur la table "Shop" !
                            const adminsMail = await AdminVerifEmail.findAllAdminEmailTrue();
                            // Je rajoute une clé pour des mails avec le nom de la boutique présent dans la table shop.

                            // si j'ai des admin qui on vérifié leur email et qui souhaite recevoir les nouvelles commande sur leur mail !
                            if (adminsMail !== null) {

                                for (const admin of adminsMail) {

                                    //Ici je dois ajouter dans l'objet contexte, le prenom des admin, pour un email avec prenom personalisé !
                                    contexte.adminPrenom = admin.prenom;

                                    const info2 = await transporter.sendMail({
                                        from: process.env.EMAIL, //l'envoyeur
                                        to: admin.email,
                                        subject: `Une nouvelle commande sur le site internet !! 🎉 `, // le sujet du mail
                                        text: `Bonjour cher Administrateur, tu as reçu une nouvelle commande !`,
                                        /* attachement:[
                                            {filename: 'picture.JPG', path: './picture.JPG'}
                                        ] */
                                        template: 'nouvelleCommande',
                                        context: contexte,

                                    });
                                    console.log(`Un email d'information d'une nouvelle commande à bien envoyé a ${admin.email} : ${info2.response}`);
                                }
                            }

                            delete contexte.adminPrenom; // plus d'admin prenom ici, dans le mail on prendra la valeur pas défault : "cher Administrateur !".

                            //Envoie d'email sur le mail présent dans la table "Shop".
                            const info2 = await transporter.sendMail({
                                from: process.env.EMAIL, //l'envoyeur
                                to: shop.emailContact,
                                subject: `Une nouvelle commande sur le site internet !! 🎉 `, // le sujet du mail
                                text: `Bonjour cher Administrateur, tu as reçu une nouvelle commande !`,
                                /* attachement:[
                                    {filename: 'picture.JPG', path: './picture.JPG'}
                                ] */
                                template: 'nouvelleCommande',
                                context: contexte,

                            });
                            console.log(`Un email d'information d'une nouvelle commande à bien envoyé a ${shop.emailContact} : ${info2.response}`);

                        } catch (error) {
                            console.log(`Erreur dans la méthode d'envoie d'un mail a l'admin aprés nouvelle commande dans la methode Webhook du paiementController : ${error.message}`);
                            console.trace(error);
                            res.status(500).end();
                        }


                        //! Envoyer un sms a l'admin (numéro dans la table Twilio), si il a choisi l'option "recevoir un sms a chaque commande" lui informant d'une nouvelle commande, lui résumant le paiment bien validé, lui rappelant les produit a emballé et l'adresse d'expéditeur !.
                        try {
                            const smsChoice = await AdminPhone.findAllSmsNewCommande();

                            // On ne lance des sms que si un des admin au moins, a choisi d'en recevoir a chaque commande...
                            if (smsChoice !== null) {
                                const dataTwillio = await Twillio.findFirst();
                                const twilio = require('twilio')(dataTwillio.accountSid, dataTwillio.authToken);

                                const articles2 = [];
                                session.cart.map(article => (`${articles2.push(article.produit+"x"+article.quantite+"/"+article.taille+"/"+article.couleur)}`));
                                articlesachat = articles2.join('.');

                                if (!(validator.isMobilePhone(dataTwillio.twillioNumber, 'en-GB', {
                                        strictMode: true
                                    }) && validator.isMobilePhone(dataTwillio.devNumber, 'fr-FR', {
                                        strictMode: true
                                    }))) {
                                    return res.status(404).json({
                                        message: 'Votre numéro de téléphone ne correspond pas au format souhaité !'
                                    })
                                }
                                //J'indique juste la présence ou non de commentaire, a lire par mail...
                                let comment;
                                if (resultCommande.commentaire) {
                                    comment = "Présence Commentaire."
                                } else {
                                    comment = "Absence Commentaire."
                                }

                                // si retrait sur le marché , on n'envoit pas d'adresse par sms !
                                if (Number(session.idTransporteur) === 3) {

                                    for (const admin of smsChoice) {

                                        twilio.messages.create({
                                                body: ` 🎉 New commande ! ${transporteurData.nom}/${comment}/${session.totalStripe/100}€/${articlesachat} `,
                                                from: dataTwillio.twillioNumber,
                                                to: admin.adminTelephone,

                                            })
                                            .then(message => console.log(message.sid));
                                        console.log("SMS bien envoyé !")
                                    }

                                } else {

                                    for (const admin of smsChoice) {

                                        twilio.messages.create({
                                                body: ` 🎉 New commande ! ${transporteurData.nom}/${comment}/${await adresseEnvoieFormat(session.user.idClient)}/${session.totalStripe/100}€/${articlesachat} `,
                                                from: dataTwillio.twillioNumber,
                                                to: admin.adminTelephone,

                                            })
                                            .then(message => console.log(message.sid));
                                        console.log("SMS bien envoyé !")
                                    }
                                }

                            }
                        } catch (error) {
                            console.log(`Erreur dans la méthode d'envoie d'un ou plusieur SMS a l'admin aprés nouvelle commande dans la methode Webhook du paiementController : ${error.message}`);
                            console.trace(error);
                            res.status(500).end();
                        }

                        //! Je vire l'argent  nouvellement dispo sur le compte STRIPE vers le compte bancaire.
                        // Je demande la balance du compte et si la balance est supérieur a 0 je vire le montant disponible une fois la réponse de la balance donnée.
                        // 1€ minimum pour le virement...
                        // appel asynchrone
                        try {
                            stripe.balance.retrieve(async function (err, balance) {
                                const balanc = balance.available[0].amount;

                                if (balanc > 0) {
                                    await stripe.payouts.create({
                                        amount: balance.available[0].amount,
                                        currency: 'eur',
                                    });
                                    console.log("On a bien viré le solde STRIPE dispo vers le CCP !")
                                }


                            });
                        } catch (error) {
                            console.log(`Erreur dans le try catch du virement STRIPE dans la methode Webhook du paiementController : ${error.message}`);
                            console.trace(error);
                            res.status(500).end();
                        }



                    } catch (error) {
                        console.log(`Erreur dans la partie payment_intent.succeeded du Webhook du paiementController : ${error.message}`);
                        console.trace(error);
                        res.status(500).end();
                    }

                    if (paymentData.type !== "sepa_debit") {
                        sessionStore.get(paymentIntent.metadata.session, function (err, session) {

                            delete session.cart,
                                delete session.totalTTC,
                                delete session.totalHT,
                                delete session.totalTVA,
                                delete session.coutTransporteur,
                                delete session.totalStripe,
                                delete session.idTransporteur,
                                delete session.IdPaymentIntentStripe,
                                delete session.clientSecret,
                                delete session.commentaire,
                                delete session.sendSmsWhenShipping,
                                // j'insere cette session modifié dans REDIS !
                                sessionStore.set(paymentIntent.metadata.session, session, function (err, session) {})

                        });

                    } else {

                        // Sinon je supprimme la session mis dans REDIS dans le webhookSEPA
                        await redis.del(`mada/sessionSEPA_Attente_Validation_PaymentIntentId:${paymentIntent.id}`);
                    }

                    // TODO 

                    //https://stripe.com/docs/refunds 
                    // écrire une facture !


                    return res.status(200).end();
                } else {

                    //! TRAITEMENT DES ÉRREURS 

                    //! CODE DE REFUS DE PAIEMENT !
                    //https://stripe.com/docs/declines/codes 

                    let infoErreur;
                    const declineCode = event.data.object.charges.data[0].outcome.reason;
                    //const sellerMessage = event.data.object.charges.data[0].outcome.seller_message;
                    if (declineCode) {
                        infoErreur = await redis.get(`mada/codeErreurPaiement:${declineCode}`);
                    }

                    //! SI PAIEMENT SEPA :

                    if ((event.type === 'payment_intent.payment_failed' || event.type === 'payment_intent.canceled') && paymentData.type === "sepa_debit") {


                        //! Suppression des stock mis de coté lors du webhookSEPA
                        // je ré-augmente la valeur des produits en stock en ajoutantceux contenu dans le panier annulé

                        try {
                            for (const item of session.cart) {
                                console.log(`On ré-augmente les stock pour l'item ${item.produit}`);
                                const updateProduit = await Stock.findOne(item.id);
                                updateProduit.quantite += item.quantite; //( updateProduit.quantite = updateProduit.quantite + item.quantite)
                                await updateProduit.update();
                                console.log("stock augmenté mis a jour");

                            }
                        } catch (error) {
                            console.log(`Erreur lors de la mise a jour des stock dans la methode Webhook du paiementController : ${error.message}`);
                            console.trace(error);
                            res.status(500).end();
                        }

                        //! Une mise a jour de la commande en "2" "Annullé" et non une supression de la commande pour gardeer une trace !

                        let resultCommande;
                        try {

                            const updateStatus = new Commande({
                                idCommandeStatut: 2,
                                id: session.resultCommande.id
                            })

                            //et je redéfinis resultCommande une fois bien mis a jour, pour que les données soient a jours dans le mail d'échec SEPA !
                            resultCommande = await updateStatus.updateStatutCommande();



                        } catch (error) {
                            console.log(`Erreur lors de la suppression de la commande (apres echec de paiement SEPA) dans la methode Webhook du paiementController : ${error.message}`);
                            console.trace(error);
                            res.status(500).end();
                        }

                        //! envoie d'un email indiquant l'échec du paiement SEPA et la cause si elle est connue.

                        try {


                            transporter.use('compile', hbs(options));

                            // je récupére les infos du transporteur choisi pour insérer les infos dans le mail.
                            transporteurData = await Transporteur.findOne(session.idTransporteur);
                            statutCommande = await StatutCommande.findOne(resultCommande.idCommandeStatut);
                            shop = await Shop.findOne(1); // les données du premier enregistrement de la table shop... Cette table a pour vocation un unique enregistrement...

                            contexte = {
                                nom: session.user.nomFamille,
                                prenom: session.user.prenom,
                                email: session.user.email,
                                refCommande: resultCommande.reference,
                                statutCommande: statutCommande.statut,
                                nomTransporteur: transporteurData.nom,
                                idTransporteur: Number(session.idTransporteur),
                                adresse: await adresseEnvoieFormat(session.user.idClient),
                                montant: (session.totalStripe) / 100,
                                shopNom: shop.nom,
                                dataArticles: session.cart,
                                commentaire: resultCommande.commentaire,
                                sendSmsWhenShipping: session.sendSmsWhenShipping,
                                paiementType: paymentData.type,
                                declineCode,
                                dateAchat: `${formatLong(resultCommande.dateAchat)}`,
                                codeBanque: paymentData.sepa_debit.bank_code,


                            }

                            // l'envoie d'email définit par l'object "transporter"
                            const info = await transporter.sendMail({
                                from: process.env.EMAIL, //l'envoyeur
                                to: session.user.email,
                                subject: `Votre commande n'as pas pu être validé sur le site d'artisanat Malgache ${shop.nom} ❌`, // le sujet du mail
                                text: `Bonjour ${session.user.prenom} ${session.user.nomFamille}, Votre paiement sur le site d'artisanat Malgache ${shop.nom} n'as pas pu être validé suite a votre paiement par virement SEPA.`,
                                /* attachement:[
                                    {filename: 'picture.JPG', path: './picture.JPG'}
                                ] */
                                template: 'echecApresAchat',
                                context: contexte,

                            });
                            console.log(`Un email d'information d'échec de paiement SEPA à bien envoyé a ${session.user.prenom} ${session.user.nomFamille} via l'adresse email: ${session.user.email} : ${info.response}`);


                        } catch (error) {
                            console.log(`Erreur dans la méthode d'envoie d'un mail au client aprés achat dans la methode Webhook du paiementController : ${error.message}`);
                            console.trace(error);
                            res.status(500).end();
                        }

                        res.status(200).end();


                    }

                    //! SI PAIEMENT cb
                    if ((event.type === 'payment_intent.payment_failed' || event.type === 'payment_intent.canceled') && paymentData.type === "card") {

                        // Ici une réponse différente selon les raisons d'échec potentielle! 

                        message = {
                            code_error: declineCode,
                            network_status: event.data.object.charges.data[0].outcome.network_status,
                            //seller_message: sellerMessage,
                            info: infoErreur,

                        };
                        console.log(message);
                        res.status(200).json(message);

                    }


                    //! Je modifie la session et supprime le panier pour que l'utilisateur puisse éffectuer une autre commande / paiement sans devoir se reconnecter. 

                    if (paymentData.type !== "sepa_debit") {
                        sessionStore.get(paymentIntent.metadata.session, function (err, session) {

                            delete session.cart,
                                delete session.totalTTC,
                                delete session.totalHT,
                                delete session.totalTVA,
                                delete session.coutTransporteur,
                                delete session.totalStripe,
                                delete session.idTransporteur,
                                delete session.IdPaymentIntentStripe,
                                delete session.clientSecret,
                                delete session.commentaire,
                                delete session.sendSmsWhenShipping,
                                // j'insere cette session modifié dans REDIS !
                                sessionStore.set(paymentIntent.metadata.session, session, function (err, session) {})
                            console.log("Panier dans le sessionStore bien supprimé");

                        });

                    } else {

                        // Sinon je supprimme la session mis dans REDIS dans le webhookSEPA
                        await redis.del(`mada/sessionSEPA_Attente_Validation_PaymentIntentId:${paymentIntent.id}`);
                        console.log("Panier dans le REDIS bien supprimé");
                    }

                }


            });

        } catch (error) {
            const errorMessage = process.env.NODE_ENV === 'production' ?
                'Erreur serveur.' :
                `Erreur dans la méthode webhookpaiement du paiementController : ${error.message})`

            res.status(500).json(errorMessage);
            console.trace(error);
        }

    },

    // Ce webhook est contacté par un seul type d'évenement :
    /* payment_intent.processing  => pour evoyer un mail quand le client a choisit le mode de paiement SEPA, l'avertissant d'une bonne reception de la volonté de paiement mais lui indiquant que la commande sera validé a la recpetion du paiement..
    On envoi la commande en BDD avec le statut 'en attente */
    webhookpaiementSEPA: async (req, res) => {
        try {

            //je verifis la signature STRIPE et je récupére la situation du paiement.
            const sig = req.headers['stripe-signature'];

            let event;

            try {
                event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecretSEPA);
            } catch (err) {
                return res.status(400).json(`Webhook erreur de la récupération de l'event: ${err.message}`);

            }

            const paymentIntent = event.data.object;

            // je récupére les infos de la CB ou du virement SEPA
            const paymentData = await stripe.paymentMethods.retrieve(paymentIntent.payment_method);

            // ce webhook s'adresse uniquement a payment_intent.processing si il provient d'un virement SEPA. 
            if (event.type === 'payment_intent.processing' && paymentData.type === "card") {

                return res.status(200).end();

            } else if (event.type === 'payment_intent.processing' && paymentData.type === "sepa_debit") {


                // Ici req.session ne vaut rien car c'est stripe qui contact ce endpoint. Je récupére donc la session pour savoir ce que le client vient de commander.
                // avec mes metadata passé a la création du payment intent
                sessionStore.get(paymentIntent.metadata.session, async function (err, session) {


                    //! je met a jour les stocks suite au produits commandé !!
                    try {
                        for (const item of session.cart) {
                            console.log(`On met a jour les stock pour l'item ${item.produit}`);
                            const updateProduit = await Stock.findOne(item.id);
                            updateProduit.quantite -= item.quantite; //( updateProduit.quantite = updateProduit.quantite - item.quantite)
                            await updateProduit.update();
                            console.log("stock bien mis a jour");

                        }
                    } catch (error) {
                        console.log(`Erreur lors de la mise a jour des stock dans la methode WebhookSEPA du paiementController : ${error.message}`);
                        console.trace(error);
                        res.status(500).end();
                    }

                    //! insérer l'info en BDD dans la table commande !
                    let resultCommande;
                    let articlesBought;

                    try {

                        //je construit ce que je vais passer comme donnée de reférence..
                        const articles = [];
                        session.cart.map(article => (`${articles.push(article.id+"."+article.quantite)}`));
                        articlesBought = articles.join('.');

                        const dataCommande = {};

                        const referenceCommande = `${session.user.idClient}.${session.totalStripe}.${formatJMAHMSsecret(new Date())}.${articlesBought}`;

                        dataCommande.reference = referenceCommande;
                        //RAPPEL des statuts de commande : 1= en attente, 2 = annulée, 3 = Paiement validé, 4 = En cour de préparation, 5 = Prêt pour expedition, 6 = Expédiée
                        dataCommande.idCommandeStatut = 1; // payment non validé... "En attente"
                        dataCommande.idClient = session.user.idClient;

                        if (session.commentaire && session.commentaire !== '') {
                            dataCommande.commentaire = session.commentaire
                        };
                        if (session.sendSmsWhenShipping == 'true') {
                            //const isTrueSet = (session.sendSmsWhenShipping === 'true');
                            dataCommande.sendSmsShipping = session.sendSmsWhenShipping
                        };


                        const newCommande = new Commande(dataCommande);
                        resultCommande = await newCommande.save();


                    } catch (error) {
                        console.log(`Erreur dans la méthode d'insertion de la commande dans la methode WebhookSEPA du paiementController : ${error.message}`);
                        console.trace(error);
                        res.status(500).end();
                    }

                    //! Insérer l'info en BDD dabns la table ligne commande 
                    try {
                        //Je boucle sur chaque produit commandé dans le cart...
                        for (const article of session.cart) {

                            const dataLigneCommande = {};
                            dataLigneCommande.quantiteCommande = article.quantite;
                            dataLigneCommande.idProduit = article.id;
                            dataLigneCommande.idCommande = resultCommande.id;

                            const newLigneCommande = new LigneCommande(dataLigneCommande);
                            await newLigneCommande.save();

                        }
                    } catch (error) {
                        console.log(`Erreur dans la méthode d'insertion des ligne de commandes dans la methode WebhookSEPA du paiementController : ${error.message}`);
                        console.trace(error);
                        res.status(500).end();
                    }

                    //! j'envoie un email indiquant la bonne reception de la volonté de payer par virement SEPA, et l'envoi d'un prochain mail, si jamais le webhook est contacté par l'évenement 'payment_intent.succeeded' ou 'payment_intent.payment_failed'

                    try {


                        transporter.use('compile', hbs(options));

                        // je récupére les infos du transporteur choisi pour insérer les infos dans le mail.
                        const transporteurData = await Transporteur.findOne(session.idTransporteur);
                        const statutCommande = await StatutCommande.findOne(resultCommande.idCommandeStatut);
                        const shop = await Shop.findOne(1); // les données du premier enregistrement de la table shop... Cette table a pour vocation un unique enregistrement...

                        // Nombre de commande déja passé par ce client ? soustraction dans la template...
                        const commandes = await Commande.findByIdClient(session.user.idClient);
                        const commandeLenght = commandes.length - 1; // on enléve la commande récente..

                        // car estimeArriveNumber (le délai) peut être une string ou un number...:/

                        const contexte = {
                            commandeLenght,
                            nom: session.user.nomFamille,
                            prenom: session.user.prenom,
                            email: session.user.email,
                            refCommande: resultCommande.reference,
                            statutCommande: statutCommande.statut,
                            nomTransporteur: transporteurData.nom,
                            idTransporteur: Number(session.idTransporteur),
                            adresse: await adresseEnvoieFormat(session.user.idClient),
                            montant: (session.totalStripe) / 100,
                            shopNom: shop.nom,
                            dataArticles: session.cart,
                            commentaire: resultCommande.commentaire,
                            sendSmsWhenShipping: session.sendSmsWhenShipping,
                            paiementType: paymentData.type,
                            codeBanque: paymentData.sepa_debit.bank_code,
                        }

                        // l'envoie d'email définit par l'object "transporter"
                        const info = await transporter.sendMail({
                            from: process.env.EMAIL, //l'envoyeur
                            to: session.user.email,
                            subject: `Votre commande en attente sur le site d'artisanat Malgache ${shop.nom} ✅ `, // le sujet du mail
                            text: `Bonjour ${session.user.prenom} ${session.user.nomFamille}, nous vous remercions de votre commande sur le site d'artisanat Malgache ${shop.nom} .`,
                            /* attachement:[
                                {filename: 'picture.JPG', path: './picture.JPG'}
                            ] */
                            template: 'apresIntentionPayementSEPA',
                            context: contexte,

                        });
                        console.log(`Un email de confirmation d'achat à bien envoyé a ${session.user.prenom} ${session.user.nomFamille} via l'adresse email: ${session.user.email} : ${info.response}`);


                    } catch (error) {
                        console.log(`Erreur dans la méthode d'envoie d'un mail au client aprés achat dans la methode WebhookSEPA du paiementController : ${error.message}`);
                        console.trace(error);
                        res.status(500).end();
                    }

                    try {
                        //TODO :
                        //!ATTENTION, il va falloir garder en BDD REDIS les infos de session jusqu' a savoir si le paiement a été validé ou non...
                        // clé REDIS ==>> l'id du payement intent // value ==>> toute la session !
                        // Je peux facilement la retrouver dans le webhook principale avec l'event.

                        session.resultCommande = resultCommande;
                        session.articlesBought = articlesBought;

                        await redis.set(`mada/sessionSEPA_Attente_Validation_PaymentIntentId:${paymentIntent.id}`, JSON.stringify(session));

                    } catch (error) {
                        console.log(`Erreur dans la méthode d'insertion de la session dans REDIS aprés achat dans la methode WebhookSEPA du paiementController : ${error.message}`);
                        console.trace(error);
                        res.status(500).end();
                    }

                    sessionStore.get(paymentIntent.metadata.session, function (err, session) {

                        // supprimer la session...
                        delete session.cart,
                            delete session.totalTTC,
                            delete session.totalHT,
                            delete session.totalTVA,
                            delete session.coutTransporteur,
                            delete session.totalStripe,
                            delete session.idTransporteur,
                            delete session.IdPaymentIntentStripeSEPA,
                            delete session.clientSecretSEPA,
                            delete session.commentaire,
                            delete session.sendSmsWhenShipping,
                            delete session.resultCommande,
                            delete session.articlesBought,

                            // j'insere cette session modifié dans REDIS !
                            sessionStore.set(paymentIntent.metadata.session, session, function (err, session) {
                                console.log("le panier a bien été supprimer dans le webhookSEPA", session)
                            });

                    });


                    res.status(200).end();

                });

            } else {

                res.status(200).end();

            }



        } catch (error) {
            const errorMessage = process.env.NODE_ENV === 'production' ?
                'Erreur serveur.' :
                `Erreur dans la méthode WebhookpaiementSEPA du paiementController : ${error.message})`

            res.status(500).json(errorMessage);
            console.trace(error);
        }

    },



    key: async (req, res) => {
        try {


            //simple rappel si j'oubli le MW d'autorisation client... a enlever en prod peut être..

            //TODO 
            //valeur décommenté aprés test 
            //NOTE => a décommenter quand un front sera présent. Sinon, vu qu'aucun token n'est renvoyé, req.seesion.user ne contient rien, comme req.session.clientsecret. on tombe dans une érreur  
            /* if (!req.session.user) {
                return res.status(401).json("Merci de vous authentifier avant d'accéder a cette ressource.");
            }

            if (req.session.IdPaymentIntentStripe === undefined || req.session.clientSecret === undefined) {
                return res.status(400).json("Merci de réaliser une tentative de paiement avant d'accéder a cette ressource.");

            } else {
                console.log(`on a bien délivré la clé au front : ${req.session.clientSecret}`)
                //NOTE : lors de l'appel de la clé secrete depuis le front, on insére dans REDIS la valeur de req.session.cart pour pouvoir aller le chercher dans le webhook avec le mail utilisateur dans les métadonnée.

                return res.status(200).json({
                    client_secret: req.session.clientSecret,
                });
            } */

            //TODO 
            //!contenu a commenté aprés test 
            console.log(`on a bien délivré la clé au front, a insérer en dure dans la méthode key, en mode test (car req.session n'existe pas)  : ${req.session.clientSecret}`);

            // A chaque test, on lance la méthode key dans postman ou REACT, on remplace la clé en dure par la clé dynamique donné en console.
            return res.status(200).json({
                client_secret: "pi_3JYib4LNa9FFzz1X1A72ijx0_secret_DdKAbnfFrbvjb5hznYjfwsBdV",
            });


        } catch (error) {
            const errorMessage = process.env.NODE_ENV === 'production' ?
                'Erreur serveur.' :
                `Erreur dans la méthode key du paiementController : ${error.message})`;

            res.status(500).json(errorMessage);
            console.trace(error);
        }
    },

    // IBAN test => https://stripe.com/docs/testing#sepa-direct-debit 
    //AT611904300234573201 (Le statut du PaymentIntent passe de processing à succeeded.)
    //AT321904300235473204	Le statut du PaymentIntent passe de processing à succeeded après 3 minutes.

    keySEPA: async (req, res) => {
        try {


            //simple rappel si j'oubli le MW d'autorisation client... a enlever en prod peut être..

            //TODO 
            //valeur décommenté aprés test 
            //NOTE => a décommenter quand un front sera présent. Sinon, vu qu'aucun token n'est renvoyé, req.seesion.user ne contient rien, comme req.session.clientsecret. on tombe dans une érreur  
            /* if (!req.session.user) {
                return res.status(401).json("Merci de vous authentifier avant d'accéder a cette ressource.");
            }

            if (req.session.IdPaymentIntentStripeSEPA === undefined || req.session.clientSecretSEPA === undefined) {
                return res.status(400).json("Merci de réaliser une tentative de paiement avant d'accéder a cette ressource.");

            } else {
                console.log(`on a bien délivré la clé au front : ${req.session.clientSecretSEPA}`)
                //NOTE : lors de l'appel de la clé secrete depuis le front, on insére dans REDIS la valeur de req.session.cart pour pouvoir aller le chercher dans le webhook avec le mail utilisateur dans les métadonnée.

                return res.status(200).json({
                    client_secret: req.session.clientSecretSEPA,
                });
            } */

            //TODO 
            //!contenu a commenté aprés test 
            console.log(`on a bien délivré la clé au front, a insérer en dure dans la méthode key, en mode test (car req.session n'existe pas)  : ${req.session.clientSecretSEPA}`);

            // A chaque test, on lance la méthode key dans postman ou REACT, on remplace la clé en dure par la clé dynamique donné en console.
            return res.status(200).json({
                client_secret: "pi_3JYkxbLNa9FFzz1X1RAFvhSs_secret_6901yMjk0k0n9SKBzGlXofKP3",
            });


        } catch (error) {
            const errorMessage = process.env.NODE_ENV === 'production' ?
                'Erreur serveur.' :
                `Erreur dans la méthode keySEPA du paiementController : ${error.message})`;

            res.status(500).json(errorMessage);
            console.trace(error);
        }
    },



    balanceStripe: async (req, res) => {
        try {


            if (req.session.user.privilege === 'Client') {
                return res.status(403).json({
                    message: "Vous n'avez pas les droits pour accéder a cette ressource"
                })
            };

            stripe.balance.retrieve(function (err, balance) {
                console.log(balance.available[0].amount);
                res.status(200).json(balance);

            });

            //res.status(200).end();
        } catch (error) {
            console.trace('Erreur dans la méthode balanceStripe du paiementController :',
                error);
            res.status(500).end();
        }
    },

    refund: async (req, res) => {
        try {
            // attent reference de commande = "commande", un montant en euro = "montant" et soit un idClient ="idClient" ou un email = "email"; (On peut prendre les deux dans l'API pour plus de souplesse !)

            //verification du role admin pour un double sécu 
            if (req.session.user.privilege === 'Client') {
                return res.status(403).json({
                    message: "Vous n'avez pas les droits pour accéder a cette ressource"
                })
            };

            // Je vérifis que le numéro de commande existe en BDD, qu'il y ait un paiement pour cette commande et que son statut n'est pas "en attente ou "annulée" ou "Remboursée"
            let refCommandeOk;

            try {
                refCommandeOk = await Commande.findByRefCommande(req.body.commande);
            } catch (error) {
                console.log("Erreur dans le try catch de récupération de la commande dans la méthode refund du PaiementController !", error);
                return res.status(500).end();
            }

            if (refCommandeOk === null || refCommandeOk.reference === undefined) {
                console.log("Aucun paiement pour cette référence de commande ou elle n'as de statut compatible avec un remboursement !");
                return res.status(200).json({
                    message: "Aucune commande avec cette référence ou commande sans paiement ou avec un statut de commande imcompatible, merci de vérifier son orthographe."
                });
            }

            let idClient;

            // si on reçoit un req.body.quelquechose :
            if (req.body.email) {

                if (!validator.isEmail(req.body.email)) {
                    console.log("le format du mail ne convient pas au validator")
                    return res.status(403).json(
                        'le format de l\'email est incorrect'
                    );

                }
                /// je vais retrouver l'id client correspondant
                let emailOk;
                try {
                    emailOk = await Client.findByEmail(req.body.email)
                } catch (error) {
                    console.log("Erreur dans le try catch de récupération de l'email dans la méthode refund du PaiementController !", error);
                    return res.status(500).end();
                }


                if (emailOk === null) {
                    console.log("Cet email n'est pas présent en BDD !");
                    return res.status(200).json({
                        message: "Cet email n'est pas présent en BDD !"
                    })
                } else {
                    idClient = emailOk.id
                }

            } else if (req.body.idClient) {
                // je recherche l'id Client correspondant et existe
                let idOk;
                try {
                    idOk = await Client.findOne(req.body.idClient);
                } catch (error) {
                    console.log("Erreur dans le try catch de récupération de l'idClient dans la méthode refund du PaiementController !", error);
                    return res.status(500).end();
                }

                if (idOk === null) {
                    console.log("Cet id client n'est pas présent en BDD !");
                    return res.status(200).json({
                        message: "Cet id client n'est pas présent en BDD !"
                    })
                } else {
                    idClient = idOk.id
                }
            }


            // j'extrait l'id Client de la ref de la commande et je compare l'id récupéré avec l'id en ref commande
            //Format d'une commande : idClient.total a payer en centime, date d'achat en format DDMMYYYYHHmmss.id d'un article acheté.la quantité de cet article.id d'un article acheté.la quantité de cet article
            const idClientFromRefCommande = req.body.commande.split('.', 1);
            if (Number(idClientFromRefCommande) !== Number(idClient)) {

                console.log("idClient en provenance de la référence de la commande n'est pas le même que l'idClient fournit ou en provenance du mail.");
                return res.status(200).json({
                    message: "Le client renseigné n'a pas effectué cette commande, vous n'êtes pas autoriser a le rembourser !"
                })

            }

            // je vérifit que le montant demandé rembourser est égal ou inférieur au montant de la commande
            if (Number(req.body.montant) > Number(refCommandeOk.montant)) {
                console.log("Il n'est pas possible d'effectuer un remboursement supérieur au montant de la commande !");
                return res.status(200).json({
                    message: `Il n'est pas possible d'effectuer un remboursement supérieur au montant de la commande (${refCommandeOk.montant}) !`
                })

            }
            // si tout matche, je lance STRIPE !
            let refund;
            try {
                refund = await stripe.refunds.create({
                    amount: req.body.montant * 100, // toujours en cents STRIPE...
                    payment_intent: refCommandeOk.payment_intent,
                    metadata: {
                        montant: req.body.montant,
                        idClient,
                        refCommande: refCommandeOk.reference,
                        idCommande: refCommandeOk.id,

                    },
                });

                console.log("Fond bien remboursé ;)");

            } catch (error) {
                console.log("Erreur dans le try catch STRIPE de création du remboursement dans la méthode refund du PaiementController !", error);
                return res.status(500).end();
            }


            return res.status(200).end();

        } catch (error) {
            console.trace('Erreur dans la méthode refund du paiementController :',
                error);
            res.status(500).end();
        }
    },

    // retour de l'evnt charge.refund.updated signifiant qu'un remboursement a échoué !

    webhookRefundUpdate: async (req, res) => {
        try {
            //je verifis la signature STRIPE et je récupére la situation du paiement.
            const sig = req.headers['stripe-signature'];

            let event;

            try {
                event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecretrefundUpdate);
            } catch (err) {
                return res.status(400).json(`WebhookRefundFail erreur de la récupération de l'event: ${err.message}`);

            }
            const metadata = event.data.object.metadata;

           
            let theClient;
            let thePaiement;
            let shop;
            let refCommandeOk;
            let adminsMail;
            try {
                refCommandeOk = await Commande.findOne(metadata.idCommande);
            } catch (error) {
                console.log("Erreur dans le try catch de récupération de la commande dans la méthode webhookrefundFAIL du PaiementController !", error);
                return res.status(500).end();
            }

            console.log(" refCommandeOk  => ",  refCommandeOk);

            // je récupére les infos du client pour l'envoi du mail.
            try {
                //TODO 
                //faire une vue pour ces type d'infos reliées ?
                adminsMail = await AdminVerifEmail.findAllAdminEmailTrue();
                theClient = await Client.findOne(metadata.idClient);
                thePaiement = await Paiement.findByIdCommande(metadata.idCommande);
                shop = await Shop.findOne(1); // les données du premier enregistrement de la table shop... Cette table a pour vocation un unique enregistrement...

            } catch (error) {
                console.log(`Erreur dans la méthode de recherche d'information (client / paiement / shop) aprés remboursement dans la methode webhookRefundFAIL du paiementController : ${error.message}`);
                console.trace(error);
                res.status(500).end();
            }

            if (event.data.object.status === " failed") {

                try {

                    transporter.use('compile', hbs(options));

                    const contexte = {
                        nom: theClient.nomFamille,
                        prenom: theClient.prenom,
                        email: theClient.email,
                        refCommande: refCommandeOk.reference,
                        statutCommande: refCommandeOk.idCommandeStatut,
                        dateAchat: formatLong(refCommandeOk.dateAchat),
                        montant: metadata.montant,
                        derniersChiffres: thePaiement.derniersChiffres,
                        moyenPaiement: thePaiement.moyenPaiement,
                        moyenPaiementDetail: thePaiement.moyenPaiementDetail,
                        methode:thePaiement.methode,
                        montantPaiement: thePaiement.montant,
                    }

                    // l'envoie d'email définit par l'object "transporter"
                    if (adminsMail !== null) {

                        for (const admin of adminsMail) {

                            //Ici je dois ajouter dans l'objet contexte, le prenom des admin, pour un email avec prenom personalisé !
                            contexte.adminPrenom = admin.prenom;

                            const info2 = await transporter.sendMail({
                                from: process.env.EMAIL, //l'envoyeur
                                to: admin.email,
                                subject: `Erreur de remboursement STRIPE pour la commande n° ${refCommandeOk.reference} concernant le client ${theClient.prenom} ${theClient.nomFamille} (${theClient.email}) ❌ `, // le sujet du mail
                                text: `Bonjour cher Administrateur, Une érreur de remboursement est apparu pour la commande client n° ${refCommandeOk.reference} !`,
                                template: 'erreurRemboursement',
                                context: contexte,

                            });
                            console.log(`Un email d'information d'une érreur de remboursement à bien été envoyé a ${admin.email} : ${info2.response}`);
                        }
                    }

                     //Envoie d'email sur le mail présent dans la table "Shop".
                     const info = await transporter.sendMail({
                        from: process.env.EMAIL, //l'envoyeur
                        to: shop.emailContact,
                        subject: `Erreur de remboursement STRIPE pour la commande n° ${refCommandeOk.reference} concernant le client ${theClient.prenom} ${theClient.nomFamille} (${theClient.email}) ❌ `, // le sujet du mail
                        text: `Bonjour cher Administrateur, Une érreur de remboursement est apparu pour la commande client n° ${refCommandeOk.reference} !`,
                        template: 'erreurRemboursement',
                        context: contexte,

                    });
                    console.log(`Un email d'information d'une érreur de remboursement à bien été envoyé a ${shop.emailContact} : ${info.response}`);

                } catch (error) {
                    console.log(`Erreur dans la méthode d'envoie d'un mail aux admins aprés und érreur de remboursement dans la methode webhookRefundFAIL du paiementController : ${error.message}`);
                    console.trace(error);
                    res.status(500).end();
                }


            }

            if (event.data.object.status === "succeeded") {

               
                try {

                    transporter.use('compile', hbs(options));

                    const contexte = {
                        nom: theClient.nomFamille,
                        prenom: theClient.prenom,
                        email: theClient.email,
                        refCommande: refCommandeOk.reference,
                        statutCommande: refCommandeOk.idCommandeStatut,
                        dateAchat: formatLong(refCommandeOk.dateAchat),
                        montant: metadata.montant,
                        derniersChiffres: thePaiement.derniersChiffres,
                        moyenPaiement: thePaiement.moyenPaiement,
                        moyenPaiementDetail: thePaiement.moyenPaiementDetail,
                        methode:thePaiement.methode,
                        montantPaiement: thePaiement.montant,
                    }

                    // l'envoie d'email définit par l'object "transporter"
                    if (adminsMail !== null) {

                        for (const admin of adminsMail) {

                            //Ici je dois ajouter dans l'objet contexte, le prenom des admin, pour un email avec prenom personalisé !
                            contexte.adminPrenom = admin.prenom;

                            const info2 = await transporter.sendMail({
                                from: process.env.EMAIL, //l'envoyeur
                                to: admin.email,
                                subject: `Mise a jour des données d'un remboursement STRIPE pour la commande n° ${refCommandeOk.reference} concernant le client ${theClient.prenom} ${theClient.nomFamille} (${theClient.email})  ✅ `, // le sujet du mail
                                text: `Bonjour cher Administrateur, une mise a jour des données de remboursement est apparu pour la commande client n° ${refCommandeOk.reference} !`,
                                template: 'updateRemboursement',
                                context: contexte,

                            });
                            console.log(`Un email d'information d'une mise a jour de remboursement à bien été envoyé a ${admin.email} : ${info2.response}`);
                        }
                    }

                     //Envoie d'email sur le mail présent dans la table "Shop".
                     const info = await transporter.sendMail({
                        from: process.env.EMAIL, //l'envoyeur
                        to: shop.emailContact,
                        subject: `Mise a jour des données d'un remboursement STRIPE pour la commande n° ${refCommandeOk.reference} concernant le client ${theClient.prenom} ${theClient.nomFamille} (${theClient.email})  ✅ `, // le sujet du mail
                        text: `Bonjour cher Administrateur, une mise a jour des données de remboursement est apparu pour la commande client n° ${refCommandeOk.reference} !`,
                        template: 'updateRemboursement',
                        context: contexte,

                    });
                    console.log(`Un email d'information d'une mise a jour de remboursement à bien été envoyé a ${shop.emailContact} : ${info.response}`);

                } catch (error) {
                    console.log(`Erreur dans la méthode d'envoie d'un mail aux admins aprés und  mise a jour des données de remboursement dans la methode webhookRefundFAIL du paiementController : ${error.message}`);
                    console.trace(error);
                    res.status(500).end();
                }


            }

            return res.status(200).end();
        } catch (error) {
            console.trace('Erreur dans la méthode webhookrefundUpdate du paiementController :',
                error);
            res.status(500).end();
        }
    },

    webhookRefund: async (req, res) => {

        try {
            //je verifis la signature STRIPE et je récupére la situation du refund.
            const sig = req.headers['stripe-signature'];

            let event;

            try {
                event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecretrefund);
            } catch (err) {
                return res.status(400).json(`WebhookRefund erreur de la récupération de l'event: ${err.message}`);

            }
            const metadata = event.data.object.refunds.data[0].metadata;

            let refCommandeOk;
            try {
                refCommandeOk = await Commande.findByRefCommande(metadata.refCommande);
            } catch (error) {
                console.log("Erreur dans le try catch de récupération de la commande dans la méthode refund du PaiementController !", error);
                return res.status(500).end();
            }


            // j'update le statut de la commande a rembourséé !
            try {
                const updateStatus = new Commande({
                    idCommandeStatut: 7, // id = 7 => statut "Remboursée"
                    id: refCommandeOk.id
                })
                await updateStatus.updateStatutCommande();
                console.log("Remboursement bien éfféctué, commande mise a jour ");

            } catch (error) {
                console.log("Erreur dans le try catch d'update du statut de la commande dans la méthode weghookRefund du PaiementController !", error);
                return res.status(500).end();
            }

            // J'envoie un mail confirmant le remboursement 
            try {

                transporter.use('compile', hbs(options));

                // je récupére les infos du client pour l'envoi du mail.
                let theClient;
                let thePaiement;
                let shop;

                try {
                    //TODO 
                    //faire une vue pour ces type d'infos reliées ?
                    theClient = await Client.findOne(metadata.idClient);
                    thePaiement = await Paiement.findByIdCommande(metadata.idCommande);
                    shop = await Shop.findOne(1); // les données du premier enregistrement de la table shop... Cette table a pour vocation un unique enregistrement...

                } catch (error) {
                    console.log(`Erreur dans la méthode de recherche d'information (client / paiement / shop) aprés remboursement dans la methode webhookRefund du paiementController : ${error.message}`);
                    console.trace(error);
                    res.status(500).end();
                }


                const contexte = {
                    nom: theClient.nomFamille,
                    prenom: theClient.prenom,
                    email: theClient.email,
                    refCommande: refCommandeOk.reference,
                    statutCommande: refCommandeOk.statut,
                    dateAchat: formatLongSansHeure(refCommandeOk.dateAchat),
                    montant: metadata.montant,
                    shopNom: shop.nom,
                    derniersChiffres: thePaiement.derniersChiffres,
                    moyenPaiement: thePaiement.moyenPaiement,
                    moyenPaiementDetail: thePaiement.moyenPaiementDetail,
                }

                // l'envoie d'email définit par l'object "transporter"
                const info = await transporter.sendMail({
                    from: process.env.EMAIL, //l'envoyeur
                    to: theClient.email,
                    subject: `Votre remboursement sur le site d'artisanat Malgache ${shop.nom} a bien été éffectué ✅ `, // le sujet du mail
                    text: `Bonjour ${theClient.prenom} ${theClient.nomFamille}, nous vous confirmons le remboursement de votre commande n°${metadata.refCommande} effectué sur le site ${shop.nom}. La somme de ${metadata.montant}€ seront recréditté sur votre moyen de paiement utilisé lors de l'achat.`,
                    /* attachement:[
                        {filename: 'picture.JPG', path: './picture.JPG'}
                    ] */
                    template: 'apresRemboursement',
                    context: contexte,

                });
                console.log(`Un email de confirmation de remboursement à bien été envoyé a ${theClient.prenom} ${theClient.nomFamille} via l'adresse email: ${theClient.email} : ${info.response}`);


            } catch (error) {
                console.log(`Erreur dans la méthode d'envoie d'un mail au client aprés remboursement dans la methode webhookRefund du paiementController : ${error.message}`);
                console.trace(error);
                res.status(500).end();
            }


            return res.status(200).end();


        } catch (error) {
            console.trace('Erreur dans la méthode webhookrefund du paiementController :',
                error);
            res.status(500).end();
        }
    },

    getAll: async (req, res) => {
        try {
            const paiements = await Paiement.findAll();

            res.status(200).json(paiements);
        } catch (error) {
            console.trace('Erreur dans la méthode getAll du paiementController :',
                error);
            res.status(500).json(error.message);
        }
    },


    getOne: async (req, res) => {
        try {

            const paiement = await Paiement.findOne(req.params.id);
            res.json(paiement);

        } catch (error) {
            console.trace('Erreur dans la méthode getOne du paiementController :',
                error);
            res.status(500).json(error.message);
        }
    },



    getByIdCommande: async (req, res) => {
        try {

            const paiement = await Paiement.findByIdCommande(req.params.id);
            res.json(paiement);

        } catch (error) {
            console.trace('Erreur dans la méthode getByIdCommande du paiementController :',
                error);
            res.status(500).json(error.message);
        }
    },





    new: async (req, res) => {
        try {

            const data = {};

            data.reference = req.body.reference;
            data.methode = req.body.methode;
            data.montant = req.body.montant;
            data.idCommande = req.body.idCommande;


            const newPaiement = new Paiement(data);
            await newPaiement.save();
            res.json(newPaiement);
        } catch (error) {
            console.log(`Erreur dans la méthode new du paiementController : ${error.message}`);
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

            const updatePaiement = await Paiement.findOne(id);


            const reference = req.body.reference;
            const methode = req.body.methode;
            const montant = req.body.montant;
            const idCommande = req.body.idCommande;


            let message = {};

            if (reference) {
                updatePaiement.reference = reference;
                message.reference = 'Votre nouveau reference a bien été enregistré ';
            } else if (!reference) {
                message.reference = 'Votre reference n\'a pas changé';
            }


            if (methode) {
                updatePaiement.methode = methode;
                message.methode = 'Votre nouveau methode a bien été enregistré ';
            } else if (!methode) {
                message.methode = 'Votre nom de methode n\'a pas changé';
            }


            if (montant) {
                updatePaiement.montant = montant;
                message.montant = 'Votre nouveau montant a bien été enregistré ';
            } else if (!montant) {
                message.montant = 'Votre montant n\'a pas changé';
            }


            if (idCommande) {
                updatePaiement.idCommande = idCommande;
                message.idCommande = 'Votre nouveau idCommande a bien été enregistré ';
            } else if (!idCommande) {
                message.idCommande = 'Votre idCommande n\'a pas changé';
            }

            await updatePaiement.update();

            res.json(message);

        } catch (error) {
            console.log(`Erreur dans la methode update du paiementController ${error.message}`);
            res.status(500).json(error.message);
        }
    },




    delete: async (req, res) => {

        try {

            const paiementInDb = await Paiement.findOne(req.params.id);

            const paiement = await paiementInDb.delete();

            res.json(paiement);

        } catch (error) {
            console.trace('Erreur dans la méthode delete du paiementController :',
                error);
            res.status(500).json(error.message);
        }
    },


    deleteByIdCommande: async (req, res) => {

        try {

            const paiementsInDb = await Paiement.findByIdCommande(req.params.id);
            const arrayDeleted = [];
            for (const paiementInDb of paiementsInDb) {

                const paiementHistoConn = await paiementInDb.deleteByIdCommande();
                arrayDeleted.push(paiementHistoConn);
            }


            res.json(arrayDeleted[0]);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteUByIdPaiement du paiementController :',
                error);
            res.status(500).json(error.message);
        }
    },


}

module.exports = paiementController;