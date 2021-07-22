const Client = require('../models/client');
const Panier = require('../models/panier');
const AdminPhone = require('../models/adminPhone');
const Privilege = require ('../models/privilege');
const ClientHistoPass = require('../models/clientHistoPass');
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


    getAll: async (req, res) => {
        try {
            const clients = await ClientHistoPass.findAll();

            res.status(200).json(clients);
        } catch (error) {
            console.trace('Erreur dans la méthode getAllUser du userController :',
                error);
            res.status(500).json(error.message);
        }
    },

    getOne: async (req, res) => {
        try {

            const client = await ClientHistoPass.findOne(req.params.id);
            res.json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode getUserbyId du userController :',
                error);
            res.status(500).json(error.message);
        }
    },

    

    new: async (req, res) => {
        try {

            const data = {};
            //!Client :
            //data.prepasswordHash = req.body.prepasswordHash;
            //data.idClient = req.body.idClient;
            //data.email = req.body.email;
            //data.password = req.body.password;
            //!Panier :
            //data.passwordHash = req.body.passwordHash;
            //data.idClient = req.body.idClient;
            //!AdminPhone :
            //data.passwordHash = req.body.passwordHash;
            //data.idClient = req.body.idClient;
            //!Privilege :
            //data.passwordHash = req.body.passwordHash;
            //ClientHistoPass :
            //!data.passwordHash = req.body.passwordHash;
            //data.idClient = req.body.idClient;

            console.log("req.body ==> ",req.body);
            const newClient = new ClientHistoPass(data);
            await newClient.save();
            res.json(newClient);
        } catch (error) {
            console.log(`Erreur lors de l'enregistrement du nouveau client: ${error.message}`);
            res.status(500).json(error.message);
        }
    },


    delete: async (req, res) => {

        try {

            const clientInDb = await ClientHistoPass.findOne(req.params.id);

            const client = await clientInDb.delete();

            res.json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode DeleteUserById du userController :',
                error);
            res.status(500).json(error.message);
        }
    },








    updateClient: async (req, res) => {
        try {

            const {
                id
            } = req.params;
            console.log(id);
            const updateClient = await Client.findOne(id);

            console.log("req.body =>", req.body);
            console.log("Dans le controller updateClient avant modif vaut => ", updateClient);


             const prepasswordHash = req.body.prepasswordHash;
            const idClient = req.body.idClient;
            const email = req.body.email;
            const password = req.body.password; 

            let updateClientInfo = {};
            let userMessage = {};

            updateClientInfo.id = updateClient.id;

            if (prepasswordHash) {
                updateClient.prepasswordHash = prepasswordHash;
                userMessage.prepasswordHash = 'Votre nouveau prepasswordHash a bien été enregistré ';
            } else if (!prepasswordHash) {
                updateClientInfo.prepasswordHash = updateClient.prepasswordHash
                userMessage.prepasswordHash = 'Votre prepasswordHash n\'a pas changé';
            }


            if (idClient) {
                updateClient.idClient = idClient;
                userMessage.idClient = 'Votre nouveau idClient a bien été enregistré ';
            } else if (!idClient) {
                updateClientInfo.idClient = updateClient.idClient
                userMessage.idClient = 'Votre idClient n\'a pas changé';
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





    updatePanier: async (req, res) => {
        try {

            const {
                id
            } = req.params;
            console.log(id);
            const updateClient = await Panier.findOne(id);


            const passwordHash = req.body.passwordHash;
            const idClient = req.body.idClient;

            let updateClientInfo = {};
            let userMessage = {};

            updateClientInfo.id = updateClient.id;

            if (passwordHash) {
                updateClient.passwordHash = passwordHash;
                userMessage.passwordHash = 'Votre nouveau passwordHash a bien été enregistré ';
            } else if (!passwordHash) {
                updateClientInfo.passwordHash = updateClient.passwordHash
                userMessage.passwordHash = 'Votre passwordHash n\'a pas changé';
            }


            if (idClient) {
                updateClient.idClient = idClient;
                userMessage.idClient = 'Votre nouveau idClient a bien été enregistré ';
            } else if (!idClient) {
                updateClientInfo.idClient = updateClient.idClient
                userMessage.idClient = 'Votre idClient n\'a pas changé';
            }

           
            await updateClient.update();

            res.json(userMessage);

        } catch (error) {
            console.log(`Erreur lors de l'enregistrement du nouveau client: ${error.message}`);
            res.status(500).json(error.message);
        }
    },


    updateAdminPhone: async (req, res) => {
        try {

            const {
                id
            } = req.params;
            console.log(id);
            const updateClient = await AdminPhone.findOne(id);


            const passwordHash = req.body.passwordHash;
      

            let updateClientInfo = {};
            let userMessage = {};

            updateClientInfo.id = updateClient.id;

            if (passwordHash) {
                updateClient.passwordHash = passwordHash;
                userMessage.passwordHash = 'Votre nouveau passwordHash a bien été enregistré ';
            } else if (!passwordHash) {
                updateClientInfo.passwordHash = updateClient.passwordHash
                userMessage.passwordHash = 'Votre passwordHash n\'a pas changé';
            }


           
            await updateClient.update();

            res.json(userMessage);

        } catch (error) {
            console.log(`Erreur lors de l'enregistrement du nouveau client: ${error.message}`);
            res.status(500).json(error.message);
        }
    },


    updatePrivilege: async (req, res) => {
        try {

            const {
                id
            } = req.params;
            console.log(id);
            const updateClient = await Privilege.findOne(id);


            const passwordHash = req.body.passwordHash;
      

            let updateClientInfo = {};
            let userMessage = {};

            updateClientInfo.id = updateClient.id;

            if (passwordHash) {
                updateClient.passwordHash = passwordHash;
                userMessage.passwordHash = 'Votre nouveau passwordHash a bien été enregistré ';
            } else if (!passwordHash) {
                updateClientInfo.passwordHash = updateClient.passwordHash
                userMessage.passwordHash = 'Votre passwordHash n\'a pas changé';
            }


           
            await updateClient.update();

            res.json(userMessage);

        } catch (error) {
            console.log(`Erreur lors de l'enregistrement du nouveau client: ${error.message}`);
            res.status(500).json(error.message);
        }
    },


    updateClientHistoPass: async (req, res) => {
        try {

            const {
                id
            } = req.params;
            console.log(id);
            const updateClient = await ClientHistoPass.findOne(id);


            const passwordHash = req.body.passwordHash;
      

            let updateClientInfo = {};
            let userMessage = {};

            updateClientInfo.id = updateClient.id;

            if (passwordHash) {
                updateClient.passwordHash = passwordHash;
                userMessage.passwordHash = 'Votre nouveau passwordHash a bien été enregistré ';
            } else if (!passwordHash) {
                updateClientInfo.passwordHash = updateClient.passwordHash
                userMessage.passwordHash = 'Votre passwordHash n\'a pas changé';
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