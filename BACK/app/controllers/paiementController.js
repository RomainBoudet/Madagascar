const Paiement = require('../models/paiement');
const Shop = require('../models/shop');
const {
    formatLong
} = require('../services/date');

const stripe = require('stripe')(process.env.STRIPE_TEST_KEY);


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
            console.log('req.session.user ==> ', req.session.user.cgv);
            if (req.session.user.cgv === 'true') {
                console.log("Les Conditions Générales de Ventes ont déja été accéptés.")
                return res.status(200).json("Les Conditions Générales de Ventes ont déja été accéptés.")
            } else(
                req.session.user.cgv = 'true')

            return res.status(200).json("Les Conditions Générales de Ventes ont été accéptés.")


        } catch (error) {
            console.trace(
                'Erreur dans la méthode CGV du paiementController :',
                error);
            res.status(500).json(error.message);
        }

    },



    paiement: async (req, res) => {
        try {

            //Pour payer, l'utilisateur doit avoir :

            // été authentifié
            if (!req.session.user) {
                console.log("Le client ne s'est pas authentifié !")
                return res.status(200).json("Merci de vous connecter  afin de finaliser votre paiement.")
            }
            // avoir accepté les CGV
            if (req.session.user.cgv !== 'true') {
                console.log("Les Conditions Générales de Ventes n'ont pas été accéptés.")
                return res.status(200).json("Les Conditions Générales de Ventes n'ont pas été accéptés. Merci de les accéptés afin de finaliser votre paiement.")
            }
            // avoir un montant de panier supérieur a 0.
            if (req.session.totalTTC == 0 || req.session.totalTTC === undefined) {
                return res.status(200).json("Pour effectuer un montant vous devez avoir des articles dans votre panier.")
            }

            const articles = [];
            req.session.cart.map(article => (`${articles.push(article.produit+' / '+'Qte: '+article.quantite)}`));
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

                const paymentIntent = await stripe.paymentIntents.create({
                    amount: req.session.totalStripe, // total en centimes et en Integer
                    currency: 'eur',
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
                // on insére le payement intent en session pour pouvoir ré-utiliser le même paiement intent si le client revient en arriére et ne finalise pas le processus. Si il revient, on pourra lui attribuer le même paiementIntent.
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

            console.log("req.session  =>", req.session);










            //!https://stripe.com/docs/payments/accept-a-payment-synchronously 
            /*  let intent;
                if (req.body.payment_method_id) {
                    // Create the PaymentIntent
                    intent = await stripe.paymentIntents.create({
                        payment_method: req.body.payment_method_id,
                        amount: 1099,
                        currency: 'usd',
                        confirmation_method: 'manual',
                        confirm: true
                    });
                } else if (req.body.payment_intent_id) {
                    intent = await stripe.paymentIntents.confirm(
                        req.body.payment_intent_id
                    );
                }
                // Send the response to the client
                res.send(generateResponse(intent));

                const generateResponse = (intent) => {
                    // Note that if your API version is before 2019-02-11, 'requires_action'
                    // appears as 'requires_source_action'.
                    if (
                        intent.status === 'requires_action' &&
                        intent.next_action.type === 'use_stripe_sdk'
                    ) {
                        // Tell the client to handle the action
                        return {
                            requires_action: true,
                            payment_intent_client_secret: intent.client_secret
                        };
                    } else if (intent.status === 'succeeded') {
                        // The payment didn’t need any additional actions and completed!
                        // Handle post-payment fulfillment
                        return {
                            success: true
                        };
                    } else {
                        // Invalid status
                        return {
                            error: 'Invalid PaymentIntent status'
                        }
                    }
                };

 */
            res.status(200).json('Roule ma poule');


        } catch (error) {
            const errorMessage = process.env.NODE_ENV === 'production' ?
                'Erreur serveur.' :
                `Erreur dans la méthode paiement du paiementController : ${error.message})`


            res.status(500).json(errorMessage);
            console.trace(error);
        }

    },


    key: async (req, res) => {
        try {

            //simple rappel si j'oubli le MW d'autorisation client... a enlever en prod peut être..
            if (!req.session) {
                return res.status(401).json("Merci de vous authentifier avant d'accéder a cette ressource.");
            }

            if (req.session.IdPaymentIntentStripe === undefined || req.session.clientSecret === undefined ) {
                return res.status(404).json("Merci de réaliser une tentative de paiement avant d'accéder a cette ressource.");

            } else {

                return res.status(200).json({
                    client_secret: req.session.clientSecret
                });
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