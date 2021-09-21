const chalk = require('chalk');
const consol = require ('../services/colorConsole');
const redis = require('./redis');


//L'objet Set (Ensemble en français) permet de stocker des valeurs uniques, 
//Une valeur donnée ne peut apparaître qu'une seule fois par Set
// mémoire qui manque a REDIS pour reetenir toutes clés clés utilisées par REDIS.
const keysIndex = new Set();
// pourquoi pas client.keys('*'); parce que c'est lent ! et pour un SGBD le plus rapide du monde, bof...
// Et trés lent si le nombre de clé augmente, car REDIS ne tient pas de registre de clé. Parcout toute sa mémoire a la recherche de clé sinon.
//Index utile pour flusher en cas d'écriture ! On pourra boucler sur cet index !

consol.redis("Redis On");
consol.forget('Ne pas préter attention au message : "ERR wrong number of arguments for del command" 😉 ');
//Le script de démmarage et de redémarrage automatique de nodemon efface les clés déja présente dans Redis, ce message survient quand il n\'y pas de clés


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
   
    return {
        cache: async (request, response, next) => {

            // le prefix devient paramétrable via l'objet options
            const theKey = `${options.prefix}:${request.originalUrl}`;

            
            if (await redis.exists(theKey)) {
                // on la sort du registre et on la parse en json puis on la renvoie
                const theValue = await redis.get(theKey).then(JSON.parse);
                console.log("theKey==> ", theKey);
                consol.redis(`la valeur ${theKey} est déja dans Redis, on la renvoie depuis Redis`);

                // et on répond directement à l'utilisateur
                response.status(200).json(theValue);


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
                    //sinon example :  await redis.set(`key`, JSON.stringify(value));
                    redis.setex(theKey, options.ttl, theResponse);


                    consol.redis(`la valeur ${theKey} n'est pas dans Redis, on la renvoie depuis postgreSQL`);
                 
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
            consol.redis("on s'aprete a flush dans Redis...");

            for (const key of keysIndex) {
                await redis.del(key);
                consol.redis("on flush dans Redis");
                
                keysIndex.delete(key);
                
            }

            next();
        }

       
    }
};



module.exports = cacheGenerator;



  
