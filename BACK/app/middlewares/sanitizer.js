const validator = require('validator');


/**
 * sanitizer Middleware
 * @module middleware/clean
 * 
 */
const clean = (req, res, next) => {

    try {
        //On boucle sur chaque propriétées du body et on supprime tous caractéres interdit ! 
        // blacklist porte bien son nom et trim supprime les espaces avant et apres.https://www.npmjs.com/package/validator
        // on aurait pu utiliser la méthode escape plutot que blacklist mais escape enléve aussi les apostrophes et je veux les garder... et je préfére une suppression des caractéres plutot que leur conversion en entité HTML...
        // j'aurais bien mis un tableau de caractéres comme ceci: ['>','<', '&', '"', '/', '|', '#', '{', '}','='] mais blacklist me prend aussi la virgule que je veux garder...
        //a l'avenir, une regex serait peut être préférable plutot qu'un module entrainant un package en plus avec ses potentielles failles...
        //a l'avenir il faudrait également logger les cas ou on a tenté d'insérer des caractéres spéciaux.

        const theBody = req.body;

        for (let prop in theBody) {
            theBody[prop] = validator.blacklist(theBody[prop], ['>']);
            theBody[prop] = validator.blacklist(theBody[prop], ['<']);
            theBody[prop] = validator.blacklist(theBody[prop], ['&']);
            theBody[prop] = validator.blacklist(theBody[prop], ['"']);
            theBody[prop] = validator.blacklist(theBody[prop], ['/']);
            theBody[prop] = validator.blacklist(theBody[prop], ['|']);
            theBody[prop] = validator.blacklist(theBody[prop], ['#']);
            theBody[prop] = validator.blacklist(theBody[prop], ['{']);
            theBody[prop] = validator.blacklist(theBody[prop], ['}']);
            theBody[prop] = validator.blacklist(theBody[prop], ['[']);
            theBody[prop] = validator.blacklist(theBody[prop], [']']);
            theBody[prop] = validator.blacklist(theBody[prop], ['=']);
            theBody[prop] = validator.blacklist(theBody[prop], ['+']);
            theBody[prop] = validator.blacklist(theBody[prop], ['*']);
            theBody[prop] = validator.blacklist(theBody[prop], ['$']);
            theBody[prop] = validator.blacklist(theBody[prop], ['%']);
            theBody[prop] = validator.blacklist(theBody[prop], ['_']);

            theBody[prop] = validator.trim(theBody[prop]);
        }

        next();

    } catch (err) {

        console.trace(
            'Erreur dans la méthode clean du sanitizer :',
            err);
        
        return res.status(500).json({
            message: 'Erreur dans le sanitizer'
          });

    }

}
//ici un petit MW special pour les routes avec passwords pour trimmer et interdire les balises mais pas les caractéres spéciaux que je veux dans les mots de passe. Le schema Joi prendra le relai pour plus de finesse mais Joi gére mal les trim...

const trim = (req, res, next) => {

    try {
        const theBody = req.body;

        for (let prop in theBody) {

            theBody[prop] = validator.trim(theBody[prop]);
            theBody[prop] = validator.blacklist(theBody[prop], ['>']);
            theBody[prop] = validator.blacklist(theBody[prop], ['<']);
            theBody[prop] = validator.blacklist(theBody[prop], ['"']);
            theBody[prop] = validator.blacklist(theBody[prop], ['/']);
            theBody[prop] = validator.blacklist(theBody[prop], ['|']);
            theBody[prop] = validator.blacklist(theBody[prop], ['{']);
            theBody[prop] = validator.blacklist(theBody[prop], ['}']);
            theBody[prop] = validator.blacklist(theBody[prop], ['[']);
            theBody[prop] = validator.blacklist(theBody[prop], [']']);
            theBody[prop] = validator.blacklist(theBody[prop], ['=']);
            theBody[prop] = validator.blacklist(theBody[prop], ['+']);
            theBody[prop] = validator.blacklist(theBody[prop], ['_']);

        }
        next();

        /* le password doit contenir => @#$%^&* */

    } catch (err) {

        console.trace(
            'Erreur dans la méthode trim du sanitizer :',
            err);
            return res.status(500).json({
                message: 'Erreur dans le sanitizer'
              });

    }
}

module.exports = {
    clean,
    trim
};