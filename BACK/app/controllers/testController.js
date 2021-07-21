const Client = require('../models/client');
const Panier = require('../models/panier');
const consol = require('../services/colorConsole');


/**
 * Une méthode qui va servir uniquement a téster les models au cour de leurs créations...
 * Retourne un json
 * @name testController
 * @method testController
 * @param {Express.Request} request - l'objet représentant la requête
 * @param {Express.Response} response - l'objet représentant la réponse
 * @return {JSON}  - une donnée en format json
 */
const testController = {


    getAllClient: async (req, res) => {
        try {
            const clients = await Panier.findAll();

            res.status(200).json(clients);
        } catch (error) {
            console.trace('Erreur dans la méthode getAllUser du userController :',
                error);
            res.status(500).json(error.message);
        }
    },

    getUserbyId: async (req, res) => {
        try {

            const client = await Panier.findOne(req.params.id);
            res.json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode getUserbyId du userController :',
                error);
            res.status(500).json(error.message);
        }
    },

    getUserbyEmail: async (req, res) => {
        try {

            const {
                email
            } = req.body;

            const client = await Client.findByEmail(email);
            res.json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode getUserbyId du userController :',
                error);
            res.status(500).json(error.message);
        }
    },

    aut: async (req, res) => {
        try {

            const {
                email,
                password
            } = req.body;
            console.log(req.body);
            const client = await Client.authenticate(email, password);
            res.json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode getUserbyId du userController :',
                error);
            res.status(500).json(error.message);
        }
    },

    newClient: async (req, res) => {
        try {

            const data = {};
            //data.prenom = req.body.prenom;
            //data.idClient = req.body.idClient;
           // data.email = req.body.email;
           // data.password = req.body.password;
            data.total = req.body.total;
            data.idClient = req.body.idClient; 

            console.log("req.body ==> ",req.body);
            const newClient = new Panier(data);
            await newClient.save();
            res.json(newClient);
        } catch (error) {
            console.log(`Erreur lors de l'enregistrement du nouveau client: ${error.message}`);
            res.status(500).json(error.message);
        }
    },

    updateClient: async (req, res) => {
        try {

            const {
                id
            } = req.params;
            console.log(id);
            const updateClient = await Panier.findOne(id);

            console.log("req.body =>", req.body);
            console.log("Dans le controller updateClient avant modif vaut => ", updateClient);


             const prenom = req.body.prenom;
            const idClient = req.body.idClient;
            const email = req.body.email;
            const password = req.body.password; 

            let updateClientInfo = {};
            let userMessage = {};

            updateClientInfo.id = updateClient.id;

            if (prenom) {
                updateClient.prenom = prenom;
                userMessage.prenom = 'Votre nouveau prenom a bien été enregistré ';
            } else if (!prenom) {
                updateClientInfo.prenom = updateClient.prenom
                userMessage.prenom = 'Votre prenom n\'a pas changé';
            }


            if (idClient) {
                updateClient.idClient = idClient;
                userMessage.idClient = 'Votre nouveau nom de famille a bien été enregistré ';
            } else if (!idClient) {
                updateClientInfo.idClient = updateClient.idClient
                userMessage.idClient = 'Votre nom de famille n\'a pas changé';
            }


            if (email) {
                updateClient.email = email;
                userMessage.elail = 'Votre nouveau email a bien été enregistré ';
            } else if (!email) {
                updateClientInfo.email = updateClient.email
                userMessage.email = 'Votre email n\'a pas changé';
            }


            if (password) {
                updateClient.password = password;
                userMessage.password = 'Votre nouveau password a bien été enregistré ';
            } else if (!password) {
                updateClientInfo.password = updateClient.password
                userMessage.password = 'Votre password n\'a pas changé';
            } 

           
          

            await updateClient.update();

            res.json(userMessage);

        } catch (error) {
            console.log(`Erreur lors de l'enregistrement du nouveau client: ${error.message}`);
            res.status(500).json(error.message);
        }
    },


    delClient: async (req, res) => {

        try {

            const clientInDb = await Panier.findOne(req.params.id);

            const client = await clientInDb.delete();

            res.json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode DeleteUserById du userController :',
                error);
            res.status(500).json(error.message);
        }
    },




    updatePanier: async (req, res) => {
        try {

            const {
                id
            } = req.params;
            console.log(id);
            const updateClient = await Panier.findOne(id);


            const total = req.body.total;
            const idClient = req.body.idClient;

            let updateClientInfo = {};
            let userMessage = {};

            updateClientInfo.id = updateClient.id;

            if (total) {
                updateClient.total = total;
                userMessage.total = 'Votre nouveau total a bien été enregistré ';
            } else if (!total) {
                updateClientInfo.total = updateClient.total
                userMessage.total = 'Votre total n\'a pas changé';
            }


            if (idClient) {
                updateClient.idClient = idClient;
                userMessage.idClient = 'Votre nouveau nom de famille a bien été enregistré ';
            } else if (!idClient) {
                updateClientInfo.idClient = updateClient.idClient
                userMessage.idClient = 'Votre nom de famille n\'a pas changé';
            }

           
          

            await updateClient.update();

            res.json(userMessage);

        } catch (error) {
            console.log(`Erreur lors de l'enregistrement du nouveau client: ${error.message}`);
            res.status(500).json(error.message);
        }
    },











}

module.exports = testController;