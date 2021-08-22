const Paiement = require('../models/paiement');
const Adresse = require('../models/adresse');
const Shop = require('../models/shop');
const Twillio = require('../models/twillio');
const Stock = require('../models/stock');


const {
    formatLong
} = require('../services/date');
const validator = require('validator');




const stripe = require('stripe')(process.env.STRIPE_TEST_KEY);
const endpointSecret = process.env.SECRETENDPOINT;
const redis = require('../services/redis');



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
            console.log("req.session a l'entrée des cgv ==> ", req.session);
            // console.log(req.session.user.cgv);

            /*  if (req.session.user === undefined) {
                 req.session.cgv = 'true'

             } */
            if (req.session.user !== undefined && req.session.user.cgv === 'true') {
                console.log("Les Conditions Générales de Ventes ont déja été accéptés.")
                return res.status(200).json("Les Conditions Générales de Ventes ont déja été accéptés.")
            } else(
                req.session.cgv = 'true')

            console.log("req.session a la sortie des cgv ==> ", req.session);


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

            // Méthode a metre en lien avec le bouton "payer votre commande" avant que l'utilisateur ne choissise son mode de paiement.

            // Quand il sera pret a payer et qu'il choisira son mode de paiement, alors le bouton "payer par carte bancaire" devra être lié a la méthode du "confirmPaiement" qui suit cette méthode.


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
            req.session.cart.map(article => (`${articles.push(article.produit+' / ' + 'idArticle = ' + '' + ' prix HT avec reduction: '+article.prixHTAvecReduc+'€'+' / '+' Qte: '+article.quantite)}`));
            articlesBought = articles.join(', ');

            //Je vérifie si le client est déja venu tenter de payer sa commande
            if (req.session.IdPaymentIntentStripe) {
                //Si oui, je met a jour le montant dans l'objet payementIntent qui existe déja, via la méthode proposé par STRIPE
                //https://stripe.com/docs/api/payment_intents/update?lang=node

                await stripe.paymentIntents.update(
                    req.session.IdPaymentIntentStripe, {
                        metadata: {
                            articles: articlesBought
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
                        ip: req.ip,
                    },


                });
                // On insére la clé secrete en session pour pouvoir l'envoyer sur la route /user/paiementkey
                //TODO 
                //bien pensé a supprimé cette donnée en session quand le webhook de stripe confirm le paiement 
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

                console.log("paiement bien validé !");

                // Supprimer le client secret en session
                req.session.IdPaymentIntentStripe = false;
                req.session.clientSecret = false;


                //Mise a jour des stocks
                //Toutes les valeurs de quantité dans req.session.cart devront être intégrer a la table stock pour chaque produit.
                console.log("req.session ==> ", req.session);
                console.log("req.session.cart ==> ", req.session.cart);
                console.log("event ==> ", event.data.object.metadata);

                //BUG
                //ici ça renvoie depuis stripe, et non depuis un user, req.session est vide !!!
                // Idée de solution => faire on objet plus propre pour les métadata envoyé reprenant toutes les infos du session.cart.
                // du genre :
                /* const  metadata = {
                     article:{prixHT: 20, id: 52, couleur:"rouge", taille:"L", quantite:2, prixHTAvecReduc:20 },
                     article2:{prixHT: 14, id: 57, couleur:"vert", taille:"S", quantite:1, prixHTAvecReduc:18 }
                } */
                // ou je peux retrouver facilement toutes ces données !
                //NOTE
                //Ou je calle la session dans REDIS pour la reprendre ici facilement !!


                const cart = req.session.cart;

                for (const item in cart) {
                    console.log(`On met a jour les stock pour l'item ${item.produit}`);
                    const updateProduit = await Stock.findOne(item.id);
                    updateProduit.quantite -= item.quantite; //( updateProduit.quantite = updateProduit.quantite - item.quantite)
                    await updateProduit.update();
                    console.log("stock bien mis a jour");

                }
                /* cart: [
                    {
                      id: 250,
                      produit: 'Handmade Cotton Keyboard',
                      prix: 27,
                      image: 'http://placeimg.com/640/480',
                      couleur: 'blanc',
                      taille: 'XS',
                      stock: 2,
                      reduction: 0.28,
                      tva: 0.05,
                      quantite: 1,
                      prixHTAvecReduc: 19.44
                    }
                  ],
                  totalHT: 19.44,
                  totalTTC: 20.41,
                  totalTVA: 0.97, */

                // TODO 
                // Envoyer un sms pour dire qu'une nouvelle commande a bien été saisi (ou aprés la commande)
                // Envoyer un mail au client lui résumant le paiment bien validé, statut de sa commande et lui rappelant ses produit.
                // Faire la méthode "Recevoir un sms m'avertissant de l'envoi de ma commande en temps réel ?"
                // insérer l'info en BDD dans la table commande !
                // Insérer l'info en BDD dabns la table ligne commande 
                // passer le statut de la commande a "paiement vérifié" ou du genre..
                // écrire une facture!
                // supprimer les articles dans req.session.cart quand plus besoin !

                // Gére tous les cas de figures ou se passe mal !
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


                return res.status(200).json(paymentIntent);
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
            if (!req.session) {
                return res.status(401).json("Merci de vous authentifier avant d'accéder a cette ressource.");
            }

            /* if (req.session.IdPaymentIntentStripe === undefined || req.session.clientSecret === undefined) {
                return res.status(404).json("Merci de réaliser une tentative de paiement avant d'accéder a cette ressource.");

            } */
            else {
                console.log(`on a bien délivré la clé au front : ${req.session.clientSecret}`)
                return res.status(200).json({
                    client_secret: "pi_3JR5cLLNa9FFzz1X1JlAgl3C_secret_jlGTGFKIS4pLBpZ9ny25Ia2Ui" //!req.session.clientSecret
                }); //TODO 
                //valeur a changé aprés test !
            }


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