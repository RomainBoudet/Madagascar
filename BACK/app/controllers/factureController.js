const Facture = require('../models/facture');


/**
 * Une méthode qui va servir a intéragir avec le model Facture pour les intéractions avec la BDD
 * Retourne un json
 * @name factureController
 * @method factureController
 * @param {Express.Request} req - l'objet représentant la requête
 * @param {Express.Response} res - l'objet représentant la réponse
 * @return {JSON}  - une donnée en format json
 */
const factureController = {


    getAll: async (req, res) => {
        try {
            const factures = await Facture.findAll();

            res.status(200).json(factures);
        } catch (error) {
            console.trace('Erreur dans la méthode getAll du factureController :',
                error);
            res.status(500).json(error.message);
        }
    },

    getOne: async (req, res) => {
        try {

            const facture = await Facture.findOne(req.params.id);
            res.json(facture);

        } catch (error) {
            console.trace('Erreur dans la méthode getOne du factureController :',
                error);
            res.status(500).json(error.message);
        }
    },



    getByIdClient: async (req, res) => {
        try {
            
            const facture = await Facture.findByIdClient(req.params.id);
            res.json(facture);

        } catch (error) {
            console.trace('Erreur dans la méthode getByIdFacture du factureController :',
                error);
            res.status(500).json(error.message);
        }
    },





    new: async (req, res) => {
        try {

            const data = {};
        
            data.reference = req.body.reference;
            data.montantHT = req.body.montantHT;
            data.montantTTC = req.body.montantTTC;
            data.montantTVA = req.body.montantTVA;
            data.idPaiement = req.body.idPaiement;
            data.idClient = req.body.idClient;

            const newFacture = new Facture(data);
            await newFacture.save();
            res.json(newFacture);
        } catch (error) {
            console.log(`Erreur dans la méthode new du factureController : ${error.message}`);
            res.status(500).json(error.message);
        }
    },

    update: async (req, res) => {
        try {

            const {
                id
            } = req.params;
            
            const updateFacture = await Facture.findOne(id);


            const reference = req.body.reference;
            const montantHT = req.body.montantHT;
            const montantTTC = req.body.montantTTC;
            const montantTVA = req.body.montantTVA;
            const idPaiement = req.body.idPaiement;
            const idClient = req.body.idClient;
        

            let message = {};

            if (reference) {
                updateFacture.reference = reference;
                message.reference = 'Votre nouveau reference a bien été enregistré ';
            } else if (!reference) {
                message.reference = 'Votre reference n\'a pas changé';
            }


            if (montantHT) {
                updateFacture.montantHT = montantHT;
                message.montantHT = 'Votre nouveau montantHT a bien été enregistré ';
            } else if (!montantHT) {
                message.montantHT = 'Votre nom de montantHT n\'a pas changé';
            }


            if (montantTTC) {
                updateFacture.montantTTC = montantTTC;
                message.montantTTC = 'Votre nouveau montantTTC a bien été enregistré ';
            } else if (!montantTTC) {
                message.montantTTC = 'Votre montantTTC n\'a pas changé';
            }


            if (montantTVA) {
                updateFacture.montantTVA = montantTVA;
                message.montantTVA = 'Votre nouveau montantTVA a bien été enregistré ';
            } else if (!montantTVA) {
                message.montantTVA = 'Votre montantTVA n\'a pas changé';
            }

            if (idPaiement) {
                updateFacture.idPaiement = idPaiement;
                message.idPaiement = 'Votre nouveau idPaiement a bien été enregistré ';
            } else if (!idPaiement) {
                message.idPaiement = 'Votre idPaiement n\'a pas changé';
            }

            if (idClient) {
                updateFacture.idClient = idClient;
                message.idClient = 'Votre nouveau idClient a bien été enregistré ';
            } else if (!idClient) {
                message.password = 'Votre idClient n\'a pas changé';
            }

             await updateFacture.update();
            
            res.json(message);

        } catch (error) {
            console.log(`Erreur dans la methode update du factureController ${error.message}`);
            res.status(500).json(error.message);
        }
    },




    delete: async (req, res) => {

        try {

            const factureInDb = await Facture.findOne(req.params.id);

            const facture = await factureInDb.delete();

            res.json(facture);

        } catch (error) {
            console.trace('Erreur dans la méthode delete du factureController :',
                error);
            res.status(500).json(error.message);
        }
    },


    deleteByIdClient: async (req, res) => {

        try {

            const facturesInDb = await Facture.findByIdClient(req.params.id);
            const arrayDeleted = [];
            for (const factureInDb of facturesInDb) {

                const factureHistoConn = await factureInDb.deleteByIdClient();
                arrayDeleted.push(factureHistoConn);
            }


            res.json(arrayDeleted[0]);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteUByIdFacture du factureController :',
                error);
            res.status(500).json(error.message);
        }
    },


}

module.exports = factureController;