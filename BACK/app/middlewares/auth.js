/**
 * Un middleware qui controle la présence d'un xcsrf-token en payload et qui vérifi sa signature avec le xsrf-token contenu dans le header, provenant lui du local Storage.
 * Les droits d'accées doivent être de type Administrateur
 */

/**
 * Auth Middleware
 * @module middleware/auth
 */
 const auth = async (req, res, next) => {

    const chalk = require('chalk');
  
  
    try {
  
      const {
        headers
      } = req;
  
  
      const cookieXsrfToken = req.signedCookies.xsrfToken;
  
  
      /* On vérifie que le xsrToken est présent dans les cookies de la session */
      if (!cookieXsrfToken) {
        console.log(chalk.red('Il n\'y a pas de token dans le cookie de session (auth)'))
        return res.status(401).json({
          message: 'Il n\'y a pas de token dans le cookie de session '
        });
      }
  
      console.log('le cookie xsrf est bien présent');
  
      /* On vérifie que le token CSRF est présent dans les en-têtes de la requête */
      if (!headers || !headers['x-xsrf-token']) {
        console.log(chalk.red('Il n\'y a pas de token CRSF dans le header (auth)'))
        return res.status(401).json({
          message: 'Il n\'y a pas de token CRSF dans le header'
        });
      }
      console.log('le header xsrf est bien présent')
  
      const headerXsrfToken = headers['x-xsrf-token'];
  
      //console.log("headerXsrfToken =>", headerXsrfToken);
      //console.log("cookieXsrfToken =>", cookieXsrfToken);
  
      /* On vérifie que le token CSRF correspond à celui présent dans le JWT  */
      if (headerXsrfToken !== cookieXsrfToken) {
        console.log(chalk.red('Probléme de token csrf dans le auth MW'))
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
  
  
      console.log(chalk.red.bold.bgYellow(`L'utilisateur ${req.session.user.pseudo} avec le role ${req.session.user.role} a bien été authentifié via le auth MW !`))
  
      /* On passe l'utilisateur dans notre requête afin que celui-ci soit disponible pour les prochains middlewares */
      //req.user = user;
  
      next();
  
    } catch (err) {
      return res.status(500).json({
        message: 'Erreur lors de l\'autentification'
      });
    }
  }
  
  module.exports = auth;
  
  // pour tester dans postman, mettre en key dans le header : x-xsrf-token
  // et comme valeur, la valeur d'un token xsrf token obtenue via une connexion
  //cookies envoyé automatiquement.