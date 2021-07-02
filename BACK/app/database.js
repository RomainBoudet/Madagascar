// db est un pool de connecteurs de base de données


/**
 * db est un pool de connecteurs de base de données
 * @module - permet le lien avec la base de données postgreSQL
 */
 const {Pool} = require('pg');

 // ici, les informations de connection sont récupérées dans l'environnement
 // PGHOST pour l'hôte
 // PGUSER pour l'utilisateur
 // PGPASSWORD pour le mot de passe
 // PGDATABASE pour la base de données
 
 const db = new Pool();
 
 // maintenant, on n'a plus un seul connecteur (comme avec Client) mais un pool de connecteur (avec Pool)
 module.exports = db;