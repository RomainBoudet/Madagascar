const consol = require('../services/colorConsole');

/**
 * Un middleware qui controle la présence d'un xcsrf-token en payload et qui vérifi sa signature avec le xsrf-token contenu dans le header, provenant lui du local Storage.
 * Les droits d'accées doivent être de type Administrateur
 */

/**
 * Admin Middleware
 * @module middleware/admin
 */
const admin = async (req, res, next) => {

  try {

    const {
      headers
    } = req;


    const cookieXsrfToken = req.signedCookies.xsrfToken;


    /* On vérifie que le xsrToken est présent dans les cookies de la session */
    if (!cookieXsrfToken) {
      console.log('Il n\'y a pas de token dans le cookie de session')
      return res.status(401).json('Vous n\'êtes pas connecté. merci de vous connecter.');
    }


    /* On vérifie que le token CSRF est présent dans les en-têtes de la requête */
    if (!headers || !headers['x-xsrf-token']) {
      console.log('Il n\'y a pas de token CRSF dans le header')
      return res.status(401).json('Vous n\'êtes pas connecté. merci de vous connecter.');
    }

    const headerXsrfToken = headers['x-xsrf-token'];

    console.log("headerXsrfToken =>", headerXsrfToken);
    console.log("cookieXsrfToken =>", cookieXsrfToken);

    /* On vérifie que le token CSRF correspond à celui présent dans le JWT  */
    if (headerXsrfToken !== cookieXsrfToken) {
      console.log('Probléme de token csrf dans le admin MW')
      return res.status(401).json('Vous n\'êtes pas connecté. merci de vous connecter.');
    }
    console.log("req.session.user ==>>", req.session.user);
    //est-ce que l'utilisateur est connecté
    if (!req.session.user) {
      return res.status(403).json('Vous n\'êtes pas connecté. merci de vous connecter.');
    }

    //est-ce que l'utilisateur a le role Administrateur ou Developper ?
    if (req.session.user.privilege !== 'Developpeur' && req.session.user.privilege !== 'Administrateur') {
      return res.status(403).json({
        message: 'Vous n\'avez pas les droit nécéssaires pour accéder a la ressource.'
      })
    }


    console.log(`L'utilisateur ${req.session.user.prenom} avec le role ${req.session.user.privilege} a bien été authentifié via le admin MW !`);

    /* On passe l'utilisateur dans notre requête afin que celui-ci soit disponible pour les prochains middlewares */
    //req.user = user;

    return next();

  } catch (err) {
    console.trace(
      'Erreur dans la méthode Admin du Mw Admin :',
      err);
    return res.status(500).json({
      message: 'Erreur lors de l\'autentification'
    });
  }
}

module.exports = admin;

// pour tester dans postman, mettre en key dans le header : x-xsrf-token
// et comme valeur, la valeur d'un token xsrf token obtenue via une connexion
//cookies envoyé automatiquement.