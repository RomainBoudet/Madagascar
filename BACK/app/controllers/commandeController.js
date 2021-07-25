const Commande = require('../models/commande');


/**
 * Une méthode qui va servir a intéragir avec le model Commande pour les intéractions avec la BDD
 * Retourne un json
 * @name commandeController
 * @param {Express.Request} req - l'objet représentant la requête
 * @param {Express.Response} res - l'objet représentant la réponse
 * @return {JSON}  - une donnée en format json
 */
const commandeController = {


    getAll: async (req, res) => {
        try {
            const commandes = await Commande.findAll();

            res.status(200).json(commandes);
        } catch (error) {
            console.trace('Erreur dans la méthode getAll du commandeController :',
                error);
            res.status(500).json(error.message);
        }
    },

    getOne: async (req, res) => {
        try {

            const commande = await Commande.findOne(req.params.id);
            res.json(commande);

        } catch (error) {
            console.trace('Erreur dans la méthode getOne du commandeController :',
                error);
            res.status(500).json(error.message);
        }
    },



    getByIdClient: async (req, res) => {
        try {
            
            const commande = await Commande.findByIdClient(req.params.id);
            res.json(commande);

        } catch (error) {
            console.trace('Erreur dans la méthode getByIdClient du commandeController :',
                error);
            res.status(500).json(error.message);
        }
    },





    new: async (req, res) => {
        try {

            const data = {};
        
            data.reference = req.body.reference;
            data.commentaire = req.body.commentaire;
            data.idCommandeStatut = req.body.idCommandeStatut;
            data.idClient = req.body.idClient;

       

            const newCommande = new Commande(data);
            
            await newCommande.save();
            res.json(newCommande);
        } catch (error) {
            console.log(`Erreur dans la méthode new du commandeController : ${error.message}`);
            res.status(500).json(error.message);
        }
    },

    update: async (req, res) => {
        try {

            const {
                id
            } = req.params;
            
            const updateCommande = await Commande.findOne(id);


            const reference = req.body.reference;
            const commentaire = req.body.commentaire;
            const idCommandeStatut = req.body.idCommandeStatut;
            const idClient = req.body.idClient;
        

            let message = {};

            if (reference) {
                updateCommande.reference = reference;
                message.reference = 'Votre nouveau reference a bien été enregistré ';
            } else if (!reference) {
                message.reference = 'Votre reference n\'a pas changé';
            }


            if (commentaire) {
                updateCommande.commentaire = commentaire;
                message.methode = 'Votre nouveau commentaire a bien été enregistré ';
            } else if (!commentaire) {
                message.commentaire = 'Votre nom de commentaire n\'a pas changé';
            }


            if (idCommandeStatut) {
                updateCommande.idCommandeStatut = idCommandeStatut;
                message.idCommandeStatut = 'Votre nouveau idCommandeStatut a bien été enregistré ';
            } else if (!idCommandeStatut) {
                message.idCommandeStatut = 'Votre idCommandeStatut n\'a pas changé';
            }


            if (idClient) {
                updateCommande.idClient = idClient;
                message.idClient = 'Votre nouveau idClient a bien été enregistré ';
            } else if (!idClient) {
                message.idClient = 'Votre idClient n\'a pas changé';
            }

             await updateCommande.update();
            
            res.json(message);

        } catch (error) {
            console.log(`Erreur dans la methode update du commandeController ${error.message}`);
            res.status(500).json(error.message);
        }
    },




    delete: async (req, res) => {

        try {

            const commandeInDb = await Commande.findOne(req.params.id);

            const commande = await commandeInDb.delete();

            res.json(commande);

        } catch (error) {
            console.trace('Erreur dans la méthode delete du commandeController :',
                error);
            res.status(500).json(error.message);
        }
    },


    deleteByIdClient: async (req, res) => {

        try {

            const commandesInDb = await Commande.findByIdClient(req.params.id);
            const arrayDeleted = [];
            for (const commandeInDb of commandesInDb) {

                const commande = await commandeInDb.deleteByIdClient();
                arrayDeleted.push(commande);
            }


            res.json(arrayDeleted[0]);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteUByIdClient du commandeController :',
                error);
            res.status(500).json(error.message);
        }
    },


}

module.exports = commandeController;