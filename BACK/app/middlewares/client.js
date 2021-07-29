const consol = require('../services/colorConsole');

/**
 * Un middleware qui controle la présence d'un xcsrf-token en payload et qui vérifi sa signature avec le xsrf-token contenu dans le header, provenant lui du local Storage.
 * Les droits d'accées doivent être de type Administrateur
 */

/**
 * Auth Middleware
 * @module middleware/client
 */
 const client = async (req, res, next) => {

    try {
  
      const {
        headers
      } = req;
  
  
      const cookieXsrfToken = req.signedCookies.xsrfToken;
  
  
      /* On vérifie que le xsrToken est présent dans les cookies de la session */
      if (!cookieXsrfToken) {
        consol.auth('Il n\'y a pas de token dans le cookie de session')
        return res.status(401).json({
          message: 'Il n\'y a pas de token dans le cookie de session '
        });
      }
  
      consol.auth('le cookie xsrf est bien présent');
  
      /* On vérifie que le token CSRF est présent dans les en-têtes de la requête */
      if (!headers || !headers['x-xsrf-token']) {
        consol.auth('Il n\'y a pas de token CRSF dans le header')
        return res.status(401).json({
          message: 'Il n\'y a pas de token CRSF dans le header'
        });
      }
      consol.auth('le header xsrf est bien présent');
  
      const headerXsrfToken = headers['x-xsrf-token'];
  
      //consol.auth("headerXsrfToken =>", headerXsrfToken);
      //consol.auth("cookieXsrfToken =>", cookieXsrfToken);
  
      /* On vérifie que le token CSRF correspond à celui présent dans le JWT  */
      if (headerXsrfToken !== cookieXsrfToken) {
        consol.auth('Probléme de token csrf dans le auth MW')
        return res.status(401).json({
          message: 'Probléme de token csrf'
        });
      }
  
      //est-ce que l'utilisateur est connecté
  
      
      if (!req.session.user) {
        return res.status(403).json({
          message: 'Vous n\'avez pas les droit nécéssaires pour accéder a la ressource (auth).'
        });
      }
  
      //est-ce que l'utilisateur a le role developper
      if (req.session.user.role !== 'Developper' && req.session.user.role !== 'Administrateur' && req.session.user.role !== 'Custumer') {
        return res.status(403).json({
          message: 'Vous n\'avez pas les droit nécéssaires pour accéder a la ressource (auth).'
        })
      }
  
  
      consol.auth(`L'utilisateur ${req.session.user.pseudo} avec le role ${req.session.user.role} a bien été authentifié via le auth MW !`);
  
      /* On passe l'utilisateur dans notre requête afin que celui-ci soit disponible pour les prochains middlewares */
      //req.user = user;
  
      next();
  
    } catch (err) {
      console.trace(
        'Erreur dans la méthode Client du MW Client :',
        err);
      return res.status(500).json({
        message: 'Erreur lors de l\'autentification'
      });
    }
  }
  
  module.exports = client;
  
  // pour tester dans postman, mettre en key dans le header : x-xsrf-token
  // et comme valeur, la valeur d'un token xsrf token obtenue via une connexion
  //cookies envoyé automatiquement.