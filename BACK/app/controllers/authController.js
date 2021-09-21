const Client = require('../models/client');
const crypto = require('crypto');
const consol = require('../services/colorConsole');
const AdminVerifEmail = require('../models/adminVerifEmail');
const {
    v4: uuid
} = require('uuid');


/**
 * Une méthode qui prend en charge la connexion d'un utilisateur déja inscrit dans la BDD
 * Une méthode qui vérifit que l'utilisateur existe en BDD et compare son mot de passe avec son hash présent en BDD via bcrypt
 * Retourne un json
 * @name handleLoginForm
 * @method handleLoginForm
 * @property {string} email - l'email qu'un utilisateur utilise pour se connecter, doit être unique en BDD et inséré dans le formulaire de connexion.
 * @property {string} password - le mot de passe qu'un utilisateur utilise pour se connecter.
 * @param {Express.Request} request - l'objet représentant la requête
 * @param {Express.Response} response - l'objet représentant la réponse
 * @return {String}  - Un token construit via la méthod sign du package jsonwebtoken
 * @return {boolean} - une valeur de connexion true ou false
 */
const authController = {

    login: async (request, response) => {

        try {

            if (request.session.user !== undefined && request.signedCookies.xsrfToken!== undefined && request.signedCookies.xsrfToken === request.headers['x-xsrf-token']) {
                return response.status(200).json({
                    message: "Vous vous êtes déja authentifié et vos informations de connection sont toujours valide.",
                    token: `${request.headers['x-xsrf-token']}`,
                });
            }

            const {
                email,
                password
            } = request.body;


            // On authentifie le user via son email et le password proposé
            const clientInDb = await Client.authenticate(email, password);
            console.log(clientInDb);
            if (!clientInDb) {
                return response.status(404).json("Erreur d'authentification : l'email ou le mot de passe est incorrect ");
            }

            //le user existe et s'est correctement identifié, on stocke les infos qui vont bien dans la session
            request.session.user = {
                idClient: clientInDb.id,
                prenom: clientInDb.prenom,
                nomFamille: clientInDb.nomFamille,
                email: clientInDb.email,
                privilege: clientInDb.nom,
            };

            console.log("req.session ==>", request.session);


            //LocalStorage => sensible aux attaques XSS // faille Cross site Scripting ! injection du contenu dans une page web
            //Cookies => sensible aux attaques CSRF // Cross Site Request Forgery , faille qui consiste simplement à faire exécuter à une victime une requête HTTP à son insu
            //Envoie token dans le body => localstorage 
            //Envoie token identique en cookie => navigateur. Quand le front passe ces deux informations au server, les deux tokens doivent matcher.


            /* On créer le token CSRF qui partira avec le body */
            const xsrfToken = crypto.randomBytes(70).toString('hex');

            // On créer le cookie contenant token CSRF. On comparera les deux au retour.
            //sameSite: strict  => Le cookie concerné par cette instruction ne sera envoyé que si la requête provient du même site web
            response.status(201).cookie('xsrfToken', xsrfToken, {
                httpOnly: true, // Garantit que le cookie n’est envoyé que sur HTTP(S), pas au JavaScript du client, ce qui renforce la protection contre les attaques de type cross-site scripting.
                secure: true, // si true, la navigateur n'envoit que des cookie sur du HTTPS
                sameSite: 'strict', //le mode Strict empêche l’envoi d’un cookie de session dans le cas d’un accès au site via un lien externe//https://blog.dareboost.com/fr/2017/06/securisation-cookies-attribut-samesite/
                signed: true, // on devra utiliser req.signedCookies au retour ! 
                expires: new Date(Date.now() + 10 * 3600000), // par défault une expiratione 10h après
            });


            /**
             * Si l'utilisateur a coché la case 'se souvenir de moi, on ajoute 7 jours de validité à sa session
             * il peut ainsi quitter son navigateur et revenir sur la page, il devrait rester connecté
             * on indique en date d'expiration la date courante + une heure (en millisecondes)
             */
            if (request.body.remember) {
                request.session.cookie.expires = new Date(Date.now() + 7 * 24 * 3600000); //je rajoute 7 jours de validité.
            }


            // un petit rappel de passage ...

            if (clientInDb.nom === 'Administrateur' || clientInDb.nom === 'Developpeur') {

                const adminInDbEmail = await AdminVerifEmail.findByIdClient(clientInDb.id);


                if (adminInDbEmail === null || adminInDbEmail.verifEmail === false) {

                    response.status(200).json({
                        xsrfToken: xsrfToken,
                        id: clientInDb.id,
                        prenom: clientInDb.prenom,
                        nomFamille: clientInDb.nomFamille,
                        email: clientInDb.emailAddress,
                        privilege: clientInDb.nom,
                        message: "Bonjour hÔ vénérable Administrateur ! Merci de faire vérifier votre email 😉 "
                    });

                    return;

                }
            };

            // On envoie une reponse JSON concernant les infos du user avec le token a comparé avec celui dans le cookie.
            response.status(200).json({
                xsrfToken: xsrfToken,
                id: clientInDb.id,
                prenom: clientInDb.prenom,
                nomFamille: clientInDb.nomFamille,
                email: clientInDb.emailAddress,
                privilege: clientInDb.nom,
            });


            console.log(`L'utilisateur ${clientInDb.prenom} ${clientInDb.nomFamille} a bien été authentifié.`);


        } catch (error) {
            console.trace('Erreur dans la méthode login du authController :',
                error);

            response.status(500).json(error.message);
        }

    },

    deconnexion: async (req, res) => {
        try {



            console.log("req.session a l'entrée de la déconnexion ==> ", req.session);

            //je change a false la valeur du headers
            //res.append('x-xsrf-token', 'false');
            //je détruis la session
            req.session.destroy(); // je supprime ma session => aprés vérif ça supprime bien la clé dans REDIS !
            //je supprime le cookie qui contient une patie de l'information pour s'authentifier (le token contre les XSS)
            res.cookie('xsrfToken', "", { //ou res.clearCookie  => La doc stipule que le cookie sera supprimé par le client seulement si les options données sont équivalent a ceux données lors de sa création. Je redonne donc les options de cookie (excluding expires and maxAge.).
                path: '/',
                httpOnly: true, //doc => https://expressjs.com/en/api.html#res.sendStatus
                secure: true,
                sameSite: 'strict',
                signed: true,
            })

            console.log("client déconnecté ! valeur de req.session maintenant ==> ", req.session)

            return res.status(200).json("L'utilisateur a été déconnecté avec succés");

        } catch (error) {
            console.trace(
                'Erreur dans la méthode deconnexion du authController :',
                error);
            res.status(500).json(error.message);
        }

    },

    cookie: async (req, res) => {
        try {
            //Si cette route est contactée, le user a accepté les cookies, je stocke sur son navigateur un cokie qui contient cette information
            //on récupére l'info d'une chekbox, bouton radio, 
            if (req.signedCookies.cookieAccepted) {
                return res.json("Vous avez accepté notre politique d'utilisation des cookies sur ce site et nous vous en remerçiont !");
            }

            if (req.body.cookieAccepted === 'true') {
                res.status(200).cookie('cookieAccepted', true, {
                    httpOnly: true, // Garantit que le cookie n’est envoyé que sur HTTP(S), pas au JavaScript du client, ce qui renforce la protection contre les attaques de type cross-site scripting.
                    secure: true, // si true, la navigateur n'envoit que des cookie sur du HTTPS
                    //sameSite: 'strict', //le mode Strict empêche l’envoi d’un cookie de session dans le cas d’un accès au site via un lien externe//https://blog.dareboost.com/fr/2017/06/securisation-cookies-attribut-samesite/
                    signed: true, // on devra utiliser req.signedCookies au retour ! 
                    expires: new Date(Date.now() + 24 * 3600000 * 180), // par défault une expiration aprés 180 jours
                }).json("Vous avez accepté notre politique d'utilisation des cookies sur ce site et nous vous en remerçiont !");


                req.session.cookie = 'accepted';
            }
            console.log()
            return res.json("Merci d\'accépter la politique de cookie pour continuer d\'utiliser ce site");


        } catch (error) {
            console.trace(
                'Erreur dans la méthode cookie du authController :',
                error);
            res.status(500).json(error.message);
        }

    },




}

module.exports = authController;