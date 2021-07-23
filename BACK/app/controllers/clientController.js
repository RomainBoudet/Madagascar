const Client = require('../models/client');


/**
 * Une méthode qui va servir a intéragir avec le model Client pour les intéractions avec la BDD
 * Retourne un json
 * @name clientController
 * @method clientController
 * @param {Express.Request} req - l'objet représentant la requête
 * @param {Express.Response} res - l'objet représentant la réponse
 * @return {JSON}  - une donnée en format json
 */
const clientController = {


    getAll: async (req, res) => {
        try {
            const clients = await Client.findAll();

            res.status(200).json(clients);
        } catch (error) {
            console.trace('Erreur dans la méthode getAllUser du clientController :',
                error);
            res.status(500).json(error.message);
        }
    },

    getOne: async (req, res) => {
        try {

            const client = await Client.findOne(req.params.id);
            res.json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode getOne du clientController :',
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
            console.trace('Erreur dans la méthode getUserbyId du clientController :',
                error);
            res.status(500).json(error.message);
        }
    },


    getByIdClient: async (req, res) => {
        try {
            
            const client = await Client.findByIdClient(req.params.id);
            res.json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode getByIdClient du clientController :',
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
            console.trace('Erreur dans la méthode getUserbyId du clientController :',
                error);
            res.status(500).json(error.message);
        }
    },





    new: async (req, res) => {
        try {

            const data = {};
        
            data.prenom = req.body.prenom;
            data.nomFamille = req.body.nomFamille;
            data.email = req.body.email;
            data.password = req.body.password;

            const newClient = new Client(data);
            await newClient.save();
            res.json(newClient);
        } catch (error) {
            console.log(`Erreur dans la méthode new du clientController : ${error.message}`);
            res.status(500).json(error.message);
        }
    },

    updateClient: async (req, res) => {
        try {

            const {
                id
            } = req.params;
            
            const updateClient = await Client.findOne(id);


            const prenom = req.body.prenom;
            const nomFamille = req.body.nomFamille;
            const email = req.body.email;
            const password = req.body.password;
        

            let message = {};

            if (prenom) {
                updateClient.prenom = prenom;
                message.prenom = 'Votre nouveau prenom a bien été enregistré ';
            } else if (!prenom) {
                message.prenom = 'Votre prenom n\'a pas changé';
            }


            if (nomFamille) {
                updateClient.nomFamille = nomFamille;
                message.nomFamille = 'Votre nouveau nom de famille a bien été enregistré ';
            } else if (!nomFamille) {
                message.nomFamille = 'Votre nom de famille n\'a pas changé';
            }


            if (email) {
                updateClient.email = email;
                message.email = 'Votre nouveau email a bien été enregistré ';
            } else if (!email) {
                message.email = 'Votre email n\'a pas changé';
            }


            if (password) {
                updateClient.password = password;
                message.password = 'Votre nouveau password a bien été enregistré ';
            } else if (!password) {
                message.password = 'Votre password n\'a pas changé';
            }

             await updateClient.update();
            // si je veux renvoyer les données ET les infos textuels de ce qui a été modifié dans le même objet : spread opérator
            //const userMessage = {...message, ...newClient};
            // et je devrais renommer les clés de l'objet "message" pour qu'elles ne soient pas identique avec l'autre objet..
            res.json(message);

        } catch (error) {
            console.log(`Erreur dans la methode updateClient du clientController ${error.message}`);
            res.status(500).json(error.message);
        }
    },




    delete: async (req, res) => {

        try {

            const clientInDb = await Client.findOne(req.params.id);

            const client = await clientInDb.delete();

            res.json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode delete du clientController :',
                error);
            res.status(500).json(error.message);
        }
    },


    deleteByIdClient: async (req, res) => {

        try {

            const clientsInDb = await Client.findByIdClient(req.params.id);
            const arrayDeleted = [];
            for (const clientInDb of clientsInDb) {

                const clientHistoConn = await clientInDb.deleteByIdClient();
                arrayDeleted.push(clientHistoConn);
            }


            res.json(arrayDeleted[0]);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteUByIdClient du clientController :',
                error);
            res.status(500).json(error.message);
        }
    },


}

module.exports = clientController;