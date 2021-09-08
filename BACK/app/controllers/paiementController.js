const Paiement = require('../models/paiement');
const Adresse = require('../models/adresse');
const Commande = require('../models/commande');
const StatutCommande = require('../models/statutCommande');
const LigneCommande = require('../models/ligneCommande');
const Transporteur = require('../models/transporteur');
const Shop = require('../models/shop');
const Twillio = require('../models/twillio');
const Stock = require('../models/stock');
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
} = require('../services/date');

const {
    adresseEnvoieFormatHTML,
    adresseEnvoieFormat
} = require('../services/adresse');

const validator = require('validator');

const stripe = require('stripe')(process.env.STRIPE_TEST_KEY);
const endpointSecret = process.env.SECRETENDPOINT;
const redis = require('../services/redis');

const path = require('path');
const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const smsChoiceSchema = require('../schemas/smsChoiceSchema');
const helpers = require('handlebars-helpers')();




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

                req.session.IdPaymentIntentStripe = paymentIntent.id;
                req.session.clientSecret = paymentIntent.client_secret;



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


    //NOTE 
    //! Pas besoin de faire appel a la methode paymentIntents.confirm dans le back (qui nécéssite un paymentMethod que je n'ai pas encore!), si on passe en front par la méthode stripe.confirmCardPayment, qui devrait confirmer automatiquement le paymentIntent 
    // https://stripe.com/docs/js/payment_methods/create_payment_method et surtout : https://stripe.com/docs/js/payment_intents/confirm_card_payment
    // https://stripe.com/docs/connect/collect-then-transfer-guide?platform=web : 
    /* "To complete the payment when the user clicks, retrieve the client secret from the PaymentIntent you created in Step 3.1 and call stripe.confirmCardPayment with the client secret."" */
    //https://stripe.com/docs/ips  //https://stripe.com/docs/webhooks/signatures

    //! pour tester : https://stripe.com/docs/testing 
    // Numéro carte avec 3D secure => 4000002760003184



    webhookpaiementCB: async (req, res) => {
        try {

            //https://stripe.com/docs/webhooks/build
            //https://stripe.com/docs/api/events/types 

            //je verifis la signature STRIPE et je récupére la situation du paiement.
            const sig = req.headers['stripe-signature'];

            let event;

            try {
                event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
            } catch (err) {
                return res.status(400).json(`Webhook erreur de la récupération de l'event: ${err.message}`);

            }

            const paymentIntent = event.data.object;

            // Ici req.session ne vaut rien car c'est stripe qui contact ce endpoint. Je récupére donc la session pour savoir ce que le client vient de commander.
            // avec mes metadata passé a la création du payment intent
            sessionStore.get(paymentIntent.metadata.session, async function (err, session) {

                // ici j'ai accés a la session du user qui a passé commande !

                //Si le paiement à bien été effectué :
                if (event.type === 'payment_intent.succeeded' && event.data.object.amount_received === session.totalStripe) {


                    // un petit visuel sur mes metadata accesible :
                    //console.log("paiement bien validé !  ==> paymentIntent.metadata", paymentIntent.metadata);

                    try {


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
                        let paymentData;
                        let resultCommande;
                        let articlesBought;

                        try {
                            // je récupére les infos de la CB
                            paymentData = await stripe.paymentMethods.retrieve(paymentIntent.payment_method);

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

                        //! Insérer l'info en BDD dabns la table paiement !
                        try {
                            const dataPaiement = {};
                            const referencePaiement = `${paymentData.card.exp_month}${paymentData.card.exp_year}${paymentData.card.last4}.${session.user.idClient}.${session.totalStripe}.${formatJMAHMSsecret(new Date())}.${articlesBought}`
                            const methode = `moyen_de_paiement:${paymentData.type}/_marque:_${paymentData.card.brand}/_type_de_carte:_${paymentData.card.funding}/_pays_origine:_${paymentData.card.country}/_mois_expiration:_${paymentData.card.exp_month}/_annee_expiration:_${paymentData.card.exp_year}/_4_derniers_chiffres:_${paymentData.card.last4}`

                            dataPaiement.reference = referencePaiement;
                            dataPaiement.methode = methode;
                            dataPaiement.montant = session.totalTTC;
                            dataPaiement.idCommande = resultCommande.id;

                            const newPaiement = new Paiement(dataPaiement);
                            await newPaiement.save();


                        } catch (error) {
                            console.log(`Erreur dans la méthode d'insertion du paiement dans la methode Webhook du paiementController : ${error.message}`);
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
                                resultLigneCommande = await newLigneCommande.save();

                            }
                        } catch (error) {
                            console.log(`Erreur dans la méthode d'insertion des ligne de commandes dans la methode Webhook du paiementController : ${error.message}`);
                            console.trace(error);
                            res.status(500).end();
                        }


                        //! Envoyer un mail au client lui résumant le paiment bien validé, statut de sa commande et lui rappelant ses produits récemment achetés.
                        let transporter;
                        let transporteurData;
                        let statutCommande;
                        let contexte;
                        try {
                            //Sendgrid ou MailGun serait préférable en prod...
                            //https://medium.com/how-tos-for-coders/send-emails-from-nodejs-applications-using-nodemailer-mailgun-handlebars-the-opensource-way-bf5363604f54
                            transporter = nodemailer.createTransport({
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

                            transporter.use('compile', hbs(options));

                            // je récupére les infos du transporteur choisi pour insérer les infos dans le mail.
                            transporteurData = await Transporteur.findOne(session.idTransporteur);
                            statutCommande = await StatutCommande.findOne(resultCommande.idCommandeStatut);

                            // Nombre de commande déja passé par ce client ?
                            const commandes = await Commande.findByIdClient(session.user.idClient);
                            const commandeLenght = commandes.length - 1; // on enléve la commande récente..

                            // car estimeArriveNumber (le délai) peut être une string ou un number...:/
                            if (Number(session.idTransporteur) === 3) {
                                contexte = {
                                    commandeLenght,
                                    nom: session.user.nomFamille,
                                    prenom: session.user.prenom,
                                    email: session.user.email,
                                    refCommande: resultCommande.reference,
                                    statutCommande: statutCommande.statut,
                                    nomTransporteur: transporteurData.nom,
                                    idTransporteur: Number(session.idTransporteur),
                                    delai: transporteurData.estimeArriveNumber, // ici une string et non un number...
                                    adresse: await adresseEnvoieFormat(session.user.idClient),
                                    montant: (session.totalStripe) / 100,
                                    marqueCB: paymentData.card.brand,
                                    dataArticles: session.cart,
                                    commentaire: resultCommande.commentaire,
                                    sendSmsWhenShipping: session.sendSmsWhenShipping,

                                }
                            } else {
                                contexte = {
                                    commandeLenght,
                                    nom: session.user.nomFamille,
                                    prenom: session.user.prenom,
                                    email: session.user.email,
                                    refCommande: resultCommande.reference,
                                    statutCommande: statutCommande.statut,
                                    nomTransporteur: transporteurData.nom,
                                    idTransporteur: Number(session.idTransporteur),
                                    delai: capitalize(formatLongSansHeure(dayjs().add(transporteurData.estimeArriveNumber,
                                        'day'))),
                                    adresse: await adresseEnvoieFormat(session.user.idClient),
                                    montant: (session.totalStripe) / 100,
                                    marqueCB: paymentData.card.brand,
                                    dataArticles: session.cart,
                                    commentaire: resultCommande.commentaire,
                                    sendSmsWhenShipping: session.sendSmsWhenShipping,
                                }
                            }

                            // l'envoie d'email définit par l'object "transporter"
                            const info = await transporter.sendMail({
                                from: process.env.EMAIL, //l'envoyeur
                                to: session.user.email,
                                subject: `Votre commande sur le site d'artisanat Malgache ✅ `, // le sujet du mail
                                text: `Bonjour ${session.user.prenom} ${session.user.nomFamille}, nous vous remercions de votre commande.`,
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
                            const shop = await Shop.findOne(1); // les données du premier enregistrement de la table shop... Cette table a pour vocation un unique enregistrement...
                            // Je rajoute une clé pour des mails avec le nom de la boutique présent dans la table shop.
                            contexte.shopNom = shop.nom;

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

                                }


                            });
                        } catch (error) {
                            console.log(`Erreur dans le try catch du virement STRIPE dans la methode Webhook du paiementController : ${error.message}`);
                            console.trace(error);
                            res.status(500).end();
                        }


                        //! Je modifie la session et supprime le panier pour que l'utilisateur puisse éffectuer une autre commande / paiement sans devoir se reconnecter. 
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

                    } catch (error) {
                        console.log(`Erreur dans la méthode du Webhook du paiementController : ${error.message}`);
                        console.trace(error);
                        res.status(500).end();
                    }


                    // TODO 
                    // écrire une facture!

                    // permettre un nouveau paiement dans tous les cas nécéssaire
                    // Permettre d'autre mode de paiement, virement et paypal ? puis google pay apple pay et un truc chinois !

                    return res.status(200).end();


                }


                // Je fais le choix de garder en session les données du panier même si le paiement n'aboutit pas, pour pouvoir tester un nouveau paiement, ou un paiement avec un autre moyen.

                //! CODE DE REFUS DE PAIEMENT !
                //https://stripe.com/docs/declines/codes 

                //! APRES LE PAIEMENT : 
                //https://stripe.com/docs/payments/after-the-payment 


                /* outcome ==>>  {
                                    network_status: 'declined_by_network',
                                    reason: 'insufficient_funds',
                                    risk_level: 'normal',
                                    risk_score: 25,
                                    seller_message: 'The bank returned the decline code `insufficient_funds`.',
                                    type: 'issuer_declined'
                                } */
                else {

                    const declineCode = event.data.object.charges.data[0].outcom.reason;
                    const message = {
                        code_error: declineCode,
                        network_status: event.data.object.charges.data[0].outcom.network_status,
                        seller_message: event.data.object.charges.data[0].outcom.seller_message,
                    };

                    switch (declineCode) {

                        case 'authentication_required':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte bancaire a été refusée, car la transaction nécessite une authentification. Essayer de relancer le paiement et d'authentifier votre carte bancaire lorsque vous y serez invité. Si vous recevez ce code de refus de paiement aprés une transaction authentifiée, contacter votre banque pour en savoir plus."
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'approve_with_id':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Il n’est pas possible d’autoriser le paiement. Vous pouvez retenter le paiement. S’il ne peut toujours pas être traité, vous pouvez contacter votre banque."
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'call_issuer':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte a été refusée pour une raison inconnue. Contacter votre banque pour en savoir plus."
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'card_not_supported':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Ce type d’achat n’est pas pris en charge par cette carte bancaire. Contacter votre banque pour en savoir plus."
                            console.log(message);
                            res.status(404).json(message);
                            break;
                        case 'card_velocity_exceeded':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Le client a dépassé le solde ou la limite de crédit disponible sur sa carte bancaire. Contacter votre banque pour en savoir plus."
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'currency_not_supported':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La devise spécifiée n’est pas prise en charge par cette carte bancaire. Contacter votre banque pour en savoir plus."
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'do_not_honor':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte a été refusée pour une raison inconnue. Contacter votre banque pour en savoir plus."
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'do_not_try_again':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte a été refusée pour une raison inconnue. Contacter votre banque pour en savoir plus."
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'duplicate_transaction':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Une transaction du même montant avec les mêmes informations de carte bancaire a été soumise tout récemment. Contacter votre banque pour en savoir plus."
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'expired_card':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte bancaire a expiré. Merci d'utiliser une autre carte bancaire. Contacter votre banque pour en savoir plus."
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'fraudulent':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Le paiement a été refusé car il a été identifié comme potentiellement frauduleux. Contacter votre banque pour en savoir plus."
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'incorrect_number':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Le numéro de carte bancaire est erroné. Merci de réessayer avec le bon numéro de carte bancaire."
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'incorrect_cvc':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Le code CVC est erroné. Merci de réessayer avec le bon CVC."
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'insufficient_funds':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte bancaire ne dispose pas de fonds suffisants pour effectuer l’achat. Merci d'utiliser un autre moyen de paiement."
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'incorrect_zip':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Le code postal est erroné. Merci de réessayer avec le bon code postal."
                            console.log(message);
                            res.status(404).json(message);
                            break;


                        case 'invalid_amount':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Le montant du paiement n’est pas valide ou dépasse le montant autorisé par l’émetteur de la carte . Contacter votre banque pour en savoir plus."
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'invalid_cvc':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Le code CVC est erroné. Merci de réessayer avec le bon CVC."
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'invalid_account':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte bancaire, ou le compte auquel elle est connectée, n’est pas valide. Contacter votre banque pour en savoir plus."
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'invalid_expiry_month':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Le mois d’expiration n’est pas valide.	Merci de réessayer avec la bonne date d’expiration."
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'invalid_expiry_year':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. L’année d’expiration n’est pas valide.	Merci de réessayer avec la bonne date d’expiration."
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'invalid_number':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Le numéro de carte bancaire est erroné. Merci de réessayer avec le bon numéro de carte bancaire."
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'issuer_not_available':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Il n’est pas possible de joindre l’émetteur de la carte, donc d’autoriser le paiement."
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'lost_card':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Le paiement a été refusé, car la carte bancaire a été déclarée perdue."
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'merchant_blacklist':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte a été refusée pour une raison inconnue. Contacter votre banque pour en savoir plus."
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'new_account_information_available':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte bancaire, ou le compte auquel elle est connectée, n’est pas valide. Contacter votre banque pour en savoir plus."
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'no_action_taken':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte a été refusée pour une raison inconnue. Contacter votre banque pour en savoir plus."
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'not_permitted':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Le paiement n’est pas autorisé. Contacter votre banque pour en savoir plus."
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'offline_pin_required':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte a été refusée, car un code PIN est requis. Contacter votre banque pour en savoir plus."
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'online_or_offline_pin_required':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte a été refusée, car un code PIN est requis. Contacter votre banque pour en savoir plus."
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'pickup_card':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte ne peut pas être utilisée pour effectuer ce paiement (il est possible qu’elle ait été déclarée perdue ou volée). Contacter votre banque pour en savoir plus."
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'pin_try_exceeded':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Le nombre de tentatives autorisées de saisie du code PIN a été dépassé."
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'processing_error':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Une erreur s’est produite lors du traitement de la carte bancaire. Vous pouvez retenter le paiement. Contacter votre banque pour en savoir plus."
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'reenter_transaction':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Le paiement n’a pas pu être traité par l’émetteur de la carte pour une raison inconnue. Vous pouvez retenter le paiement. "
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'restricted_card':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte ne peut pas être utilisée pour effectuer ce paiement (il est possible qu’elle ait été déclarée perdue ou volée). Contacter votre banque pour en savoir plus."
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'revocation_of_all_authorizations':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte a été refusée pour une raison inconnue. Contacter votre banque pour en savoir plus."
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'revocation_of_authorization':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte a été refusée pour une raison inconnue. Contacter votre banque pour en savoir plus."
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'security_violation':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte a été refusée pour une raison inconnue. Contacter votre banque pour en savoir plus."
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'service_not_allowed':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte a été refusée pour une raison inconnue. Contacter votre banque pour en savoir plus."
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'stolen_card':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Le paiement a été refusé, car la carte bancaire a été déclarée volée."
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'stop_payment_order':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte a été refusée pour une raison inconnue. Contacter votre banque pour en savoir plus."
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'testmode_decline':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte utilisée est une carte de test. Utilisez une véritable carte bancaire pour effectuer le paiement"
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'transaction_not_allowed':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte a été refusée pour une raison inconnue. Contacter votre banque pour en savoir plus."
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'try_again_later':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte a été refusée pour une raison inconnue. Merci de retenter le paiement"
                            console.log(message);
                            res.status(404).json(message);
                            break;

                        case 'withdrawal_count_limit_exceeded':
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Vous avez dépassé le solde ou la limite de crédit disponible sur votre carte bancaire. Merci d'utiliser un autre moyen de paiement"
                            console.log(message);
                            res.status(404).json(message);
                            break;


                        default:
                            message.info = "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte a été refusée pour une raison inconnue. Contacter votre banque pour en savoir plus."
                            console.log(message);
                            res.status(404).json(message);
                    }

                }

            });

        } catch (error) {
            const errorMessage = process.env.NODE_ENV === 'production' ?
                'Erreur serveur.' :
                `Erreur dans la méthode paiement du paiementController : ${error.message})`

            res.status(500).json(errorMessage);
            console.trace(error);
        }

    },


    // Méthode pour envoyer au front la clé secréte !
    key: async (req, res) => {
        try {


            //simple rappel si j'oubli le MW d'autorisation client... a enlever en prod peut être..

            //TODO 
            //valeur décpmmenté aprés test 
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
                client_secret: "pi_3JXFfRLNa9FFzz1X11Z28QuH_secret_Fm43nor4tE1MhEQ6mIEhZrkeL",
            });


        } catch (error) {
            const errorMessage = process.env.NODE_ENV === 'production' ?
                'Erreur serveur.' :
                `Erreur dans la méthode key du paiementController : ${error.message})`;

            res.status(500).json(errorMessage);
            console.trace(error);
        }
    },

    balanceStripe: async (req, res) => {
        try {

            stripe.balance.retrieve(function (err, balance) {
                // asynchronously called
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