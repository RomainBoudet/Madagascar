// Un routeur, sur lequel on branche des routes et des MW qui leur correspondent
const {
    Router
  } = require('express');
  
  const router = Router();
  const port = process.env.PORT || 5000;
  //les MW de permission des routes
  const auth = require('./middlewares/auth');
  const admin = require('./middlewares/admin');
  const dev = require('./middlewares/dev');
  
  // le MW limitant le nombre de requetes pour un user (defense contre les attaques par Brute-Force)
  const rateLimit = require("express-rate-limit");
  
  // Conrollers
  const authController = require('./controllers/authController');
  const userController = require('./controllers/userController');
  
  
  // implémentation de joi, avec un validator  dans le dossier "services".
  const {
    validateQuery,
    validateBody,
    validateParams
  } = require('./services/validator');
  const userLoginSchema = require('./schemas/userLoginSchema');
  const userSigninSchema = require('./schemas/userSigninSchema');
  const userUpdateSchema = require('./schemas/userUpdateSchema');
  const resetPwdSchema = require('./schemas/resetPwdSchema');
  const verifyEmailSchema = require('./schemas/verifyEmailSchema');
  const resendEmailLinkSchema = require('./schemas/resendEmailLinkSchema');
  const addProductSchema = require('./schemas/addProductShema');
  
  //Redis pour le cache
  const cacheGenerator = require('./services/cache');
  //Config de notre service de mise en cache via Redis, avec une invalidation temporelle de 15 Jours (en sec) en plus de l'invalidation événementielle.
   const { cache, flush } = cacheGenerator({
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
  
  //! SQL RACCOURCIS POUR PG ADMIN
  // SQL pour changer le role = UPDATE "user" SET group_id = 3 WHERE pseudo = 'agathe'; // valeur de group_id => [1 = Membre, 2 = Administrateur, 3 = Modérateur])
  // SQL Pour changer le statut d'un email a TRUE =  UPDATE "user" SET verifyemail ='true' WHERE pseudo = 'agathe';
  
  /**
   * Page d'acceuil du site des Gardiens de la légende
   * @route GET /v1/
   * @summary Une magnifique documentation swagger :)
   * @group acceuil
   * @returns {JSON} 200 - la page d'acceuil
   */
  router.get('/', mainController.init);
  

  /**
 * Une connexion
 * @typedef {object} connexion
 * @property {string} pseudo - pseudo
 * @property {string} password - password
 */
/**
 * Autorise la connexion d'un utilisateur au site.
 * Route sécurisée avec Joi et limité a 100 requetes par 10h pour le même user
 * @route POST /v1/connexion
 * @group connexion - Pour se connecter
 * @summary Autorise la connexion d'un utilisateur au site. Aprés validation de son email !
 * @param {connexion.Model} connexion.body.required - les informations qu'on doit fournir
 * @returns {JSON} 200 - Un utilisateur à bien été connecté
 */
router.post('/connexion', apiLimiter, validateBody(userLoginSchema), authController.login);

/**
 * Une inscription
 * @typedef {object} inscription
 * @property {string} firstName - prénom
 * @property {string} lastName - nom de famille
 * @property {string} pseudo - pseudo
 * @property {string} emailAddress - email
 * @property {string} password - password
 * @property {string} passwordConfirm - la confirmation du password
 */
/**
 * Autorise la connexion d'un utilisateur au site.
 * Route sécurisée avec Joi
 * @route POST /v1/inscription
 * @group inscription - Pour s'inscire
 * @summary Inscrit un utilisateur en base de donnée
 * @param {inscription.Model} inscription.body.required - les informations d'inscriptions qu'on doit fournir
 * @returns {JSON} 200 - les données d'un utilisateur ont été inséré en BDD, redirigé vers la page de connexon
 */
router.post('/inscription', validateBody(userSigninSchema), userController.handleSignupForm);

//Routes pour procédure de vérification de mail : c'est si un utilisateur n'a pas vérifier son email dans les 24h apres l'inscription, il peut via cet route re-vérifier son mail quand il le souhaite. La route inscription comprend son propre envoi de mail pour vérifier son email sinon.
//ETAPE 1 => Route pour prendre un email dans le body, verifis ce qu'il faut, envoi un mail avec URL sécurisé incorporé + tolken, qui renvoit sur la route verifyEmail
/**
 * Envoie un email si l'utilisateur n'a pas valider son email la premiere fois aprés inscription et a attendu plus de 24h.
 * @route POST /resendEmailLink'
 * @group Vérification du mail
 * @summary Prend un mail en entrée et renvoie un email dessus si celui çi est présent en BDD.  Cliquer sur le lien dans l'email l'enmenera sur la route /verifyemail validera l'attribut verifyemail en BDD, autorisant ainsi la connexion. 
 * @param {evenement.Model} evenement.body.required
 * @returns {JSON} 200 - Un email a été délivré
 */
 router.post('/resendEmailLink', validateBody(verifyEmailSchema), userController.resendEmailLink);


 //ETAPE 2 => Reçois userId et Token en query, vérifis ce qu'il faut et change le statut en BDD de verifyemail dans la table user.
 /**
  * Reçois userId et Token en query, vérifis ce qu'il faut et change le statut en BDD de verifyemail dans la table user.
  * @route GET /verifyEmail
  * @group Vérification du mail
  * @summary Route qui réceptionne le lien de la validation du mail avec un token en query et valide le mail en BDD. Front géré par le server. Back power !
  * @param {evenement.Model} evenement.body.required
  * @returns {JSON} 200 - l'attibut verifyemail du user est passé a TRUE. Il peut désoemais se connecter.
  */
 router.get('/verifyEmail', validateQuery(resendEmailLinkSchema), userController.verifyEmail);
 
 //Routes pour procédure de reset du mot de passe :
 // ETAPE 1 => Route de reception pour l'envoi en 1er de l'email en body: renvoi un lien par mail + token sécurisé par clé dynamique pour aller sur un Form pour rentrer new infos !
 
 /**
  * Envoie un email si l'utilisateur ne se souvient plus de son mot de passe, pour mettre en place un nouveau mot de passe de maniére sécurisé.
  * @route POST /user/new_pwd
  * @group Changement du mot de passe
  * @summary Prend un mail en entrée et renvoie un email dessus si celui çi est présent en BDD.  Cliquer sur le lien dans l'email l'enmenera sur la route /user/reset_pwd ou l'attent un formulaire
  * @param {evenement.Model} evenement.body.required
  * @returns {JSON} 200 - Un email a été délivré
  */
 router.post('/user/new_pwd', validateBody(verifyEmailSchema), userController.new_pwd);
 // ETAPE 2 => envoi en second newPassword, passwordConfirm et pseudo dans le body et userId et token en query: decode le token avec clé dynamique et modifit password (new hash + bdd) !
 
 /**
 *  envoi en second newPassword, passwordConfirm et pseudo dans le body et userId et token en query: decode le token avec clé dynamique et modifit password (new hash + bdd) !
 *  @route POST /user/reset_pwd
  * @group Changement du mot de passe
  * @summary  Reset du mot de passe. prend en entrée, newPassword, passwordConfirm et pseudo dans le body et userId et token en query: decode le token avec clé dynamique et modifit password (new hash + bdd) !
  * @param {evenement.Model} evenement.body.required
  * @returns {JSON} 200 - Un nouveau mot de passe est entré en BDD
  */
 router.post('/user/reset_pwd', validateBody(resetPwdSchema), validateQuery(resendEmailLinkSchema), userController.reset_pwd);


 /**
 * Un utilisateur
 * @typedef {object} user
 * @property {number} id - id du jeu
 * @property {string} firstName - prénom
 * @property {string} lastName - nom de famille
 * @property {string} pseudo - pseudo
 * @property {string} emailAddress - email
 * @property {string} password - password
 * @property {string} inscription - date d'inscription
 * @property {string} avatar - chemin absolu jusqu' une image
 * @property {string} group_id - références a la table qui détient les rôles
 */
/**
 * Affiche tous les utilisateurs.
 * @route GET /v1/user
 * @group user - gestion des utilisateurs
 * @summary Affiche tous les utilisateurs en base de donnée. Route mise en cache (REDIS) *** Nécéssite un role Admin***
 * @param {user.Model} user.body.required
 * @returns {JSON} 200 - Tous les utilisateurs ont été délivré
 */

//Pour gérer les informations des users :
router.get('/user', admin, cache, userController.getAllUser);
/**
 * Affiche un utilisateur.
 * @route GET /v1/user/:id
 * @group user - gestion des utilisateurs
 * @summary Affiche un utilisateur en base de donnée. Route mise en cache (REDIS)*** Nécéssite un role Membre***
 * @param {user.Model} user.body.required
 * @param {number} id.path.required - l'id à fournir
 * @returns {JSON} 200 - Un utilisateur a été délivré
 */
router.get('/user/:id(\\d+)', auth, cache, userController.getUserbyId);

/**
 * Supprime les informations d'un utilisateur.
 * @route DELETE /v1/user/:id
 * @group user - Les routes de notre API
 * @summary Supprimme un utilisateur en base de donnée. Route mise en flush (REDIS)*** Nécéssite un role Admin***
 * @param {user.Model} user.body.required
 * @param {number} id.path.required - l'id à fournir
 * @returns {JSON} 200 - les données d'un utilisateur ont été supprimées
 */
router.delete('/user/:id(\\d+)', admin, flush, userController.deleteUserById);

/**
 * Modifit les informations d'un utilisateur.
 * @route PATCH /v1/user/:id
 * @group user -  gestion des utilisateurs
 * @summary Modifit un utilisateur en base de donnée. Route mise en flush (REDIS)*** Nécéssite un role Membre***
 * @param {user.Model} user.body.required - les informations du user que l'on peut fournir
 * @param {number} id.path.required - l'id à fournir
 * @returns {JSON} 200 - les données d'un utilisateur ont été mis a jour
 */
 router.patch('/user/:id(\\d+)', auth, flush, validateBody(userUpdateSchema), userController.updateUser);



/**
 * Permet de mettre à jour un produit.
 * @route PATCH /v1/produits/:id
 * @group produits - gestion des produits
 * @summary Mets à jour un produit en base de donnée. Route mise en flush (REDIS)*** Nécéssite un role Membre***
 * @param {produits.model} produits.body.required
 * @returns {JSON} 200 - Un produit a été créé
 */
 router.patch('/produits/:id(\\d+)', auth, flush, validateBody(produitSchema, 'PATCH'), produitController.updateproduit);

 /**
  * Permet de créer un nouvel produit.
  * @route POST /v1/produits
  * @group produits - gestion des produits
  * @summary Insére un produit en base de donnée. Route mise en flush (REDIS)*** Nécéssite un role Membre***
  * @param {produits.model} produits.body.required
  * @returns {JSON} 200 - Un produit a été créé
  */
 router.post('/produits',auth, flush, validateBody(produitSchema, 'POST'), produitController.newproduit);
 
 /**
  * Permet de supprimer un produit.
  * @route DELETE /v1/produits/:id
  * @group produits - gestion des produits
  * @summary Supprime un produit en base de donnée. Route mise en flush (REDIS)*** Nécéssite un role Membre***
  * @param {produits.model} produits.body.required
  * @param {number} id.path.required - l'id à fournir
  * @returns {JSON} 200 - Un produit a été supprimé
  */
 router.delete('/produits/:id(\\d+)', auth, flush, produitController.deleteproduit);
 








 /**
  * Permet la déconnexion d'un utilisateur au site. Nécéssite un token dans le cookie le xsrfToken du local storage
  * @route GET /v1/deconnexion
  * @group deconnexion - Pour se déconnecter
  * @summary déconnecte un utilisateur - on reset les infos du user en session
  * @returns {JSON} 200 - Un utilisateur a bien été déconnecté
  */
 router.get('/deconnexion', auth, authController.deconnexion);
 
 
 /**
  * Redirection vers une page 404
  */
 router.use((req, res) => {
   res.redirect(`https://localhost:${port}/api-docs#/`);
   //res.status(404).send(`La route choisie n\'existe pas : https://localhost:${port}/api-docs#/`);
 });
 
 
 
 
 module.exports = router;