const ClientAdresse = require('../models/clientAdresse');
const ClientVille = require('../models/clientVille');
const ClientPays = require('../models/clientPays');
const LiaisonVilleCodePostal = require('../models/liaisonVilleCodePostal');
const ClientCodePostal = require('../models/clientCodePostal');
const Client = require('../models/client');

const countrynames = require('countrynames');

const stripe = require('stripe')(process.env.STRIPE_TEST_KEY);



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

            const {
                password
            } = req.body;
            const clientInDb = await Client.authenticateWhitoutHisto(req.session.user.email, password);
            if (!clientInDb) {
                return res.status(401).json("Erreur d'authentification : vous n'êtes pas autoriser a modifier votre adresse.");
            }

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

            // On n'accepte que les adresses en France pour cette premiére version de l'API
            // upperCase est appliqué uniquement a req.body.pays dans le MW sanitiz dans l'index.
            if (req.body.pays !== 'FRANCE') {
                return res.status(404).json("Bonjour, merci de renseigner une adresse en France pour cette version de l'API")
            };

            if (await ClientAdresse.findByTitre(req.body.titre)) {
                console.log('Vous avez déja enregistré une adresse avec ce titre d\'adresse. Merci de renseigner un autre titre pour éviter toute confusion lors de vos prochaines selections d\'adresse.');
                return res.status(404).json('Vous avez déja enregistré une adresse avec ce titre d\'adresse. Merci de renseigner un autre titre pour éviter toute confusion lors de vos prochaines selections d\'adresse.');

            }


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
                titre: resultatAdresse.titre,
                prenom: resultatAdresse.prenom,
                nomFamille: resultatAdresse.nomFamille,
                adresse1: resultatAdresse.ligne1,
                adresse2: resultatAdresse.ligne2,
                adresse3: resultatAdresse.ligne3,
                codePostal: parseInt(resultatCodePostal.codePostal, 10),
                ville: resultatVille.nom,
                pays: resultatPays.nom,
                telephone: resultatAdresse.telephone,
            }

            console.log("resultatAdresse => ", resultatAdresse);

            let ligneAdresse;

            if (resultatAdresse.ligne3) {

                ligneAdresse = ` ${resultatAdresse.ligne2} ${resultatAdresse.ligne3}`

            } else if (resultatAdresse.ligne2) {

                ligneAdresse = `${resultatAdresse.ligne2}`
            }

            console.log("ligneAdresse  => ", ligneAdresse);

            // je donne quelques infos a STRIPE maintenant que mon utilisateur a également créer une adresse en plus d'un compte.
            const custumer = await stripe.customers.create({
                description: 'Un client MadaSHOP',
                email: req.session.user.email,
                name: `${resultatAdresse.prenom} ${resultatAdresse.nomFamille}`,
                address: {
                    city: resultatVille.nom,
                    country: countrynames.getCode(`${resultatPays.nom}`),
                    line1: resultatAdresse.ligne1,
                    line2: ligneAdresse,
                    postal_code: resultatCodePostal.codePostal,
                    state: resultatPays.nom,
                },
                phone: resultatAdresse.telephone,
                balance: 0,
            });

            console.log(countrynames.getAllNames());
            console.log('custumer ==> ', custumer);





            res.status(200).json(resultatsToSend);
        } catch (error) {
            console.trace(error);
            console.log(`Erreur dans la méthode newAdresse du clientAdresseController: ${error}`);
            res.status(500).json(error.message);
        }
    },




    updateAdresse: async (req, res) => {
        try {

            console.time('Timing de la méthode updateAdresse : ');

            const {
                password
            } = req.body;
            const clientInDb = await Client.authenticateWhitoutHisto(req.session.user.email, password);
            if (!clientInDb) {
                return res.status(401).json("Erreur d'authentification : vous nêtes pas autoriser a mettre a jour votre adresse.");
            }
            const {
                id
            } = req.params;
            //re.params.id doit valoir l'id d'une client_adresse !

            const updateClient = await ClientAdresse.findOneForUpdate(id);

            updateClient.id = updateClient.idAdresse;
            const prenom = req.body.prenom;
            const nomFamille = req.body.nomFamille;
            const ligne1 = req.body.ligne1;
            const ligne2 = req.body.ligne2;
            const ligne3 = req.body.ligne3;
            const telephone = req.body.telephone;
            const titre = req.body.titre;
            const idVille = updateClient.idVille;
            const idClient = updateClient.idClient;

            if (await ClientAdresse.findByTitre(req.body.titre)) {
                console.log('Vous avez déja enregistré une adresse avec ce titre d\'adresse. Merci de renseigner un autre titre pour éviter toute confusion lors de vos prochaines selections d\'adresse.');
                return res.status(404).json('Vous avez déja enregistré une adresse avec ce titre d\'adresse. Merci de renseigner un autre titre pour éviter toute confusion lors de vos prochaines selections d\'adresse.');

            }

            // On n'accepte que les adresses en France pour cette premiére version de l'API
            // upperCase est appliqué uniquement a req.body.pays dans le MW sanitiz dans l'index.
            if (req.body.pays !== 'FRANCE') {
                return res.status(404).json("Bonjour, merci de renseigner une adresse en France pour cette version de l'API")
            };


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

            await updateClient.update();




            const pays = req.body.pays;
            const updatePays = await ClientPays.findOne(updateClient.idPays);

            if (pays) {
                updatePays.nom = pays;
                userMessage.pays = 'Votre nouveau nom de pays a bien été enregistré ';
            } else if (!pays) {
                userMessage.pays = 'Votre pays de pays n\'a pas changé';
            }

            await updatePays.update();


            const ville = req.body.ville;
            const idPays = updateClient.idPays;
            const updateVille = await ClientVille.findOne(updateClient.idVille);
            if (ville) {
                updateVille.nom = ville;
                userMessage.ville = 'Votre nouveau nom de ville a bien été enregistré ';
            } else if (!ville) {
                userMessage.ville = 'Votre nom de ville n\'a pas changé';
            }
            if (idPays) {
                updateVille.idPays = idPays;
            }

            await updateVille.update();



            const codePostal = req.body.codePostal;
            const updateCodePostal = await ClientCodePostal.findOne(updateClient.idCodePostal);
            if (codePostal) {
                updateCodePostal.codePostal = codePostal;
                userMessage.codePostal = 'Votre nouveau code postal a bien été enregistré ';
            } else if (!codePostal) {
                userMessage.codePostal = 'Votre code postal n\'a pas changé';
            }

            await updateCodePostal.update();



            const idCodePostal = updateClient.idCodePostal;
            const updateLiaison = await LiaisonVilleCodePostal.findOne(updateClient.idLiaisonVilleCodePostal);
            if (idVille) {
                updateLiaison.idVille = idVille;
            }
            if (idCodePostal) {
                updateLiaison.idCodePostal = idCodePostal;
            }

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
            console.time("ça delete en ");
            const {
                password
            } = req.body;
            const clientInDb = await Client.authenticateWhitoutHisto(req.session.user.email, password);
            if (!clientInDb) {
                return res.status(401).json("Erreur d'authentification : vous nêtes pas autoriser a supprimer votre adresse.");
            }


            //re.params.id doit valoir l'id d'une client_adresse !
            const fullAdresseInDbForId = await ClientAdresse.findOneForUpdate(req.params.id);
            console.log("fullAdresseInDbForId ==>", fullAdresseInDbForId)

            const adresseInDb = await ClientAdresse.findOne(req.params.id);
            const adresseDelete = await adresseInDb.delete();
            console.log("adresseDelete => ", adresseDelete);

            const paysInDb = await ClientPays.findOne(fullAdresseInDbForId.idPays);
            await paysInDb.delete();

            const codePostalInDb = await ClientCodePostal.findOne(fullAdresseInDbForId.idCodePostal);
            await codePostalInDb.delete();

            //pas besoin de DELETE via le model clientVille, et le LiaisonVilleCodePostal, le ON CASCADE DELETE s'en charge pour nous ! 


            res.status(200).json(`l'adresse id ${req.params.id} a bien été supprimé`);
            console.timeEnd("ça delete en ");

        } catch (error) {
            console.trace('Erreur dans la méthode delete du clientAdresseController :',
                error);
            res.status(500).json(error.message);
        }
    },


}

module.exports = clientAdresseController;