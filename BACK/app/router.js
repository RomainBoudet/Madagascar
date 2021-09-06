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
const livraisonPostSchema = require('./schemas/livraisonPostSchema');
const livraisonSchema = require('./schemas/livraisonSchema');
const choixLivraisonSchema = require('./schemas/choixLivraisonSchema');
const smsChoiceSchema = require('./schemas/smsChoiceSchema');





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

//! Pour autoriser une route a tous les utilisateurs connéctés :
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

/**
 * Page d'acceuil de swagger
 * @route GET /v1/
 * @summary Une magnifique documentation swagger :)
 * @group acceuil
 * @returns {JSON} 200 - la page d'acceuil
 */
router.get('/', mainController.init);


//! ROUTES UTILISATEUR ----------------
/**
 * Une connexion
 * @typedef {object} connexion
 * @property {string} email - email
 * @property {string} password - password
 */
/**
 * Autorise la connexion d'un utilisateur au site.
 * Route sécurisée avec Joi et limité a 100 requetes par 10h pour le même user
 * @route POST /v1/connexion
 * @group connexion - Pour se connecter ou se déconnecter
 * @summary Autorise la connexion d'un utilisateur au site.
 * @param {connexion.Model} connexion.body.required - les informations qu'on doit fournir
 * @returns {JSON} 200 - Un utilisateur à bien été connecté
 */

router.post('/connexion', apiLimiter, validateBody(userLoginSchema), authController.login);

/**
 * Permet la déconnexion d'un utilisateur au site. Nécéssite un token dans le cookie le xsrfToken du local storage
 * @route GET /v1/deconnexion
 * @group connexion - 
 * @summary déconnecte un utilisateur - on reset les infos du user en session
 * @returns {JSON} 200 - Un utilisateur a bien été déconnecté
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
 * Permet l'inscription d'un utilisateur au site.
 * Route sécurisée avec Joi et validator
 * @route POST /v1/inscription
 * @group inscription - Pour s'inscire 
 * @summary Inscrit un utilisateur en base de donnée
 * @param {inscription.Model} inscription.body.required - les informations d'inscriptions qu'on doit fournir
 * @returns {JSON} 200 - les données d'un utilisateur ont été inséré en BDD, redirigé vers la page de connexon
 */
router.post('/inscription', validateBody(userSigninSchema), clientController.signIn);


/**
 * Permet l'inscription d'un Administrateur au site.
 * Route sécurisée avec Joi et MW Developpeur
 * @route POST /v1/signin
 * @group Administrateur - Des méthodes a dispositions des Administrateurs
 * @summary Inscrit un Administrateur en base de donnée
 * @param {inscription.Model} inscription.body.required - les informations d'inscriptions qu'on doit fournir
 * @returns {JSON} 200 - les données d'un admin ont été inséré en BDD, redirigé vers la page de connexon
 */
router.post('/signin', dev, validateBody(userSigninSchema), adminController.signInAdmin);


/**
 * Un utilisateur
 * @typedef {object} utilisateur
 * @property {number} id - id du jeu
 * @property {string} prenom - prénom
 * @property {string} nomFamille - nom de famille
 * @property {string} email - email
 * @property {string} password - password
 */
/**
 * Met a jour les informations d'un utilisateur.
 * @route PATCH /user/update/:id
 * @group utilisateur - Des méthodes a dispositions des utilisateurs
 * @summary Met a jour un utilisateur en base de donnée. Un email est envoyé pour signaler les changements. Si changement d'email, un second email est également envoyé sur l'ancienne adresse pour signaler le changement.
 * @param {utilisateur.Model} utiisateur.body.required
 * @param {number} id.path.required - l'id à fournir
 * @returns {JSON} 200 - les données d'un utilisateur ont été mises a jour
 */
router.patch('/user/update/:id(\\d+)', cleanPassword, client, validateBody(userUpdateSchema), clientController.updateClient);

/**
 * Envoie un email si l'utilisateur ne se souvient plus de son mot de passe, pour mettre en place un nouveau mot de passe de maniére sécurisé.
 * @route POST /user/new_pwd
 * @group utilisateur
 * @summary Prend un mail en entrée et renvoie un email dessus si celui çi est présent en BDD.  Cliquer sur le lien dans l'email l'enmenera sur la route /user/reset_pwd ou l'attent un formulaire
 * @param {utilisateur.Model} utilisateur.body.required
 * @returns {JSON} 200 - Un email a été délivré
 */
router.post('/user/new_pwd', cleanPassword, validateBody(verifyEmailSchema), clientController.new_pwd);
// ETAPE 2 => envoi en second newPassword, passwordConfirm et pseudo dans le body et userId et token en query: decode le token avec clé dynamique et modifit password (new hash + bdd) !

/**
 *  envoi en second newPassword, passwordConfirm et pseudo dans le body et userId et token en query: decode le token avec clé dynamique et modifit password (new hash + bdd) !
 *  @route POST /user/reset_pwd
 * @group utilisateur
 * @summary  Reset du mot de passe. prend en entrée, newPassword et passwordConfirm dans le body et userId et token en query: decode le token avec clé dynamique et modifit password (new hash + bdd) !
 * @param {utilisateur.Model} utilisateur.body.required
 * @returns {JSON} 200 - Un nouveau mot de passe est entré en BDD
 */
router.post('/user/reset_pwd', validateBody(resetPwdSchema), validateQuery(resendEmailSchema), clientController.reset_pwd);


/**
 * Prend en charge l'acceptation de la politique de cookie sur le site
 *  @route POST /setcookie
 * @group utilisateur
 * @summary  Renvoie un cookie avec le nom 'cookieAccepted' et la valeur 'true'
 * @param {utilisateur.Model} utilisateur.body.required
 * @returns {JSON} 200 - Renvoie un cookie avec le nom 'cookieAccepted' et la valeur 'true'
 */
 router.post('/setcookie', clean, authController.cookie);

/**
 * Prend en charge l'acceptation des Conditions Générale de Ventes
 *  @route POST /cgv
 * @group utilisateur
 * @summary  L'acceptation des Conditions Générale de Ventes est stocké en session
 * @returns {JSON} 200 - L'acceptation des Conditions Générale de Ventes est stocké en session
 */
 router.get('/cgv', paiementController.cgv);

 //! PAIEMENT -----------------------------------------------------------------------------------------------------------------------------------------

/**
 * Prend en charge l'intention de paiement via STRIPE, a utiliser lorsque le client valide le panier, avant de choisir son mode paiement mais apres avoir choisit son transporteur.
 *  @route GET /user/paiement
 * @group utilisateur
 * @summary  Prend en charge le paiement via STRIPE
 * @returns {JSON} 200 -  Prend en charge le paiement via STRIPE
 */
 router.get('/user/paiement', client, paiementController.paiement);

 /**
 * Permet de récupérer la clé client secret nécéssaire a STRIPE, nécéssaire pour le front.
 *  @route GET /user/paiementkey
 * @group utilisateur
 * @summary  Permet de récupérer la clé client secret nécéssaire a STRIPE *** nécéssite d'être authentifié et d'avoir tenté d'effectuer un paiement.
 * @returns {JSON} 200 -  Renvoie la valeur de payementIntent.client_secret
 */
  router.get('/user/paiementkey', paiementController.key);


// router.get('/insertCookieForWebhookTest', paiementController.insertCookieForWebhookTest);

/**
 * Prend en charge le webhook STRIPE apres un paiement
 * Route non filtré mais signature vérifié par une API STRIPE pour s'assurer que l'info vient bien de STRIPE.
 *  @route POST /webhookpaiement
 * @group utilisateur
 * @summary  Prend en charge le webhook STRIPE apres un paiement
 * @returns {JSON} 200 -  Prend en charge le webhook STRIPE apres un paiement
 */
 router.post('/webhookpaiement', paiementController.webhookpaiement);


//! SEARCH BAR -------------------------------------------------------------------------------------------------------------------------------

/**
 * Receptionne une string et renvoie un tableau d'objet représentant les produits qui match. 
 * @route POST /user/searchProduit
 * @group utilisateur
 * @summary Permet la recherche d'un mot ou d'une phrase (une string) dans les produits. 
 * @returns {JSON} 200 - Un tableau d'objeta 
 */
router.post('/user/searchProduit', clean, validateBody(searchSchema), searchController.search);

//! ROUTES ADMINISTRATEUR -----------------------------------------------------------------------------------------------------------------------


/**
 * Envoie un email pour que l'admin qui le souhaite puisse vérifier son email.
 * @route POST /resendEmailLink
 * @group Administrateur
 * @summary Prend un mail en entrée et renvoie un email si celui çi est présent en BDD.  Cliquer sur le lien dans l'email envoyé enmenera sur la route /verifyemail  
 * @returns {JSON} 200 - Un email a été délivré
 */
router.post('/resendEmailLink', clean, admin, validateBody(resendEmailSchema), clientController.resendEmailLink);

//ETAPE 2 => Reçois userId et Token en query, vérifis ce qu'il faut et change le statut en BDD
/**
 * Reçois userId et Token en query, vérifis ce qu'il faut et change le statut en BDD
 * @route POST /verifyEmail
 * @group Administrateur
 * @summary Route qui réceptionne le lien de la validation du mail avec un token en query et valide le mail en BDD.
 * @returns {JSON} 200 - On passe la verif de l'email de l'admin a TRUE. Il peut désormais effectuer des opérations qui nécessitent un vérification de l'email en amont.
 */
router.get('/verifyEmail', clean, admin, validateQuery(verifyEmailSchema), clientController.verifyEmail);
/**
 * Permet d'enregitrer en BDD et de vérifier un téléphone par l'envoie d'un sms sur le numéro.
 * @route POST /admin/smsVerify
 * @group Administrateur
 * @summary Utilise l'API de Twillio. Permet de vérifier un numéro de téléphone
 * @param {Administrateur.Model} Administrateur.body.required
 * @returns {JSON} 200 - Un code par sms a été envoyé
 */
router.post('/admin/smsVerify', admin, clean, validateBody(phoneNumberSchema), adminController.smsVerify);
//
/**
 * Reçoi un code pour vérifier un numéro de téléphone et si le code est correct, le téléphone est enregistré en BDD sous format E. 164.
 * @route POST /admin/smsCheck
 * @group Administrateur
 * @summary Utilise l'API de Twillio. C'est le retour de la route smsVerify. Insert un téléphone vérifié d'un admin en BDD
 * @param {Administrateur.Model} Administrateur.body.required
 * @returns {JSON} 200 - Un un json informant que le téléphone a été authentifié
 */
router.post('/admin/smsCheck', admin, clean, validateBody(codeSchema), adminController.smsCheck);

//
/**
 * Reçoie un true ou false pour pouvoir choisir l'envoie de sms a l'admin a chaque commande, ou non. Nécéssite d'avoir vérifié son téléphone avant.
 * @route POST /admin/smsChoice
 * @group Administrateur
 * @summary Permet d'insérer en BDD le choix de l'admin en matiére d'envoie de sms a chaque commande reçu
 * @param {Administrateur.Model} Administrateur.body.required
 */
 router.post('/admin/smsChoice', admin, clean, validateBody(smsChoiceSchema), adminController.smsChoice);



/**
 * Faire appel a la méthode smsSend envoi un sms avec le contenu voulu. Ici un exemple générique qui renvoie le nombre d'enregistrement dans la table clients, a chaque demande. A modifier selon les besoins d'envoie de SMS...
 * @route GET /admin/smsSend
 * @group Administrateur
 * @summary Utilise l'API de Twillio. Permet d'envoyer un sms sur le numéro souhaité. Relié au numéro de l'admin du site.
 * @returns {JSON} 200 -Renvoie un sms au numéro souhaité.
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
 * @summary Renvoie tous les client en BDD
 * @returns {JSON} 200 -Renvoie la liste des clients en BDD.
 */
router.get('/admin/user/getone/:id(\\d+)', admin, clientController.getOne);


/**
 * Supprime un client selon son id
 * @route DELETE /admin/user/:id
 * @group Administrateur
 * @summary Supprime un client en BDD selon son id    *** nécéssite un mot de passe
 * @returns {JSON} 200 - Supprime un client en BDD
 */
 router.delete('/admin/user/:id(\\d+)', admin, validateBody(passwordSchema), clientController.deleteById);


 /**
 * Supprime un client selon son email
 * @route DELETE /admin/user
 * @group Administrateur
 * @summary Supprime un client en BDD selon son email    *** nécéssite un mot de passe et l'email a supprimer
 * @returns {JSON} 200 - Supprime un client en BDD
 */
  router.delete('/admin/user', admin, validateBody(userLoginSchema), clientController.deleteByEmail);

//! ADRESSE DES CLIENT -----------------------------------

/**
 * Renvoie toutes les adresses des clients en bdd 
 * @route GET /admin/user/adresse
 * @group Administrateur
 * @summary Renvoie toutes les adresses des clients en BDD
 * @returns {JSON} 200 -Renvoie la liste des adresses en BDD.
 */
 router.get('/admin/user/adresses', admin, adresseController.getAllAdresse);

/**
 * Renvoie les adresses d'un client selon son idClient
 * @route GET /client/adresses/:id
 * @group utilisateur
 * @summary Renvoie toutes les adresse d'un client en BDD
 * @returns {JSON} 200 -Renvoie toutes les adresse d'un client en BDD
 */
 router.get('/client/adresses/:id(\\d+)', client, adresseController.getAdresseByIdClient);

/**
 * Renvoie une seule adresse d'un client selon son client_adresse.id
 * @route GET /client/adresse/:id
 * @group utilisateur
 * @summary Renvoie une seule adresse d'un client selon son client_adresse.id
 * @returns {JSON} 200 - Renvoie une seule adresse d'un client selon son client_adresse.id
 */
 router.get('/client/adresse/:id(\\d+)', client, adresseController.getOneAdresse);

/**
 * Renvoie la derniére adresse saisi d'un client selon son idClient
 * @route GET /client/adresselast/:id
 * @group utilisateur
 * @summary Renvoie la derniére adresse saisi d'un client selon son idClient
 * @returns {JSON} 200 - Renvoie la derniére adresse saisi d'un client selon son idClient
 */
 router.get('/client/adresselast/:id(\\d+)', client, adresseController. getLastAdresseByIdClient);



 /**
 * Une route pour insérer une adresse
 * @route POST /client/adresse/new
 * @group utilisateur
 * @summary Insére une nouvelle adresse ***néccésite un mot de passe
 * @returns {JSON} 200 - Les données de la nouvelle adresse insérée
 */
router.post('/client/adresse/new',cleanPassword, client, validateBody(adressePostSchema), adresseController.newAdresse);

 /**
 * Une route pour mettre a jour une adresse
 * @route PATCH /client/adresse/:id
 * @group utilisateur
 * @summary Met a jour une adresse ***néccésite un mot de passe
 * @returns {JSON} 200 - Les données de la nouvelle adresse mise a jour
 */
  router.patch('/client/adresse/:id(\\d+)', cleanPassword, client, validateBody(adresseSchema), adresseController.updateAdresse);

/**
 * Une route pour supprimer une adresse
 * @route DELETE /client/adresse/:id
 * @group utilisateur
 * @summary Supprime une adresse ***néccésite un mot de passe
 * @returns {JSON} 200 - Les données de la nouvelle adresse mise a jour
 */
 router.delete('/client/adresse/:id(\\d+)', client, validateBody(passwordSchema), adresseController.delete);


/**
 * Une route pour supprimer toutes les adresses d'un client
 * route accessible a tous
 * @route DELETE /client/adresses/:id
 * @group utilisateur
 * @summary Supprime des adresses d'un même client ***néccésite un mot de passe
 * @returns {JSON} 200 - Les données de la nouvelle adresse mise a jour
 */
 router.delete('/client/adresses/:id(\\d+)', client, validateBody(passwordSchema), adresseController.deleteByIdClient);

 
//! ROUTE TRANSPORTEUR ---------------------

/**
 * Une route pour déterminer le type de livraison choisi par l'utilisateur et permet de laisser un commentaire en session 
 * @route POST /client/livraisonChoix
 * @group utilisateur
 * @summary Permet de déterminer le choix du transporteur fait par le client et de laisser un commentaire en session
 * @returns {JSON} 200 - Le choix du transporteur fait par le client et permet de laisser un commentaire en session  
 */
 router.post('/client/livraisonChoix', clean, validateBody(choixLivraisonSchema), livraisonController.choixLivraison);


/**
 * Renvoie tous les transporteurs en BDD
 * @route GET /user/transporteurs
 * @group utilisateur
 * @summary  Renvoie tous les transporteurs en BDD
 * @returns {JSON} 200 - Renvoie tous les transporteurs en BDD
 */
 router.get('/user/transporteurs', client, livraisonController.getAllTransporteur);

/**
 * Une route pour insérer un transporteur
 * @route POST /admin/transporteur/new
 * @group Administrateur
 * @summary Insére un nouveau transporteur 
 * @returns {JSON} 200 - Les données du nouveau transporteur inséré
 */
 router.post('/admin/transporteur/new', clean, admin, validateBody(transporteurPostSchema), livraisonController.newTransporteur);

/**
 * Une route pour mettre a jour un transporteur
 * @route POST /admin/transporteur/new
 * @group Administrateur
 * @summary Met a jour un nouveau transporteur 
 * @returns {JSON} 200 - Les données du nouveau transporteur mis a jour
 */
 router.patch('/admin/transporteurs/:id(\\d+)', clean, admin, validateBody(transporteurSchema), livraisonController.updateTransporteur);


 /**
 * Une route pour supprimer un un transporteur
 * @route DELETE /admin/transporteur/:id
 * @group Administrateur
 * @summary Supprime un transporteur
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
 * @group utilisateur
 * @summary  Renvoie toutes les livraisons d'un client en BDD
 * @returns {JSON} 200 - Renvoie toutes les livraisons d'un client en BDD
 */
 router.get('/user/livraisons/:id(\\d+)', client, livraisonController.getByIdClient);
  

/**
 * Renvoie toutes les produit commandé / livré en BDD
 * @route GET /admin/produitLivre
 * @group Administrateur
 * @summary  Renvoie toutes les livraisons en BDD
 * @returns {JSON} 200 - Renvoie tous les livraisons en BDD
 */
 router.get('/admin/produitcommande', admin, livraisonController.getAllLigneCommande);


 /**
 * Renvoie toutes les produit commandé / livré pour un client en particulier
 * @route GET /user/produitLivre
 * @group utilisateur
 * @summary  Renvoie toutes les livraisons d'un client en BDD
 * @returns {JSON} 200 - Renvoie tous les livraisons d'un client en BDD
 */
  router.get('/user/produitcommande/:id(\\d+)', client, livraisonController.getAllLivraisonByIdClient);
  

/**
 * Renvoie tous les produits commandés / livré pour une commande particuliére
 * @route GET /user/produitLivreByCommande
 * @group utilisateur
 * @summary  Renvoie toutes les livraisons d'un client en BDD
 * @returns {JSON} 200 - Renvoie tous les livraisons d'un client en BDD
 */
    router.get('/user/produitLivreByCommande/:id(\\d+)', client, livraisonController.getByIdCommande);
  

/**
 * Une route pour insérer une nouvelle livraison
 * @route POST /admin/livraison/new
 * @group Administrateur
 * @summary Insére une nouvelle livraison 
 * @returns {JSON} 200 - Les données de la nouvelle livraison insérée
 */
 router.post('/admin/livraison/new', clean, admin, validateBody(livraisonPostSchema), livraisonController.new);

/**
 * Une route pour mettre a jour une livraison
 * @route POST /admin/livraison/new
 * @group Administrateur
 * @summary Met a jour une nouvelle livraison 
 * @returns {JSON} 200 - Les données d'une nouvelle livraison mise a jour
 */
 router.patch('/admin/livraison/:id(\\d+)', clean, admin, validateBody(livraisonSchema), livraisonController.update);

 /**
 * Une route pour supprimer une livraison
 * @route DELETE /admin/livraison/:id
 * @group Administrateur
 * @summary Supprime une livraison
 * @returns {JSON} 200 - Les données de la livraison supprimée
 */
  router.delete('/admin/livraison/:id(\\d+)', admin, livraisonController.delete);


/**
 * Une route pour modifier le choix de l'adresse d'envoi. Enléve la valeur TRUE de la précédente adresse et la met a une autre adresse
 * @route PATCH /user/choixAdresseEnvoi/:id
 * @group utilisateur
 * @summary Met a jour la nouvelle adresse de livraison 
 * @returns {JSON} 200 - Les données d'une adresse de livraison mise a jour
 */
 router.patch('/user/choixAdresseEnvoi/:id(\\d+)', clean, client, adresseController.setAdresseEnvoiTrue);


 /**
 * Une route pour modifier le choix de l'adresse de facturation. Enléve la valeur TRUE de la précédente adresse et la met a une autre adresse
 * @route PATCH /user/choixAdresseFacturation/:id
 * @group utilisateur
 * @summary Met a jour la nouvelle adresse de facturation 
 * @returns {JSON} 200 - Les données d'une adresse de facturation mise a jour
 */
  router.patch('/user/choixAdresseFacturation/:id(\\d+)', clean, client, adresseController.setAdresseFacturationTrue);



  //! ROUTES DEVELOPPEUR ----------------

/**
 * Faire appel a la méthode smsBalance envoi un sms avec la balance du compte Twilio. 
 * @route GET /dev/smsBalance
 * @group Developpeur - Twillio
 * @summary Utilise l'API de Twillio. Renvoie la balance du compte par sms au numéro souhaité. Relier au numéro du developpeur.
 * @returns {JSON} 200 -Renvoie la balance du compte par sms au numéro souhaité.
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
 * Actuellement la méthode répond a 3 payload différents => "Balance ?"" // "Paiement ?"" // "Clients ?"" qui répond respectivement, la balance du compte Twillio, le dernier paiement effectué et le nombre de client en BDD, toujours par sms.
 * @route POST /admin/smsRespond
 * @group Developpeur
 * @summary Utilise l'API de Twillio. Permet d'envoyer un sms selon le contenu d'un sms reçu. Relier au numéro du développeur
 * @param {Administrateur.Model} Administrateur.body.required
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
 * @returns {JSON} 200 - Renvoie les informations souhaitées
 */
router.get('/dev/oneTwillio/:id(\\d+)', dev, adminController.getOneTwillio);

/**
 * Insére une ligne d'infos twillio
 * @route POST /dev/newTwillio
 * @group Developpeur - twillio
 * @summary  Insére une information de connexion lié a un compte twillio
 * @returns {JSON} 200 - Renvoie les informations souhaitées
 */
router.post('/dev/newTwillio', clean, dev, adminController.newTwillio);

/**
 * Met a jour une ligne d'infos twillio
 * @route PATCH /dev/newTwillio
 * @group Developpeur - twillio
 * @summary  Met a jour une information de connexion lié a un compte twillio
 * @returns {JSON} 200 - Renvoie les informations mis a jour
 */
router.patch('/dev/updateTwillio/:id(\\d+)', clean, dev, adminController.updateTwillio);

/**
 * Supprime une ligne d'infos twillio
 * @route DELETE /dev/newTwillio
 * @group Developpeur - twillio
 * @summary  Supprime une information de connexion lié a un compte twillio
 * @returns {JSON} 200 - Renvoie les informations supprimé
 */
router.delete('/dev/deleteTwillio/:id(\\d+)', dev, adminController.deleteTwillio);

/**
 * Pour vérifier un paiement avec Twillio et sa méthode PSD2 // ETAPE 1
 * @route POST /dev/psd2Verify
 * @group Developpeur - twillio
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
 * @param {admin.Model} req.params - les informations d'inscriptions qu'on doit fournir
 * @returns {JSON} 200 - les données d'un admin ont été inséré en BDD, redirigé vers la page de connexon
 */
router.patch('/dev/updateprivilege/:id(\\d+)', clean, dev, clean, adminController.updatePrivilege);

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
 * @returns {JSON} 200 - un email d'admin, vérifié ou non
 */
router.get('/dev/emailVerif/:id(\\d+)', dev, adminController.getOneEmailVerif);

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
 * @group utilisateur
 * @summary Affiche les articles d'un panier selon la session
 * @returns {JSON} 200 - les articles présent dans ce panier et leurs caractéristiques
 */
router.get('/user/panier', panierController.getPanier);


/**
 * Une route pour ajouter un article dans le panier
 * route accessible a tous 
 * @route GET /user/addPanier
 * @group utilisateur
 * @summary Ajoute un article dans le panier
 * @returns {JSON} 200 - les articles ajouté dans ce panier et leurs caractéristiques
 */
router.get('/user/addPanier/:id(\\d+)', panierController.addArticlePanier);

/**
 * Une route pour supprimer un article dans le panier
 * route accessible a tous 
 * @route DELETE /user/delPanier
 * @group utilisateur
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
 * Une route pour voir la derniere connexion valide d'un utilisateur 
 * @route GET /user/lastconn/:id
 * @group utilisateur
 * @summary Affiche la derniere connexion valide d'un utilisateur 
 * @param {produit.Model} req.params - L'id du client
 * @returns {JSON} 200 - Affiche la derniere connexion valide d'un utilisateur 
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
  //res.redirect(`https://localhost:3000/api-docs#/`);
  res.status(404).json(`La route choisie n\'existe pas : Pour la liste des routes existantes, saisir cette URL dans le navigateur => https://localhost:${port}/api-docs#/`);
});




module.exports = router;