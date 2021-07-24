const ClientAdresse = require('../models/clientAdresse');
const ClientVille = require('../models/clientVille');

/**
 * Une méthode qui va servir a intéragir avec le model ClientAdresse pour les intéractions des adresses des clients avec la BDD 
 * Retourne un json
 * @name clientAdresseController
 * @method clientAdresseController
 * @param {Express.Request} req - l'objet représentant la requête
 * @param {Express.Response} res - l'objet représentant la réponse
 * @return {JSON}  - une donnée en format json
 */
const clientAdresseController = {


    getAll: async (req, res) => {
        try {
            const clients = await ClientAdresse.findAll();

            res.status(200).json(clients);
        } catch (error) {
            console.trace('Erreur dans la méthode getAll du clientAdresseController :',
                error);
            res.status(500).json(error.message);
        }
    },

    getAllVille: async (req, res) => {
        try {
            const clients = await ClientVille.findAll();

            res.status(200).json(clients);
        } catch (error) {
            console.trace('Erreur dans la méthode getAllVille du clientAdresseController :',
                error);
            res.status(500).json(error.message);
        }
    },





    getOne: async (req, res) => {
        try {

            const client = await ClientAdresse.findOne(req.params.id);
            res.json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode getOne du clientAdresseController :',
                error);
            res.status(500).json(error.message);
        }
    },

    getOneVille: async (req, res) => {
        try {

            const client = await ClientVille.findOne(req.params.id);
            res.json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode getOneVille du clientAdresseController :',
                error);
            res.status(500).json(error.message);
        }
    },





    getByIdClient: async (req, res) => {
        try {
            console.log(req.params);
            const client = await ClientAdresse.findByIdClient(req.params.id);
            res.json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode getByIdClient du clientAdresseController :',
                error);
            res.status(500).json(error.message);
        }
    },





    new: async (req, res) => {
        try {

            const data = {};

            data.prenom = req.body.prenom;
            data.nomFamille = req.body.nomFamille;
            data.ligne1 = req.body.ligne1;
            data.ligne2 = req.body.ligne2;
            data.ligne3 = req.body.ligne3;
            data.telephone = req.body.telephone;
            data.titre = req.body.titre;
            data.idClient = req.body.idClient;
            data.idVille = req.body.idVille;

            console.log("req.body ==> ", req.body);

            const newClient = new ClientAdresse(data);
            await newClient.save();
            res.json(newClient);
        } catch (error) {
            console.log(`Erreur dans la méthode new du clientAdresseController: ${error.message}`);
            res.status(500).json(error.message);
        }
    },

    newVille: async (req, res) => {
        try {

            const data = {};

            data.nom = req.body.nom;
            data.idPays = req.body.idPays;


            const newClient = new ClientVille(data);
            await newClient.save();
            res.json(newClient);
        } catch (error) {
            console.log(`Erreur dans la méthode newVille du clientAdresseController: ${error.message}`);
            res.status(500).json(error.message);
        }
    },




    updateClientAdresse: async (req, res) => {
        try {

            const {
                id
            } = req.params;

            const updateClient = await ClientAdresse.findOne(id);
            console.log("updateClient ==>>", updateClient);

            const prenom = req.body.prenom;
            const nomFamille = req.body.nomFamille;
            const ligne1 = req.body.ligne1;
            const ligne2 = req.body.ligne2;
            const ligne3 = req.body.ligne3;
            const telephone = req.body.telephone;
            const titre = req.body.titre;
            const idClient = req.body.idClient;
            const idVille = req.body.idVille;

            let userMessage = {};

            if (prenom) {
                updateClient.prenom = prenom;
                userMessage.prenom = 'Votre nouveau prenom a bien été enregistré ';
            } else if (!prenom) {
                userMessage.prenom = 'Votre prenom n\'a pas changé';
            }

            if (nomFamille) {
                updateClient.nomFamille = nomFamille;
                userMessage.nomFamille = 'Votre nouveau nomFamille a bien été enregistré ';
            } else if (!nomFamille) {
                userMessage.nomFamille = 'Votre nomFamille n\'a pas changé';
            }

            if (ligne1) {
                updateClient.ligne1 = ligne1;
                userMessage.ligne1 = 'Votre nouveau ligne1 a bien été enregistré ';
            } else if (!ligne1) {
                userMessage.ligne1 = 'Votre ligne1 n\'a pas changé';
            }

            if (ligne2) {
                updateClient.ligne2 = ligne2;
                userMessage.ligne2 = 'Votre nouveau ligne2 a bien été enregistré ';
            } else if (!ligne2) {
                userMessage.ligne2 = 'Votre ligne2 n\'a pas changé';
            }

            if (ligne3) {
                updateClient.ligne3 = ligne3;
                userMessage.ligne3 = 'Votre nouveau ligne3 a bien été enregistré ';
            } else if (!ligne3) {
                userMessage.ligne3 = 'Votre ligne3 n\'a pas changé';
            }

            if (telephone) {
                updateClient.telephone = telephone;
                userMessage.telephone = 'Votre nouveau telephone a bien été enregistré ';
            } else if (!telephone) {
                userMessage.telephone = 'Votre telephone n\'a pas changé';
            }

            if (titre) {
                updateClient.titre = titre;
                userMessage.titre = 'Votre nouveau titre a bien été enregistré ';
            } else if (!titre) {
                userMessage.titre = 'Votre titre n\'a pas changé';
            }



            if (idClient) {
                updateClient.idClient = idClient;
                userMessage.idClient = 'Votre nouveau idClient a bien été enregistré ';
            } else if (!idClient) {
                userMessage.idClient = 'Votre idClient n\'a pas changé';
            }
            if (idVille) {
                updateClient.idVille = idVille;
                userMessage.idVille = 'Votre nouveau idVille a bien été enregistré ';
            } else if (!idVille) {
                userMessage.idVille = 'Votre idVille n\'a pas changé';
            }



            await updateClient.update();

            res.json(userMessage);

        } catch (error) {
            console.log(`Erreur dans la méthode updateClientAdress du clientAdresseController : ${error.message}`);
            res.status(500).json(error.message);
        }
    },

    updateClientVille: async (req, res) => {
        try {

            const {
                id
            } = req.params;

            const updateClient = await ClientVille.findOne(id);

            const nom = req.body.nom;
            const idPays = req.body.idPays;            

            let userMessage = {};

            if (nom) {
                updateClient.nom = nom;
                userMessage.nom = 'Votre nouveau nom de ville a bien été enregistré ';
            } else if (!nom) {
                userMessage.nom = 'Votre nom de ville n\'a pas changé';
            }

            if (idPays) {
                updateClient.idPays = idPays;
                userMessage.idPays = 'Votre nouveau id de pays a bien été enregistré ';
            } else if (!idPays) {
                userMessage.idPays = 'Votre id de pays n\'a pas changé';
            }

            await updateClient.update();

            res.json(userMessage);

        } catch (error) {
            console.log(`Erreur dans la méthode updateClientVille du clientAdresseController : ${error.message}`);
            res.status(500).json(error.message);
        }
    },






    delete: async (req, res) => {

        try {

            const clientInDb = await ClientAdresse.findOne(req.params.id);

            const client = await clientInDb.delete();

            res.json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode delete du clientAdresseController :',
                error);
            res.status(500).json(error.message);
        }
    },

    deleteVille: async (req, res) => {

        try {

            const clientInDb = await ClientVille.findOne(req.params.id);

            const client = await clientInDb.delete();

            res.json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteVille du clientAdresseController :',
                error);
            res.status(500).json(error.message);
        }
    },





    deleteByIdClient: async (req, res) => {

        try {

            const clientsInDb = await ClientAdresse.findByIdClient(req.params.id);
        

            const arrayDeleted = [];
            for (const clientInDb of clientsInDb) {

                const clientAdresse = await clientInDb.deleteByIdClient();
                arrayDeleted.push(clientAdresse);
            }


            res.json(arrayDeleted[0]);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteByIdClien du clientAdresseController :',
                error);
            res.status(500).json(error.message);
        }
    },




}

module.exports = clientAdresseController;