const Paiement = require('../models/paiement');
const Adresse = require('../models/adresse');
const Commande = require('../models/commande');
const StatutCommande = require('../models/statutCommande');
const LigneCommande = require('../models/ligneCommande');
const Transporteur = require('../models/transporteur');
const Shop = require('../models/shop');
const Twillio = require('../models/twillio');
const Stock = require('../models/stock');

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
const AdminPhone = require('../models/adminPhone');
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


    //STRIPE processus complet = https://stripe.com/docs/connect/collect-then-transfer-guide?platform=web 
    // comprendre les différent type de paiement sur STRIP : https://stripe.com/docs/payments/payment-intents/migration/charges 
    // API PaymentIntent a privilégier sur API Charge !
    paiement: async (req, res) => {
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
                    statement_descriptor: 'Madagascar Shop', //22 caractéres . si mis en dynamique, concaténer au prefix du libellé dans le dashboard 
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

            //ici désormais, l'objet paiementIntent contient la clé secrete "secret_client" qui est passé au front via la route /user/paiementkey
            // Pour la récupérer en Front :

            /* const response = fetch('/v1/user/paiementkey').then(function(response) {
              return response.json();
            }).then(function(responseJson) {
             const clientSecret = responseJson.client_secret;
              // Call stripe.confirmCardPayment() with the client secret.
            }); */



            console.log("la clé secrete a bien été envoyé en session !");

            res.status(200).end();


        } catch (error) {
            const errorMessage = process.env.NODE_ENV === 'production' ?
                'Erreur serveur.' :
                `Erreur dans la méthode paiement du paiementController : ${error.message})`


            res.status(500).json(errorMessage);
            console.trace(error);
        }

    },


    //NOTE 
    //! EDIT 
    //! Pas besoin de faire appel a la methode paymentIntents.confirm dans le back (qui nécéssite un paymentMethod que je n'ai pas encore!), si on passe en front par la méthode stripe.confirmCardPayment, qui devrait confirmer automatiquement le paymentIntent 
    // https://stripe.com/docs/js/payment_methods/create_payment_method et surtout : https://stripe.com/docs/js/payment_intents/confirm_card_payment


    // https://stripe.com/docs/connect/collect-then-transfer-guide?platform=web : 
    /* "To complete the payment when the user clicks, retrieve the client secret from the PaymentIntent you created in Step 3.1 and call stripe.confirmCardPayment with the client secret."" */


    //https://stripe.com/docs/ips  //https://stripe.com/docs/webhooks/signatures
    webhookpaiement: async (req, res) => {
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


            if (event.type === 'payment_intent.succeeded') {
                const paymentIntent = event.data.object;

                // un petit visuel sur mes metadata accesible :
                console.log("paiement bien validé ! paymentIntent. ==> ", paymentIntent.metadata);

                // Ici req.session ne vaut rien car c'est stripe qui contact ce endpoint. Je récupére donc la session pour savoir ce que le client vient de commander.
                // avec mes metadata passé a la création du payment intent
                sessionStore.get(paymentIntent.metadata.session, async function (err, session) {



                    /* session ==>> {
  cookie: {
    originalMaxAge: 1296000000,
    expires: '2021-09-19T19:04:12.044Z',
    secure: true,
    httpOnly: true,
    path: '/',
    sameSite: 'Strict'
  },
  user: {
    idClient: 101,
    prenom: 'leo',
    nomFamille: 'Pape',
    email: 'romain@boudet.me',
    privilege: 'Client'
  },
  cgv: 'true',
  cart: [
    {
      id: 1,
      produit: 'Refined Fresh Towels',
      prix: 38,
      image: 'http://placeimg.com/640/480',
      couleur: 'blanc',
      taille: 'S',
      stock: 4,
      reduction: null,
      tva: 0.05,
      quantite: 4,
      prixHTAvecReduc: 37.62
    },
    {
      id: 2,
      produit: 'Handcrafted Wooden Chicken',
      prix: 75,
      image: 'http://placeimg.com/640/480',
      couleur: 'bleu',
      taille: 'M',
      stock: 6,
      reduction: 0.01,
      tva: 0.05,
      quantite: 6,
      prixHTAvecReduc: 74.25
    }
  ],
  totalHT: 595.98,
  totalTTC: 625.78,
  totalTVA: 29.8,
  coutTransporteur: 0,
  totalStripe: 62578,
  idTransporteur: '3',
  IdPaymentIntentStripe: 'pi_3JW49rLNa9FFzz1X1PBWifo2',
  clientSecret: 'pi_3JW49rLNa9FFzz1X1PBWifo2_secret_R9CMOmjlhd0nR7CkGBYQsNfWK'
} */


                    try {

                        // ici j'ai accés a la session du user qui a passé commande !
                        //console.log("session ==>>", session);

                        //! je met a jour les stocks suite au produits achetés avec succés !!

                        for (const item of session.cart) {
                            console.log(`On met a jour les stock pour l'item ${item.produit}`);
                            const updateProduit = await Stock.findOne(item.id);
                            updateProduit.quantite -= item.quantite; //( updateProduit.quantite = updateProduit.quantite - item.quantite)
                            await updateProduit.update();
                            console.log("stock bien mis a jour");

                        }

                        //! insérer l'info en BDD dans la table commande !

                        const paymentData = await stripe.paymentMethods.retrieve(paymentIntent.payment_method);

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
                        const resultCommande = await newCommande.save();

                        console.log("resultCommande ==>> ", resultCommande);


                        //! Insérer l'info en BDD dabns la table paiement !

                        const dataPaiement = {};

                        const referencePaiement = `${paymentData.card.exp_month}${paymentData.card.exp_year}${paymentData.card.last4}.${session.user.idClient}.${session.totalStripe}.${formatJMAHMSsecret(new Date())}.${articlesBought}`
                        const methode = `moyen_de_paiement:${paymentData.type}/_marque:_${paymentData.card.brand}/_type_de_carte:_${paymentData.card.funding}/_pays_origine:_${paymentData.card.country}/_mois_expiration:_${paymentData.card.exp_month}/_annee_expiration:_${paymentData.card.exp_year}/_4_derniers_chiffres:_${paymentData.card.last4}`

                        dataPaiement.reference = referencePaiement;
                        dataPaiement.methode = methode;
                        dataPaiement.montant = session.totalTTC;
                        dataPaiement.idCommande = resultCommande.id;

                        const newPaiement = new Paiement(dataPaiement);
                        const resultpaiement = await newPaiement.save();

                        //console.log("resultpaiement ==>> ", resultpaiement);

                        //! Insérer l'info en BDD dabns la table ligne commande 


                        //Je boucle sur chaque produit commandé dans le cart...

                        for (const article of session.cart) {

                            const dataLigneCommande = {};
                            dataLigneCommande.quantiteCommande = article.quantite;
                            dataLigneCommande.idProduit = article.id;
                            dataLigneCommande.idCommande = resultCommande.id;

                            const newLigneCommande = new LigneCommande(dataLigneCommande);
                            const resultLigneCommande = await newLigneCommande.save();

                            //console.log("resultLigneCommande ==>> ", resultLigneCommande);
                        }

                        //! Envoyer un mail au client lui résumant le paiment bien validé, statut de sa commande et lui rappelant ses produits récemment achetés.

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

                        transporter.use('compile', hbs(options));

                        // je récupére les infos du transporteur choisi pour insérer les infos dans le mail.
                        const transporteurData = await Transporteur.findOne(session.idTransporteur);
                        const statutCommande = await StatutCommande.findOne(resultCommande.idCommandeStatut);

                        // Nombre de commande déja passé par ce client ?
                        const commandes = await Commande.findByIdClient(session.user.idClient);
                        const commandeLenght = commandes.length - 1; // on enléve la commande récente..

                        // car estimeArriveNumber (le délai) peut être une string ou un number...:/
                        let contexte;
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
                                montant: (session.totalStripe)/100,
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
                                montant: (session.totalStripe)/100,
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
                            subject: `Votre achat sur le site d'artisanat Malgache ✅ `, // le sujet du mail
                            text: `Bonjour ${session.user.prenom} ${session.user.nomFamille}, nous vous remercions de votre commande.`,
                            /* attachement:[
                                {filename: 'picture.JPG', path: './picture.JPG'}
                            ] */
                            template: 'apresAchat',
                            context: contexte,

                        });
                        console.log(`Un email de confirmation d'achat à bien envoyé a ${session.user.prenom} ${session.user.nomFamille} via l'adresse email: ${session.user.email} : ${info.response}`);


                        //! Envoyer un mail a l'admin lui informant d'une nouvelle commande, lui résumant le paiment bien validé, lui rappelant les produit a emballé et l'adresse d'expéditeur !.

                        const shop = await Shop.findOne(1); // les données du premier enregistrement...

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


                        //! Envoyer un sms a l'admin (numéro dans la table Twilio), si il a choisi l'option "recevoir un sms a chaque commande" lui informant d'une nouvelle commande, lui résumant le paiment bien validé, lui rappelant les produit a emballé et l'adresse d'expéditeur !.
                        // produit, quantité, adresse, transporteur.

                        //Faire une méthode dans le model qui ne prend que les numéros de tel avec new_sms_commande a true.
                        // Envoyer un sms sur chacun d'eux !!

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


                        //! Je modifie la session et supprime le panier pour que l'utilisateur puisse éffectuer une autre commande / paiement aprés. 
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
                        console.log(`Erreur dans la méthode d'insertion de la commande / paiement / ligne commande / envoi mail et sms du Webhook du paiementController : ${error.message}`);
                        console.trace(error);
                        res.status(500).end();
                    }


                });






                // TODO 

                //NOTE  => supression de req.session.cart aprés achat ??
                // Envoyer un sms pour dire qu'une nouvelle commande a bien été saisi (ou aprés la commande)
                // Envoyer un mail au client lui résumant le paiment bien validé, statut de sa commande et lui rappelant ses produit.
                // Faire la méthode "Recevoir un sms m'avertissant de l'envoi de ma commande en temps réel ?"
                // écrire une facture!
                // supprimer les articles dans req.session.cart quand plus besoin !

                // Gére tous les cas de figures ou se passe mal ! Envoyez un e-mail ou une notification Push pour demander au client d’essayer un autre moyen de paiement.
                // permettre un nouveau paiement dans tous les cas nécéssaire
                // autorisation d'ip pour webhook https://stripe.com/docs/ips 
                // Permettre d'autre mode de paiement, virement et paypal ? puis google pay apple pay et un truc chinois !


                //! ==>> Prendre en charge tous les cas un webhook peut être appelé : https://stripe.com/docs/api/events/types 
                //payment_intent.payment_failed
                //payment_intent.canceled
                //payment_intent.processing
                //payment_intent.processing
                //payment_intent.succeeded
                //info aussi quand on configure les retours d'infos des webhooks

                /* const dataTwillio = await Twillio.findFirst();
                const twilio = require('twilio')(dataTwillio.accountSid, dataTwillio.authToken);
                if (!(validator.isMobilePhone(dataTwillio.twillioNumber, 'en-GB', {
                        strictMode: true
                    }) && validator.isMobilePhone(dataTwillio.devNumber, 'fr-FR', {
                        strictMode: true
                    }))) {
                    return res.status(404).json('Votre numéro de téléphone ne correspond pas au format souhaité !')
                }
                twilio.messages.create({
                    body: `Votre commande contenant : ${event.data.object.metadata.articles} pour un montant total de ${event.data.object.metadata.amount_received}, a bien été validé !  `,
                    from: dataTwillio.twillioNumber,
                    to: dataTwillio.devNumber,

                }) */


                return res.status(200).end();
            } else {

                message = {
                    message: "erreur lors du paiement!"
                };

                return res.status(200).json(event.type);
            }



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
                client_secret: "pi_3JWthiLNa9FFzz1X1jgy3TMu_secret_HnyLbRQ7zJDrA8Z4llQtxuMrl",
            });


        } catch (error) {
            const errorMessage = process.env.NODE_ENV === 'production' ?
                'Erreur serveur.' :
                `Erreur dans la méthode key du paiementController : ${error.message})`;

            res.status(500).json(errorMessage);
            console.trace(error);
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