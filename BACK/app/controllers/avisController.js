const Avis = require('../models/avis');


/**
 * Une méthode qui va servir a intéragir avec le model Avis pour les intéractions avec la BDD
 * Retourne un json
 * @name avisController
 * @method avisController
 * @param {Express.Request} req - l'objet représentant la requête
 * @param {Express.Response} res - l'objet représentant la réponse
 * @return {JSON}  - une donnée en format json
 */
const avisController = {


    getAll: async (req, res) => {
        try {
            const aviss = await Avis.findAll();

            res.status(200).json(aviss);
        } catch (error) {
            console.trace('Erreur dans la méthode getAll du avisController :',
                error);
            res.status(500).json(error.message);
        }
    },

    getOne: async (req, res) => {
        try {

            const avis = await Avis.findOne(req.params.id);
            res.json(avis);

        } catch (error) {
            console.trace('Erreur dans la méthode getOne du avisController :',
                error);
            res.status(500).json(error.message);
        }
    },



    getByIdClient: async (req, res) => {
        try {
            
            const avis = await Avis.findByIdClient(req.params.id);

            if (req.session.user.privilege === 'Client' && req.session.user.idClient !== avis.idClient) {
                return res.status(403).json({
                    message: "Vous n'avez pas les droits pour accéder a cette ressource"
                })
            };
            res.json(avis);

        } catch (error) {
            console.trace('Erreur dans la méthode getByIdAvis du avisController :',
                error);
            res.status(500).json(error.message);
        }
    },





    new: async (req, res) => {
        try {

            const data = {};
        
            data.notation = req.body.notation;
            data.avis = req.body.avis;
            data.titre = req.body.titre;
            data.idClient = req.body.idClient;
            data.idProduit = req.body.idProduit;
           
            const newAvis = new Avis(data);
            await newAvis.save();
            res.json(newAvis);
        } catch (error) {
            console.log(`Erreur dans la méthode new du avisController : ${error.message}`);
            res.status(500).json(error.message);
        }
    },

    update: async (req, res) => {
        try {

            const {
                id
            } = req.params;
            
            const updateAvis = await Avis.findOne(id);

            if (req.session.user.privilege === 'Client' && req.session.user.idClient !== updateAvis.idClient) {
                return res.status(403).json({
                    message: "Vous n'avez pas les droits pour accéder a cette ressource"
                })
            };


            const notation = req.body.notation;
            const avis = req.body.avis;
            const titre = req.body.titre;
            const idClient = req.body.idClient;
            const idProduit = req.body.idProduit;
        

            let message = {};

            if (notation) {
                updateAvis.notation = notation;
                message.notation = 'Votre nouveau notation a bien été enregistré ';
            } else if (!notation) {
                message.notation = 'Votre notation n\'a pas changé';
            }


            if (avis) {
                updateAvis.avis = avis;
                message.avis = 'Votre nouveau avis a bien été enregistré ';
            } else if (!avis) {
                message.avis = 'Votre nom de avis n\'a pas changé';
            }


            if (titre) {
                updateAvis.titre = titre;
                message.titre = 'Votre nouveau titre a bien été enregistré ';
            } else if (!titre) {
                message.titre = 'Votre titre n\'a pas changé';
            }

            if (idClient) {
                updateAvis.idClient = idClient;
                message.idClient = 'Votre nouveau idClient a bien été enregistré ';
            } else if (!idClient) {
                message.idClient = 'Votre idClient n\'a pas changé';
            }
            if (idProduit) {
                updateAvis.idProduit = idProduit;
                message.idProduit = 'Votre nouveau idProduit a bien été enregistré ';
            } else if (!idProduit) {
                message.idProduit = 'Votre idProduit n\'a pas changé';
            }

             await updateAvis.update();
            
            res.json(message);

        } catch (error) {
            console.log(`Erreur dans la methode update du avisController ${error.message}`);
            res.status(500).json(error.message);
        }
    },




    delete: async (req, res) => {

        try {

            const avisInDb = await Avis.findOne(req.params.id);

            if (req.session.user.privilege === 'Client' && req.session.user.idClient !== avisInDb.idClient) {
                return res.status(403).json({
                    message: "Vous n'avez pas les droits pour accéder a cette ressource"
                })
            };

            const avis = await avisInDb.delete();

            res.json(avis);

        } catch (error) {
            console.trace('Erreur dans la méthode delete du avisController :',
                error);
            res.status(500).json(error.message);
        }
    },


    deleteByIdClient: async (req, res) => {

        try {

            const avissInDb = await Avis.findByIdClient(req.params.id);

            if ((req.session.user.privilege === 'Administrateur' || req.session.user.privilege === 'Client') && req.session.user.idClient !== avissInDb.idClient) {
                return res.status(403).json({
                    message: "Vous n'avez pas les droits pour accéder a cette ressource"
                })
            };
           
                 await avissInDb[0].deleteByIdClient();
             

            res.json(avissInDb);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteUByIdAvis du avisController :',
                error);
            res.status(500).json(error.message);
        }
    },


}

module.exports = avisController;