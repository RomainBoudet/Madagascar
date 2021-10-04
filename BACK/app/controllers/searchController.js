const Fuse = require('fuse.js');
const Produit = require('../models/produit');

const {
    createClient
} = require('redis');

const client = createClient();

const {
    promisify,
    inspect
} = require('util');

const redis = {
    get: promisify(client.get).bind(client), // pour obtenir un clé
    exists: promisify(client.exists).bind(client) // pour vérifier si une clé existe
};


/**
 * Un objet qui contient des méthodes permettant de rechercher des mots dans la barre de recherche 
 * Retourne un json
 * @name adminController
 * @method adminController
 * @param {Express.Request} request - l'objet représentant la requête
 * @param {Express.Response} response - l'objet représentant la réponse
 * @return {JSON}  - une donnée en format json
 */

//! pour plus de souplesse je pourrais metre en variable l'endroit ou l'utilisateur veut faire sa recherche (categorie, produit, description, etc..) et la valeur du slice qui séléctionne un nombre de résultats. Si c'est données passe en req.body. alors beaucoup plus de choix dans la recherche...

const searchController = {


    search: async (req, res) => {
        try {
            console.time("search");
            //Je vais chercher une clé dans redis, si elle existe, je la prend, sinon je vais la chercher via postgres.
            let produits;
            const theKey = `mada:/v1/user/produits`; //! a vérifier que son nom n'ai pas changé avant déploiement...
            const dataInRedis = await redis.exists(theKey);

            if (dataInRedis) {
                // on la prends dans REDIS si elle y est déja.
                produits = await redis.get(theKey).then(JSON.parse);
                console.log(`la valeur ${theKey} est déja dans Redis, on la renvoie depuis Redis`);

            } else {
                console.log(`la valeur ${theKey} n'est pas dans Redis, on la renvoie depuis Postgres !`);
                produits = await Produit.findAll();

            };

            // Ici, n'ayant pas créeé la clé mada:/v1/user/produits, je ne fais que l'utiliser, elle a bien déja été mis dans l'index en JS qui recéle nos clé REDIS dans la méthode du cacheGenerator, lors de sa création (sur la route /v1/user/produits) et ainsi, elle sera bien supprimée en cas d'activation d'une route flush.  

            // les options de fuse => https://fusejs.io/api/options.html 
            //comprendre le scoring ==> https://fusejs.io/concepts/scoring-theory.html 

            const options = {
                isCaseSensitive: false,
                includeScore: true,
                shouldSort: false,
                // includeMatches: false,
                // findAllMatches: false,
                minMatchCharLength: req.body.search.length - 1, //le nombre de caractére min qui doit matcher avec le résultat : je les veux tous ! -1 car j'admet que l'utilisateur puisse faire UNE faute d'orthographe :)
                // location: 0,
                threshold: 0.6,
                // distance: 100,
                // useExtendedSearch: false,
                ignoreLocation: true,
                // ignoreFieldNorm: false,

                // keys ==> ce dans quoi je décide d'autoriser la recherche !
                keys: [
                    //"description",
                    "produit",
                    //"categorie",
                    // "couleur",
                    //"taille",
                    // "avis",
                ]
            };

            const fuse = new Fuse(produits, options);

            // La valeur que l'on veut chercher
            const pattern = `${req.body.search}`

            const resultat = fuse.search(`${pattern}`);

            if (resultat.length < 1) {
                console.log("Aucun résultat pour cette recherche.")
                return res.status(200).json("Aucun résultat ne correspond a votre recherche.")
            }

            // je veux uniquement les score inférieurs a 0.4 et pas plus de 20 résultats !
            const goodResult = (resultat.filter(item => item.score < 0.3)).slice(0, 20);

            if (goodResult.length < 1) {
                console.log("Aucun résultat pour cette recherche.")
                return res.status(200).json("Aucun résultat ne correspond a votre recherche.")
            }
            // et surtout je veux des données clean et bien formaté : les chiffre en type number, je rajoute les clé qui m'intérese et j'enléve les clés aux valeurs undefined.
            for (const elem of goodResult) {

                elem.item.tva = parseFloat(elem.item.tva);
                elem.item.reduction = parseFloat(elem.item.reduction);
                elem.item.prix = parseFloat(elem.item.prix);
                elem.item.prixHTAvecReduc = parseFloat((elem.item.prix * (1 - elem.item.reduction)).toFixed(2));
                elem.item.prixTTC = parseFloat((elem.item.prixHTAvecReduc * (parseFloat(elem.item.tva) + 1)).toFixed(2));
                elem.item.score = elem.score;
                delete elem.item.nom;
                delete elem.item.prixHT;
                delete elem.item.idTVA;
                delete elem.item.createdDate;
                delete elem.item.updatedDate;
                delete elem.item.idCategorie;
                delete elem.itemidTVA;
                delete elem.item.idReduction;
                delete elem.score;
                delete elem.refIndex;

            };
            // et enfin j'enléve one useless level of nested object pour avoir un jolie tableau d'objet !
            const myCleanData = [];
            for (const elem of goodResult) {
                myCleanData.push(elem.item)
            }

            console.timeEnd("search");

            /*
            Pour homogénéiser les json rendu, il faut veiller a ce que le nom des cles soit les mêmes que dans les routes /user/produit/ (qui rend les produits).
            Format de donnée (et nom des clés) rendus: 
            [ Produit {
    id: 56,
    description: 'Andy shoes are designed to keeping in mind durability as well as trends, the most stylish range of shoes & sandals',
    imageMini: 'http://placeimg.com/640/480',
    produit: 'Generic Concrete Tuna',
    prix: 56,
    couleur: 'orange',
    taille: 'L',
    stock: 6,
    reduction: 0.02,
    tva: 0.2,
    categorie: 'Health',
    image: [
      'http://placeimg.com/640/480/nightlife',
      'http://placeimg.com/640/480/technics',
    ],
    avis: [
      'Veniam commodi qui.',
      'Debitis dolorum dignissimos non occaecati quasi at quisquam quo ut.',
    ],
    prixHTAvecReduc: 54.88,
    prixTTC: 65.86,
    score: 0.01857804455091699
  }, */
            console.log(`La recherche a rendu ${myCleanData.length} produits sur un total de ${goodResult.length} trouvé en lien avec la demande ! Le rendu de la recherche est limité a 20 produits`);
            res.status(200).json(myCleanData);


        } catch (error) {
            console.log(`Erreur dans la méthode search du searchController : ${error.message}`);
            res.status(500).json(error.message);
        }


    },

};

module.exports = searchController;