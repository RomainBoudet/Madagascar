const ClientAdresse = require('../models/clientAdresse');
const ClientVille = require('../models/clientVille');
const ClientPays = require('../models/clientPays');
const LiaisonVilleCodePostal = require('../models/liaisonVilleCodePostal');
const ClientCodePostal = require('../models/clientCodePostal');
const Client = require('../models/client');

const redis = require('../services/redis');

const countrynames = require('countrynames');
const passwordSchema = require('../schemas/passwordOnlySchema');

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
            res.status(500).end();
        }
    },

    /**
     * Une méthode pour avoir une adresse complete d'un utilisateur, incluant les pays, villes et code postaux
     */
    getOneAdresse: async (req, res) => {
        try {

            const client = await ClientAdresse.findOnePlus(req.params.id);

            if (client === null) {
                return res.status(404).json({
                    message: "Cette adresse n'existe pas."
                })
            };

            if ((req.session.user.privilege === 'Administrateur' || req.session.user.privilege === 'Client') && req.session.user.idClient !== client.idClient) {
                return res.status(403).json({
                    message: "Vous n'avez pas les droits pour accéder a cette ressource"
                })
            };

            console.log(client);
            client.codePostal = parseInt(client.codePostal, 10);

            res.status(200).json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode getOneAdresse du clientAdresseController :',
                error);
            res.status(500).end();
        }
    },

    /**
     * Une méthode pour avoir les adresse complete d'un seul utilisateur, incluant les pays, villes et code postaux
     */
    getAdresseByIdClient: async (req, res) => {
        try {


            if ((req.session.user.privilege === 'Administrateur' || req.session.user.privilege === 'Client') && req.session.user.idClient !== req.params.id) {
                return res.status(403).json({
                    message: "Vous n'avez pas les droits pour accéder a cette ressource"
                })
            };


            const client = await ClientAdresse.findByIdClient(req.params.id);

            client.map(item => item.codePostal = parseInt(item.codePostal, 10));

            res.status(200).json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode getAdresseByIdClient du clientAdresseController :',
                error);
            res.status(500).end();
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
            data.envoie = req.body.envoie;
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

            const idClientStripe = await redis.get(`mada/clientStripe:${req.session.user.email}`);

            let resultatAdresse;
            let ligneAdresse;
            let custumer;

            if (req.body.envoie && req.body.envoie === 'true') {

                //TODO
                //vérifier si TRUE est la colonne envoie est déja passé a TRUE. si oui, on le supprime pour qu'une nouvelle insertion soit posible
                //const isEnvoieTrue = await ClientAdresse. 
                //TODO
                //Contruire dans le model, une méthode pour rechercher si une valeur de la colonne 'envoie', pour un client donné, est égal a TRUE.

                //BUG
                // ATTENTION, ici je ne peut pas avoir plusieur valeur a TRUE dans la colonne envoi avec le DDL, alors que j'en veux un par id_client !




                console.log("ici req.body.shippingAsBilliing est présent !")
                resultatAdresse = await newAdresse.saveWithEnvoie();

                if (resultatAdresse.ligne3) {
                    ligneAdresse = ` ${resultatAdresse.ligne2} ${resultatAdresse.ligne3}`
                } else if (resultatAdresse.ligne2) {
                    ligneAdresse = `${resultatAdresse.ligne2}`
                }
                custumer = await stripe.customers.update(
                    idClientStripe, {
                        address: {
                            city: resultatVille.nom,
                            country: countrynames.getCode(`${resultatPays.nom}`),
                            line1: resultatAdresse.ligne1,
                            line2: ligneAdresse,
                            postal_code: resultatCodePostal.codePostal,
                            state: resultatPays.nom,
                        },
                        phone: resultatAdresse.telephone,
                        shipping: {
                            address: {
                                city: resultatVille.nom,
                                country: countrynames.getCode(`${resultatPays.nom}`),
                                line1: resultatAdresse.ligne1,
                                line2: ligneAdresse,
                                postal_code: resultatCodePostal.codePostal,
                                state: resultatPays.nom,
                            },
                            name: `${resultatAdresse.prenom} ${resultatAdresse.nomFamille}`,
                            phone: resultatAdresse.telephone,
                        },
                    }
                );


            } else {

                console.log("ici absent !")
                resultatAdresse = await newAdresse.save();

                if (resultatAdresse.ligne3) {
                    ligneAdresse = ` ${resultatAdresse.ligne2} ${resultatAdresse.ligne3}`
                } else if (resultatAdresse.ligne2) {
                    ligneAdresse = `${resultatAdresse.ligne2}`
                }
                //je récupére dans REDIS mon idClientStripe avant update du client dans STRIPE
                await stripe.customers.update(
                    idClientStripe, {
                        address: {
                            city: resultatVille.nom,
                            country: countrynames.getCode(`${resultatPays.nom}`),
                            line1: resultatAdresse.ligne1,
                            line2: ligneAdresse,
                            postal_code: resultatCodePostal.codePostal,
                            state: resultatPays.nom,
                        },
                        phone: resultatAdresse.telephone,
                    }
                );
            }

            console.log("custumer ==>> ", custumer);

            console.log("resultatAdresse ==> ", resultatAdresse);

            const resultatsToSend = {
                idClient: resultatAdresse.idClient,
                idAdresse: resultatAdresse.id,
                titre: resultatAdresse.titre,
                prenom: resultatAdresse.prenom,
                nomFamille: resultatAdresse.nomFamille,
                adresse1: resultatAdresse.ligne1,
                adresse2: resultatAdresse.ligne2,
                adresse3: resultatAdresse.ligne3,
                envoie: resultatAdresse.envoie,
                codePostal: parseInt(resultatCodePostal.codePostal, 10),
                ville: resultatVille.nom,
                pays: resultatPays.nom,
                telephone: resultatAdresse.telephone,
            }



            console.log('custumer dans new adresse ==> ', custumer);

            res.status(200).json(resultatsToSend);
        } catch (error) {
            console.trace(error);
            console.log(`Erreur dans la méthode newAdresse du clientAdresseController: ${error}`);
            res.status(500).end();
        }
    },




    updateAdresse: async (req, res) => {
        try {

            const {
                password
            } = req.body;

            if (Object.keys(req.body).length === 0) {
                return res.status(200).json({message: 'Vous n\'avez envoyé aucune données à modifier.'});
            }
            
            const clientInDb = await Client.authenticateWhitoutHisto(req.session.user.email, password);

            if (!clientInDb) {
                return res.status(401).json({
                    message: "Erreur d'authentification : vous n'êtes pas autoriser a mettre a jour cette adresse."
                });
            }
            const {
                id
            } = req.params;
            //re.params.id doit valoir l'id d'une client_adresse !

            const updateClient = await ClientAdresse.findOneForUpdate(id);

            if (updateClient === null) {
                return res.status(404).json({
                    message: "Cette adresse n'existe pas."
                })
            };

            if (updateClient.idClient !== req.session.user.idClient) {
                return res.status(403).json({
                    message: "Vous n'avez pas les droits pour accéder a cette ressource"
                })
            };

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
            if (req.body.pays !== 'FRANCE' && req.body.pays !== undefined) {
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

            const resultatUpdateClientAdress = await updateClient.update();


            const pays = req.body.pays;
            const updatePays = await ClientPays.findOne(updateClient.idPays);

            if (pays) {
                updatePays.nom = pays;
                userMessage.pays = 'Votre nouveau nom de pays a bien été enregistré ';
            } else if (!pays) {
                userMessage.pays = 'Votre pays de pays n\'a pas changé';
            }

            const resultatUpdatePays = await updatePays.update();


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

            const resultatUpdateVille = await updateVille.update();


            const codePostal = req.body.codePostal;
            const updateCodePostal = await ClientCodePostal.findOne(updateClient.idCodePostal);
            if (codePostal) {
                updateCodePostal.codePostal = codePostal;
                userMessage.codePostal = 'Votre nouveau code postal a bien été enregistré ';
            } else if (!codePostal) {
                userMessage.codePostal = 'Votre code postal n\'a pas changé';
            }

            const resultatUpdatecodePostal = await updateCodePostal.update();



            const idCodePostal = updateClient.idCodePostal;
            const updateLiaison = await LiaisonVilleCodePostal.findOne(updateClient.idLiaisonVilleCodePostal);
            if (idVille) {
                updateLiaison.idVille = idVille;
            }
            if (idCodePostal) {
                updateLiaison.idCodePostal = idCodePostal;
            }

            await updateLiaison.update();

            let ligneAdresse;

            if (resultatUpdateClientAdress.ligne3) {

                ligneAdresse = ` ${resultatUpdateClientAdress.ligne2} ${resultatUpdateClientAdress.ligne3}`

            } else if (resultatUpdateClientAdress.ligne2) {

                ligneAdresse = `${resultatUpdateClientAdress.ligne2}`
            }



            // j'update les info de mon client dans STRIPE au passage...
            const idClientStripe = await redis.get(`mada/clientStripe:${req.session.user.email}`);
            const customer = await stripe.customers.update(
                idClientStripe, {
                    address: {
                        city: resultatUpdateVille.nom,
                        country: countrynames.getCode(`${resultatUpdatePays.nom}`),
                        line1: resultatUpdateClientAdress.ligne1,
                        line2: ligneAdresse,
                        postal_code: resultatUpdatecodePostal.codePostal,
                        state: resultatUpdatePays.nom,
                    },
                    phone: resultatUpdateClientAdress.telephone,
                }
            );

            //TODO
            // Ne pas oublier de finir la méthod pour la mise a jour des info de shipping si envoie est dans le body...


            console.log(customer);


            res.status(200).json(userMessage);

        } catch (error) {
            console.log(`Erreur dans la méthode updateClientAdress du clientAdresseController : ${error.message}`);
            res.status(500).end();
        }
    },




    delete: async (req, res) => {

        try {
            const {
                password
            } = req.body;
            const clientInDb = await Client.authenticateWhitoutHisto(req.session.user.email, password);

            if (!clientInDb) {
                return res.status(401).json({
                    message: "Erreur d'authentification : vous n'êtes pas autoriser a supprimer votre adresse."
                });
            };


            //re.params.id doit valoir l'id d'une client_adresse !
            const fullAdresseInDbForId = await ClientAdresse.findOneForUpdate(req.params.id);

            if (fullAdresseInDbForId === null) {
                return res.status(404).json({
                    message: "Cette adresse n'existe pas."
                })
            };
            if (fullAdresseInDbForId.idClient !== req.session.user.idClient) {
                return res.status(403).json({
                    message: "Vous n'avez pas les droits pour accéder a cette ressource"
                })
            };



            //BUG
            ///ici une suppression en cascade avec toutes les adresses d'un client qui sont supprimé d'un coup ! 



            // ordre a tester => inverse que l'update ! Liaison => CP => Ville => Pays => adresse
            console.log("fullAdresseInDbForId => ", fullAdresseInDbForId);

            const adresseInDb = await ClientAdresse.findOne(req.params.id);
            const adresseDelete = await adresseInDb.delete();
            console.log("adresseDelete => ", adresseDelete);


            const liaisonInDb = await LiaisonVilleCodePostal.findOne(fullAdresseInDbForId.idLiaisonVilleCodePostal);
            await liaisonInDb.delete();
            console.log("liaisonInDb =>", liaisonInDb); 

            const codePostalInDb = await ClientCodePostal.findOne(fullAdresseInDbForId.idCodePostal);
            await codePostalInDb.delete();
            console.log("codePostalInDb => ", codePostalInDb);


           /*  const paysInDb = await ClientPays.findOne(fullAdresseInDbForId.idPays);
            await paysInDb.delete();
            console.log("paysInDb => ", paysInDb);
            
          

            const villeInDb = await ClientVille.findOne(fullAdresseInDbForId.idVille);
            await villeInDb.delete();
            console.log("villeInDb => ", villeInDb); */



            res.status(200).json(`l'adresse id ${req.params.id} a bien été supprimé`);

        } catch (error) {
            console.trace('Erreur dans la méthode delete du clientAdresseController :',
                error);
            res.status(500).end();
        }
    },


}

module.exports = clientAdresseController;