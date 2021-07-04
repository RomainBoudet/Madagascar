const consol = require('../services/colorConsole');

/**
 * Un middleware qui controle la présence d'un xcsrf-token en payload et qui vérifi sa signature avec le xsrf-token contenu dans le header, provenant lui du local Storage.
 * Les droits d'accées doivent être de type Developper
 */

/**
 * Developper Middleware
 * @module middleware/developper
 */
 const dev = async (req, res, next) => {

    try {
  
      const {
        headers
      } = req;
  
      
      const cookieXsrfToken = req.signedCookies.xsrfToken;
      
  
      /* On vérifie que le xsrToken est présent dans les cookies de la session */
      if (!cookieXsrfToken) {
        consol.dev('Il n\'y a pas de token dans le cookie de session')
        return res.status(401).json({
          message: 'Il n\'y a pas de token dans le cookie de session'
        });
      }
  
  
      /* On vérifie que le token CSRF est présent dans les en-têtes de la requête */
      if (!headers || !headers['x-xsrf-token']) {
        consol.dev('Il n\'y a pas de token CRSF dans le header')
        return res.status(401).json({
          message: 'Il n\'y a pas de token CRSF dans le header'
        });
      }
  
      const headerXsrfToken = headers['x-xsrf-token'];
  
      consol.dev("headerXsrfToken =>", headerXsrfToken);
      consol.dev("cookieXsrfToken =>", cookieXsrfToken);
  
      /* On vérifie que le token CSRF correspond à celui présent dans le JWT  */
      if (headerXsrfToken !== cookieXsrfToken) {
        consol.dev('Probléme de token csrf dans le admin MW')
        return res.status(401).json({
          message: 'Probléme de token csrf'
        });
      }
  
      //est-ce que l'utilisateur est connecté
      if (!req.session.user) {
        return res.status(403).json({
          message: 'Vous n\'avez pas les droit nécéssaires pour accéder a la ressource.'
        });
      }
      
      //est-ce que l'utilisateur a le role developper
      if (req.session.user.role !== 'Developper') {
        return res.status(403).json({
          message: 'Vous n\'avez pas les droit nécéssaires pour accéder a la ressource.'
        })
      }
  
      
      consol.dev(`L'utilisateur ${req.session.user.pseudo} avec le role ${req.session.user.role} a bien été authentifié via le developper MW !`);
  
      /* On passe l'utilisateur dans notre requête afin que celui-ci soit disponible pour les prochains middlewares */
      //req.user = user;
  
      return next();
  
    } catch (err) {
      return res.status(500).json({
        message: 'Erreur lors de l\'autentification'
      });
    }
  }
  
  module.exports = dev;
  
  // pour tester dans postman, mettre en key dans le header : x-xsrf-token
  // et comme valeur, la valeur d'un token xsrf token obtenue via une connexion
  //cookies envoyé automatiquement.