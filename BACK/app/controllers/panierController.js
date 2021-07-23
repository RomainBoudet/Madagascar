const Panier = require('../models/panier');

/**
 * Une méthode qui va servir a intéragir avec le model Panier pour les intéractions avec la BDD 
 * Retourne un json
 * @name panierController
 * @method panierController
 * @param {Express.Request} request - l'objet représentant la requête
 * @param {Express.Response} response - l'objet représentant la réponse
 * @return {JSON}  - une donnée en format json
 */
const panierController = {


    getAll: async (req, res) => {
        try {
            const clients = await Panier.findAll();

            res.status(200).json(clients);
        } catch (error) {
            console.trace('Erreur dans la méthode getAllUser du panierController :',
                error);
            res.status(500).json(error.message);
        }
    },

    getOne: async (req, res) => {
        try {

            const client = await Panier.findOne(req.params.id);
            res.json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode getOne du panierController :',
                error);
            res.status(500).json(error.message);
        }
    },

    getByIdClient: async (req, res) => {
        try {
            console.log(req.params);
            const client = await Panier.findByIdClient(req.params.id);
            res.json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode getByIdClient du panierController :',
                error);
            res.status(500).json(error.message);
        }
    },





    new: async (req, res) => {
        try {

            const data = {};
            
            data.total = req.body.total;
            data.idClient = req.body.idClient;

            console.log("req.body ==> ", req.body);
            const newClient = new Panier(data);
            await newClient.save();
            res.json(newClient);
        } catch (error) {
            console.log(`Erreur lors de l'enregistrement du nouveau panier: ${error.message}`);
            res.status(500).json(error.message);
        }
    },

    updatePanier: async (req, res) => {
        try {

            const {
                id
            } = req.params;
            
            const updateClient = await Panier.findOne(id);


            const total = req.body.total;
            const idClient = req.body.idClient;

            let userMessage = {};

            if (total) {
                updateClient.total = total;
                userMessage.total = 'Votre nouveau total a bien été enregistré ';
            } else if (!total) {
                userMessage.total = 'Votre total n\'a pas changé';
            }


            if (idClient) {
                updateClient.idClient = idClient;
                userMessage.idClient = 'Votre nouveau idClient a bien été enregistré ';
            } else if (!idClient) {
                userMessage.idClient = 'Votre idClient n\'a pas changé';
            }

            await updateClient.update();

            res.json(userMessage);

        } catch (error) {
            console.log(`Erreur lors de l'enregistrement du nouveau panier: ${error.message}`);
            res.status(500).json(error.message);
        }
    },




    delete: async (req, res) => {

        try {

            const clientInDb = await Panier.findOne(req.params.id);

            const client = await clientInDb.delete();

            res.json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode delete du panierController :',
                error);
            res.status(500).json(error.message);
        }
    },


    deleteByIdClient: async (req, res) => {

        try {

            const clientsInDb = await Panier.findByIdClient(req.params.id);
            const arrayDeleted = [];
            for (const clientInDb of clientsInDb) {

                const clientHistoConn = await clientInDb.deleteByIdClient();
                arrayDeleted.push(clientHistoConn);
            }


            res.json(arrayDeleted[0]);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteByIdClien du panierController :',
                error);
            res.status(500).json(error.message);
        }
    },




}

module.exports = panierController;