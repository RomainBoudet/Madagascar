// Un routeur, sur lequel on branche des routes et des MW qui leur correspondent
const {
  Router
} = require('express');

const router = Router();
const port = process.env.PORT || 5000;
//les MW de permission des routes
const client = require('./middlewares/client');
const admin = require('./middlewares/admin');
const dev = require('./middlewares/dev');



const {
  cleanPassword,
  clean,
} = require('./middlewares/sanitizer'); //cleanPassword => moins restrictif, pour laisser passer les caractéres spéciaux des password. 
// clean => pour toutes les routes sans password (ou on n'a pas besoin de caractéres spéciaux..)


// le MW limitant le nombre de requetes pour un user (defense contre les attaques par Brute-Force)
const rateLimit = require("express-rate-limit");

// Controllers
const authController = require('./controllers/authController');
const mainController = require('./controllers/mainController');
const adminController = require('./controllers/adminController');
const clientController = require('./controllers/clientController');
const panierController = require('./controllers/panierController');
const clientHistoController = require('./controllers/clientHistoController');
const factureController = require('./controllers/factureController');
const adresseController = require('./controllers/adresseController');
const paiementController = require('./controllers/paiementController');
const commandeController = require('./controllers/commandeController');
const livraisonController = require('./controllers/livraisonController');
const avisController = require('./controllers/avisController');
const produitController = require('./controllers/produitController');
const searchController = require('./controllers/searchController');


// implémentation de joi, avec un validator  dans le dossier "services".
const {
  validateQuery,
  validateBody
} = require('./services/validator');
//Schema validation Joi
const userLoginSchema = require('./schemas/userLoginSchema');
const userSigninSchema = require('./schemas/userSigninSchema');
const userUpdateSchema = require('./schemas/userUpdateSchema');
const verifyEmailSchema = require('./schemas/verifyEmailSchema');
const resendEmailSchema = require('./schemas/resendEmailSchema');
const resetPwdSchema = require('./schemas/resetPwdSchema');
const phoneNumberSchema = require('./schemas/phoneNumber');
const codeSchema = require('./schemas/codeSchema');
const searchSchema = require('./schemas/searchSchema');
const adresseSchema = require('./schemas/adresseSchema');
const adressePostSchema = require('./schemas/adressePostSchema');
const passwordSchema = require('./schemas/passwordOnlySchema');
const transporteurSchema = require('./schemas/transporteurShema');
const transporteurPostSchema = require('./schemas/transporteurPostSchema');
const choixLivraisonSchema = require('./schemas/choixLivraisonSchema');
const smsChoiceSchema = require('./schemas/smsChoiceSchema');
const emailChoiceSchema = require('./schemas/emailChoiceShema');
const refundSchema = require('./schemas/refundSchema');
const refundClientSchema = require('./schemas/refundClientSchema');
const couponSchema = require('./schemas/couponSchema');
const delCouponSchema = require('./schemas/delCouponSchema');
const newLivraisonSchema = require('./schemas/newLivraisonSchema');
const updateStatutSchema = require('./schemas/updateStatutSchema');




//Redis pour le cache
const cacheGenerator = require('./services/cache');
const consol = require('./services/colorConsole');
//Config de notre service de mise en cache via Redis, avec une invalidation temporelle de 15 Jours (en sec) en plus de l'invalidation événementielle.
const {
  cache,
  flush
} = cacheGenerator({
  ttl: 1296000, // 3600 *24 *15 => 15 jours
  prefix: "mada",
});

// Config du module pour limiter le nombre de connexion sur la route /connexion => empeche toute attaque par Brute-Force. 
//Basé sur l'ip
const apiLimiter = rateLimit({
  windowMs: 3600 * 1000 * 10, // la fenetre de tir pour le nombre de connexion : 10h
  message: 'Vous avez dépassé la limite des 100 demandes de connexion en 10h !',
  max: 100, //le nombre de connexion max pour la fenetre donnée.
});



// sur nos route avec params :
// (\d+) => sécurise le params et obligation de mettre un entier via une feature d'express, joi overkill ici, pour plus de controle, on passe une expression réguliére \d = [0-9] et + pour plusieurs chiffre mais pas zéro. Double antislash (\\) car un seul a déja une fonction (sert a "échapper")

//! DROITS D'ACCES :
//!-----------------------------------------------------------------------------------------
//! Un simple mot a ajouter aprés la route pour changer les droits d'accés :

//! Pour autoriser une route a tous les Utilisateurs connéctés :
//on ajoute "auth" aprés la route   ex = router.get('/produits', auth, produitController.allproduits);
//! pour autoriser une route aux seuls Administrateurs :
//on ajoute "admin" aprés la route  ex = router.get('/produits', admin, produitController.allproduits);
//! pour autoriser une route aux Developpeur :
//on ajoute "dev" apres la route  ex = router.get('/produits', dev, produitController.dropdb);

/*//! RAPPEL de la nomanclature des MW possible :
cache = le résultat de la route est stoké dans REDIS si ce ce n'est pas déja le cas
flush = Pour les route en post. Le déclenchement de cette route va vider toutes les données présentes dans REDIS pour ne pas donner des fausses données ultérieurement (invalidation temporel)
clean = sanitize et bloque quasi tous les caractéres spéciaux sauf le @ et la ponctuation (!?;.:,-), tout le reste disparait sans préavis
dev = n'autorise que les privilege "Developeur" sur la route auquel il est aposé.
admin = autorise les "Developpeur" et les "Administrateur" sur la route auquel il est aposé.
client = autorise les "Client", "Developpeur" et "Administrateur" sur la route, seules les personnnes non connecté seront refusé.
apiLimiter = restreint l'accée de la route selon l'ip du visiteur. Si plus de 100 tentavives de connexion en 10 heure, accés est refusé jusqu'a la fin des 10h.
aut */

//router.use('/api-docs', swaggerUi.serve);
//router.get('/api-docs', swaggerUi.setup(swaggerDocument));


/**
 * Page d'acceuil de la swagger doc
 * @route GET /api-docs
 * @summary Une magnifique documentation swagger :)
 * @group Acceuil
 * @returns {JSON} 200 - la page d'acceuil
 */
router.get('/api-docs', mainController.init);


//! ROUTES UTILISATEUR ----------------
/**
 * Une connexion
 * @typedef {connexion} connexion
 * @property {string} email - email
 * @property {string} password - password
 */
/**
 * Autorise la connexion d'un Utilisateur au site.
 * Route sécurisée avec Joi et limité a 100 requetes par 10h pour le même user
 * @route POST /v1/connexion
 * @group connexion - Pour se connecter ou se déconnecter
 * @summary Autorise la connexion d'un Utilisateur au site.
 * @param {string} email.body.required - les informations qu'on doit fournir
 * @param {string} password.body.required - les informations qu'on doit fournir
 * @returns {JSON} 200 - Un Utilisateur à bien été connecté
 * @returns {JSON} 200 - {xsrfToken, id, prenom, nomFamille, email, privilege}
 * @headers {integer} 200.X-Rate-Limit - limité a 100 requetes par 10h pour le même user
 */
router.post('/connexion', apiLimiter, validateBody(userLoginSchema), authController.login);

/**
 * Permet la déconnexion d'un Utilisateur au site.
 * Destroy la session et supprime le cookie
 * @route GET /v1/deconnexion
 * @group connexion - 
 * @summary déconnecte un Utilisateur - on reset les infos du user en session
 * @returns {JSON} 200 - L'Utilisateur a été déconnecté avec succés
 */
router.get('/deconnexion', authController.deconnexion);

/**
 * Une inscription
 * @typedef {object} inscription
 * @property {string} prenom - prénom
 * @property {string} NomFamille - nom de famille
 * @property {string} email - email
 * @property {string} password - password
 * @property {string} passwordConfirm - la confirmation du password
 */
/**
 * Permet l'inscription d'un Utilisateur au site.
 * Route sécurisée avec Joi et validator
 * @route POST /v1/inscription
 * @group inscription - Pour s'inscire 
 * @summary Inscrit un Utilisateur en base de donnée
 * @param {string} prenom.body.required - les informations d'inscriptions qu'on doit fournir
 * @param {string} nomFamille.body.required - les informations d'inscriptions qu'on doit fournir
 * @param {string} email.body.required - les informations d'inscriptions qu'on doit fournir
 * @param {string} password.body.required - les informations d'inscriptions qu'on doit fournir
 * @param {string} passwordConfirm.body.required - les informations d'inscriptions qu'on doit fournir
 * @returns {JSON} 200 - {email, prenom, nomFamille, message : "Vous pouvez désormais vous connecter !"}
 */
router.post('/inscription', validateBody(userSigninSchema), clientController.signIn);


/**
 * Permet l'inscription d'un Administrateur au site.
 * Utilise email validator (métthode isEmail et isStrongPassword)
 * Route sécurisée avec Joi et MW Developpeur
 * Un email est envoyé à l'administrateur récémment inscrit
 * @route POST /v1/signin
 * @group Administrateur - Des méthodes a dispositions des Administrateurs
 * @summary Inscrit un Administrateur en base de donnée
 * @param {string} prenom.body.required - les informations d'inscriptions qu'on doit fournir
 * @param {string} nomFamille.body.required - les informations d'inscriptions qu'on doit fournir
 * @param {string} email.body.required - les informations d'inscriptions qu'on doit fournir
 * @param {string} password.body.required - les informations d'inscriptions qu'on doit fournir
 * @param {string} passwordConfirm.body.required - les informations d'inscriptions qu'on doit fournir * 
 * @returns {JSON} 200 - {email, prenom, nomFamille, message : "Vous pouvez désormais vous connecter !"}
 */
router.post('/signin', dev, validateBody(userSigninSchema), adminController.signInAdmin);


/**
 * Un Utilisateur
 * @typedef {object} Utilisateur
 * @property {number} id - id du jeu
 * @property {string} prenom - prénom
 * @property {string} nomFamille - nom de famille
 * @property {string} email - email
 * @property {string} password - password
 */
/**
 * Met a jour les informations d'un Utilisateur.
 * Les données STRIPE sont également mis a jour 
 * On envoie un mail pour informer l'utilisateur de changement de ses données !
 * Si l'email est également changé, on envoie un email sur l'ancien email également par mesure de sécurité.
 * @route PATCH /user/update/:id
 * @group Utilisateur - Des méthodes a dispositions des Utilisateurs
 * @summary Met a jour un Utilisateur en base de donnée. Un email est envoyé pour signaler les changements. Si changement d'email, un second email est également envoyé sur l'ancienne adresse pour signaler le changement.
 * @param {string} password.body.required - les informations d'un user que l'on souhaite mettre a jour.
 * @param {string} newPassword.body.required - les informations d'un user que l'on souhaite mettre a jour.
 * @param {string} newPasswordConfirm.body.required - les informations d'un user que l'on souhaite mettre a jour.
 * @param {string} pprenom.body.required - les informations d'un user que l'on souhaite mettre a jour.
 * @param {string} nomFamille.body.required - les informations d'un user que l'on souhaite mettre a jour.
 * @param {string} email.body.required - les informations d'un user que l'on souhaite mettre a jour.
 * @param {number} id.path.required - l'id d'un client à fournir
 * @returns {JSON} 200 - {message: "message variable selon les données mises a jour !""}
 */
router.patch('/user/update/:id(\\d+)', cleanPassword, client, validateBody(userUpdateSchema), clientController.updateClient);

// ETAPE 1 => Envoie d'un email avec un lien 
/**
 * Envoie un email si l'Utilisateur ne se souvient plus de son mot de passe, pour mettre en place un nouveau mot de passe de maniére sécurisé.
 * L'email posséde un lien sur lequel cliquer !
 * @route POST /user/new_pwd
 * @group Utilisateur
 * @summary Prend un mail en entrée et renvoie un email dessus si celui çi est présent en BDD.  Cliquer sur le lien dans l'email l'enmenera sur la route /user/reset_pwd ou l'attent un formulaire
 * @param {string} email.body.required - L'email du compte pour lequel on souhaite retrouver le mot de passe
 * @returns {JSON} 200 - "Merci de consulter vos emails et de cliquer sur le lien envoyé pour renouveller votre mot de passe."
 */
router.post('/user/new_pwd', cleanPassword, validateBody(verifyEmailSchema), clientController.new_pwd);

// ETAPE 2 => envoi en second newPassword, passwordConfirm  dans le body et userId et token en query: decode le token avec clé dynamique et modifit password (new hash + bdd) !
/**
 * Seconde partie de la méthode pour renouveller son password :
 * envoi en second newPassword, passwordConfirm dans le body et userId et token en query: decode le token avec clé dynamique et modifit password (new hash + bdd) !
 * L'ancien mot de passe est conservé en BDD pour de potentielles futurs utilisation
 * Un mail est envoyé pour confirmer a l'utilisateur le changement de mot de passe.
 * @route POST /user/reset_pwd
 * @group Utilisateur
 * @summary  Reset du mot de passe. prend en entrée, newPassword et passwordConfirm dans le body et userId et token en query: decode le token avec clé dynamique et modifit password (new hash + bdd) !
 * @param {string} passwordConfirm.body.required
 * @param {string} newPassword.body.required
 * @param {number} userId.query.required
 * @param {string} token.query.required
 * @returns {JSON} 200 -  {message: `Bonjour prenom, nom de famille, votre mot de passe a été modifié avec succés ! Un email de confirmation vous a été envoyé.`}
 */
router.post('/user/reset_pwd', validateBody(resetPwdSchema), validateQuery(resendEmailSchema), clientController.reset_pwd);


/**
 * Prend en charge l'acceptation de la politique de cookie sur le site
 * Renvoie un cookie chiffrée nommé "cookieAccepted" si la valeur du body "cookieAccepted" est a true, avec une expiration du cookie fixé a 180 jours.
 * Insére en session la valeur "cookie"= 'accepted'
 * @route POST /setcookie
 * @group Utilisateur
 * @summary  Renvoie un cookie avec le nom 'cookieAccepted' si la valeur cookieAccepted est a 'true'
 * @param {string} cookieAccepted.body.required (booléean) Doit valoir 'true' pour renvoyer un cookie au client.
 * @returns {JSON} 200 - {"Vous avez accepté notre politique d'utilisation des cookies sur ce site et nous vous en remerçiont !"} / Renvoie un cookie avec le nom 'cookieAccepted' et la valeur 'true'
 */
router.post('/setcookie', clean, authController.cookie);

/**
 * Prend en charge l'acceptation des Conditions Générale de Ventes
 * Insére l'information en session.
 *  @route POST /cgv
 * @group Utilisateur
 * @summary  L'acceptation des Conditions Générale de Ventes est stocké en session
 * @returns {JSON} 200 - {"Les Conditions Générales de Ventes ont été accéptés."}
 */
router.get('/cgv', paiementController.cgv);

//! PAIEMENT -----------------------------------------------------------------------------------------------------------------------------------------

/**
 * Prend en charge l'intention de paiement via STRIPE, a utiliser lorsque le client choisit un mode de paiement par carte bancaire apres avoir choisit son transporteur.
 * Nécéssite d'être authentifié, d'avoir accepté les CGV, avoir des article dans le panier, avoir choisit un transporteur, avoir une adresse de livraison OU choisi le retrait sur place de sa commande, et avoir une adresse de facturation
 * @route GET /user/paiementCB
 * @group Utilisateur
 * @summary  Prend en charge le paiement via STRIPE
 * @returns {JSON} 200 -  Prend en charge le paiement via STRIPE et stock en session une clé secréte qui sera demandé lors du paiement par le Front.
 */
router.get('/user/paiementCB', client, paiementController.paiementCB);

/**
 * Prend en charge l'intention de paiement via STRIPE, a utiliser lorsque le client choisit un mode de paiement par virement SEPA apres avoir choisit son transporteur.
 * Nécéssite d'être authentifié, d'avoir accepté les CGV, avoir des article dans le panier, avoir choisit un transporteur, avoir une adresse de livraison OU choisi le retrait sur place de sa commande, et avoir une adresse de facturation
 *  @route GET /user/paiementSEPA
 * @group Utilisateur
 * @summary  Prend en charge le paiement via STRIPE
 * @returns {JSON} 200 -  Prend en charge le paiement via STRIPE
 */
router.get('/user/paiementSEPA', client, paiementController.paiementSEPA);

/**
 * Permet de récupérer la clé client secret nécéssaire a STRIPE pour une paiement CB, nécéssaire pour le front.
 * Nécessite d'être connecté et d'avoir réaliser une tentative de paiement
 * @route GET /user/paiementkey
 * @group Utilisateur
 * @summary  Permet de récupérer la clé client secret nécéssaire a STRIPE *** nécéssite d'être authentifié et d'avoir tenté d'effectuer un paiement.
 * @returns {JSON} 200 -  {client_secret: "pi_3JkQuOLNa9FFzz1X1k9sSb4o_secret_VwFZt1ZASDVjEZBvG95GAAu3Q"}
 */
router.get('/user/paiementkey', paiementController.key);

/**
 * Permet de récupérer la clé client secret nécéssaire a STRIPE pour un paiement SEPA, nécéssaire pour le front.
 * Nécessite d'être connecté et d'avoir réaliser une tentative de paiement
 * @route GET /user/paiementkeySEPA
 * @group Utilisateur
 * @summary  Permet de récupérer la clé client secret nécéssaire a STRIPE *** nécéssite d'être authentifié et d'avoir tenté d'effectuer un paiement.
 * @returns {JSON} 200 -  {client_secret: "pi_3JkQuOLNa9FFzz1X1k9sSb4o_secret_VwFZt1ZASDVjEZBvG95GAAu3Q"}
 */
router.get('/user/paiementkeySEPA', paiementController.keySEPA);


// router.get('/insertCookieForWebhookTest', paiementController.insertCookieForWebhookTest);

/**
 * Prend en charge le webhook STRIPE apres un paiement validé via carte bancaire et virement SEPA
 * Route avec une signature vérifié par une API STRIPE pour s'assurer que l'info vient bien de STRIPE.
 * Cette route est contacté par 3 évenement :  payment_intent.succeeded, payment_intent.canceled, payment_intent.payment_failed 
 * Si le paiement est validée : les stock sont mis a jour, la BDD est mis a jour, un email est envoyé au client lui résumant son achat, un email est envoyé a l'administrateur du site pour l'informer d'une nouvelle commande, un sms peut être envoyé a l'admin si il a choisi d'en recevoir.
 * L'argent rçu sur Stripe est viré sur le compte bancaire
 * Si un coupon a été utilisé, il est supprimé.
 * En cas d'érreur le stock est ré-augmenté, un email est envoyé pour signaler l'échec a l'utilisateur.
 * Génére automatiquement une facture au format PDF avec le statut "PAYÉ".
 * @route POST /webhookpaiement
 * @group Utilisateur
 * @summary  Prend en charge le webhook STRIPE apres un paiement validé CB et SEPA
 * @returns {JSON} 200 -  Prend en charge le webhook STRIPE apres un paiement validé CB et SEPA
 */
router.post('/webhookpaiement', paiementController.webhookpaiement);

/**
 * Prend en charge le webhook STRIPE apres une tentative paiement SEPA
 * Route non filtré mais signature vérifié par une API STRIPE pour s'assurer que l'info vient bien de STRIPE.
 *  @route POST /webhookpaiementSEPA
 * @group Utilisateur
 * @summary  Prend en charge le webhook STRIPE apres un paiement
 * @returns {JSON} 200 -  Prend en charge le webhook STRIPE apres une tentative paiement SEPA
 */
router.post('/webhookpaiementSEPA', paiementController.webhookpaiementSEPA);

/**
 * Connaitre la balance STRIPE du compte
 * Nécessite d'être authentifié comme administrateur
 * @route GET /balanceStripe
 * @group Utilisateur
 * @summary  Connaitre la balance STRIPE du compte
 * @returns {JSON} 200 -  Connaitre la balance STRIPE du compte {{"object": "balance","available": [{"amount": 0,"currency": "eur","source_types": {"card": 0}}],"livemode": false,"pending": [{"amount": 0,"currency": "eur","source_types": {"card": 0}}]}}
 */
router.get('/balanceStripe', admin, paiementController.balanceStripe);

/**
 * Demander un remboursement sur un paiement de la part d'un Admin. Utilise l'API STRIPE
 * Nécéssite d'être authentifié comme un Administrateur.
 * Le montant a rembourser ne peut être supérieur a celuin de la commande
 * Une commande avec le statut "En attente", "Annulée" ou "Remboursée" ne sera pas remboursé.
 * @route POST /admin/refund
 * @group Administrateur
 * @summary  Demander un remboursement sur un paiement de la part d'un Administrateur
 * @param {string} commande.body.required - Une référence de commande.
 * @param {number} montant.body - Une valeur en euros et non en centimes. Egale a 100% du paiement de la commande si non précisé.
 * @returns {JSON} 200 -  Demander un remboursement sur un paiement de la part d'un Admin
 */
router.post('/admin/refund', clean, admin, validateBody(refundSchema), paiementController.refund);

/**
 * Demander un remboursement sur un paiement de la part d'un client. Utilise l'API STRIPE
 * Nécéssite d'être authentifié par l'utilisateur.
 * Une annulation automatique n'est possible que si la commande a la statut "Paiement validé" (2) ou "En cour de préparation" (3)
 * Si la commande a le statut "Pret pour expedition" (4) : ici pas de remboursement automatique, demande d'annulation d'envoie simplement par un mail au ADmin et un SMS, si l'admin l'a choisi
 * Si le statut est "Expédié" (5) alors on demande a l'utilisateur de lancer une procédure de retour aprés la réception de sa commande.
 * @route POST /client/refund
 * @group Utilisateur
 * @summary  Demander un remboursement sur un paiement de la part d'un Admin
 * @param {string} commande.body.required - Une référence de commande.
 * @returns {JSON} 200 -  Demander un remboursement sur un paiement de la part d'un Admin
 */
router.post('/client/refund', clean, client, validateBody(refundClientSchema), paiementController.refundClient);

/**
 * Prend en charge le webhook STRIPE apres un échec ou une mise a jour d'une tentative de remboursement
 * Route avec signature vérifié par une API STRIPE pour s'assurer que l'info vient bien de STRIPE.
 * Un email est envoyé a l'administrateur en cas d'échec, ou en cas de succés (dans ce cas il s'agit d'une mise a jour)
 *  @route POST /webhookRefundUpdate
 * @group Utilisateur
 * @summary  Prend en charge le webhook STRIPE apres un échec ou une mise a jour d'une tentative de remboursement
 * @returns {JSON} 200 -  Prend en charge le webhook STRIPE apres un échec ou une mise a jour d'une tentative de remboursement
 */
router.post('/webhookRefundUpdate', paiementController.webhookRefundUpdate);

/**
 * Prend en charge le webhook STRIPE apres un remboursement
 * Mofifit la facture PDF créé lors du paiement pour marquer en filigrame "Remboursée" sur toute la facture.
 * Route non filtré mais signature vérifié par une API STRIPE pour s'assurer que l'info vient bien de STRIPE.
 *  @route POST /webhookRefund
 * @group Utilisateur
 * @summary  Prend en charge le webhook STRIPE apres un remboursement
 * @returns {JSON} 200 -  Prend en charge le webhook STRIPE apres une tentative paiement SEPA
 */
router.post('/webhookRefund', paiementController.webhookRefund);

/**
 * Créer un coupon de reduction utilisable par un client
 * Met dans REDIS des coupons qui seront vérifié lors du paiement. 
 * Nécéssite d'être authentifié comme Administrateur.
 * @route POST /admin/coupon
 * @group Administrateur
 * @summary  Créer un coupon de reduction utilisable par un client
 * @param {number} idClient.body - Un identifiant d'un client (pas obligatoire). Si présent, ce coupon ne sera utilisable que par ce client.
 * @param {string} prefix.body.required - Un prefix pour personnaliser notre coupon.
 * @param {string} postfix.body.required - Un postfix pour personnaliser notre coupon.
 * @param {string} montant.body.required - Un montant pour la valeur de notre coupon, en euros.
 * @param {number} ttl.body.required - La durée de vie en jour, de notre coupon.
 * @returns {JSON} 200 -  {coupon:"monCodeCoupon"} Un coupon utilisable par un client !
 */
router.post('/admin/coupon', admin, validateBody(couponSchema), paiementController.coupon);

/**
 * Affiche la liste des coupons non expiré
 * Nécéssite d'être authentifié comme Administrateur.
 * @route GET /admin/couponList
 * @group Administrateur
 * @summary  Affiche la liste des coupons non expiré
 * @returns {JSON} 200 - {"allCoupons = ", allCoupons} / Affiche dans un tableau la liste des coupons non expiré
 */
router.get('/admin/couponList', admin, paiementController.couponList);


/**
 * Supprime un coupon passé en paramétre
 * Nécéssite d'être authentifié comme Administrateur.
 * @route DELETE /admin/coupon
 * @group Administrateur
 * @summary  Supprime un coupon passé en paramétre
 * @param {string} coupon.body.required - Un coupon a supprimer
 * @returns {JSON} 200 -  Supprime un coupon passé en paramétre
 */
router.delete('/admin/coupon', admin, validateBody(delCouponSchema), paiementController.delCoupon);

/**
 * Utilise un coupon passé en paramétre et met a jour le panier
 * Nécéssite d'être authentifié comme Client et d'avoir un coupon valide.
 * Si le coupon a été créé pour un client en particulier, seul ceui-çi pourra s'en servir.
 * @route POST /user/coupon
 * @group Utilisateur
 * @summary  Met a jour le panier d'un Utilisateur avec le montant du panier déduit du montant du coupon 
 * @param {string} coupon.body.required - Un coupon a supprimer
 * @returns {JSON} 200 - {totalHT,totalTTC,totalTVA,(coutTransporteur,)cart,totalAPayer} / Met a jour le panier d'un Utilisateur avec le montant du panier déduit du montant du coupon 
 */
router.post('/user/coupon', client, validateBody(delCouponSchema), panierController.insertCoupon);

/**
 * Supprime la valeur d'un coupon passé par un Utilisateur et met a jour le panier
 * Nécéssite d'être authentifié comme Client et d'avoir un coupon valide.
 * Le coupon n'est pas supprimé, sa valeur n'est juste plus appliqué dans le panier.
 * @route GET /user/cancelCoupon
 * @group Utilisateur
 * @summary  Supprime la valeur d'un coupon passé par un Utilisateur et met a jour le panier
 * @returns {JSON} 200 - {totalHT,totalTTC,totalTVA,(coutTransporteur,)cart,totalAPayer} Supprime la valeur d'un coupon passé par un Utilisateur et met a jour le panier 
 */
router.get('/user/cancelCoupon', client, panierController.cancelCoupon);



//! UPDATE COMMANDE --------------------------------------------------------------------------------------------------------------------------

/**
 * Mise a jour du statut d'une commande. 
 * Nécéssite d'être authentifié comme Administrateur.
 * Uniquement les statuts : 2 = Paiement validé, 3 = En cours de préparation, 4 = Prêt pour expédition, 5 = Expédiée, sont autorisé a être mis a jour.
 * Droits différents entre Admin et Developpeur. Le Dev a le droit de changer le statut d'une commande par tous les statuts existant.
 * Entrées flexible : on prend soit une réference de commande soit un id de commande et soit le nom d'un statut soit sont id et on autorise l'administrateur a faire 3 fautes par statut, dans ce cas on le corrige automatiquement. Sinon on lui propose le plus proche statut existant de ce qui a été écrit (Levenshtein).
 * Si le statut est mis a jour a "Expédié", et que l'utilisateur a choisit de recevoir un sms a l'expédition de sa commande, alors un sms lui sera envoyé, lui confirmant le départ de sa commmande.
 * Si la mise a jour de la commande ne suit pas un ordre logique, on accept mais on avertit l'admin par un message en JSON.
 * @route POST /admin/updateCommande
 * @group Administrateur
 * @summary  Mise a jour du statut du statut d'une commande 
 * @param {string} statut.body.required - Un statut a mettre a jour qui peut être soit un identifiant de statut (chiffre de 2 à 5) ou un nom de statut (ex: "Paiement validé")
 * @param {string} confirmStatut.body.required - La confirmation d'un statut a mettre a jour, identique a req.body.statut
 * @param {string} commande.body.required - Une commande a mettre a jour, qui peut être soit une référence, soit un identifiant de commande.
 * @returns {JSON} 200 - Mise a jour du statut du statut d'une commande et renvoie le statut de la commande nouvellement mis a jour 
 */
router.post('/admin/updateCommande', admin, validateBody(updateStatutSchema), commandeController.updateStatut);


//! FACTURES Création de factures aprés la commande et le paiement ---------------------------------------------------------------------------
/**
 * Bien qu'un facture soit généré automatiquement a chaque paiement, cette route permet a l'admin de la regénérer a volonté.
 * Route pour la génération d'une facture PDF pour l'identifiant de commande passée dans URL !
 * Si une facture existe déja au format pdf pour cette commande, cette facture pdf la remplacera.
 * @route GET /users/facture/:id
 * @group Utilisateur
 * @summary  Permet de générer une facture PDF pour la commande voulue 
 * @param {number} id.path.required - l'identifiant de commande à fournir
 * @returns {JSON} 200 - Une commande au format pdf est construite sur le serveur.
 */
router.get('/users/facture/:id(\\d+)', factureController.facture);


/**
 * Route pour l'ouverture d'une facture PDF 
 * @route GET /users/readFacture
 * @group Utilisateur
 * @summary  Permet de lire dans le navigateur une facture PDF pour la commande voulue 
 * @param {number} idCommande.body.required - Un identifiant de commande
 * @returns {JSON} 200 - Permet d'ouvrir un facture pdf dans le navigateur
 */
router.get('/users/readFacture', client, factureController.getFacture);

//! Non util, permet de récupérer des email sur serveur Imap... 
/**
 * Permet de lire les emails
 * Route sécurisée avec Joi et MW Administrateur
 * @route GET /admin/email
 * @group Administrateur 
 * @summary - Permet de lire les emails
 * @returns {JSON} 200 - Permet de lire les emails
 */
//router.get('/admin/email', clean, admin, commandeController.getEmail);

/**
 * Permet de lire les emails automatiquement et de mettre a jour le statut d'une commande selon le contenu d'un mail
 * L'email doit avoir un statut précis = "update statut" et un body précis = "commande : statut".
 * Commande peut être un identifiant de commande ou une référence de commande.
 * statut peut être un identifiant de staut ou un nom de statut.
 * Seul le mail d'un administrateur sera pris en compte
 * Route sécurisée avec MW Administrateur.
 * Un email est envoyé dans chaque cas, érreur ou succés, sur le mail de l'administrateur qui contacté l'API
 * @route GET /admin/StartUpdateCommandeFromEmail
 * @group Administrateur 
 * @summary Permet de démarrer le serveur qui lira les email et de mettra a jour le statut d'une commande selon le contenu d'un mail
 * @param {string} email.required - L'email doit avoir un statut précis = "update statut" et un body précis = "commande : statut".
 * @returns {JSON} 200 - Envoi d'un email a l'administrateur qui a contacté l'API par email
 */
router.get('/admin/startUpdateCommandeFromEmail', clean, admin, commandeController.startUpdateCommandeFromEmail);

//FLAG
//! Non fonctionnel, si on l'arrete, plus moyen de le démarrer si ce n'est qu'en relancant le serveur !
/**
 * Permet d'arréter le serveur qui lira les email et de mettra a jour le statut d'une commande selon le contenu d'un mail
 * Route sécurisée avec Joi et MW Administrateur
 * @route GET /admin/stopUpdateCommandeFromEmail
 * @group Administrateur 
 * @summary Permet de démarrer le serveur qui lira les email et de mettra a jour le statut d'une commande selon le contenu d'un mail
 * @returns {JSON} 200 - le statut d'une commande mise a jour selon le contenu d'un mail
 */
//router.get('/admin/stopUpdateCommandeFromEmail', clean, admin, commandeController.stopUpdateCommandeFromEmail);

//! SEARCH BAR -------------------------------------------------------------------------------------------------------------------------------
/**
 * Receptionne une string et renvoie un tableau d'objet représentant les produits qui match. 
 * Dans la configuration de la recherche, on admet que le nombre de caractére minimum qui doit matcher avec le résultat est egale a la longeur du mot de recherche proposé moins une lettre.
 * Insensible a la casse et ne comprend pas les scores.
 * Ne seront présenté uniquement les scores qui sont inférieur a 0.4 et pas plus de 20 articles par recherche.
 * @route POST /user/searchProduit
 * @group Utilisateur
 * @summary Permet la recherche d'un mot ou d'une phrase (une string) dans les produits.
 * @param {string} search.body.required - Une commande a mettre a jour, qui peut être soit une référence, soit un identifiant de commande.
 * @returns {JSON} 200 - Un tableau d'objet
 */
router.post('/user/searchProduit', clean, validateBody(searchSchema), searchController.search);

//! ROUTES ADMINISTRATEUR -----------------------------------------------------------------------------------------------------------------------

/**
 * Envoie un email avec un lien pour que l'admin qui le souhaite puisse vérifier son email.
 * @route POST /sendEmailLink
 * @group Administrateur
 * @summary Prend un mail en entrée et renvoie un email si celui çi est présent en BDD.  Cliquer sur le lien dans l'email envoyé enmenera sur la route /verifyemail  
 * @param {string} email.body.required - 
 * @returns {JSON} 200 - Un email a été délivré
 */
router.post('/sendEmailLink', clean, admin, validateBody(resendEmailSchema), clientController.sendEmailLink);

//ETAPE 2 => Reçois userId et Token en query, vérifis ce qu'il faut et change le statut en BDD
/**
 * Reçois userId et Token en query, vérifis ce qu'il faut et change le statut en BDD
 * @route POST /verifyEmail
 * @group Administrateur
 * @summary Route qui réceptionne le lien de la validation du mail avec un token en query et valide le mail en BDD.
 * @param {string} userId.query.required - 
 * @param {string} token.query.required - 
 * @returns {JSON} 200 - "message: Bonjour 'prenom', votre mail 'email' a été authentifié avec succés ! Vous pouvez désormais fermer cette page."
                } On passe la verif de l'email de l'admin a TRUE. Il peut désormais effectuer des opérations qui nécessitent un vérification de l'email en amont.
 */
router.get('/verifyEmail', clean, validateQuery(verifyEmailSchema), clientController.verifyEmail);
/**
 * Permet d'enregitrer en BDD et de vérifier un téléphone par l'envoie d'un sms sur le numéro.
 * Récupére les données de connexion de twilio dans la BDD et les utilise pour l'envoi d'un sms
 * Le numéro de téléphone doit être français.
 * Un code a 6 chiffre est envoyé. La longeur du code peut être modifié sur le dasboard de Twillio.
 * @route POST /admin/smsVerify
 * @group Administrateur
 * @summary Utilise l'API de Twillio. Permet de vérifier un numéro de téléphone
 * @param {string} phoneNumber.body.required
 * @returns {JSON} 200 - Un code par sms a été envoyé
 */
router.post('/admin/smsVerify', admin, clean, validateBody(phoneNumberSchema), adminController.smsVerify);

/**
 * Reçoi un code pour vérifier un numéro de téléphone et si le code est correct, le téléphone est enregistré en BDD sous format E. 164.
 * Entre l'envoi et la reception du code, le numéro de téléphone est stocké en session.
 * @route POST /admin/smsCheck
 * @group Administrateur
 * @summary Utilise l'API de Twillio. C'est le retour de la route smsVerify. Insert un téléphone vérifié d'un admin en BDD
 * @param {string} code.body.required - Le code a 6 chiffre reçu par sms.
 * @returns {JSON} 200 - Un json informant que le téléphone a été authentifié
 */
router.post('/admin/smsCheck', admin, clean, validateBody(codeSchema), adminController.smsCheck);


/**
 * Reçoie la valeur true ou false contenu dans un objet ayant également comme clé la valeur true ou false pour pouvoir choisir l'envoie de sms a l'admin a chaque création ou annulation de commandes. Nécéssite d'avoir vérifié son téléphone avant.
 * @route POST /admin/smsChoice
 * @group Administrateur
 * @summary Permet d'insérer en BDD le choix de l'admin en matiére d'envoie de sms a chaque commande reçu
 * @param {string} true.body
 * @param {string} false.body
 * @returns {JSON} 200 - message: "Votre choix a bien été enregistré !"
 */
router.post('/admin/smsChoice', admin, clean, validateBody(smsChoiceSchema), adminController.smsChoice);

/**
 * Reçoie la valeur true ou false contenu dans un objet ayant également comme clé la valeur true ou false. Nécéssite d'avoir vérifié son email avant.
 * @route POST /admin/emailChoice
 * @group Administrateur
 * @summary Permet d'insérer en BDD le choix de l'admin en matiére d'envoie d'email a chaque commande reçu ou annulée.
 * @param {string} true.body - doit contenir la valeur "true"
 * @param {string} false.body - doit contenir la valeur "false"
 * @returns {JSON} 200 - message: "Votre choix a bien été enregistré !"
 */
router.post('/admin/emailChoice', admin, clean, validateBody(emailChoiceSchema), adminController.emailChoice);


/**
 * Faire appel a la méthode smsSend envoi un sms avec le contenu voulu. Ici un exemple générique qui renvoie le nombre d'enregistrement dans la table clients, a chaque demande. A modifier selon les besoins d'envoie de SMS...
 * Le numéro de téléphone de Twillio DOIT être anglais. Celui du dev, doit être français.
 * Envoie un sms sur le téléphone du developpeur, pour l'exemple, indiquant le nombre de client en BDD.
 * @route GET /admin/smsSend
 * @group Administrateur
 * @summary Utilise l'API de Twillio. Permet d'envoyer un sms sur le numéro souhaité. Relié au numéro de l'admin du site.
 * @returns {JSON} 200 -message:'Sms bien envoyé !'
 */
router.get('/admin/smsSend', admin, adminController.smsSend);

/**
 * Renvoie tous les clients en bdd 
 * @route GET /admin/user/all
 * @group Administrateur
 * @summary Renvoie tous les client en BDD
 * @returns {JSON} 200 -Renvoie la liste des clients en BDD.
 */
router.get('/admin/user/all', admin, clientController.getAll);

/**
 * Renvoie un client selon son id
 * @route GET /admin/user/all
 * @group Administrateur
 * @summary Renvoie un client selon son id
 * @param {number} id.params.required - L'identifiant d'un client a afficher 
 * @returns {JSON} 200 -Renvoie un clients en BDD.
 */
router.get('/admin/user/getone/:id(\\d+)', admin, clientController.getOne);


/**
 * Supprime un client selon son id. Nécéssite un mot de passe
 * @route DELETE /admin/user/:id
 * @group Administrateur
 * @summary Supprime un client en BDD selon son id 
 * @param {number} id.params.required - L'identifiant d'un client a supprimer
 * @param {string} password.body.required - 
 * @returns {JSON} 200 - Supprime un client en BDD. On renvoie le client supprimé en JSON.
 */
router.delete('/admin/user/:id(\\d+)', admin, validateBody(passwordSchema), clientController.deleteById);


/**
 * Supprime un client selon son email. Nécéssite un mot de passe
 * @route DELETE /admin/user
 * @group Administrateur
 * @summary Supprime un client en BDD selon son email
 * @param {string} password.body.required - 
 * @param {string} email.body.required - L'email d'un client a supprimer
 * @returns {JSON} 200 - Supprime un client en BDD. On renvoie le client supprimé en JSON.
 */
router.delete('/admin/user', admin, validateBody(userLoginSchema), clientController.deleteByEmail);

//! ADRESSE DES CLIENT -----------------------------------

/**
 * Renvoie toutes les adresses des clients en bdd. Donné dans l'ordre des identifiants client
 * @route GET /admin/user/adresse
 * @group Administrateur
 * @summary Renvoie toutes les adresses des clients en BDD
 * @returns {JSON} 200 -Renvoie la liste des adresses en BDD.
 */
router.get('/admin/user/adresses', admin, adresseController.getAllAdresse);

/**
 * Renvoie les adresses d'un client selon son idClient
 * @route GET /client/adresses/:id
 * @group Utilisateur
 * @summary Renvoie toutes les adresse d'un client en BDD
 * @param {number} id.params.required - L'identifiant d'un client.
 * @returns {JSON} 200 -Renvoie toutes les adresse d'un client en BDD
 */
router.get('/client/adresses/:id(\\d+)', client, adresseController.getAdresseByIdClient);

/**
 * Renvoie une seule adresse d'un client selon son client_adresse.id
 * Renvoie l'adesse compléte avec son pays, ville, CP.
 * @route GET /client/adresse/:id
 * @group Utilisateur
 * @summary Renvoie une seule adresse d'un client selon son client_adresse.id
 * @param {number} id.param.required - L'identifiant d'une adresse.
 * @returns {JSON} 200 - Renvoie une seule adresse d'un client selon son client_adresse.id
 */
router.get('/client/adresse/:id(\\d+)', client, adresseController.getOneAdresse);

/**
 * Renvoie l'adresse de facturation d'un client selon son idClient
 * @route GET /client/adresseFacturation/:id
 * @group Utilisateur
 * @summary Renvoie l'adresse de facturation d'un client selon son idClient
 * @param {number} id.param.required - L'identifiant d'un client
 * @returns {JSON} 200 - Renvoie l'adresse de facturation d'un client selon son idClient
 */
router.get('/client/adresseFacturation/:id(\\d+)', client, adresseController.getFacturationAdresseByIdClient);

/**
 * Renvoie l'adresse d'envoie' d'un client selon son idClient
 * @route GET /client/adresseEnvoie/:id
 * @group Utilisateur
 * @summary Renvoie l'adresse d'envoie d'un client selon son idClient
 * @param {number} id.param.required - L'identifiant d'un client.
 * @returns {JSON} 200 - Renvoie l'adresse d'envoie d'un client selon son idClient
 */
router.get('/client/adresseEnvoie/:id(\\d+)', client, adresseController.getEnvoieAdresseByIdClient);


/**
 * Une route pour insérer une adresse, néccésite un mot de passe.
 * Uniquement les adresses en France sont autorisé.
 * Les données STRIPE sont également mise a jour via cette méthode.
 * Les titres d'adresses doivent être unique.
 * @route POST /client/adresse/new
 * @group Utilisateur
 * @summary Insére une nouvelle adresse 
 * @param {string} password.body.required - Le mot de passe de l'utilisateur qui souhaite rentrer une nouvelle adresse.
 * @param {string} titre.body.required - Un titre, unique pour retrouver l'adresse.
 * @param {string} prenom.body.required - 
 * @param {string} nomFamille.body.required - 
 * @param {string} ligne1.body.required - 
 * @param {string} ligne2.body - Un complément d'adresse si nécéssaire
 * @param {string} ligne3.body - Un complément d'adresse si nécéssaire
 * @param {string} codePostal.body.required - 
 * @param {string} ville.body.required - 
 * @param {string} pays.body.required - Seul la France est autorisé...
 * @param {string} telephone.body.required - 
 * @param {string} envoie.body.required - Avec la valeur "true" si cette envoie est aussi une adresse d'envoie. 
 * @param {number} id.param.required - L'identifiant d'une adresse. 
 * @returns {JSON} 200 - Les données de la nouvelle adresse insérée
 */
router.post('/client/adresse/new', cleanPassword, client, validateBody(adressePostSchema), adresseController.newAdresse);

/**
 * Une route pour mettre a jour une adresse
 * Uniquement les adresses en France sont autorisé.
 * Les données STRIPE sont également mise a jour via cette méthode.
 * Un message personnalisé est envoyé selon les données mise a jour. 
 * @route PATCH /client/adresse/:id
 * @group Utilisateur
 * @summary Met a jour une adresse ***néccésite un mot de passe
 * @param {string} password.body.required - Le mot de passe de l'utilisateur qui souhaite rentrer une nouvelle adresse.
 * @param {string} titre.body - Un titre, unique pour retrouver l'adresse.
 * @param {string} prenom.body - 
 * @param {string} nomFamille.body - 
 * @param {string} ligne1.body - 
 * @param {string} ligne2.body - Un complément d'adresse si nécéssaire
 * @param {string} ligne3.body - Un complément d'adresse si nécéssaire
 * @param {string} codePostal.body - 
 * @param {string} ville.body - 
 * @param {string} pays.body - Seul la France est autorisé...
 * @param {string} telephone.body - 
 * @param {string} envoie.body - Avec la valeur "true" si cette envoie est aussi une adresse d'envoie.
 * @returns {JSON} 200 - Les données de la nouvelle adresse mise a jour
 */
router.patch('/client/adresse/:id(\\d+)', cleanPassword, client, validateBody(adresseSchema), adresseController.updateAdresse);

/**
 * Une route pour supprimer une adresse, néccésite un mot de passe.
 * @route DELETE /client/adresse/:id
 * @group Utilisateur
 * @summary Supprime une adresse
 * @param {string} password.body.required - Le mot de passe de l'utilisateur qui souhaite supprimer une adresse.
 * @param {number} id.params.required - L'identifiant d'une adresse a supprimer.
 * @returns {JSON} 200 - Les données de l'adresse supprimée.
 */
router.delete('/client/adresse/:id(\\d+)', client, validateBody(passwordSchema), adresseController.delete);

/**
 * Une route pour supprimer toutes les adresses d'un client, néccésite un mot de passe. 
 * route accessible a tous les clients connectés.
 * @route DELETE /client/adresses/:id
 * @group Utilisateur
 * @summary Supprime des adresses d'un même client
 * @param {string} password.body.required - Le mot de passe de l'utilisateur qui souhaite supprimer ses adresses.
 * @param {number} id.params.required - L'identifiant d'un client qui souhaite supprimer toutes ses adresses.
 * @returns {JSON} 200 - Les données des adresses supprimées.
 */
router.delete('/client/adresses/:id(\\d+)', client, validateBody(passwordSchema), adresseController.deleteByIdClient);


//! ROUTE TRANSPORTEUR ---------------------

/**
 * Une route pour déterminer le type de livraison choisi par l'Utilisateur et permet de laisser un commentaire en session 
 * Aucun sms ne sera envoyé si le retrait sur le marché a été choisi.
 * Le panier est mis a jour en prenant en compte le cout du transporteur. Les données concernant les totaux sont renvoyés a l'utilisateur.
 * @route POST /client/livraisonChoix
 * @group Utilisateur
 * @summary Permet de déterminer le choix du transporteur fait par le client et de laisser un commentaire en session
 * @param {string} nomTransporteur.body.required - Le nom du transporteur, compris entre 1 et 4.
 * @param {string} commentaire.body.required - Le commentaire laissé par lors du choix du transporteur. D'une longeur max de 500 caractéres. Les caractéres suivant : <>&#=+*"|{} seront rejetés.
 * @param {boolean} sendSmsWhenShipping.body - Booléen avec true ou false comme valeur accéptée.
 * @returns {JSON} 200 -  {totalHT, totalTTC, totalTVA, coutTransporteur, transporteur, totalTTCAvecTransport, message, commentaire, sendSmsWhenShipping,}
 */
router.post('/client/livraisonChoix', clean, validateBody(choixLivraisonSchema), livraisonController.choixLivraison);


/**
 * Renvoie tous les transporteurs en BDD
 * @route GET /user/transporteurs
 * @group Utilisateur
 * @summary  Renvoie tous les transporteurs en BDD
 * @returns {JSON} 200 - {"id": 1,"nom": "DPD","description": "DPD en point relai pickup","fraisExpedition": 720,"estimeArrive": "Expédié sous 24 à 48h","estimeArriveNumber": "2","logo": "http://placeimg.com/640/480/business"}
 */
router.get('/user/transporteurs', client, livraisonController.getAllTransporteur);

/**
 * Une route pour insérer un transporteur
 * @route POST /admin/transporteur/new
 * @group Administrateur
 * @summary Insére un nouveau transporteur 
 * @param {string} nom.body.required - 
 * @param {string} description.body.required - 
 * @param {string} fraisExpedition.body.required - 
 * @param {string} estimeArrive.required - 
 * @param {string} logo.body.required - 
 * @param {string} idClient.body.required - 
 * @param {string} idCommande.body.required - 
 * @param {string} idTransporteur.body.required - 
 * @returns {JSON} 200 - Les données du nouveau transporteur inséré
 */
router.post('/admin/transporteur/new', clean, admin, validateBody(transporteurPostSchema), livraisonController.newTransporteur);

/**
 * Une route pour mettre a jour un transporteur
 * @route POST /admin/transporteur/new
 * @group Administrateur
 * @summary Met a jour un nouveau transporteur 
 * @param {number} id.params.required - L'identifiant d'un tranporteur a mettre a jour
 * @param {string} nom.body - 
 * @param {string} description.body - 
 * @param {string} fraisExpedition.body - 
 * @param {string} estimeArrive - 
 * @param {string} logo.body - 
 * @param {string} idClient.body - 
 * @param {string} idCommande.body - 
 * @param {string} idTransporteur.body - 
 * @returns {JSON} 200 - Les données du nouveau transporteur mis a jour
 */
router.patch('/admin/transporteurs/:id(\\d+)', clean, admin, validateBody(transporteurSchema), livraisonController.updateTransporteur);


/**
 * Une route pour supprimer un transporteur
 * @route DELETE /admin/transporteur/:id
 * @group Administrateur
 * @summary Supprime un transporteur
 * @param {number} id.params.required - L'identifiant d'un tranporteur a supprimer
 * @returns {JSON} 200 - Les données du transporteur supprimé
 */
router.delete('/admin/transporteur/:id(\\d+)', admin, livraisonController.deleteTransporteur);

//! ROUTE LIVRAISONS ----------------------------



/**
 * Renvoie toutes les livraisons en BDD
 * @route GET /admin/livraisons
 * @group Administrateur
 * @summary  Renvoie toutes les livraisons en BDD
 * @returns {JSON} 200 - Renvoie tous les livraisons en BDD
 */
router.get('/admin/livraisons', admin, livraisonController.getAllLivraison);

/**
 * Renvoie toutes les livraisons pour un client 
 * @route GET /user/livraisons/:id
 * @group Utilisateur
 * @summary  Renvoie toutes les livraisons d'un client en BDD
 * @param {number} id.params.required - L'identifiant d'un client dont on veut savoir toutes ses livraisons.
 * @returns {JSON} 200 - Renvoie toutes les livraisons d'un client en BDD
 */
router.get('/user/livraisons/:id(\\d+)', client, livraisonController.getByIdClient);


/**
 * Renvoie toutes les produit commandé / livré en BDD
 * @route GET /admin/produitcommande
 * @group Administrateur
 * @summary  Renvoie toutes les livraisons en BDD
 * @returns {JSON} 200 - Renvoie tous les livraisons en BDD
 */
router.get('/admin/produitcommande', admin, livraisonController.getAllLigneCommande);


/**
 * Renvoie tous les produit commandés / livrés pour un client en particulier
 * @route GET /user/produitcommande/:id
 * @group Utilisateur
 * @summary  Renvoie tous les produit commandés / livrés pour un client en particulier
 * @param {number} id.params.required - L'identifiant d'un client dont on veut savoir toutes ses lignes de commande.
 * @returns {JSON} 200 - Renvoie tous les produit commandés / livrés pour un client 
 */
router.get('/user/produitcommande/:id(\\d+)', client, livraisonController.getAllLivraisonByIdClient);


/**
 * Renvoie tous les produits commandés / livré pour une commande particuliére
 * @route GET /user/produitLivreByCommande
 * @group Utilisateur
 * @summary  Renvoie tous les produits commandés / livré pour une commande particuliére
 * @param {number} id.params.required - L'identifiant d'une commande dont on veut savoir toutes ses lignes de commande.
 * @returns {JSON} 200 - Renvoie tous les produits commandés / livré pour une commande particuliére
 */
router.get('/user/produitLivreByCommande/:id(\\d+)', client, livraisonController.getByIdCommande);


/**
 * Une route pour insérer une nouvelle livraison
 * @route POST /admin/livraison/new
 * @group Administrateur
 * @summary Insére une nouvelle livraison 
 * @param {string} numeroSuivi.body.required 
 * @param {string} confirmNumeroSuivi.body.required 
 * @param {string} commande.body.required 
 * @param {number} poid.body - 
 * @returns {JSON} 200 - Les données de la nouvelle livraison insérée
 */
router.post('/admin/livraison/new', clean, admin, validateBody(newLivraisonSchema),livraisonController.newLivraison);

/**
 * Une route pour supprimer une livraison
 * @route DELETE /admin/livraison/:id
 * @group Administrateur
 * @summary Supprime une livraison
 * @param {number} id.params.required - l'identifiant d'une livraison que l'on souhaite supprimer.
 * @returns {JSON} 200 - Les données de la livraison supprimée
 */
router.delete('/admin/livraison/:id(\\d+)', admin, livraisonController.delete);


/**
 * Une route pour modifier le choix de l'adresse d'envoi. Enléve la valeur TRUE de la précédente adresse et la met a une envoyé en paramétre.
 * @route PATCH /user/choixAdresseEnvoi/:id
 * @group Utilisateur
 * @summary Met a jour la nouvelle adresse de livraison
 * @param {number} id.params.required - L'identifiant d'une adresse a passé a TRUE
 * @returns {JSON} 200 - Les données d'une adresse de livraison mise a jour
 */
router.patch('/user/choixAdresseEnvoi/:id(\\d+)', clean, client, adresseController.setAdresseEnvoiTrue);


/**
 * Une route pour modifier le choix de l'adresse de facturation. Enléve la valeur TRUE de la précédente adresse et la met a l'adresse passé en paramétre
 * @route PATCH /user/choixAdresseFacturation/:id
 * @group Utilisateur
 * @summary Met a jour la nouvelle adresse de facturation
 * @param {number} id.params.required - L'identifiant d'une adresse qui doit être définit comme adresse de facturation.
 * @returns {JSON} 200 - Les données d'une adresse de facturation mise a jour
 */
router.patch('/user/choixAdresseFacturation/:id(\\d+)', clean, client, adresseController.setAdresseFacturationTrue);



//! ROUTES DEVELOPPEUR ----------------

/**
 * Faire appel a la méthode smsBalance envoi un sms sur le numéro de téléphone du développeur avec la balance du compte Twilio. 
 * Le numéro utilisé par Twillio doit être Anglais et celui du developpeur, en Français.
 * @route GET /dev/smsBalance
 * @group Developpeur - Twillio
 * @summary Utilise l'API de Twillio. Renvoie la balance du compte par sms au numéro souhaité. Relier au numéro du developpeur.
 * @returns {JSON} 200 -Renvoie la balance du compte par sms sur le numéro de téléphone du développeur.
 */
router.get('/dev/smsBalance', dev, adminController.smsBalance);

/**
 * Faire appel a la méthode balanceTwillio renvoi la balance du compte Twilio. 
 * @route GET /dev/balanceTwillio
 * @group Developpeur - Twillio
 * @summary Utilise l'API de Twillio. Renvoie la balance du compte.
 * @returns {JSON} 200 -Renvoie la balance du compte Twillio.
 */
router.get('/dev/balanceTwillio', dev, adminController.balanceTwillio);

/**
 * Faire appel a la méthode smsResponse envoi un sms avec le contenu voulu selon le contenu d'un sms envoyé. A modifier selon les besoins d'envoie de SMS. Il pourrait être intéressant d'envoyer l'adresse a laquel envoyé le colis pour la derniére commande par example. 
 * Actuellement la méthode répond a 3 payload différents => "Twilio ?" // "Paiement ?" // "Clients ?" // "Stripe ?" qui répond respectivement, la balance du compte Twillio, le dernier paiement effectué et le nombre de client en BDD, et la balance du compte Stripe. toujours par sms.
 * @route POST /admin/smsRespond
 * @group Developpeur
 * @summary Utilise l'API de Twillio. Permet d'envoyer un sms selon le contenu d'un sms reçu. Relier au numéro du développeur
 * @param {string} Body.body.required - Le corp du sms.
 * @returns {JSON} 200 -Renvoie un sms au numéro souhaité avec la réponse attendue.
 */
router.post('/admin/smsRespond', clean, adminController.smsRespond);

/**
 * Renvoie tous les infos twillio
 * @route GET /dev/allTwillio
 * @group Developpeur - twillio
 * @summary  Renvoie les informations de connexion au compte twillio
 * @returns {JSON} 200 - Renvoie les informations souhaitées
 */
router.get('/dev/allTwillio', dev, adminController.getAllTwillio);

/**
 * Renvoie une ligne d'infos twillio
 * @route GET /dev/oneTwillio
 * @group Developpeur - twillio
 * @summary  Renvoie une information de connexion lié a un compte twillio
 * @param {number} id.params.required -L'identifiant d'une donnée Twillio
 * @returns {JSON} 200 - Renvoie les informations souhaitées
 */
router.get('/dev/oneTwillio/:id(\\d+)', dev, adminController.getOneTwillio);

/**
 * Insére une ligne d'infos twillio
 * @route POST /dev/newTwillio
 * @group Developpeur - twillio
 * @param {string} twillioNumber.body.required -
 * @param {string} devNumber.body.required -
 * @param {string} clientNumber.body.required -
 * @param {string} accountSid.body.required -
 * @param {string} authToken.body.required -
 * @param {string} sidVerify.body.required -
 * @summary  Insére une information de connexion lié a un compte twillio
 * @returns {JSON} 200 - Renvoie les informations souhaitées
 */
router.post('/dev/newTwillio', clean, dev, adminController.newTwillio);

/**
 * Met a jour une ligne d'infos twillio
 * @route PATCH /dev/newTwillio
 * @group Developpeur - twillio
 * @summary  Met a jour une information de connexion lié a un compte twillio
 * @param {string} twillioNumber.body.required -
 * @param {string} devNumber.body.required -
 * @param {string} clientNumber.body.required -
 * @param {string} accountSid.body.required -
 * @param {string} authToken.body.required -
 * @param {string} sidVerify.body.required -
 * @param {number} id.params.required -L'identifiant d'une donnée Twillio
 * @returns {JSON} 200 - Renvoie les informations mis a jour
 */
router.patch('/dev/updateTwillio/:id(\\d+)', clean, dev, adminController.updateTwillio);

/**
 * Supprime une ligne d'infos twillio
 * @route DELETE /dev/newTwillio
 * @group Developpeur - twillio
 * @param {number} id.params.required -L'identifiant d'une donnée Twillio a supprimer
 * @summary  Supprime une information de connexion lié a un compte twillio
 * @returns {JSON} 200 - Renvoie les informations supprimé
 */
router.delete('/dev/deleteTwillio/:id(\\d+)', dev, adminController.deleteTwillio);

/**
 * Pour vérifier un paiement avec Twillio et sa méthode PSD2 // ETAPE 1
 * @route POST /dev/psd2Verify
 * @group Developpeur - twillio
 * @param {string} phoneNumber.body.required -
 * @summary  Permet de certifier un paiement, mesure de sécurité redondante si 3D secure... codé pour le plaisir ;)
 * @returns {JSON} 200 - Envoie un SMS averc un code, le montant d'un paiement et le site 
 */
router.post('/dev/psd2Verify', clean, dev, adminController.smsVerifypsd2);

/**
 * Retour de la route psq2Verify Pour vérifier un paiement avec Twillio et sa méthode PSD2 // ETAPE 2
 * @route POST /dev/psd2Check
 * @group Developpeur - twillio
 * @summary  Permet de certifier un paiement, mesure de sécurité redondante si 3D secure... codé pour le plaisir ;)
 * @returns {JSON} 200 - Valide les données reçu pas sms avec un code, le montant d'un paiement et le site 
 */
router.post('/dev/psd2Check', clean, dev, adminController.smsVerifypsd2);

/**
 * Permet de donner le privilege Administrateur a un client.
 * Route sécurisée avec Joi et MW Developpeur
 * @route PATCH /v1/updatePrivilege
 * @group Developpeur - 
 * @summary Transforme un client en Administrateur dans la base de donnée
 * @param {string} req.params.required - L'identifiant d'un client a passé au statut Administarteur.
 * @returns {JSON} 200 - {message:"Votre nouveau privilege a bien été enregistré"}
 */
router.patch('/dev/updateprivilege/:id(\\d+)', clean, dev, adminController.updatePrivilege);

//! GESTION DES EMAILS VERIFIE !

/**
 * Permet de voir tous les emails vérifié ou non pour les admins
 * Route sécurisée avec Joi et MW Developpeur
 * @route GET /v1/dev/emailVerif
 * @group Developpeur - 
 * @summary Affiche tous les emails des admins existants, vérifié ou non 
 * @returns {JSON} 200 - les email des admins, vérifié ou non
 */
router.get('/dev/emailVerif', dev, adminController.getAllEmailVerif);

/**
 * Permet de voir un email vérifié ou non pour les admins
 * Route sécurisée avec Joi et MW Developpeur
 * @route GET /v1/dev/emailVerif/:id
 * @group Developpeur - 
 * @summary Affiche un emails d'admin existant, vérifié ou non
 * @param {number} id.params.required -L'identifiant d'un email vérifié. 
 * @returns {JSON} 200 - un email d'admin, vérifié ou non
 */
router.get('/dev/emailVerif/:id(\\d+)', dev, adminController.getOneEmailVerif);

//FLAG 
//! A finir clean swagger doc ! _____________________-------------------______________--------------------_______________-_-_-_-_-_-_-_-_-_-_-_-
/**
 * Permet de voir tous un email vérifié ou non pour les admins, selon son id Client
 * Route sécurisée avec Joi et MW Developpeur
 * @route GET /v1/dev/emailVerifByIdClient/:id
 * @group Developpeur - 
 * @summary Affiche un emails d'admin existant, vérifié ou non, selon son id Client
 * @returns {JSON} 200 - un email d'admin, vérifié ou non
 */
router.get('/dev/emailVerifByIdClient/:id(\\d+)', dev, adminController.getEmailVerifByIdClient);

/**
 * Permet de d'insérer un email pour un admin
 * Route sécurisée avec Joi et MW Developpeur
 * @route POST /v1/dev/newEmailVerif
 * @group Developpeur - 
 * @summary Insére un email d'admins existant, non vérifié 
 * @returns {JSON} 200 - un email d'admin, non vérifié
 */
router.post('/dev/newEmailVerif', clean, dev, adminController.newVerifEmail);

/**
 * Permet de mettre a jour un email pour un admin
 * Route sécurisée avec Joi et MW Developpeur
 * @route PATCH /v1/dev/updateEmailVerif
 * @group Developpeur - 
 * @summary Met a jour un email d'admins, non vérifié 
 * @returns {JSON} 200 - un email d'admin, non vérifié
 */
router.patch('/dev/updateEmailVerif', clean, dev, adminController.updateVerifEmail);

/**
 * Permet de supprimer un email pour un admin
 * Route sécurisée avec Joi et MW Developpeur
 * @route DELETE /v1/dev/delEmailVerif
 * @group Developpeur - 
 * @summary Supprime un email d'admins 
 * @returns {JSON} 200 - un email d'admin supprimé
 */
router.delete('/dev/delEmailVerif', dev, adminController.deleteVerifEmail);

/**
 * Permet de supprimer un email pour un admin selon son id Client
 * Route sécurisée avec Joi et MW Developpeur
 * @route DELETE /v1/dev/delEmailVerifByIdClient
 * @group Developpeur - 
 * @summary Supprime un email d'admin selon son id Client 
 * @returns {JSON} 200 - un email d'admin supprimé
 */
router.delete('/dev/delEmailVerifByIdClient', dev, adminController.deleteVerifEmailByIdClient);

//! GESTION DES ADMINS PHONE !

/**
 * Permet de voir tous les numéros de téphone vérifié pour les admins
 * Route sécurisée avec Joi et MW Developpeur
 * @route GET /v1/dev/adminPhone
 * @group Developpeur - 
 * @summary Affiche tous les adminPhone des admins 
 * @returns {JSON} 200 - les adminPhone des admins
 */
router.get('/dev/adminPhone', dev, adminController.getAllPhone);

/**
 * Permet de voir un adminPhone pour un admin (forcemment vérifié si il est en BDD)
 * Route sécurisée avec Joi et MW Developpeur
 * @route GET /v1/dev/Phone/:id
 * @group Developpeur - 
 * @summary Affiche un adminPhone d'un admin 
 * @returns {JSON} 200 - un adminPhone d'un admin
 */
router.get('/dev/Phone/:id(\\d+)', dev, adminController.getOnePhone);

/**
 * Permet de voir un adminPhone pour un admin selon son id Client
 * Route sécurisée avec Joi et MW Developpeur
 * @route GET /v1/dev/PhoneByIdClient/:id
 * @group Developpeur - 
 * @summary Affiche un adminPhone d'un admin selon son id Client
 * @returns {JSON} 200 - un adminPhone d'un admin
 */
router.get('/dev/PhoneByIdClient/:id(\\d+)', dev, adminController.getPhoneByIdClient);


/**
 * Permet de supprimer un adminPhone pour un admin
 * Route sécurisée avec Joi et MW Developpeur
 * @route DELETE /v1/dev/delPhone
 * @group Developpeur - 
 * @summary Supprime un adminPhone d'un admin - Seule la méthode Verify permet d'en réinsérer un !
 * @returns {JSON} 200 - un adminPhone d'admin supprimé
 */
router.delete('/dev/delPhone', dev, adminController.deletePhone);

/**
 * Permet de supprimer un adminPhone pour un admin selon son id Client
 * Route sécurisée avec Joi et MW Developpeur
 * @route DELETE /v1/dev/delPhoneByIdClient
 * @group Developpeur - 
 * @summary Supprime un adminPhone d'admins selon son id Client 
 * @returns {JSON} 200 - un adminPhone d'admin supprimé
 */
router.delete('/dev/delPhoneByIdClient', dev, adminController.deletePhoneByIdClient);



//! PRIVILEGE


/**
 * Permet de voir tous les priviléges
 * Route sécurisée avec Joi et MW Developpeur
 * @route GET /v1/dev/privilege
 * @group Developpeur - 
 * @summary Affiche tous les privilege des admins 
 * @returns {JSON} 200 - les privilege des admins
 */
router.get('/dev/privilege', dev, adminController.getAllPrivilege);

/**
 * Permet de voir un privilege 
 * Route sécurisée avec Joi et MW Developpeur
 * @route GET /v1/dev/privilege/:id
 * @group Developpeur - 
 * @summary Affiche un privilege 
 * @returns {JSON} 200 - un privilege 
 */
router.get('/dev/privilege/:id(\\d+)', dev, adminController.getOnePrivilege);

/**
 * Permet de d'insérer un privilege 
 * Route sécurisée avec Joi et MW Developpeur
 * @route POST /v1/dev/newPrivilege
 * @group Developpeur - 
 * @summary Insére un privilege
 * @returns {JSON} 200 - un privilege
 */
router.post('/dev/newPrivilege', clean, dev, adminController.newPrivilege);


/**
 * Permet de supprimer un privilege pour un admin
 * Route sécurisée avec Joi et MW Developpeur
 * @route DELETE /v1/dev/delPhone
 * @group Developpeur - 
 * @summary Supprime un privilege 
 * @returns {JSON} 200 - un privilege supprimé
 */
router.delete('/dev/delPrivilege', dev, adminController.deletePrivilege);


//! methodes pour la gestion du panier en session

/**
 * Une route pour voir ce qu'on a dans le panier
 * route accessible a tous 
 * @route GET /user/panier
 * @group Utilisateur
 * @summary Affiche les articles d'un panier selon la session
 * @returns {JSON} 200 - les articles présent dans ce panier et leurs caractéristiques
 */
router.get('/user/panier', panierController.getPanier);


/**
 * Une route pour ajouter un article dans le panier
 * route accessible a tous 
 * @route GET /user/addPanier
 * @group Utilisateur
 * @summary Ajoute un article dans le panier
 * @returns {JSON} 200 - les articles ajouté dans ce panier et leurs caractéristiques
 */
router.get('/user/addPanier/:id(\\d+)', panierController.addArticlePanier);

/**
 * Une route pour supprimer un article dans le panier
 * route accessible a tous 
 * @route DELETE /user/delPanier
 * @group Utilisateur
 * @summary Supprime un article dans le panier
 * @returns {JSON} 200 - les articles restant dans le panier et leurs caractéristiques
 */
router.delete('/user/delPanier/:id(\\d+)', panierController.delArticlePanier);

//! methodes pour la gestion du panier en base de données !

/**
 * Une route pour voir tous les paniers en BDD
 * @route GET /admin/allPanier
 * @group Panier - Gestion du panier en base de donnée
 * @summary Affiche les paniers en BDD
 * @returns {JSON} 200 - les paniers présent en BDD et leurs caractéristiques
 */
router.get('/admin/allPanier', panierController.getAll);

/**
 * Une route pour voir un panier en particuler
 * @route GET /admin/panier/:id
 * @group Panier - Gestion du panier en base donnée
 * @summary Affiche un panier en particulier
 * @param {panier.Model} req.params - les informations d'un panier qu'on doit fournir
 * @returns {JSON} 200 - Les données d'un panier selon son id
 */
router.get('/admin/panier/:id(\\d+)', panierController.getOne);

/**
 * Une route pour insérer un panier
 * @route POST /admin/newPanier
 * @group Panier - Gestion du panier en base donnée
 * @summary Insére un nouveau panier
 * @returns {JSON} 200 - Les données du nouveau panier inséré
 */
router.post('/admin/newPanier', clean, admin, panierController.new);

/**
 * Une route pour mette a jour un panier
 * @route PATCH /admin/updatePanier/:id
 * @group Panier - Gestion du panier en base donnée
 * @summary Met à jour un nouveau panier
 * @param {panier.Model} req.params - les informations d'un panier qu'on doit fournir
 * @returns {JSON} 200 - Les données du nouveau panier mis a jour
 */
router.patch('/admin/updatePanier/:id(\\d+)', clean, admin, panierController.update);

/**
 * Une route pour supprimmer un panier
 * @route DELETE /admin/delPanier
 * @group Panier - Gestion du panier en base donnée
 * @summary Supprimme un nouveau panier
 * @param {admin.Model} req.params - les informations d'un panier qu'on doit fournir
 * @returns {JSON} 200 - Les données du panier supprimmé
 */
router.delete('/admin/delPanier/:id(\\d+)', admin, panierController.delete);

/**
 * Une route pour supprimmer un panier selon l'id client
 * @route DELETE /admin/delPanierByIdClient
 * @group Panier - Gestion du panier en base donnée
 * @summary Supprimme un nouveau panier selon son Id client
 * @param {admin.Model} req.params - les informations d'un panier qu'on doit fournir
 * @returns {JSON} 200 - Les données du panier supprimmé
 */
router.delete('/admin/delPanierByIdClient/:id(\\d+)', admin, panierController.deleteByIdClient);

//! ROUTES POUR LA VUE D'UN PRODUIT OU DE TOUS LES ARTICLES 


/**
 * Une route pour voir un article en particuler
 * route accessible a tous 
 * @route GET /user/produit/:id
 * @group Produit - Gestion des produits
 * @summary Affiche un article en particulier
 * @returns {JSON} 200 - Les données d'un produit selon son id
 */
router.get('/user/produit/:id(\\d+)', produitController.getOne);

/**
 * Une route pour voir tous les articles //! Attention l'adresse de la route est lié à la clé REDIS dans le searchController.
 * route accessible a tous 
 * @route GET /user/produits
 * @group Produit - Gestion des produits
 * @summary Affiche tous les articles 
 * @returns {JSON} 200 - Les données de tous les produits
 */
router.get('/user/produits', cache, produitController.getAll);

/**
 * Une route pour voir tous les articles d'une catégorie
 * route accessible a tous 
 * @route GET /user/produitByCategorie/:id
 * @group Produit - Gestion des produits
 * @param {admin.Model} req.params - les informations d'un produit qu'on doit fournir
 * @summary Affiche des articles lié a une catégorie précise
 * @returns {JSON} 200 - Les données de tous les produit selon l'id de la catégorie choisie
 */
router.get('/user/produitByCategorie/:id(\\d+)', produitController.articleByCategorieId);

/**
 * Une route pour insérer un produit
 * route accessible a tous
 * @route POST /admin/newProduit
 * @group Produit - Gestion des produits
 * @summary Insére un nouveau produit
 * @returns {JSON} 200 - Les données de la nouvelle produit inséré
 */
router.post('/admin/newProduit', clean, admin, produitController.new);

/**
 * Une route pour mette a jour un produit
 * route accessible a tous
 * @route PATCH /admin/updateProduit/:id
 * @group Produit - Gestion des produits
 * @summary Met à jour un nouveau produit
 * @param {produit.Model} req.params - les informations d'un produit qu'on doit fournir
 * @returns {JSON} 200 - Les données du nouveau produit mis a jour
 */
router.patch('/admin/updateProduit/:id(\\d+)', clean, admin, produitController.update);

/**
 * Une route pour supprimmer un produit
 * @route DELETE /admin/delProduit
 * @group Produit - Gestion des produits
 * @summary Supprimme un nouveau produit
 * @param {produit.Model} req.params - les informations d'un produit qu'on doit fournir
 * @returns {JSON} 200 - Les données du produit supprimmé
 */
router.delete('/admin/delProduit/:id(\\d+)', admin, produitController.delete);



//!ROUTES POUR LA GESTION DE CATÉGORIE

/**
 * Une route pour voir  une catégorie
 * route accessible a tous
 * @route GET /user/categorie/:id
 * @group Categorie - Gestion des categories
 * @summary Affiche une catégorie
 * @param {categorie.Model} req.params - les informations d'un produit qu'on doit fournir
 * @returns {JSON} 200 - Les données d'une catégorie
 */
router.get('/user/categorie/:id(\\d+)', produitController.getOneCategorie);

/**
 * Une route pour voir toutes les catégories
 * route accessible a tous
 * @route GET /user/categorie/:id
 * @group Categorie - Gestion des categories
 * @summary Affiche toutes les catégories
 * @returns {JSON} 200 - Les données de toutes les catégories
 */
router.get('/user/allCategorie', produitController.getAllCategorie);

/**
 * Une route pour insérer une catégorie
 * route accessible a tous
 * @route POST /admin/newCategorie
 * @group Categorie - Gestion des categories
 * @summary Insére une nouvelle catégorie
 * @returns {JSON} 200 - Les données de la nouvelle catégorie inséré
 */
router.post('/admin/newCategorie', clean, admin, produitController.newCategorie);

/**
 * Une route pour mette a jour une catégorie
 * route accessible a tous
 * @route PATCH /admin/updateCategorie
 * @group Categorie - Gestion des categories
 * @summary Met à jour une nouvelle catégorie
 * @param {produit.Model} req.params - les informations d'une catégorie qu'on doit fournir
 * @returns {JSON} 200 - Les données de la nouvelle catégorie mis a jour
 */
router.patch('/admin/updateCategorie/:id(\\d+)', clean, admin, produitController.updateCategorie);

/**
 * Une route pour supprimmer une catégorie, route accessible a tous
 * @route DELETE /admin/delCategorie
 * @group Categorie - Gestion des categories
 * @summary Supprimme une nouvelle catégorie
 * @param {produit.Model} req.params - les informations d'une catégorie qu'on doit fournir
 * @returns {JSON} 200 - Les données de la catégorie supprimmée
 */
router.delete('/admin/delCategorie/:id(\\d+)', admin, produitController.deleteCategorie);




//!ROUTES POUR LA GESTION DES CARACTÉRISTIQUES


/**
 * Une route pour voir  une caracteristique
 * @route GET /admin/caracteristique/:id
 * @group Caracteristique - Gestion des caracteristiques
 * @summary Affiche une caracteristique
 * @param {produit.Model} req.params - les informations d'une catactéristique qu'on doit fournir
 * @returns {JSON} 200 - Les données d'une caracteristique
 */
router.get('/admin/caracteristique/:id(\\d+)', admin, produitController.getOneCaracteristique);

/**
 * Une route pour voir toutes les caracteristiques
 * @route GET /admin/caracteristique/:id
 * @group Caracteristique - Gestion des caracteristiques
 * @summary Affiche toutes les caracteristiques
 * @returns {JSON} 200 - Les données de toutes les caracteristiques
 */
router.get('/admin/allCaracteristique', admin, produitController.getAllCaracteristique);

/**
 * Une route pour voir  une caracteristique selon son id produit 
 * @route GET /admin/caracteristiqueByIdProduit/:id
 * @group Caracteristique - Gestion des caracteristiques
 * @summary Affiche une caracteristique selon son id produit
 * @param {produit.Model} req.params - les informations d'une catactéristique qu'on doit fournir
 * @returns {JSON} 200 - Les données d'une caracteristique selon son id produit
 */
router.get('/admin/caracteristiqueByIdProduit/:id(\\d+)', admin, produitController.getCaracteristiqueByIdProduit);

/**
 * Une route pour insérer une caracteristique
 * @route POST /admin/newCaracteristique
 * @group Caracteristique - Gestion des caracteristiques
 * @summary Insére une nouvelle caracteristique
 * @returns {JSON} 200 - Les données de la nouvelle caracteristique inséré
 */
router.post('/admin/newCaracteristique', clean, admin, produitController.newCaracteristique);

/**
 * Une route pour mette a jour une caracteristique
 * @route PATCH /admin/updateCaracteristique
 * @group Caracteristique - Gestion des caracteristiques
 * @summary Met à jour une nouvelle caracteristique
 * @param {produit.Model} req.params - les informations d'une catactéristique qu'on doit fournir
 * @returns {JSON} 200 - Les données de la nouvelle caracteristique mis a jour
 */
router.patch('/admin/updateCaracteristique/:id(\\d+)', clean, admin, produitController.updateCaracteristique);

/**
 * Une route pour supprimmer une caracteristique
 * @route DELETE /admin/delCaracteristique
 * @group Caracteristique - Gestion des caracteristiques
 * @summary Supprimme une nouvelle caracteristique
 * @param {produit.Model} req.params - les informations d'une catactéristique qu'on doit fournir
 * @returns {JSON} 200 - Les données de la caracteristique supprimmée
 */
router.delete('/admin/delCaracteristique/:id(\\d+)', admin, produitController.deleteCaracteristique);

/**
 * Une route pour supprimmer une caracteristique selon son id produit
 * @route DELETE /admin/delCaracteristiqueByIdProduit
 * @group Caracteristique - Gestion des caracteristiques
 * @summary Supprimme une nouvelle caracteristique selon son id produit
 * @param {produit.Model} req.params - les informations d'une catactéristique qu'on doit fournir
 * @returns {JSON} 200 - Les données de la caracteristique supprimmée
 */
router.delete('/admin/delCaracteristiqueByIdProduit/:id(\\d+)', admin, produitController.deleteCaracteristiqueByIdProduit);


//! GESTION DES STOCKS


/**
 * Une route pour voir  un stock
 * @route GET /admin/stock/:id
 * @group stock - Gestion des stocks
 * @summary Affiche un stock
 * @param {produit.Model} req.params - les informations d'un stock qu'on doit fournir
 * @returns {JSON} 200 - Les données d'un stock
 */
router.get('/admin/stock/:id(\\d+)', admin, produitController.getOneStock);

/**
 * Une route pour voir tous les stocks
 * @route GET /admin/allStock
 * @group stock - Gestion des stocks
 * @summary Affiche tous les stocks
 * @returns {JSON} 200 - Les données de tous les stocks
 */
router.get('/admin/allStock', admin, produitController.getAllStock);

/**
 * Une route pour voir un stock selon son id produit 
 * @route GET /admin/stockByIdProduit/:id
 * @group stock - Gestion des stocks
 * @summary Affiche un stock selon son id produit
 * @param {produit.Model} req.params - les informations d'un stock qu'on doit fournir
 * @returns {JSON} 200 - Les données d'un stock selon son id produit
 */
router.get('/admin/stockByIdProduit/:id(\\d+)', admin, produitController.getStockByIdProduit);

/**
 * Une route pour insérer un stock
 * @route POST /admin/newStock
 * @group stock - Gestion des stocks
 * @summary Insére un nouveau stock
 * @returns {JSON} 200 - Les données d'un nouveau stock inséré
 */
router.post('/admin/newStock', clean, admin, produitController.newStock);

/**
 * Une route pour mette a jour un stock
 * @route PATCH /admin/updateStock/:id
 * @group stock - Gestion des stocks
 * @summary Met à jour un nouveau stock
 * @param {produit.Model} req.params - les informations d'un stock qu'on doit fournir
 * @returns {JSON} 200 - Les données d'un nouveau stock mis a jour
 */
router.patch('/admin/updateStock/:id(\\d+)', clean, admin, produitController.updateStock);

/**
 * Une route pour supprimmer un stock
 * @route DELETE /admin/delStock
 * @group stock - Gestion des stocks
 * @summary Supprimme un nouveau stock
 * @param {produit.Model} req.params - les informations d'un stock qu'on doit fournir
 * @returns {JSON} 200 - Les données d'un stock supprimmé
 */
router.delete('/admin/delStock/:id(\\d+)', admin, produitController.deleteStock);

/**
 * Une route pour supprimmer une stock selon son id produit
 * @route DELETE /admin/delStockByIdProduit
 * @group stock - Gestion des stocks
 * @summary Supprimme un nouveau stock selon son id produit
 * @param {produit.Model} req.params - les informations d'un stock qu'on doit fournir
 * @returns {JSON} 200 - Les données d'un stock supprimmé
 */
router.delete('/admin/delStockByIdProduit/:id(\\d+)', admin, produitController.deleteStockByIdProduit);



//! FOURNISSEUR


/**
 * Une route pour voir un Fournisseur
 * @route GET /admin/fournisseur/:id
 * @group Fournisseur - Gestion des fourniseurs
 * @summary Affiche un Fournisseur
 * @param {produit.Model} req.params - les informations d'un fournisseur qu'on doit fournir
 * @returns {JSON} 200 - Les données d'un Fournisseur
 */
router.get('/admin/fournisseur/:id(\\d+)', admin, produitController.getOneFournisseur);

/**
 * Une route pour voir tous les Fournisseurs
 * @route GET /admin/allFournisseur
 * @group Fournisseur - Gestion des Fournisseurs
 * @summary Affiche tous les Fournisseurs
 * @returns {JSON} 200 - Les données de tous les Fournisseurs
 */
router.get('/admin/allFournisseur', admin, produitController.getAllFournisseur);

/**
 * Une route pour insérer un Fournisseur
 * @route POST /admin/newFournisseur
 * @group Fournisseur - Gestion des Fournisseurs
 * @summary Insére un nouveau Fournisseur
 * @returns {JSON} 200 - Les données d'un nouveau Fournisseur inséré
 */
router.post('/admin/newFournisseur', clean, admin, produitController.newFournisseur);

/**
 * Une route pour mette a jour un Fournisseur
 * @route PATCH /admin/updateFournisseur/:id
 * @group Fournisseur - Gestion des Fournisseurs
 * @summary Met à jour un nouveau Fournisseur
 * @param {produit.Model} req.params - les informations d'un fournisseur qu'on doit fournir
 * @returns {JSON} 200 - Les données d'un nouveau Fournisseur mis a jour
 */
router.patch('/admin/updateFournisseur/:id(\\d+)', clean, admin, produitController.updateFournisseur);

/**
 * Une route pour supprimmer un Fournisseur
 * @route DELETE /admin/delFournisseur
 * @group Fournisseur - Gestion des Fournisseurs
 * @summary Supprimme un nouveau Fournisseur
 * @param {produit.Model} req.params - les informations d'un fournisseur qu'on doit fournir
 * @returns {JSON} 200 - Les données d'un Fournisseur supprimmé
 */
router.delete('/admin/delFournisseur/:id(\\d+)', admin, produitController.deleteFournisseur);



//! TABLE DE LIAISON "FOURNIE"

/**
 * Une route pour voir un Fournisseur
 * @route GET /admin/fournie/:id
 * @group Fournie - Table de liaison avec Fournisseur
 * @summary Affiche un Fournie
 * @param {produit.Model} req.params - les informations d'un fournie qu'on doit fournir
 * @returns {JSON} 200 - Les données d'un Fournie
 */
router.get('/admin/fournie/:id(\\d+)', admin, produitController.getOneFournie);

/**
 * Une route pour voir tous les Fournies
 * @route GET /admin/allFournie
 * @group Fournie - Table de liaison avec Fournisseur
 * @summary Affiche tous les Fournies
 * @returns {JSON} 200 - Les données de tous les Fournies
 */
router.get('/admin/allFournie', admin, produitController.getAllFournie);

/**
 * Une route pour insérer un Fournie
 * @route POST /admin/newFournie
 * @group Fournie - Table de liaison avec Fournisseur
 * @summary Insére un nouveau Fournie
 * @returns {JSON} 200 - Les données d'un nouveau Fournie inséré
 */
router.post('/admin/newFournie', clean, admin, produitController.newFournie);

/**
 * Une route pour mette a jour un Fournie
 * @route PATCH /admin/updateFournie/:id
 * @group Fournie - Table de liaison avec Fournisseur
 * @summary Met à jour un nouveau Fournie
 * @param {produit.Model} req.params - les informations d'un fournie qu'on doit fournir
 * @returns {JSON} 200 - Les données d'un nouveau Fournie mis a jour
 */
router.patch('/admin/updateFournie/:id(\\d+)', clean, admin, produitController.updateFournie);

/**
 * Une route pour supprimmer un Fournie
 * @route DELETE /admin/delFournie
 * @group Fournie - Table de liaison avec Fournisseur
 * @summary Supprimme un nouveau Fournie
 * @param {produit.Model} req.params - les informations d'un fournie qu'on doit fournir
 * @returns {JSON} 200 - Les données d'un Fournie supprimmé
 */
router.delete('/admin/delFournie/:id(\\d+)', admin, produitController.deleteFournie);



//! REDUCTION 


/**
 * Une route pour voir une Reduction
 * @route GET /admin/reduction/:id
 * @group Reduction - Gestion des Reductions
 * @summary Affiche une Reduction
 * @param {produit.Model} req.params - les informations d'une Reduction qu'on doit fournir
 * @returns {JSON} 200 - Les données d'un Reduction
 */
router.get('/admin/reduction/:id(\\d+)', admin, produitController.getOneReduction);

/**
 * Une route pour voir toutes les Reductions
 * @route GET /admin/allReduction
 * @group Reduction - Gestion des Reductions
 * @summary Affiche toutes les Reductions
 * @returns {JSON} 200 - Les données de toutes les Reductions
 */
router.get('/admin/allReduction', admin, produitController.getAllReduction);

/**
 * Une route pour insérer une Reduction
 * @route POST /admin/newReduction
 * @group Reduction - Gestion des Reductions
 * @summary Insére un nouvelle Reduction
 * @returns {JSON} 200 - Les données d'un nouvelle Reduction inséré
 */
router.post('/admin/newReduction', clean, admin, produitController.newReduction);

/**
 * Une route pour mette a jour une Reduction
 * @route PATCH /admin/updateReduction/:id
 * @group Reduction - Gestion des Reductions
 * @summary Met à jour une nouvelle Reduction
 * @param {produit.Model} req.params - les informations d'un Reduction qu'on doit fournir
 * @returns {JSON} 200 - Les données d'une nouvelle Reduction mise a jour
 */
router.patch('/admin/updateReduction/:id(\\d+)', clean, admin, produitController.updateReduction);

/**
 * Une route pour supprimmer une Reduction
 * @route DELETE /admin/delReduction
 * @group Reduction - Gestion des Reductions
 * @summary Supprimme un nouvelle Reduction
 * @param {produit.Model} req.params - les informations d'un Reduction qu'on doit fournir
 * @returns {JSON} 200 - Les données d'une Reduction supprimmée
 */
router.delete('/admin/delReduction/:id(\\d+)', admin, produitController.deleteReduction);



//! TVA--------------------------------------------------------



/**
 * Une route pour voir une TVA
 * @route GET /admin/Tva/:id
 * @group TVA - Gestion des TVAs
 * @summary Affiche une TVA
 * @param {produit.Model} req.params - les informations d'une TVA qu'on doit fournir
 * @returns {JSON} 200 - Les données d'un TVA
 */
router.get('/admin/Tva/:id(\\d+)', admin, produitController.getOneTva);

/**
 * Une route pour voir toutes les TVAs
 * @route GET /admin/allTVA
 * @group TVA - Gestion des TVAs
 * @summary Affiche toutes les TVAs
 * @returns {JSON} 200 - Les données de toutes les TVAs
 */
router.get('/admin/allTva', admin, produitController.getAllTva);

/**
 * Une route pour insérer une TVA
 * @route POST /admin/newTVA
 * @group TVA - Gestion des TVAs
 * @summary Insére un nouvelle TVA
 * @returns {JSON} 200 - Les données d'un nouvelle TVA inséré
 */
router.post('/admin/newTva', clean, admin, produitController.newTva);

/**
 * Une route pour mette a jour une TVA
 * @route PATCH /admin/updateTVA/:id
 * @group TVA - Gestion des TVAs
 * @summary Met à jour une nouvelle TVA
 * @param {produit.Model} req.params - les informations d'un TVA qu'on doit fournir
 * @returns {JSON} 200 - Les données d'une nouvelle TVA mise a jour
 */
router.patch('/admin/updateTva/:id(\\d+)', clean, admin, produitController.updateTva);

/**
 * Une route pour supprimmer une TVA
 * @route DELETE /admin/delTVA
 * @group TVA - Gestion des TVAs
 * @summary Supprimme un nouvelle TVA
 * @param {produit.Model} req.params - les informations d'un TVA qu'on doit fournir
 * @returns {JSON} 200 - Les données d'une TVA supprimmée
 */
router.delete('/admin/delTva/:id(\\d+)', admin, produitController.deleteTva);


//! IMAGE-----------------------------------------------------------------

/**
 * Une route pour voir une image
 * @route GET /admin/image/:id
 * @group image - Gestion des images
 * @summary Affiche une image
 * @param {produit.Model} req.params - les informations d'un image qu'on doit fournir
 * @returns {JSON} 200 - Les données d'une image
 */
router.get('/admin/image/:id(\\d+)', admin, produitController.getOneImage);

/**
 * Une route pour voir tous les images
 * @route GET /admin/allImage
 * @group image - Gestion des images
 * @summary Affiche toutes les images
 * @returns {JSON} 200 - Les données de tous les images
 */
router.get('/admin/allImage', admin, produitController.getAllImage);

/**
 * Une route pour voir une image selon son id produit 
 * @route GET /admin/imageByIdProduit/:id
 * @group stock - Gestion des images
 * @summary Affiche une image selon son id produit
 * @param {produit.Model} req.params - les informations d'une image qu'on doit fournir
 * @returns {JSON} 200 - Les données d'une image selon son id produit
 */
router.get('/admin/imageByIdProduit/:id(\\d+)', admin, produitController.getImageByIdProduit);

/**
 * Une route pour insérer une image
 * @route POST /admin/newImage
 * @group image - Gestion des images
 * @summary Insére une nouveau image
 * @returns {JSON} 200 - Les données d'une nouveau image inséré
 */
router.post('/admin/newimage', clean, admin, produitController.newImage);

/**
 * Une route pour mette a jour une image
 * @route PATCH /admin/updateImage/:id
 * @group image - Gestion des images
 * @summary Met à jour une nouveau image
 * @param {produit.Model} req.params - les informations d'une image qu'on doit fournir
 * @returns {JSON} 200 - Les données d'une nouveau image mis a jour
 */
router.patch('/admin/updateImage/:id(\\d+)', clean, admin, produitController.updateImage);

/**
 * Une route pour supprimmer une image
 * @route DELETE /admin/delImage/:id
 * @group image - Gestion des images
 * @summary Supprimme une nouveau image
 * @param {produit.Model} req.params - les informations d'une image qu'on doit fournir
 * @returns {JSON} 200 - Les données d'une image supprimmé
 */
router.delete('/admin/delImage/:id(\\d+)', admin, produitController.deleteImage);

/**
 * Une route pour supprimmer une image selon son id produit
 * @route DELETE /admin/delImageByIdProduit/:id
 * @group image - Gestion des images
 * @summary Supprimme une nouveau image selon son id produit
 * @param {produit.Model} req.params - les informations d'une image qu'on doit fournir
 * @returns {JSON} 200 - Les données d'une image supprimmé
 */
router.delete('/admin/delImageByIdProduit/:id(\\d+)', admin, produitController.deleteImageByIdProduit);



//! SOUS-CATEGORIE------------------------------------------


/**
 * Une route pour voir une SousCategorie
 * @route GET /admin/sousCategorie/:id
 * @group SousCategorie - Gestion des SousCategories
 * @summary Affiche une SousCategorie
 * @param {produit.Model} req.params - les informations d'une SousCategorie qu'on doit fournir
 * @returns {JSON} 200 - Les données d'une SousCategorie
 */
router.get('/admin/sousCategorie/:id(\\d+)', admin, produitController.getOneSousCategorie);

/**
 * Une route pour voir tous les SousCategories
 * @route GET /admin/allSousCategorie
 * @group SousCategorie - Gestion des SousCategories
 * @summary Affiche toutes les SousCategories
 * @returns {JSON} 200 - Les données de toutes les SousCategories
 */
router.get('/admin/allSousCategorie', admin, produitController.getAllSousCategorie);

/**
 * Une route pour voir une SousCategorie selon son id Categorie 
 * @route GET /admin/sousCategorieByIdCategorie/:id
 * @group SousCategorie - Gestion des SousCategories
 * @summary Affiche une SousCategorie selon son id Categorie
 * @param {produit.Model} req.params - les informations d'une SousCategorie qu'on doit fournir
 * @returns {JSON} 200 - Les données d'une SousCategorie selon son id Categorie
 */
router.get('/admin/sousCategorieByIdCategorie/:id(\\d+)', admin, produitController.getSousCategorieByIdCategorie);

/**
 * Une route pour insérer une SousCategorie
 * @route POST /admin/newSousCategorie
 * @group SousCategorie - Gestion des SousCategories
 * @summary Insére une nouvelle SousCategorie
 * @returns {JSON} 200 - Les données d'une nouvelle SousCategorie inséré
 */
router.post('/admin/newSousCategorie', clean, admin, produitController.newSousCategorie);

/**
 * Une route pour mette a jour une SousCategorie
 * @route PATCH /admin/updateSousCategorie/:id
 * @group SousCategorie - Gestion des SousCategories
 * @summary Met à jour une nouvelle SousCategorie
 * @param {produit.Model} req.params - les informations d'une SousCategorie qu'on doit fournir
 * @returns {JSON} 200 - Les données d'une nouvelle SousCategorie mis a jour
 */
router.patch('/admin/updateSousCategorie/:id(\\d+)', clean, admin, produitController.updateSousCategorie);

/**
 * Une route pour supprimmer une SousCategorie
 * @route DELETE /admin/delSousCategorie/:id
 * @group SousCategorie - Gestion des SousCategories
 * @summary Supprimme une nouvelle SousCategorie
 * @param {produit.Model} req.params - les informations d'une SousCategorie qu'on doit fournir
 * @returns {JSON} 200 - Les données d'une SousCategorie supprimmé
 */
router.delete('/admin/delSousCategorie/:id(\\d+)', admin, produitController.deleteSousCategorie);

/**
 * Une route pour supprimmer une iSousCategorieselon son id produit
 * @route DELETE /admin/delSousCategorieByIdCategorie/:id
 * @group SousCategorie - Gestion des sSousCategorie
 * @summary Supprimme une nouvelle SousCategorie selon son id Categorie
 * @param {produit.Model} req.params - les informations d'une SousCategorie qu'on doit fournir
 * @returns {JSON} 200 - Les données d'une SousCategorie supprimmé
 */
router.delete('/admin/delSousCategorieByIdCategorie/:id(\\d+)', admin, produitController.deleteSousCategorieByIdCategorie);

//! SOUS-CATEGORIE IMAGE 

/**
 * Une route pour voir une SsCatImage
 * @route GET /admin/SsCatImage/:id
 * @group SsCatImage - Gestion des SSsCatImage
 * @summary Affiche une SsCatImage
 * @param {produit.Model} req.params - les informations d'une SsCatImage qu'on doit fournir
 * @returns {JSON} 200 - Les données d'une SsCatImage
 */
router.get('/admin/SsCatImage/:id(\\d+)', admin, produitController.getOneSsCatImage);

/**
 * Une route pour voir toutes les SsCatImages
 * @route GET /admin/allSsCatImage
 * @group SsCatImage - Gestion des SsCatImages
 * @summary Affiche toutes les SsCatImages
 * @returns {JSON} 200 - Les données de toutes les SsCatImages
 */
router.get('/admin/allSsCatImage', admin, produitController.getAllSsCatImage);

/**
 * Une route pour voir une SsCatImage selon son id Categorie 
 * @route GET /admin/SsCatImageByIdSsCat/:id
 * @group SsCatImage - Gestion des SsCatImages
 * @summary Affiche une SsCatImage selon son id Categorie
 * @param {produit.Model} req.params - les informations d'une SsCatImage qu'on doit fournir
 * @returns {JSON} 200 - Les données d'une SsCatImage selon son id Categorie
 */
router.get('/admin/SsCatImageByIdSsCat/:id(\\d+)', admin, produitController.getSsCatImageByIdSsCat);

/**
 * Une route pour insérer une SsCatImage
 * @route POST /admin/newSsCatImage
 * @group SsCatImage - Gestion des SsCatImages
 * @summary Insére une nouvelle SsCatImage
 * @returns {JSON} 200 - Les données d'une nouvelle SsCatImage inséré
 */
router.post('/admin/newSsCatImage', clean, admin, produitController.newSsCatImage);

/**
 * Une route pour mette a jour une SsCatImage
 * @route PATCH /admin/updateSsCatImage/:id
 * @group SsCatImage - Gestion des SsCatImages
 * @summary Met à jour une nouvelle SsCatImage
 * @param {produit.Model} req.params - les informations d'une SsCatImage qu'on doit fournir
 * @returns {JSON} 200 - Les données d'une nouvelle SsCatImage mis a jour
 */
router.patch('/admin/updateSsCatImage/:id(\\d+)', clean, admin, produitController.updateSsCatImage);

/**
 * Une route pour supprimmer une SsCatImage
 * @route DELETE /admin/delSsCatImage/:id
 * @group SsCatImage - Gestion des SsCatImages
 * @summary Supprimme une nouvelle SsCatImage
 * @param {produit.Model} req.params - les informations d'une SsCatImage qu'on doit fournir
 * @returns {JSON} 200 - Les données d'une SsCatImage supprimmé
 */
router.delete('/admin/delSsCatImage/:id(\\d+)', admin, produitController.deleteSsCatImage);

/**
 * Une route pour supprimmer une iSsCatImage selon son id produit
 * @route DELETE /admin/delSsCatImageByIdSsCat/:id
 * @group SsCatImage - Gestion des sSsCatImage
 * @summary Supprimme une nouvelle SsCatImage selon son id Categorie
 * @param {produit.Model} req.params - les informations d'une SsCatImage qu'on doit fournir
 * @returns {JSON} 200 - Les données d'une SsCatImage supprimmé
 */
router.delete('/admin/delSsCatImageByIdSsCat/:id(\\d+)', admin, produitController.deleteSsCatImageByIdSsCat);


//! SOUS-CATEGORIE IMAGES

/**
 * Une route pour voir une CategorieImage
 * @route GET /admin/categorieImage/:id
 * @group CategorieImage - Gestion des CategorieImages
 * @summary Affiche une CategorieImage
 * @param {produit.Model} req.params - les informations d'une CategorieImage qu'on doit fournir
 * @returns {JSON} 200 - Les données d'une CategorieImage
 */
router.get('/admin/categorieImage/:id(\\d+)', admin, produitController.getOneCategorieImage);

/**
 * Une route pour voir toutes les CategorieImages
 * @route GET /admin/allCategorieImage
 * @group CategorieImage - Gestion des CategorieImages
 * @summary Affiche toutes les CategorieImages
 * @returns {JSON} 200 - Les données de toutes les CategorieImages
 */
router.get('/admin/allCategorieImage', admin, produitController.getAllCategorieImage);

/**
 * Une route pour voir une CategorieImage selon son id Categorie 
 * @route GET /admin/CategorieImageByIdCategorie/:id
 * @group CategorieImage - Gestion des CategorieImages
 * @summary Affiche une CategorieImage selon son id Categorie
 * @param {produit.Model} req.params - les informations d'une CategorieImage qu'on doit fournir
 * @returns {JSON} 200 - Les données d'une CategorieImage selon son id Categorie
 */
router.get('/admin/CategorieImageByIdCategorie/:id(\\d+)', admin, produitController.getCategorieImageByIdCategorie);

/**
 * Une route pour insérer une CategorieImage
 * @route POST /admin/newCategorieImage
 * @group CategorieImage - Gestion des CategorieImages
 * @summary Insére une nouvelle CategorieImage
 * @returns {JSON} 200 - Les données d'une nouvelle CategorieImage inséré
 */
router.post('/admin/newCategorieImage', clean, admin, produitController.newCategorieImage);

/**
 * Une route pour mette a jour une CategorieImage
 * @route PATCH /admin/updateCategorieImage/:id
 * @group CategorieImage - Gestion des CategorieImages
 * @summary Met à jour une nouvelle CategorieImage
 * @param {produit.Model} req.params - les informations d'une CategorieImage qu'on doit fournir
 * @returns {JSON} 200 - Les données d'une nouvelle CategorieImage mis a jour
 */
router.patch('/admin/updateCategorieImage/:id(\\d+)', clean, admin, produitController.updateCategorieImage);

/**
 * Une route pour supprimmer une CategorieImage
 * @route DELETE /admin/delCategorieImage/:id
 * @group CategorieImage - Gestion des CategorieImages
 * @summary Supprimme une nouvelle CategorieImage
 * @param {produit.Model} req.params - les informations d'une CategorieImage qu'on doit fournir
 * @returns {JSON} 200 - Les données d'une CategorieImage supprimmé
 */
router.delete('/admin/delCategorieImage/:id(\\d+)', admin, produitController.deleteCategorieImage);

/**
 * Une route pour supprimmer une CategorieImage selon son id produit
 * @route DELETE /admin/delCategorieImageByIdCategorie/:id
 * @group CategorieImage - Gestion des sCategorieImage
 * @summary Supprimme une nouvelle CategorieImage selon son id Categorie
 * @param {produit.Model} req.params - les informations d'une CategorieImage qu'on doit fournir
 * @returns {JSON} 200 - Les données d'une CategorieImage supprimmé
 */
router.delete('/admin/delCategorieImageByIdCategorie/:id(\\d+)', admin, produitController.deleteCategorieImageByIdCategorie);



//! INFOS DU SHOP !

/**
 * Une route pour voir un Shop
 * @route GET /admin/shop/:id
 * @group Shop - Gestion des Shops
 * @summary Affiche un Shop
 * @param {produit.Model} req.params - les informations d'un Shop qu'on doit fournir
 * @returns {JSON} 200 - Les données d'un Shop
 */
router.get('/admin/shop/:id(\\d+)', admin, mainController.getOneShop);

/**
 * Une route pour voir tous les Shops
 * @route GET /admin/allShop
 * @group Shop - Gestion des Shops
 * @summary Affiche tous les FShop
 * @returns {JSON} 200 - Les données de tous les Shops
 */
router.get('/admin/allShop', admin, mainController.getAllShop);

/**
 * Une route pour insérer un Shop
 * @route POST /admin/newShop
 * @group Shop - Gestion des Shops
 * @summary Insére un nouveau Shop
 * @returns {JSON} 200 - Les données d'un nouveau Shop inséré
 */
router.post('/admin/newShop', clean, admin, mainController.newShop);

/**
 * Une route pour mette a jour un Shop
 * @route PATCH /admin/updateShop/:id
 * @group Shop - Gestion des Shops
 * @summary Met à jour un nouveau Shop
 * @param {produit.Model} req.params - les informations d'un Shop qu'on doit fournir
 * @returns {JSON} 200 - Les données d'un nouveau Shop mis a jour
 */
router.patch('/admin/updateShop/:id(\\d+)', clean, admin, mainController.updateShop);

/**
 * Une route pour supprimmer un Shop
 * @route DELETE /admin/delShop
 * @group Shop - Gestion des Shops
 * @summary Supprimme un nouveau Shop
 * @param {produit.Model} req.params - les informations d'un Shop qu'on doit fournir
 * @returns {JSON} 200 - Les données d'un Shop supprimmé
 */
router.delete('/admin/delShop/:id(\\d+)', admin, mainController.deleteShop);

//! GESTION DES HISTORIQUE DE CONNEXION

/**
 * Une route pour voir un HistoConn
 * @route GET /dev/HistoConn/:id
 * @group Developpeur Gestion des HistoConns
 * @summary Affiche un HistoConn
 * @param {produit.Model} req.params - les informations d'un HistoConn qu'on doit fournir
 * @returns {JSON} 200 - Les données d'un HistoConn
 */
router.get('/dev/HistoConn/:id(\\d+)', dev, clientHistoController.getOneHistoConn);

/**
 * Une route pour voir tous les HistoConns
 * @route GET /dev/allHistoConn
 * @group Developpeur Gestion des HistoConns
 * @summary Affiche tous les HistoConns
 * @returns {JSON} 200 - Les données de tous les HistoConns
 */
router.get('/dev/allHistoConn', dev, clientHistoController.getAllHistoConn);

/**
 * Une route pour voir un HistoConn selon son id Client 
 * @route GET /dev/HistoConnByIdClient/:id
 * @group Developpeur Gestion des HistoConns
 * @summary Affiche un HistoConn selon son id Client
 * @param {produit.Model} req.params - les informations d'un HistoConn qu'on doit fournir
 * @returns {JSON} 200 - Les données d'un HistoConn selon son id produit
 */
router.get('/dev/HistoConnByIdClient/:id(\\d+)', dev, clientHistoController.getHistoConnByIdClient);

/**
 * Une route pour voir la derniere connexion valide d'un Utilisateur 
 * @route GET /user/lastconn/:id
 * @group Utilisateur
 * @summary Affiche la derniere connexion valide d'un Utilisateur 
 * @param {produit.Model} req.params - L'id du client
 * @returns {JSON} 200 - Affiche la derniere connexion valide d'un Utilisateur 
 */
router.get('/user/lastconn/:id(\\d+)', client, clientHistoController.getLastHistoConn);


/**
 * Une route pour insérer un HistoConn
 * @route POST /dev/newHistoConn
 * @group Developpeur Gestion des HistoConns
 * @summary Insére un nouveau HistoConn
 * @returns {JSON} 200 - Les données d'un nouveau HistoConn inséré
 */
router.post('/dev/newHistoConn', clean, dev, clientHistoController.newHistoConn);


/**
 * Une route pour supprimmer un HistoConn
 * @route DELETE /dev/delHistoConn
 * @group Developpeur Gestion des HistoConns
 * @summary Supprimme un nouveau HistoConn
 * @param {produit.Model} req.params - les informations d'un HistoConn qu'on doit fournir
 * @returns {JSON} 200 - Les données d'un HistoConn supprimmé
 */
router.delete('/dev/delHistoConn/:id(\\d+)', dev, clientHistoController.deleteHistoConn);

/**
 * Une route pour supprimmer une HistoConn selon son id produit
 * @route DELETE /dev/delHistoConnByIdClient
 * @group Developpeur Gestion des HistoConns
 * @summary Supprimme un nouveau HistoConn selon son id produit
 * @param {produit.Model} req.params - les informations d'un HistoConn qu'on doit fournir
 * @returns {JSON} 200 - Les données d'un HistoConn supprimmé
 */
router.delete('/dev/delHistoConnByIdClient/:id(\\d+)', dev, clientHistoController.deleteHistoConnByIdClient);


//! AVIS --------------------------------------------------

/**
 * Une route pour voir un avis
 * @route GET /admin/avis/:id
 * @group avis - Gestion des aviss
 * @summary Affiche un avis
 * @param {produit.Model} req.params - les informations d'un avis qu'on doit fournir
 * @returns {JSON} 200 - Les données d'un avis
 */
router.get('/admin/avis/:id(\\d+)', admin, avisController.getOne);

/**
 * Une route pour voir tous les aviss
 * @route GET /admin/allAvis
 * @group avis - Gestion des aviss
 * @summary Affiche tous les aviss
 * @returns {JSON} 200 - Les données de tous les aviss
 */
router.get('/admin/allAvis', admin, avisController.getAll);

/**
 * Une route pour voir un avis selon son id Client 
 * @route GET /admin/avisByIdClient/:id
 * @group avis - Gestion des aviss
 * @summary Affiche un avis selon son id Client
 * @param {produit.Model} req.params - les informations d'un avis qu'on doit fournir
 * @returns {JSON} 200 - Les données d'un avis selon son id produit
 */
router.get('/admin/avisByIdClient/:id(\\d+)', admin, avisController.getByIdClient);

/**
 * Une route pour insérer un avis
 * @route POST /admin/newavis
 * @group avis - Gestion des aviss
 * @summary Insére un nouveau avis
 * @returns {JSON} 200 - Les données d'un nouveau avis inséré
 */
router.post('/admin/newavis', clean, client, avisController.new);

/**
 * Une route pour mette a jour un avis
 * @route PATCH /admin/updateAvis/:id
 * @group avis - Gestion des aviss
 * @summary Met à jour un nouveau avis
 * @param {produit.Model} req.params - les informations d'un avis qu'on doit fournir
 * @returns {JSON} 200 - Les données d'un nouveau avis mis a jour
 */
router.patch('/admin/updateAvis/:id(\\d+)', clean, client, avisController.update);

/**
 * Une route pour supprimmer un avis
 * @route DELETE /admin/delAvis
 * @group avis - Gestion des aviss
 * @summary Supprimme un nouveau avis
 * @param {produit.Model} req.params - les informations d'un avis qu'on doit fournir
 * @returns {JSON} 200 - Les données d'un avis supprimmé
 */
router.delete('/admin/delAvis/:id(\\d+)', client, avisController.delete);

/**
 * Une route pour supprimmer une avis selon son id Client
 * @route DELETE /admin/delAvisByIdClient
 * @group avis - Gestion des aviss
 * @summary Supprimme un nouveau avis selon son id Client
 * @param {produit.Model} req.params - les informations d'un avis qu'on doit fournir
 * @returns {JSON} 200 - Les données d'un avis supprimmé
 */
router.delete('/admin/delAvisByIdClient/:id(\\d+)', client, avisController.deleteByIdClient);


/**
 * Redirection vers une page 404
 */
router.use((req, res) => {
  //res.redirect(`https://localhost:4000/api-docs#/`);
  res.status(404).json(`La route choisie n\'existe pas : Pour la liste des routes existantes, saisir cette URL dans le navigateur => https://localhost:${port}/api-docs#/`);
});




module.exports = router;