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
  clean,
} = require('./middlewares/sanitizer'); //cleanPassword => supression de <> + cleanPassword. Pour les routes avec password // clean => pour toutes les routes sans password (ou on n'a pas besoin de caractéres spéciaux..)


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
const clientAdresseController = require('./controllers/clientAdresseController');
const paiementController = require('./controllers/paiementController');
const commandeController = require('./controllers/commandeController');
const livraisonController = require('./controllers/livraisonController');
const avisController = require('./controllers/avisController');
const produitController = require('./controllers/produitController');

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
const resendEmailSchema =require('./schemas/resendEmailSchema');
const resetPwdSchema = require('./schemas/resetPwdSchema');
const phoneNumberSchema = require('./schemas/phoneNumber');
const codeSchema = require('./schemas/codeSchema');


//Redis pour le cache
const cacheGenerator = require('./services/cache');
const consol = require('./services/colorConsole');
//Config de notre service de mise en cache via Redis, avec une invalidation temporelle de 15 Jours (en sec) en plus de l'invalidation événementielle.
const {
  cache,
  flush
} = cacheGenerator({
  ttl: 1296000, // 3600 *24 *15 
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
//! pour autoriser une route aux seuls administrateurs :
//on ajoute "admin" aprés la route  ex = router.get('/produits', admin, produitController.allproduits);
//! pour autoriser une route aux modérateurs ET au administrateurs :
//on ajoute "moderateur" apres la route  ex = router.get('/produits', moderateur, produitController.allproduits);

/*//! RAPPEL de la nomanclature des MW possible :
cache = le résultat de la route est stoké dans REDIS si ce ce n'est pas déja le cas
flush = Pour les route en post. Le déclenchement de cette route va vider toutes les données présentes dans REDIS pour ne pas donner des fausses données ultérieurement (invalidation temporel)
clean = sanitize et bloque quasi tous les caractéres spéciaux sauf le @ et la ponctuation (!?;.:,-), tout le reste disparait sans préavis
cleanPassword = sanitize mais plus light. Conçu pour être posé sur les routes des demande de password. autorise les caractéres spéciaux demandé dans les mot de passe (@#$%^&*) en plus de la pnctuation.
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
 * @group connexion - Pour se connecter
 * @summary Autorise la connexion d'un utilisateur au site.
 * @param {connexion.Model} connexion.body.required - les informations qu'on doit fournir
 * @returns {JSON} 200 - Un utilisateur à bien été connecté
 */

router.post('/connexion', apiLimiter, validateBody(userLoginSchema), authController.login);

/**
 * Permet la déconnexion d'un utilisateur au site. Nécéssite un token dans le cookie le xsrfToken du local storage
 * @route GET /v1/deconnexion
 * @group connexion - Pour se déconnecter
 * @summary déconnecte un utilisateur - on reset les infos du user en session
 * @returns {JSON} 200 - Un utilisateur a bien été déconnecté
 */
 router.get('/deconnexion', client, authController.deconnexion);

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
 * Permet l'inscription d'un administrateur au site.
 * Route sécurisée avec Joi et MW Developpeur
 * @route POST /v1/signin
 * @group inscription - Pour s'inscire
 * @summary Inscrit un administrateur en base de donnée
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
 * @route PATCH /v1/user/:id
 * @group utilisateur - gestion de nos utilisateurs
 * @summary Met a jour un utilisateur en base de donnée. Un email est envoyé pour signaler les changements. Si changement d'email, un second email est également envoyé sur l'ancienne adresse pour signaler le changement.
 * @param {utilisateur.Model} utiisateur.body.required
 * @param {number} id.path.required - l'id à fournir
 * @returns {JSON} 200 - les données d'un utilisateur ont été mises a jour
 */
 router.patch('/user/:id(\\d+)', client, validateBody(userUpdateSchema), clientController.updateClient);

/**
 * Envoie un email si l'utilisateur ne se souvient plus de son mot de passe, pour mettre en place un nouveau mot de passe de maniére sécurisé.
 * @route POST /user/new_pwd
 * @group utilisateur
 * @summary Prend un mail en entrée et renvoie un email dessus si celui çi est présent en BDD.  Cliquer sur le lien dans l'email l'enmenera sur la route /user/reset_pwd ou l'attent un formulaire
 * @param {utilisateur.Model} utilisateur.body.required
 * @returns {JSON} 200 - Un email a été délivré
 */
router.post('/user/new_pwd', clean, validateBody(verifyEmailSchema), clientController.new_pwd);
 // ETAPE 2 => envoi en second newPassword, passwordConfirm et pseudo dans le body et userId et token en query: decode le token avec clé dynamique et modifit password (new hash + bdd) !
 
 /**
 *  envoi en second newPassword, passwordConfirm et pseudo dans le body et userId et token en query: decode le token avec clé dynamique et modifit password (new hash + bdd) !
 *  @route POST /user/reset_pwd
  * @group utilisateur
  * @summary  Reset du mot de passe. prend en entrée, newPassword et passwordConfirm dans le body et userId et token en query: decode le token avec clé dynamique et modifit password (new hash + bdd) !
  * @param {utilisateur.Model} utilisateur.body.required
  * @returns {JSON} 200 - Un nouveau mot de passe est entré en BDD
  */
 router.post('/user/reset_pwd',  validateBody(resetPwdSchema), validateQuery(resendEmailSchema), clientController.reset_pwd);


/**
 * Un administrateur
 * @typedef {object} administrateur
 */
/**
 * Permet de donner le privilege Administrateur a un client.
 * Route sécurisée avec Joi et MW Developpeur
 * @route PATCH /v1/updatePrivilege
 * @group adminitrateur - Pour upgrader les privileges d'un utilisateurt en admin
 * @summary Transforme un client en administrateur dans la base de donnée
 * @param {admin.Model} req.params - les informations d'inscriptions qu'on doit fournir
 * @returns {JSON} 200 - les données d'un admin ont été inséré en BDD, redirigé vers la page de connexon
 */
 router.patch('/updateprivilege/:id(\\d+)', dev, clean, adminController.updatePrivilege);

//Routes pour procédure de vérification de mail 
//ETAPE 1 => Route pour prendre un email dans le body, verifis ce qu'il faut, envoi un mail avec URL sécurisé incorporé + tolken, qui renvoit sur la route verifyEmail
/**
 * Envoie un email pour que l'admin qui le souhaite puisse vérifier son email.
 * @route POST /resendEmailLink'
 * @group administrateur
 * @summary Prend un mail en entrée et renvoie un email si celui çi est présent en BDD.  Cliquer sur le lien dans l'email envoyé enmenera sur la route /verifyemail  
 * @returns {JSON} 200 - Un email a été délivré
 */
 router.post('/resendEmailLink', clean, admin, validateBody(resendEmailSchema), clientController.resendEmailLink);

 //ETAPE 2 => Reçois userId et Token en query, vérifis ce qu'il faut et change le statut en BDD
 /**
  * Reçois userId et Token en query, vérifis ce qu'il faut et change le statut en BDD
  * @route GET /verifyEmail
  * @group administrateur
  * @summary Route qui réceptionne le lien de la validation du mail avec un token en query et valide le mail en BDD. Front géré par le server.
  * @returns {JSON} 200 - On passe la verif de l'email de l'admin a TRUE. Il peut désormais effectuer des opérations qui nécessitent un vérification de l'email en amont.
  */
 router.post('/verifyEmail', clean, admin, validateQuery(verifyEmailSchema), clientController.verifyEmail);
/**
 * Permet d'enregitrer en BDD et de vérifier un téléphone par l'envoie d'un sms sur le numéro.
 * @route POST /admin/smsVerify
 * @group administrateur
 * @summary Utilise l'API de Twillio. Permet de vérifier un numéro de téléphone
 * @param {administrateur.Model} administrateur.body.required
 * @returns {JSON} 200 - Un code par sms a été envoyé
 */
 router.post('/admin/smsVerify', admin, clean, validateBody(phoneNumberSchema), adminController.smsVerify);
//
/**
 * Reçoi un code pour vérifier un numéro de téléphone et si le code est correct, le téléphone est enregistré en BDD sous format E. 164.
 * @route POST /admin/smsCheck
 * @group administrateur
 * @summary Utilise l'API de Twillio. Permet de vérifier un numéro de téléphone
 * @param {administrateur.Model} administrateur.body.required
 * @returns {JSON} 200 - Un un json informant que le téléphone a été authentifié
 */
router.post('/admin/smsCheck', admin, clean, validateBody(codeSchema), adminController.smsCheck);

/**
 * Faire appel a la méthode smsSend envoi un sms avec le contenu voulu. Ici un exemple générique qui renvoie le nombre d'enregistrement dans la table clients, a chaque demande. A modifier selon les besoins d'envoie de SMS...
 * @route GET /admin/smsSend
 * @group administrateur
 * @summary Utilise l'API de Twillio. Permet d'envoyer un sms sur le numéro souhaité
 * @param {administrateur.Model} administrateur.body.required
 * @returns {JSON} 200 -Renvoie un sms au numéro souhaité.
 */
 router.get('/admin/smsSend', admin, adminController.smsSend);

/**
 * Faire appel a la méthode smsResponse envoi un sms avec le contenu voulu selon le contenu d'un sms envoyé. A modifier selon les besoins d'envoie de SMS. Il pourrait être intéressant d'envoyer l'adresse a laquel envoyé le colis pour la derniére commande par example. 
 * Actuellement la méthode répond a 3 payload différents => "Balance ?"" // "Paiement ?"" // "Clients ?"" qui répond respectivement, la balance du compte Twillio, le dernier paiement effectué et le nombre de client en BDD, toujours par sms.
 * @route POST /admin/smsRespond
 * @group administrateur
 * @summary Utilise l'API de Twillio. Permet d'envoyer un sms selon le contenu d'un sms reçu.
 * @param {administrateur.Model} administrateur.body.required
 * @returns {JSON} 200 -Renvoie un sms au numéro souhaité avec la réponse attendue.
 */
router.post('/admin/smsRespond', clean, adminController.smsRespond);

/**
 * Renvoie tous les clients en bdd 
 * @route POST /admin/user/all
 * @group administrateur
 * @summary Renvoie tous les client en BDD
 * @returns {JSON} 200 -Renvoie la liste des clients en BDD.
 */
 router.get('/admin/user/all', admin, clientController.getAll);

/**
 * Renvoie un client selon son id
 * @route POST /admin/user/all
 * @group administrateur
 * @summary Renvoie tous les client en BDD
 * @returns {JSON} 200 -Renvoie la liste des clients en BDD.
 */
router.get('admin/user/getone/:id(\\d+)', clientController.getOne);




//! route mis en place pour tester.. 

router.get('admin/user/getone/:id(\\d+)', clientController.getOne);

router.get('/getSsCatImageByIdSsCat/:id(\\d+)', produitController.getCategorieImageByIdCategorie);

router.post('/new', produitController.new);

router.post('/newProd', produitController.new);

router.delete('/del/:id(\\d+)', clientController.delete);

router.delete('/deleteSsCatImageByIdSsCat/:id(\\d+)', produitController.deleteCategorieImageByIdCategorie);

router.delete('/delByIdLivraison/:id(\\d+)', panierController.deleteLignePanierByIdPanier);

router.patch('/update/:id(\\d+)', produitController.update);










/**
 * Redirection vers une page 404
 */
router.use((req, res) => {
  //res.redirect(`https://localhost:${port}/api-docs#/`);
  res.status(404).json(`La route choisie n\'existe pas : Pour la liste des routes existantes, saisir cette URL dans le navigateur => https://localhost:${port}/api-docs#/`);
});




module.exports = router;