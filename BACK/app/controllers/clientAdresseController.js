const ClientAdresse = require('../models/clientAdresse');
const ClientVille = require('../models/clientVille');
const ClientPays = require('../models/clientPays');
const LiaisonVilleCodePostal = require('../models/liaisonVilleCodePostal');
const ClientCodePostal = require('../models/clientCodePostal');

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

    /**
     * Une méthode pour avoir les adresses complete de tous les utilisateurs, incluant les pays, villes et code postaux
     */
    getAllAdresse: async (req, res) => {
        try {
            const adresses = await ClientAdresse.findAllPlus();
            adresses.map(item => item.codePostal = parseInt(item.codePostal, 10));

            res.status(200).json(adresses);
        } catch (error) {
            console.trace('Erreur dans la méthode getAllAdresse du clientAdresseController :',
                error);
            res.status(500).json(error.message);
        }
    },

    /**
     * Une méthode pour avoir une adresse complete d'un utilisateur, incluant les pays, villes et code postaux
     */
    getOneAdresse: async (req, res) => {
        try {

            const client = await ClientAdresse.findOnePlus(req.params.id);
            console.log(client);
            client.codePostal = parseInt(client.codePostal, 10);

            res.status(200).json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode getOneAdresse du clientAdresseController :',
                error);
            res.status(500).json(error.message);
        }
    },

    /**
     * Une méthode pour avoir les adresse complete d'un seul utilisateur, incluant les pays, villes et code postaux
     */
    getAdresseByIdClient: async (req, res) => {
        try {

            const client = await ClientAdresse.findByIdClient(req.params.id);

            client.map(item => item.codePostal = parseInt(item.codePostal, 10));

            res.status(200).json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode getAdresseByIdClient du clientAdresseController :',
                error);
            res.status(500).json(error.message);
        }
    },


    newAdresse: async (req, res) => {
        try {

            const data = {};
            const data2 = {};
            const data3 = {};
            const data4 = {};
            const data5 = {};

            data.prenom = req.body.prenom;
            data.nomFamille = req.body.nomFamille;
            data.ligne1 = req.body.ligne1;
            data.ligne2 = req.body.ligne2;
            data.ligne3 = req.body.ligne3;
            data.telephone = req.body.telephone;
            data.titre = req.body.titre;
            data.idClient = req.session.user.idClient;
            //data.idVille = req.body.idVille;

            //! ville
            data4.ville = req.body.ville;
            //data4.idPays = req.body.idPays;

            //! pays
            data2.pays = req.body.pays;

            //! ville a codepostal
            //data5.idVille = req.body.idVille;
            //data5.idCodePostal = req.body.idCodePostal;

            //! codePostal
            data3.codePostal = req.body.codePostal;

            //! ordre d'INSERT : pays, codePostal, ville, ville a codepostal, client_adresse

            const newPays = new ClientPays(data2);
            const resultatPays = await newPays.save();
            data4.idPays = resultatPays.id;


            const newCodePostal = new ClientCodePostal(data3);
            const resultatCodePostal = await newCodePostal.save();
            data5.idCodePostal = resultatCodePostal.id;


            const newVille = new ClientVille(data4);
            const resultatVille = await newVille.save();
            data5.idVille = resultatVille.id;
            data.idVille = resultatVille.id;


            const newLiaisonVilleCodePostal = new LiaisonVilleCodePostal(data5);
            await newLiaisonVilleCodePostal.save();

            
            const newAdresse = new ClientAdresse(data);
            const resultatAdresse = await newAdresse.save();


            const resultatsToSend = {
                idClient: resultatAdresse.idClient,
                idAdresse: resultatAdresse.id,
                titre:resultatAdresse.titre,
                prenom: resultatAdresse.prenom,
                nomFamille: resultatAdresse.nomFamille,
                adresse1: resultatAdresse.ligne1,
                adresse2: resultatAdresse.ligne2,
                adresse3: resultatAdresse.ligne3,
                codePostal: parseInt(resultatCodePostal.codePostal, 10),
                ville: resultatVille.nom,
                pays: resultatPays.nom,
            }

            res.status(200).json(resultatsToSend);
        } catch (error) {
            console.log(`Erreur dans la méthode newAdresse du clientAdresseController: ${error}`);
            res.status(500).json(error.message);
        }
    },




    updateAdresse: async (req, res) => {
        try {

            console.time('Timing de la méthode updateAdresse : ');

            const {
                id
            } = req.params;
            /* ClientAdresse {
  id: undefined,
  prenom: 'Xavier',
  nomFamille: 'Benoit',
  ligne1: undefined,
  ligne2: undefined,
  ligne3: undefined,
  telephone: '+33203499058',
  titre: undefined,
  createdDate: undefined,
  updatedDate: undefined,
  idClient: 74,
  idVille: 74,
  idAdresse: 74,
  idPays: 69,
  idCodePostal: 74,
  idLiaisonVilleCodePostal: 74,
  email: '74Laura83@yahoo.fr',
  adresse1: '48 Allée Pierre des Francs-Bourgeois ',
  adresse2: null,
  adresse3: null,
  pays: 'Tadjikistan',
  codePostal: '95433',
  ville: 'New Sandrinefort',
  privilege: 'Client'
} */

            const updateClient = await ClientAdresse.findOneForUpdate(id);
            

          

            updateClient.id = updateClient.idAdresse;
            const prenom = req.body.prenom;
            console.log("prenm =>," , prenom);
            const nomFamille = req.body.nomFamille;
            const ligne1 = req.body.ligne1;
            const ligne2 = req.body.ligne2;
            const ligne3 = req.body.ligne3;
            const telephone = req.body.telephone;
            const titre = req.body.titre;
            const idVille = updateClient.idVille;
            const idClient = updateClient.idClient;
            
            let userMessage = {};

            if (prenom) {
                updateClient.prenom = prenom;
                userMessage.prenom = 'Votre nouveau prenom a bien été enregistré ';
            } else if (!prenom) {
                userMessage.prenom = 'Votre prenom n\'a pas changé';
            }

            if (nomFamille) {
                updateClient.nomFamille = nomFamille;
                userMessage.nomFamille = 'Votre nouveau nom de famille a bien été enregistré ';
            } else if (!nomFamille) {
                userMessage.nomFamille = 'Votre nom de famille n\'a pas changé';
            }

            if (ligne1) {
                updateClient.ligne1 = ligne1;
                userMessage.ligne1 = 'Votre nouvelle ligne 1 de votre adresse a bien été enregistré ';
            } else if (!ligne1) {
                userMessage.ligne1 = 'Votre ligne 1 de votre adresse n\'a pas changé';
            }

            if (ligne2) {
                updateClient.ligne2 = ligne2;
                userMessage.ligne2 = 'Votre nouvelle ligne 2 de votre adresse a bien été enregistré ';
            } else if (!ligne2) {
                userMessage.ligne2 = 'Votre ligne 2 de votre adresse n\'a pas changé';
            }

            if (ligne3) {
                updateClient.ligne3 = ligne3;
                userMessage.ligne3 = 'Votre nouvelle ligne 3 de votre adresse a bien été enregistré ';
            } else if (!ligne3) {
                userMessage.ligne3 = 'Votre ligne 3 de votre adresse n\'a pas changé';
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
            }

            if (idVille) {
                updateClient.idVille = idVille;
            }

            console.log("updateClient==> ",updateClient);
            await updateClient.update();




            const pays = req.body.pays;
            const updatePays = await ClientPays.findOne(updateClient.idPays);
            if (pays) {
                updatePays.nom = pays;
                userMessage.pays = 'Votre nouveau nom de pays a bien été enregistré ';
            } else if (!nom) {
                userMessage.pays = 'Votre pays de pays n\'a pas changé';
            }
            console.log("updatePays==> ",updatePays);

            await updatePays.update();


            const ville = req.body.ville;
            const idPays = updateClient.idPays;
            const updateVille = await ClientVille.findOne(updateClient.idVille);
            if (ville) {
                updateVille.nom = ville;
                userMessage.ville = 'Votre nouveau nom de ville a bien été enregistré ';
            } else if (!nom) {
                userMessage.ville = 'Votre nom de ville n\'a pas changé';
            }
            if (idPays) {
                updateVille.idPays = idPays;
            } 
            console.log("updateVille==> ",updateVille);

            await updateVille.update();



            const codePostal = req.body.codePostal;
            const updateCodePostal = await ClientCodePostal.findOne(updateClient.idCodePostal);
           if (codePostal) {
                updateCodePostal.codePostal = codePostal;
                userMessage.codePostal = 'Votre nouveau code postal a bien été enregistré ';
            } else if (!codePostal) {
                userMessage.codePostal = 'Votre code postal n\'a pas changé';
            }
            console.log("updateCodePostal==> ",updateCodePostal);

            await updateCodePostal.update();



            const idCodePostal = updateClient.idCodePostal;
            const updateLiaison = await LiaisonVilleCodePostal.findOne(updateClient.idLiaisonVilleCodePostal);
            if (idVille) {
                updateLiaison.idVille = idVille;
            }
            if (idCodePostal) {
                updateLiaison.idCodePostal = idCodePostal;
            } 
            console.log("updateLiaison==> ",updateLiaison);

            await updateLiaison.update();

            console.timeEnd('Timing de la méthode updateAdresse : ');

            res.status(200).json(userMessage);

        } catch (error) {
            console.log(`Erreur dans la méthode updateClientAdress du clientAdresseController : ${error.message}`);
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
    deletePays: async (req, res) => {

        try {

            const clientInDb = await ClientPays.findOne(req.params.id);

            const client = await clientInDb.delete();

            res.json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode deletePays du clientAdresseController :',
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

    deleteLiaisonVilleCodePostal: async (req, res) => {

        try {

            const clientInDb = await LiaisonVilleCodePostal.findOne(req.params.id);

            const client = await clientInDb.delete();

            res.json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteLiaisonVilleCodePostal du clientAdresseController :',
                error);
            res.status(500).json(error.message);
        }
    },
    deleteCodePostal: async (req, res) => {

        try {

            const clientInDb = await ClientCodePostal.findOne(req.params.id);

            const client = await clientInDb.delete();

            res.json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteCodePostal du clientAdresseController :',
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