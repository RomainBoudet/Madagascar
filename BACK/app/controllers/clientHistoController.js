const ClientHistoPass = require('../models/clientHistoPass');
const ClientHistoConn = require('../models/clientHistoConn');



/**
 * Une méthode qui va servir a intéragir avec le model ClientHistoPass et ClientHistoConn concernant les historique de password et connexion des clients pour les intéractions avec la BDD 
 * Retourne un json
 * Ici pas de méthode Update dans ce controller :les historique de password et de connexion des clients n'ont pas vocation a pouvoir être "updaté"...
 * @name clientHistoController
 * @param {Express.Request} request - l'objet représentant la requête
 * @param {Express.Response} response - l'objet représentant la réponse
 * @return {JSON}  - une donnée en format json
 */
const clientHistoController = {


    getAllHistoPass: async (req, res) => {
        try {
            const clients = await ClientHistoPass.findAll();

            res.status(200).json(clients);
        } catch (error) {
            console.trace('Erreur dans la méthode  getAllHistoPass du clientHistoController :',
                error);
            res.status(500).json(error.message);
        }
    },

    getAllHistoConn: async (req, res) => {
        try {
            const clients = await ClientHistoConn.findAll();

            res.status(200).json(clients);
        } catch (error) {
            console.trace('Erreur dans la méthode  getAllHistoConn du clientHistoController :',
                error);
            res.status(500).json(error.message);
        }
    },

    getOneHistoPass: async (req, res) => {
        try {

            const client = await ClientHistoPass.findOne(req.params.id);
            res.json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode  getOneHistoPass du clientHistoController :',
                error);
            res.status(500).json(error.message);
        }
    },

    getOneHistoConn: async (req, res) => {
        try {

            const client = await ClientHistoConn.findOne(req.params.id);
            res.json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode  getOneHistoConn du clientHistoController :',
                error);
            res.status(500).json(error.message);
        }
    },


    getHistoPassByIdClient: async (req, res) => {
        try {
            console.log(req.params);
            const client = await ClientHistoPass.findByIdClient(req.params.id);
            res.json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode getHistoPassByIdClient du clientHistoController :',
                error);
            res.status(500).json(error.message);
        }
    },
    
    getHistoConnByIdClient: async (req, res) => {
        try {
            const client = await ClientHistoConn.findByIdClient(req.params.id);
            
            res.json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode getHistoConnByIdClient du clientHistoController :',
                error);
            res.status(500).json(error.message);
        }
    },

    getLastHistoConn: async (req, res) => {
        try {
            
            const client = await ClientHistoConn.findLastTrueConnexionByIdClient(req.params.id);

            console.log(client);

            if ((req.session.user.privilege === 'Administrateur' || req.session.user.privilege === 'Client') && req.session.user.idClient !== client.idClient) {
                return res.status(403).json({
                    message: "Vous n'avez pas les droits pour accéder a cette ressource"
                })
            };
           
            client.derniereConnexion = client.to_char;
            delete client.to_char;
            delete client.idClient;
            res.json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode getHistoConnByIdClient du clientHistoController :',
                error);
            res.status(500).json(error.message);
        }
    },


    newHistoPass: async (req, res) => {
        try {

            const data = {};
            
          
            data.passwordHash = req.body.passwordHash;
            data.idClient = req.body.idClient;
        
            const newClient = new ClientHistoPass(data);
            await newClient.save();
            res.json(newClient);
        } catch (error) {
            console.log(`Erreur dans la méthode newHistoPass du clientHistoController : ${error.message}`);
            res.status(500).json(error.message);
        }
    },

    newHistoConn: async (req, res) => {
        try {

            const data = {};

            data.idClient = req.body.idClient;

            console.log("req.body ==> ", req.body);
            const newClient = new ClientHistoConn(data);
            await newClient.true();
            res.json(newClient);
        } catch (error) {
            console.log(`Erreur dans la méthode newHistoConn du clientHistoController : ${error.message}`);
            res.status(500).json(error.message);
        }
    },




    deleteHistoPass: async (req, res) => {

        try {

            const clientInDb = await ClientHistoPass.findOne(req.params.id);

            const client = await clientInDb.delete();

            res.json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteHistoPass du clientHistoController :',
                error);
            res.status(500).json(error.message);
        }
    },

    deleteHistoConn: async (req, res) => {

        try {

            const clientInDb = await ClientHistoConn.findOne(req.params.id);

            const client = await clientInDb.delete();

            res.json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteHistoConn du clientHistoController :',
                error);
            res.status(500).json(error.message);
        }
    },


    deleteHistoPassByIdClient: async (req, res) => {

        try {

            const clientsInDb = await ClientHistoPass.findByIdClient(req.params.id);
            const arrayDeleted = [];
            for (const clientInDb of clientsInDb) {

                const clientHistoConn = await clientInDb.deleteByIdClient();
                arrayDeleted.push(clientHistoConn);
            }


            res.json(arrayDeleted[0]);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteHistoPassByIdClient du clientHistoController :',
                error);
            res.status(500).json(error.message);
        }
    },

    deleteHistoConnByIdClient: async (req, res) => {

        try {

            const clientsInDb = await ClientHistoConn.findByIdClient(req.params.id);
            const arrayDeleted = [];
            for (const clientInDb of clientsInDb) {

                const clientHistoConn = await clientInDb.deleteByIdClient();
                arrayDeleted.push(clientHistoConn);
            }


            res.json(arrayDeleted[0]);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteHistoConnByIdClient du clientHistoController :',
                error);
            res.status(500).json(error.message);
        }
    },



}

module.exports = clientHistoController;