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


module.exports = redis;
