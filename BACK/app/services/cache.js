const chalk = require('chalk');
const {
    createClient
} = require('redis');

const client = createClient();

const {
    promisify,
    inspect
} = require('util');

const redis = {
    del: promisify(client.del).bind(client), // pour éffacer une clé
    get: promisify(client.get).bind(client), // pour obtenir un clé
    set: promisify(client.set).bind(client), // pour insérer une nouvelle clé avec une nouvelle valeur
    setex: promisify(client.setex).bind(client), // je définis une clé avec un temps d'éxpiration (en sec)
    exists: promisify(client.exists).bind(client) // pour vérifier si une clé existe
};
//L'objet Set (Ensemble en français) permet de stocker des valeurs uniques, 
//Une valeur donnée ne peut apparaître qu'une seule fois par Set
const keysIndex = new Set();
console.log(chalk.hex('#FF8800')("Redis On"));
console.log(chalk.hex('#585F5A')('Ne pas préter attention au message : "ERR wrong number of arguments for del command" 😉 '))
//console.log(chalk.hex('#585F5A')('Le script de démmarage et de redémarrage automatique de nodemon efface les clés déja présente dans Redis, ce message survient quand il n\'y pas de clés'));


// côté routeur, on a dit que cacheGenerator retournait un objet contenant 2 middlewares

/**
 * A litteral object containing 2 middlewares for caching purpose
 * @typedef {object} CacheObject
 * @property {Middleware} cache - the middleware for caching
 * @property {Middleware} flush - the middleware for flushing
 */

/**
 * An Express Middleware, sharing a request and a response object with its peers
 * @typedef {Function} Middleware
 * @param {object} request
 * @param {object} response
 * @param {Function} next
 */

/**
 * A function that generates ready-to-use middlewares
 * @param {object} options - an option object for further configuration
 * @returns {CacheObject} the 2 configured middlewares
 */
const cacheGenerator = (options) => {
    // console.log(chalk.yellow("coucou du module de mise en cache !"));
    return {
        cache: async (request, response, next) => {

            // le prefix devient paramétrable via l'objet options
            const theKey = `${options.prefix}:${request.originalUrl}`;

            
            if (await redis.exists(theKey)) {
                // on la sort du registre et on la parse en json puis on la renvoie
                const theValue = await redis.get(theKey).then(JSON.parse);
                console.log(chalk.yellow(`la valeur ${theKey} est déja dans Redis, on la renvoie depuis Redis`));
        
                // et on répond directement à l'utilisateur
                response.json(theValue);


            } else {

                const originalResponseSend = response.send.bind(response);

                response.send = (theResponse) => {

                    // en fait response.json fait appel à response.send
                    // tout ce que fait response.json, c'est appliquer JSON.stringify et définir le Content-Type de la réponse, avant d'appeler response.send

                    // donc en "piégeant" response.send plutôt que response.json, on s'assure de couvrir absolument tous les cas
                    // et en prime, plus besoin d'utiliser JSON.stringify plus bas, car c'est déjà appliqué au moment où response.json fait appel à response.send
                    // et inutile quand nos usagers feront directement response.send (puisqu'ils passeront alors une string)

                    // on garde une trace des clés qu'on utilise
        
                    
                    keysIndex.add(theKey);

                    
                    // on stocke la réponse dans le cache, sans la stringifier (plus besoin)
                    redis.setex(theKey, options.ttl, theResponse);


                    console.log(chalk.yellow(`la valeur ${theKey} n'est pas dans Redis, on la renvoie depuis postgreSQL`));
                 
                    originalResponseSend(theResponse);
                }

                next();
            }
        },
        flush: async (request, response, next) => {
            //on boucle sur toutes les clés dans Redis, et pour chaque clés détenu dans l'index des clés, 
            //on la supprime et sans attendre ,
            //on passse a la prochaine clé a supprimer.
            //on supprime aussi l'index des clés a la fin.
            console.log(chalk.hex('#16DE40')("on s'aprete a flush dans Redis..."));

            for (const key of keysIndex) {
                await redis.del(key);
                console.log(chalk.hex('#16DE40')("on flush dans Redis"));
                
                keysIndex.delete(key);
                
            }

            next();
        }
    }
};

module.exports = cacheGenerator;