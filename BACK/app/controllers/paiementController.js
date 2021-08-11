const Paiement = require('../models/paiement');


/**
 * Une méthode qui va servir a intéragir avec le model Paiement pour les intéractions avec la BDD
 * Retourne un json
 * @name paiementController
 * @param {Express.Request} req - l'objet représentant la requête
 * @param {Express.Response} res - l'objet représentant la réponse
 * @return {JSON}  - une donnée en format json
 */
const paiementController = {



    CGV: async (req, res) => {
        try {


            //le user a accecepté les cookies,  
            // je vérifie si req.session.uer.cookie existe déja et si sa valeur est déja 'true'
          


            req.session.user.cgv = 'true';
            console.log('req.session.user ==> ',req.session.user);

            console.log("client déconnecté ! valeur de req.session maintenant ==> ", req.session)
            return res.status(200).json("L'utilisateur a été déconnecté");

        } catch (error) {
            console.trace(
                'Erreur dans la méthode deconnexion du authController :',
                error);
            res.status(500).json(error.message);
        }

    },


    getAll: async (req, res) => {
        try {
            const paiements = await Paiement.findAll();

            res.status(200).json(paiements);
        } catch (error) {
            console.trace('Erreur dans la méthode getAll du paiementController :',
                error);
            res.status(500).json(error.message);
        }
    },

    getOne: async (req, res) => {
        try {

            const paiement = await Paiement.findOne(req.params.id);
            res.json(paiement);

        } catch (error) {
            console.trace('Erreur dans la méthode getOne du paiementController :',
                error);
            res.status(500).json(error.message);
        }
    },



    getByIdCommande: async (req, res) => {
        try {
            
            const paiement = await Paiement.findByIdCommande(req.params.id);
            res.json(paiement);

        } catch (error) {
            console.trace('Erreur dans la méthode getByIdCommande du paiementController :',
                error);
            res.status(500).json(error.message);
        }
    },





    new: async (req, res) => {
        try {

            const data = {};
        
            data.reference = req.body.reference;
            data.methode = req.body.methode;
            data.montant = req.body.montant;
            data.idCommande = req.body.idCommande;
         

            const newPaiement = new Paiement(data);
            await newPaiement.save();
            res.json(newPaiement);
        } catch (error) {
            console.log(`Erreur dans la méthode new du paiementController : ${error.message}`);
            res.status(500).json(error.message);
        }
    },

    update: async (req, res) => {
        try {

            const {
                id
            } = req.params;
            
            const updatePaiement = await Paiement.findOne(id);


            const reference = req.body.reference;
            const methode = req.body.methode;
            const montant = req.body.montant;
            const idCommande = req.body.idCommande;
        

            let message = {};

            if (reference) {
                updatePaiement.reference = reference;
                message.reference = 'Votre nouveau reference a bien été enregistré ';
            } else if (!reference) {
                message.reference = 'Votre reference n\'a pas changé';
            }


            if (methode) {
                updatePaiement.methode = methode;
                message.methode = 'Votre nouveau methode a bien été enregistré ';
            } else if (!methode) {
                message.methode = 'Votre nom de methode n\'a pas changé';
            }


            if (montant) {
                updatePaiement.montant = montant;
                message.montant = 'Votre nouveau montant a bien été enregistré ';
            } else if (!montant) {
                message.montant = 'Votre montant n\'a pas changé';
            }


            if (idCommande) {
                updatePaiement.idCommande = idCommande;
                message.idCommande = 'Votre nouveau idCommande a bien été enregistré ';
            } else if (!idCommande) {
                message.idCommande = 'Votre idCommande n\'a pas changé';
            }

             await updatePaiement.update();
            
            res.json(message);

        } catch (error) {
            console.log(`Erreur dans la methode update du paiementController ${error.message}`);
            res.status(500).json(error.message);
        }
    },




    delete: async (req, res) => {

        try {

            const paiementInDb = await Paiement.findOne(req.params.id);

            const paiement = await paiementInDb.delete();

            res.json(paiement);

        } catch (error) {
            console.trace('Erreur dans la méthode delete du paiementController :',
                error);
            res.status(500).json(error.message);
        }
    },


    deleteByIdCommande: async (req, res) => {

        try {

            const paiementsInDb = await Paiement.findByIdCommande(req.params.id);
            const arrayDeleted = [];
            for (const paiementInDb of paiementsInDb) {

                const paiementHistoConn = await paiementInDb.deleteByIdCommande();
                arrayDeleted.push(paiementHistoConn);
            }


            res.json(arrayDeleted[0]);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteUByIdPaiement du paiementController :',
                error);
            res.status(500).json(error.message);
        }
    },


}

module.exports = paiementController;