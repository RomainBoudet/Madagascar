const validator = require('validator');
const capitalize = (string) => string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
const capitalizeNotForceLowerCase = (string) => string.charAt(0).toUpperCase() + string.slice(1); //Que pour la ligne d'adresse, si celle çi contient des noms propres, l'utilisateur peut les mettre en majuscule...



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
            //theBody[prop] = validator.blacklist(theBody[prop], ['&']);
            theBody[prop] = validator.blacklist(theBody[prop], ['"']);
            //theBody[prop] = validator.blacklist(theBody[prop], ['/']);
            theBody[prop] = validator.blacklist(theBody[prop], ['|']);
            //theBody[prop] = validator.blacklist(theBody[prop], ['#']);
            theBody[prop] = validator.blacklist(theBody[prop], ['{']);
            theBody[prop] = validator.blacklist(theBody[prop], ['}']);
            theBody[prop] = validator.blacklist(theBody[prop], ['[']);
            theBody[prop] = validator.blacklist(theBody[prop], [']']);
            theBody[prop] = validator.blacklist(theBody[prop], ['=']);
            theBody[prop] = validator.blacklist(theBody[prop], ['*']);
            theBody[prop] = validator.blacklist(theBody[prop], ['$']);
            theBody[prop] = validator.blacklist(theBody[prop], ['%']);
            //theBody[prop] = validator.blacklist(theBody[prop], ['_']);

            theBody[prop] = validator.trim(theBody[prop]);
        }

        //Je formate quelque entrées pour que ca soit propre en BDD...

    if (req.body.pays) {
        req.body.pays = req.body.pays.toUpperCase();
    }
    if (req.body.prenom) {
        req.body.prenom = capitalize(req.body.prenom);
    }
    if (req.body.nomFamille) {
        req.body.nomFamille = capitalize(req.body.nomFamille);
    }
    if (req.body.ligne1) {
        req.body.ligne1 = capitalizeNotForceLowerCase(req.body.ligne1);
    }
    if (req.body.ligne2) {
        req.body.ligne2 = capitalize(req.body.ligne2);
    }
    if (req.body.ligne3) {
        req.body.ligne3 = capitalize(req.body.ligne3);
    }
    if (req.body.titre) {
        req.body.titre = capitalize(req.body.titre);
    }
    if (req.body.ville) {
        req.body.ville = capitalize(req.body.ville);
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
//le MW suivant n'est pas utilisé et a été remplacé par un MW direct dans l'index, en amont.
 const cleanPassword = (req, res, next) => {

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
            theBody[prop] = validator.blacklist(theBody[prop], ['_']);

        }
        next();

         //le password doit pouvoir contenir => @#$%^&* et le phone number : +

    } catch (err) {

        console.trace(
            'Erreur dans la méthode cleanPassword du sanitizer :',
            err);
            return res.status(500).json({
                message: 'Erreur dans le sanitizer'
              });

    }
} 


module.exports = {
    clean,
    cleanPassword

};