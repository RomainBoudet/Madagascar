const Produit = require('../models/produit');
const Caracteristique = require('../models/caracteristique');


/**
 * Une méthode qui va servir a intéragir avec le model Produit pour les intéractions avec la BDD
 * Retourne un json
 * @name produitController
 * @method produitController
 * @param {Express.Request} req - l'objet représentant la requête
 * @param {Express.Response} res - l'objet représentant la réponse
 * @return {JSON}  - une donnée en format json
 */
const produitController = {


    getAll: async (req, res) => {
        try {
            const produits = await Produit.findAll();

            res.status(200).json(produits);
        } catch (error) {
            console.trace('Erreur dans la méthode getAll du produitController :',
                error);
            res.status(500).json(error.message);
        }
    },

    getOne: async (req, res) => {
        try {

            const produit = await Produit.findOne(req.params.id);
            res.json(produit);

        } catch (error) {
            console.trace('Erreur dans la méthode getOne du produitController :',
                error);
            res.status(500).json(error.message);
        }
    },



    getByIdCategorie: async (req, res) => {
        try {
            
            const produit = await Produit.findByIdCategorie(req.params.id);
            res.json(produit);

        } catch (error) {
            console.trace('Erreur dans la méthode getByIdCategorie du produitController :',
                error);
            res.status(500).json(error.message);
        }
    },





    new: async (req, res) => {
        try {

            const data = {};
        
            data.nom = req.body.nom;
            data.description = req.body.description;
            data.prixHT = req.body.prixHT;
            data.idCategorie = req.body.idCategorie;
            data.idTVA = req.body.idTVA;
           

            const newProduit = new Produit(data);
            await newProduit.save();
            res.json(newProduit);
        } catch (error) {
            console.log(`Erreur dans la méthode new du produitController : ${error.message}`);
            res.status(500).json(error.message);
        }
    },

    update: async (req, res) => {
        try {

            const {
                id
            } = req.params;
            
            const updateProduit = await Produit.findOne(id);


            const nom = req.body.nom;
            const description = req.body.description;
            const prixHT = req.body.prixHT;
            const idCategorie = req.body.idCategorie;
            const idTVA = req.body.idTVA;
        

            let message = {};

            if (nom) {
                updateProduit.nom = nom;
                message.nom = 'Votre nouveau nom a bien été enregistré ';
            } else if (!nom) {
                message.nom = 'Votre nom n\'a pas changé';
            }


            if (description) {
                updateProduit.description = description;
                message.description = 'Votre nouveau description a bien été enregistré ';
            } else if (!description) {
                message.description = 'Votre nom de description n\'a pas changé';
            }


            if (prixHT) {
                updateProduit.prixHT = prixHT;
                message.prixHT = 'Votre nouveau prixHT a bien été enregistré ';
            } else if (!prixHT) {
                message.prixHT = 'Votre prixHT n\'a pas changé';
            }


            if (idCategorie) {
                updateProduit.idCategorie = idCategorie;
                message.idCategorie = 'Votre nouveau idCategorie a bien été enregistré ';
            } else if (!idCategorie) {
                message.idCategorie = 'Votre idCategorie n\'a pas changé';
            }

            if (idTVA) {
                updateProduit.idTVA = idTVA;
                message.idTVA = 'Votre nouveau idTVA a bien été enregistré ';
            } else if (!idTVA) {
                message.idTVA = 'Votre idTVA n\'a pas changé';
            }


             await updateProduit.update();
            
            res.json(message);

        } catch (error) {
            console.log(`Erreur dans la methode update du produitController ${error.message}`);
            res.status(500).json(error.message);
        }
    },




    delete: async (req, res) => {

        try {

            const produitInDb = await Produit.findOne(req.params.id);

            const produit = await produitInDb.delete();

            res.json(produit);

        } catch (error) {
            console.trace('Erreur dans la méthode delete du produitController :',
                error);
            res.status(500).json(error.message);
        }
    },




    //! CARACTERISTIQUE //////////////////////////////////////////////////////////////////////////////////////////////////////



    getAllCaracteristique: async (req, res) => {
        try {
            const produits = await Caracteristique.findAll();

            res.status(200).json(produits);
        } catch (error) {
            console.trace('Erreur dans la méthode getAllCaracteristique du produitController :',
                error);
            res.status(500).json(error.message);
        }
    },

    getOneCaracteristique: async (req, res) => {
        try {

            const produit = await Caracteristique.findOne(req.params.id);
            res.json(produit);

        } catch (error) {
            console.trace('Erreur dans la méthode getOneCaracteristique du produitController :',
                error);
            res.status(500).json(error.message);
        }
    },



    getCaracteristiqueByIdProduit: async (req, res) => {
        try {
            
            const produit = await Caracteristique.findByIdProduit(req.params.id);
            res.json(produit);

        } catch (error) {
            console.trace('Erreur dans la méthode getCaracteristiqueByIdProduit du produitController :',
                error);
            res.status(500).json(error.message);
        }
    },

    newCaracteristique: async (req, res) => {
        try {

            const data = {};
        
            data.couleur = req.body.couleur;
            data.taille = req.body.taille;
            data.idProduit = req.body.idProduit;
        
            const newProduit = new Caracteristique(data);
            await newProduit.save();
            res.json(newProduit);
        } catch (error) {
            console.log(`Erreur dans la méthode newCaracteristique du produitController : ${error.message}`);
            res.status(500).json(error.message);
        }
    },

    updateCaracteristique: async (req, res) => {
        try {

            const {
                id
            } = req.params;
            
            const updateProduit = await Caracteristique.findOne(id);


            const couleur = req.body.couleur;
            const taille = req.body.taille;
            const idProduit = req.body.idProduit;

            let message = {};

            if (couleur) {
                updateProduit.couleur = couleur;
                message.couleur = 'Votre nouveau couleur a bien été enregistré ';
            } else if (!couleur) {
                message.couleur = 'Votre couleur n\'a pas changé';
            }


            if (taille) {
                updateProduit.taille = taille;
                message.taille = 'Votre nouveau taille a bien été enregistré ';
            } else if (!taille) {
                message.taille = 'Votre nom de taille n\'a pas changé';
            }


            if (idProduit) {
                updateProduit.idProduit = idProduit;
                message.idProduit = 'Votre nouveau idProduit a bien été enregistré ';
            } else if (!idProduit) {
                message.idProduit = 'Votre idProduit n\'a pas changé';
            }


             await updateProduit.update();
            
            res.json(message);

        } catch (error) {
            console.log(`Erreur dans la methode updateCaracteristique du produitController ${error.message}`);
            res.status(500).json(error.message);
        }
    },




    deleteCaracteristique: async (req, res) => {

        try {

            const produitInDb = await Caracteristique.findOne(req.params.id);

            const produit = await produitInDb.delete();

            res.json(produit);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteCaracteristique du produitController :',
                error);
            res.status(500).json(error.message);
        }
    },

    deleteCaracteristiqueByIdProduit: async (req, res) => {

        try {

            const produitsInDb = await Caracteristique.findByIdProduit(req.params.id);
            const arrayDeleted = [];
            for (const produitInDb of produitsInDb) {

                const produit = await produitInDb.deleteByIdProduit();
                arrayDeleted.push(produit);
            }

            res.json(arrayDeleted[0]);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteCaracteristiqueByIdProduit du produitController :',
                error);
            res.status(500).json(error.message);
        }
    },





}

module.exports = produitController;