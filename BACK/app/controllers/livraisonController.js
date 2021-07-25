const Livraison = require('../models/livraison');



/**
 * Une méthode qui va servir a intéragir avec le model Livraison pour les intéractions avec la BDD
 * Retourne un json
 * @name livraisonController
 * @param {Express.Request} req - l'objet représentant la requête
 * @param {Express.Response} res - l'objet représentant la réponse
 * @return {JSON}  - une donnée en format json
 */
const livraisonController = {


    getAll: async (req, res) => {
        try {
            const livraisons = await Livraison.findAll();

            res.status(200).json(livraisons);
        } catch (error) {
            console.trace('Erreur dans la méthode getAll du livraisonController :',
                error);
            res.status(500).json(error.message);
        }
    },
    
    getOne: async (req, res) => {
        try {

            const livraison = await Livraison.findOne(req.params.id);
            res.json(livraison);

        } catch (error) {
            console.trace('Erreur dans la méthode getOne du livraisonController :',
                error);
            res.status(500).json(error.message);
        }
    },

    getByIdClient: async (req, res) => {
        try {
            
            const livraison = await Livraison.findByIdClient(req.params.id);
            res.json(livraison);

        } catch (error) {
            console.trace('Erreur dans la méthode getByIdClient du livraisonController :',
                error);
            res.status(500).json(error.message);
        }
    },
    getByIdCommande: async (req, res) => {
        try {
            
            const livraison = await Livraison.findByIdCommande(req.params.id);
            res.json(livraison);

        } catch (error) {
            console.trace('Erreur dans la méthode getByIdCommande du livraisonController :',
                error);
            res.status(500).json(error.message);
        }
    },
    






    new: async (req, res) => {
        try {

            const data = {};
        
            data.fraisExpedition = req.body.fraisExpedition;
            data.nomTransporteur = req.body.nomTransporteur;
            data.description = req.body.description;
            data.numeroSuivi = req.body.numeroSuivi;
            data.URLSuivi = req.body.URLSuivi;
            data.poid = req.body.poid;
            data.estimeArrive = req.body.estimeArrive;
            data.idClient = req.body.idClient;
            data.idCommande = req.body.idCommande;

            const newLivraison = new Livraison(data);
            console.log(req.body);
            console.log('newLivraison ==>> ', newLivraison);
            
            await newLivraison.save();
            res.json(newLivraison);
        } catch (error) {
            console.log(`Erreur dans la méthode new du livraisonController : ${error.message}`);
            res.status(500).json(error.message);
        }
    },
    
    
    update: async (req, res) => {
        try {

            const {
                id
            } = req.params;
            
            const updateLivraison = await Livraison.findOne(id);


            const fraisExpedition = req.body.fraisExpedition;
            const nomTransporteur = req.body.nomTransporteur;
            const description = req.body.description;
            const numeroSuivi = req.body.numeroSuivi;
            const URLsuivi = req.body.URLsuivi;
            const poid = req.body.poid;
            const estimeArrive = req.body.estimeArrive;
            const idClient = req.body.idClient;
            const idCommande = req.body.idCommande;
        

            let message = {};

            if (fraisExpedition) {
                updateLivraison.fraisExpedition = fraisExpedition;
                message.fraisExpedition = 'Votre nouveau fraisExpedition a bien été enregistré ';
            } else if (!fraisExpedition) {
                message.fraisExpedition = 'Votre fraisExpedition n\'a pas changé';
            }


            if (nomTransporteur) {
                updateLivraison.nomTransporteur = nomTransporteur;
                message.nomTransporteur = 'Votre nouveau nomTransporteur a bien été enregistré ';
            } else if (!nomTransporteur) {
                message.nomTransporteur = 'Votre nom de nomTransporteur n\'a pas changé';
            }


            if (description) {
                updateLivraison.description = description;
                message.description = 'Votre nouveau description a bien été enregistré ';
            } else if (!description) {
                message.description = 'Votre description n\'a pas changé';
            }

            if (numeroSuivi) {
                updateLivraison.numeroSuivi = numeroSuivi;
                message.numeroSuivi = 'Votre nouveau numeroSuivi a bien été enregistré ';
            } else if (!numeroSuivi) {
                message.numeroSuivi = 'Votre numeroSuivi n\'a pas changé';
            }


            if (URLsuivi) {
                updateLivraison.URLsuivi = URLsuivi;
                message.URLsuivi = 'Votre nouveau URLsuivi a bien été enregistré ';
            } else if (!URLsuivi) {
                message.URLsuivi = 'Votre nom de URLsuivi n\'a pas changé';
            }


            if (poid) {
                updateLivraison.poid = poid;
                message.poid = 'Votre nouveau poid a bien été enregistré ';
            } else if (!poid) {
                message.poid = 'Votre poid n\'a pas changé';
            }

            if (estimeArrive) {
                updateLivraison.estimeArrive = estimeArrive;
                message.estimeArrive = 'Votre nouveau estimeArrive a bien été enregistré ';
            } else if (!estimeArrive) {
                message.estimeArrive = 'Votre estimeArrive n\'a pas changé';
            }

            if (idCommande) {
                updateLivraison.idCommande = idCommande;
                message.idCommande = 'Votre nouveau idCommande a bien été enregistré ';
            } else if (!idCommande) {
                message.idCommande = 'Votre idCommande n\'a pas changé';
            }


            if (idClient) {
                updateLivraison.idClient = idClient;
                message.idClient = 'Votre nouveau idClient a bien été enregistré ';
            } else if (!idClient) {
                message.idClient = 'Votre idClient n\'a pas changé';
            }

             await updateLivraison.update();
            
            res.json(message);

        } catch (error) {
            console.log(`Erreur dans la méthode update du livraisonController ${error.message}`);
            res.status(500).json(error.message);
        }
    },
   

    delete: async (req, res) => {

        try {

            const livraisonInDb = await Livraison.findOne(req.params.id);

            const livraison = await livraisonInDb.delete();

            res.json(livraison);

        } catch (error) {
            console.trace('Erreur dans la méthode delete du livraisonController :',
                error);
            res.status(500).json(error.message);
        }
    },

    deleteByIdClient: async (req, res) => {

        try {

            const livraisonsInDb = await Livraison.findByIdClient(req.params.id);
            const arrayDeleted = [];
            for (const livraisonInDb of livraisonsInDb) {

                const livraison = await livraisonInDb.deleteByIdClient();
                arrayDeleted.push(livraison);
            }


            res.json(arrayDeleted[0]);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteByIdClient du livraisonController :',
                error);
            res.status(500).json(error.message);
        }
    },

    deleteByIdCommande: async (req, res) => {

        try {

            const livraisonsInDb = await Livraison.findByIdCommande(req.params.id);
            const arrayDeleted = [];
            for (const livraisonInDb of livraisonsInDb) {

                const livraison = await livraisonInDb.deleteByIdCommande();
                arrayDeleted.push(livraison);
            }


            res.json(arrayDeleted[0]);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteByIdCommande du livraisonController :',
                error);
            res.status(500).json(error.message);
        }
    },
    


}

module.exports = livraisonController;