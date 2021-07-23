
const AdminVerifEmail = require('../models/adminVerifEmail');
const AdminVerifPhone = require('../models/adminVerifPhone');
const AdminPhone = require('../models/adminPhone');
const Privilege = require('../models/privilege');


/**
 * Un objet qui contient des méthodes permettant d'intéragir avec les emails et téléphones des admins pour assurer leur verification avant utilisation
 * Retourne un json
 * @name adminController
 * @method adminController
 * @param {Express.Request} request - l'objet représentant la requête
 * @param {Express.Response} response - l'objet représentant la réponse
 * @return {JSON}  - une donnée en format json
 */
const adminController = {


    getAllPhoneVerif: async (req, res) => {
        try {
            const resultats = await AdminVerifPhone.findAll();

            res.status(200).json(resultats);
        } catch (error) {
            console.trace('Erreur dans la méthode getAllPhoneVerif du adminController :',
                error);
            res.status(500).json(error.message);
        }
    },

    getAllEmailVerif: async (req, res) => {
        try {
            const resultats = await AdminVerifEmail.findAll();

            res.status(200).json(resultats);
        } catch (error) {
            console.trace('Erreur dans la méthode getAllEmailVerif du adminController :',
                error);
            res.status(500).json(error.message);
        }
    },

    getAllPhone: async (req, res) => {
        try {
            const resultats = await AdminPhone.findAll();

            res.status(200).json(resultats);
        } catch (error) {
            console.trace('Erreur dans la méthode getAllPhone du adminController :',
                error);
            res.status(500).json(error.message);
        }
    },

    getAllPrivilege: async (req, res) => {
        try {
            const resultats = await Privilege.findAll();

            res.status(200).json(resultats);
        } catch (error) {
            console.trace('Erreur dans la méthode getAllPrivilege du adminController :',
                error);
            res.status(500).json(error.message);
        }
    },






    getOnePhoneVerif: async (req, res) => {
        try {

            const resultat = await AdminVerifPhone.findOne(req.params.id);
            res.json(resultat);

        } catch (error) {
            console.trace('Erreur dans la méthode getOnePhoneVerif du adminController :',
                error);
            res.status(500).json(error.message);
        }
    },

    getOneEmailVerif: async (req, res) => {
        try {

            const resultat = await AdminVerifEmail.findOne(req.params.id);
            res.json(resultat);

        } catch (error) {
            console.trace('Erreur dans la méthode getOneEmailVerif du adminController :',
                error);
            res.status(500).json(error.message);
        }
    },
    getOnePhone: async (req, res) => {
        try {

            const resultat = await AdminPhone.findOne(req.params.id);
            res.json(resultat);

        } catch (error) {
            console.trace('Erreur dans la méthode getOnePhone du adminController :',
                error);
            res.status(500).json(error.message);
        }
    },
    getOnePrivilege: async (req, res) => {
        try {

            const resultat = await Privilege.findOne(req.params.id);
            res.json(resultat);

        } catch (error) {
            console.trace('Erreur dans la méthode getOnePrivilege du adminController :',
                error);
            res.status(500).json(error.message);
        }
    },







    getPhoneVerifByIdClient: async (req, res) => {
        try {
            console.log(req.params);
            const resultat = await AdminVerifPhone.findByIdClient(req.params.id);
            res.json(resultat);

        } catch (error) {
            console.trace('Erreur dans la méthode getPhoneVerifByIdClient du adminController :',
                error);
            res.status(500).json(error.message);
        }
    },

    getEmailVerifByIdClient: async (req, res) => {
        try {
            console.log(req.params);
            const resultat = await AdminVerifEmail.findByIdClient(req.params.id);
            res.json(resultat);

        } catch (error) {
            console.trace('Erreur dans la méthode getEmailVerifByIdClient du adminController :',
                error);
            res.status(500).json(error.message);
        }
    },

    getPhoneByIdClient: async (req, res) => {
        try {
            console.log(req.params);
            const resultat = await AdminPhone.findByIdClient(req.params.id);
            res.json(resultat);

        } catch (error) {
            console.trace('Erreur dans la méthode getPhoneByIdClient du adminController :',
                error);
            res.status(500).json(error.message);
        }
    },








    newVerifPhone: async (req, res) => {
        try {

            const data = {};
            
            data.idClient = req.body.idClient;

            const newClient = new AdminVerifPhone(data);
            await newClient.true();
            res.json(newClient);
        } catch (error) {
            console.log(`Erreur dans la méthode newVerifPhone du adminController : ${error.message}`);
            res.status(500).json(error.message);
        }
    },

    newVerifEmail: async (req, res) => {
        try {

            const data = {};
            
            data.idClient = req.body.idClient;

            const newClient = new AdminVerifEmail(data);
            await newClient.true();
            res.json(newClient);
        } catch (error) {
            console.log(`Erreur dans la méthode newVerifEmail du adminController : ${error.message}`);
            res.status(500).json(error.message);
        }
    },

    newPhone: async (req, res) => {
        try {

            const data = {};
            
            data.idClient = req.body.idClient;
            data.adminTelephone = req.body.adminTelephone;

            const newClient = new AdminPhone(data);
            await newClient.save();
            res.json(newClient);
        } catch (error) {
            console.log(`Erreur dans la méthode newPhone du adminController : ${error.message}`);
            res.status(500).json(error.message);
        }
    },

    newPrivilege: async (req, res) => {
        try {

            const data = {};
            
            data.nom = req.body.nom;
          
            const newClient = new Privilege(data);
            await newClient.save();
            res.json(newClient);
        } catch (error) {
            console.log(`Erreur dans la méthode newPrivilege du adminController : ${error.message}`);
            res.status(500).json(error.message);
        }
    },




    deleteVerifPhone: async (req, res) => {

        try {

            const phoneInDb = await AdminVerifPhone.findOne(req.params.id);

            const phoneDeleted = await phoneInDb.delete();

            res.json(phoneDeleted);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteVerifPhone du adminController :',
                error);
            res.status(500).json(error.message);
        }
    },

    deleteVerifEmail: async (req, res) => {

        try {

            const emailInDb = await AdminVerifEmail.findOne(req.params.id);

            const emailDeleted = await emailInDb.delete();

            res.json(emailDeleted);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteVerifEmail du adminController :',
                error);
            res.status(500).json(error.message);
        }
    },

    deletePhone: async (req, res) => {

        try {

            const phoneInDb = await AdminPhone.findOne(req.params.id);

            const phoneDeleted = await phoneInDb.delete();

            res.json(phoneDeleted);

        } catch (error) {
            console.trace('Erreur dans la méthode deletePhone du adminController :',
                error);
            res.status(500).json(error.message);
        }
    },

    deletePrivilege: async (req, res) => {

        try {

            const privilegeInDb = await Privilege.findOne(req.params.id);

            const privilegeDeleted = await privilegeInDb.delete();

            res.json(privilegeDeleted);

        } catch (error) {
            console.trace('Erreur dans la méthode deletePrivilege du adminController :',
                error);
            res.status(500).json(error.message);
        }
    },






    deleteVerifPhoneByIdClient: async (req, res) => {

        try {

            const clientsInDb = await AdminVerifPhone.findByIdClient(req.params.id);
            const arrayDeleted = [];
            for (const clientInDb of clientsInDb) {

                const clientHistoConn = await clientInDb.deleteByIdClient();
                arrayDeleted.push(clientHistoConn);
            }


            res.json(arrayDeleted[0]);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteVerifPhoneByIdClient du adminController :',
                error);
            res.status(500).json(error.message);
        }
    },

    deleteVerifEmailByIdClient: async (req, res) => {

        try {

            const clientsInDb = await AdminVerifEmail.findByIdClient(req.params.id);
            const arrayDeleted = [];
            for (const clientInDb of clientsInDb) {

                const clientHistoConn = await clientInDb.deleteByIdClient();
                arrayDeleted.push(clientHistoConn);
            }


            res.json(arrayDeleted[0]);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteVerifEmailByIdClient du adminController :',
                error);
            res.status(500).json(error.message);
        }
    },

    deletePhoneByIdClient: async (req, res) => {

        try {

            const clientsInDb = await AdminPhone.findByIdClient(req.params.id);
            const arrayDeleted = [];
            for (const clientInDb of clientsInDb) {

                const clientHistoConn = await clientInDb.deleteByIdClient();
                arrayDeleted.push(clientHistoConn);
            }

            res.json(arrayDeleted[0]);

        } catch (error) {
            console.trace('Erreur dans la méthode deletePhoneByIdClient du adminController :',
                error);
            res.status(500).json(error.message);
        }
    },





   
    updateVerifPhone: async (req, res) => {
        try {

            const {
                id
            } = req.params;

            const updateClient = await AdminVerifPhone.findByIdClient(id);
            console.log(updateClient);

            const verifPhone = req.body.verifPhone;
            const idClient = req.body.idClient;
            let userMessage = {};

        
            if (verifPhone) {
                updateClient.verifPhone = verifPhone;
                userMessage.verifPhone = 'Votre nouveau verifPhone a bien été enregistré ';
            } else if (!verifPhone) {               
                 userMessage.verifPhone = 'Votre verifPhone n\'a pas changé';
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
            console.log(`Erreur dans la méthode updateVerifPhone du adminController : ${error.message}`);
            res.status(500).json(error.message);
        }
    },

    updateVerifEmail: async (req, res) => {
        try {

            const {
                id
            } = req.params;

            const updateClient = await AdminVerifEmail.findByIdClient(id);
            console.log(updateClient);

            const verifEmail = req.body.verifEmail;
            const idClient = req.body.idClient;

            let userMessage = {};


            if (verifEmail) {
                updateClient.verifEmail = verifEmail;
                userMessage.verifEmail = 'Votre nouveau verifEmail a bien été enregistré ';
            } else if (!verifEmail) {
                userMessage.verifEmail = 'Votre verifEmail n\'a pas changé';
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
            console.log(`Erreur dans la méthode updateVerifEmail du adminController : ${error.message}`);
            res.status(500).json(error.message);
        }
    },

    updatePhone: async (req, res) => {
        try {

            const {
                id
            } = req.params;

            const updateClient = await AdminPhone.findByIdClient(id);

            const adminTelephone = req.body.adminTelephone;
            const idClient = req.body.idClient;

            let userMessage = {};

            if (adminTelephone) {
                updateClient.adminTelephone = adminTelephone;
                userMessage.adminTelephone = 'Votre nouveau adminTelephone a bien été enregistré ';
            } else if (!adminTelephone) {
                userMessage.adminTelephone = 'Votre adminTelephone n\'a pas changé';
            }


            if (idClient) {
                updateClient.idClient = idClient;
                userMessage.idClient = 'Votre nouveau idClient a bien été enregistré ';
            } else if (!idClient) {
                userMessage.idClient = 'Votre idClient n\'a pas changé';
            }

            await updateClient.updateByIdClient();

            res.json(userMessage);

        } catch (error) {
            console.log(`Erreur dans la méthode updatePhone du adminController : ${error.message}`);
            res.status(500).json(error.message);
        }
    },








}

module.exports = adminController;