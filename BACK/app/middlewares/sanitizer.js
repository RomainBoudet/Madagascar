const validator = require('validator');


/**
 * sanitizer Middleware
 * @module middleware/sanitizer
 * 
 */
const clean = (req, res, next) => {

    try {
        //On boucle sur chaque propriétées du body et on supprime tous caractéres interdit ! 
        // blacklist porte bien son nom et trim supprime les espace avant et apres.https://www.npmjs.com/package/validator
        // on aurait pu utiliser la méthode escape plutot que blacklist mais escape enléve aussi les apostrophes et je veux les garder... et je préfére une suppression des caractéres plutot que leur conversion en entité HTML...
        // j'aurais bien mis un tableau de caractéres comme ceci: ['>','<', '&', '"', '/', '|', '#', '{', '}','='] mais blacklist me prend aussi la virgule que je veux garder...
      
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
            theBody[prop] = validator.blacklist(theBody[prop], ['-']);

            theBody[prop] = validator.trim(theBody[prop]);
        }

        next();

    } catch (err) {

        return res.status(500).json({
            message: 'Erreur lors de l\'opération de sanitizer'
        });

    }
}

module.exports = clean;

