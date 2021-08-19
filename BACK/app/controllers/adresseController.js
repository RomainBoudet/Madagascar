const Adresse = require('../models/adresse');
const Client = require('../models/client');

const redis = require('../services/redis');

const countrynames = require('countrynames');

const stripe = require('stripe')(process.env.STRIPE_TEST_KEY);



/**
 * Une méthode qui va servir a intéragir avec le model Adresse pour les intéractions des adresses des clients avec la BDD 
 * Retourne un json
 * @name adresseController
 * @method adresseController
 * @param {Express.Request} req - l'objet représentant la requête
 * @param {Express.Response} res - l'objet représentant la réponse
 * @return {JSON}  - une donnée en format json
 */
const adresseController = {


    /**
     * Une méthode pour passer a TRUE la valeur de la colonne Envoie d'une adresse.
     */
    setAdresseEnvoiTrue: async (req, res) => {
        try {
            //recois dans req.params.id ==> un id.adresse a passer a true.

            //Je vérifie si une adresse est déja a TRUE dans la liste
            //si oui, je supprime le true.
            //je passe l'adreese demandé a TRUE dans la colonne Envoi

            //Attention si aucune adresse ne posséde l'attribue TRUE, on ne doit pas bloquer le processus...

            const adresseExist = await Adresse.findOne(req.params.id);


            if (adresseExist === null) {
                return res.status(404).json({
                    message: "Cette adresse n'existe pas."
                })
            };

            if ((req.session.user.privilege === 'Administrateur' || req.session.user.privilege === 'Client') && req.session.user.idClient !== adresseExist.idClient) {
                return res.status(403).json({
                    message: "Vous n'avez pas les droits pour accéder a cette ressource"
                })

            };

            if (adresseExist.envoie === true) {
                return res.status(404).json({
                    message: "Cette adresse est déja défini comme adresse d'envoi."
                })
            };

            const adresse = await Adresse.findByEnvoiTrue(req.session.user.idClient);

            //Si l'utilisateur a déja une adresse indiqués commen adresse de livraison, je passe a null cette adresse.
            if (adresse && adresse.idClient !== undefined) {

                const adresseToSetNull = new Adresse({
                    id: adresse.id
                });
                await adresseToSetNull.updateEnvoieNull();

            }; // ici aucune adresse de l'utilisateur en session n'a d'adresse indiqué comme valide pour la livraison, on va pouvoir indiqué celle reçu en paramétre.

            const adresseToSetTrue = new Adresse({
                id: req.params.id
            });
            const adresseNowTrue = await adresseToSetTrue.updateEnvoieTrue();

            adresseNowTrue.codePostal = parseInt(adresseNowTrue.codePostal, 10);

            res.status(200).json(adresseNowTrue);

        } catch (error) {
            console.trace('Erreur dans la méthode setAdresseEnvoiTrue du adresseController :',
                error);
            res.status(500).json(error.message);
        }
    },

    /**
     * Une méthode pour passer a TRUE la valeur de la colonne Envoie d'une adresse.
     */
    setAdresseFacturationTrue: async (req, res) => {
        try {
            //recois dans req.params.id ==> un id.adresse a passer a true.

            //Je vérifie si une adresse est déja a TRUE dans la liste
            //si oui, je supprime le true.
            //je passe l'adreese demandé a TRUE dans la colonne Envoi

            //Attention si aucune adresse ne posséde l'attribue TRUE, on ne doit pas bloquer le processus...



            const adresseExist = await Adresse.findOne(req.params.id);

            if (adresseExist === null) {
                return res.status(404).json({
                    message: "Cette adresse n'existe pas."
                })
            };

            if ((req.session.user.privilege === 'Administrateur' || req.session.user.privilege === 'Client') && req.session.user.idClient !== adresseExist.idClient) {
                return res.status(403).json({
                    message: "Vous n'avez pas les droits pour accéder a cette ressource"
                })

            };

            if (adresseExist.facturation === true) {
                return res.status(404).json({
                    message: "Cette adresse est déja défini comme adresse de facturation."
                })
            };

            const adresse = await Adresse.findByFacturationTrue(req.session.user.idClient);


            //Si l'utilisateur a déja une adresse indiqués commen adresse de facturation,  je passe a null cette adresse.
            if (adresse && adresse.idClient !== undefined) {

                const adresseToSetNull = new Adresse({
                    id: adresse.id
                });
                const adresseNowNull = await adresseToSetNull.updateFacturationNull();


            }; // ici aucune adresse de l'utilisateur en session n'a d'adresse indiqué comme valide pour la livraison, on va pouvoir indiqué celle reçu en paramétre.

            const adresseToSetTrue = new Adresse({
                id: req.params.id
            });
            const adresseNowTrue = await adresseToSetTrue.updateFacturationTrue();

            adresseNowTrue.codePostal = parseInt(adresseNowTrue.codePostal, 10);

            res.status(200).json(adresseNowTrue);

        } catch (error) {
            console.trace('Erreur dans la méthode setAdresseFacturationTrue du adresseController :',
                error);
            res.status(500).json(error.message);
        }
    },


    /**
     * Une méthode pour avoir les adresses complete de tous les utilisateurs, incluant les pays, villes et code postaux
     */
    getAllAdresse: async (req, res) => {
        try {
            const adresses = await Adresse.findAllPlus();
            adresses.map(item => item.codePostal = parseInt(item.codePostal, 10));

            res.status(200).json(adresses);

        } catch (error) {
            console.trace('Erreur dans la méthode getAllAdresse du adresseController :',
                error);
            res.status(500).json(error.message);
        }
    },

    /**
     * Une méthode pour avoir une adresse complete d'un utilisateur, incluant les pays, villes et code postaux
     */
    getOneAdresse: async (req, res) => {
        try {

            const client = await Adresse.findOnePlus(req.params.id);

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
            console.trace('Erreur dans la méthode getOneAdresse du adresseController :',
                error);
            res.status(500).json(error.message);
        }
    },

    /**
     * Une méthode pour avoir les adresse complete d'un seul utilisateur, incluant les pays, villes et code postaux
     */
    getAdresseByIdClient: async (req, res) => {
        try {

            if ((req.session.user.privilege === 'Administrateur' || req.session.user.privilege === 'Client') && req.session.user.idClient !== parseInt(req.params.id, 10)) {
                return res.status(403).json({
                    message: "Vous n'avez pas les droits pour accéder a cette ressource"
                })
            };


            const client = await Adresse.findByIdClient(req.params.id);
            console.log(client);

            client.map(item => item.codePostal = parseInt(item.codePostal, 10));

            res.status(200).json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode getAdresseByIdClient du adresseController :',
                error);
            res.status(500).json(error.message);
        }
    },



    getLastAdresseByIdClient: async (req, res) => {
        try {

            if ((req.session.user.privilege === 'Administrateur' || req.session.user.privilege === 'Client') && req.session.user.idClient !== parseInt(req.params.id, 10)) {
                return res.status(403).json({
                    message: "Vous n'avez pas les droits pour accéder a cette ressource"
                })
            };


            const client = await Adresse.findLastAdresseByIdClient(req.params.id);
            console.log(client);

            client.codePostal = Number(client.codePostal);
            res.status(200).json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode getLastAdresseByIdClient du adresseController :',
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
                return res.status(401).json({
                    message: "Erreur d'authentification : vous n'êtes pas autoriser a modifier cette adresse."
                });
            }

            //Si l'utilisateur a déja une adresse indiqués commen adresse de facturation,  je passe a null cette adresse puisque celle qu'il vient de demander de créer sera automatiquement par défaul, sa nouvelle adresse de facturation.
            const adresse = await Adresse.findByFacturationTrue(req.session.user.idClient);
            if (adresse && adresse.idClient !== undefined) {

                const adresseToSetNull = new Adresse({
                    id: adresse.id
                });
                await adresseToSetNull.updateFacturationNull();
            };

            const data = {};

            data.titre = req.body.titre;
            data.prenom = req.body.prenom;
            data.nomFamille = req.body.nomFamille;
            data.ligne1 = req.body.ligne1;
            data.ligne2 = req.body.ligne2;
            data.ligne3 = req.body.ligne3;
            data.codePostal = req.body.codePostal;
            data.ville = req.body.ville;
            data.pays = req.body.pays;
            data.telephone = req.body.telephone;
            data.envoie = req.body.envoie;
            data.idClient = req.session.user.idClient;

            if (data.ligne2 === '') {
                data.ligne2 = null;
            }

            if (data.ligne3 == '') {
                data.ligne3 = null;
            }

            // On n'accepte que les adresses en France pour cette premiére version de l'API
            // upperCase est appliqué uniquement a req.body.pays dans le MW sanitiz dans l'index.
            if (req.body.pays !== 'FRANCE') {
                return res.status(404).json({
                    message: "Bonjour, merci de renseigner une adresse en France pour cette version de l'API"
                })
            };

            //Si l'utilisateur a rentré deux titres d'adresse identique, on lui refuse..
            if (await Adresse.findByTitre(req.body.titre, req.session.user.idClient)) {
                console.log('Vous avez déja enregistré une adresse avec ce titre d\'adresse. Merci de renseigner un autre titre pour éviter toute confusion lors de vos prochaines selections d\'adresse.');
                return res.status(404).json({
                    message: 'Vous avez déja enregistré une adresse avec ce titre d\'adresse. Merci de renseigner un autre titre pour éviter toute confusion lors de vos prochaines selections d\'adresse.'
                });

            }

            const newAdresse = new Adresse(data);

            const idClientStripe = await redis.get(`mada/clientStripe:${req.session.user.email}`);
            console.log("newAddrresse ==> ", newAdresse);
            let resultatAdresse;
            let ligneAdresse;
            let custumer;


            // Si une adresse est déja a true dans la facturation, je passe cette donneé a FALSE, pour permettre un passage a TRUE automatique pour la nouvelle
            if (req.body.envoie && req.body.envoie === 'true') {

                //NOTE 
                // Si la valeur TRUE signifiant qu'une adresse de livraison existe déja en BDD, on supprime l'ancienne valeur true pour pouvoir en insérer une nouvelle.
                const envoiIsTrue = await Adresse.findByEnvoie(req.session.user.idClient)


                if (envoiIsTrue) {
                    await envoiIsTrue.envoieNull();
                }

                resultatAdresse = await newAdresse.saveWithEnvoie();

                if (resultatAdresse.ligne3) {
                    ligneAdresse = ` ${resultatAdresse.ligne2} ${resultatAdresse.ligne3}`
                } else if (resultatAdresse.ligne2) {
                    ligneAdresse = `${resultatAdresse.ligne2}`
                }
                custumer = await stripe.customers.update(
                    idClientStripe, {
                        address: {
                            city: resultatAdresse.ville,
                            country: countrynames.getCode(`${resultatAdresse.pays}`),
                            line1: resultatAdresse.ligne1,
                            line2: ligneAdresse,
                            postal_code: resultatAdresse.codePostal,
                            state: resultatAdresse.pays,
                        },
                        phone: resultatAdresse.telephone,
                        shipping: {
                            address: {
                                city: resultatAdresse.ville,
                                country: countrynames.getCode(`${resultatAdresse.pays}`),
                                line1: resultatAdresse.ligne1,
                                line2: ligneAdresse,
                                postal_code: resultatAdresse.codePostal,
                                state: resultatAdresse.pays,
                            },
                            name: `${resultatAdresse.prenom} ${resultatAdresse.nomFamille}`,
                            phone: resultatAdresse.telephone,
                        },
                    }
                );


            } else {

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
                            city: resultatAdresse.ville,
                            country: countrynames.getCode(`${resultatAdresse.nom}`),
                            line1: resultatAdresse.ligne1,
                            line2: ligneAdresse,
                            postal_code: resultatAdresse.codePostal,
                            state: resultatAdresse.pays,
                        },
                        phone: resultatAdresse.telephone,
                    }
                );
            }

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
                codePostal: parseInt(resultatAdresse.codePostal, 10),
                ville: resultatAdresse.ville,
                pays: resultatAdresse.pays,
                telephone: resultatAdresse.telephone,
            }

            res.status(200).json(resultatsToSend);
        } catch (error) {
            console.trace(error);
            console.log(`Erreur dans la méthode newAdresse du adresseController: ${error}`);
            res.status(500).json(error.message);
        }
    },


    updateAdresse: async (req, res) => {
        try {

            const {
                password
            } = req.body;

            if (Object.keys(req.body).length === 0) {
                return res.status(200).json({
                    message: 'Vous n\'avez envoyé aucune données à modifier.'
                });
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

            const updateClient = await Adresse.findOneForUpdate(id);


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
            const titre = req.body.titre;
            const prenom = req.body.prenom;
            const nomFamille = req.body.nomFamille;
            const ligne1 = req.body.ligne1;
            const ligne2 = req.body.ligne2;
            const ligne3 = req.body.ligne3;
            const codePostal = req.body.codePostal;
            const ville = req.body.ville;
            const pays = req.body.pays;
            const telephone = req.body.telephone;
            const envoie = req.body.envoie;


            if (await Adresse.findByTitre(titre, req.session.user.idClient)) {
                console.log('Vous avez déja enregistré une adresse avec ce titre d\'adresse. Merci de renseigner un autre titre pour éviter toute confusion lors de vos prochaines selections d\'adresse.');
                return res.status(404).json({
                    message: 'Vous avez déja enregistré une adresse avec ce titre d\'adresse. Merci de renseigner un autre titre pour éviter toute confusion lors de vos prochaines selections d\'adresse.'
                });

            }

            // On n'accepte que les adresses en France pour cette premiére version de l'API
            // upperCase est appliqué uniquement a req.body.pays dans le MW sanitiz dans l'index.
            if (req.body.pays !== 'FRANCE' && req.body.pays !== undefined) {
                return res.status(404).json({
                    message: "Bonjour, merci de renseigner une adresse en France pour cette version de l'API"
                })
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

            if (ville) {
                updateClient.ville = ville;
                userMessage.ville = 'Votre nouvelle ville a bien été enregistré ';
            } else if (!ville) {
                userMessage.ville = 'Votre ville n\'a pas changé';
            }

            if (pays) {
                updateClient.pays = pays;
                userMessage.pays = 'Votre nouveau pays a bien été enregistré ';
            } else if (!pays) {
                userMessage.pays = 'Votre pays n\'a pas changé';
            }

            if (envoie) {
                updateClient.envoie = envoie;
                userMessage.envoie = 'Votre nouveau envoie a bien été enregistré ';
            } else if (!envoie) {
                userMessage.envoie = 'Votre envoie n\'a pas changé';
            }

            if (codePostal) {
                updateClient.codePostal = codePostal;
                userMessage.codePostal = 'Votre nouveau codePostal a bien été enregistré ';
            } else if (!codePostal) {
                userMessage.codePostal = 'Votre codePostal n\'a pas changé';
            }

            const myUpdate = new Adresse(updateClient);
            const resultatAdresse = await myUpdate.update();


            let ligneAdresse;
            if (resultatAdresse.ligne3) {
                ligneAdresse = ` ${resultatAdresse.ligne2} ${resultatAdresse.ligne3}`
            } else if (resultatAdresse.ligne2) {
                ligneAdresse = `${resultatAdresse.ligne2}`
            }

            // j'update les info de mon client dans STRIPE au passage...
            const idClientStripe = await redis.get(`mada/clientStripe:${req.session.user.email}`);
            if (envoie && envoie === 'true') {

                //NOTE 
                // Si la valeur TRUE signifiant qu'une adresse de livraison existe déja en BDD, on supprime l'ancienne valeur true pour pouvoir en insérer une nouvelle.

                const envoiIsTrue = await Adresse.findByEnvoie(req.session.user.idClient)
                if (envoiIsTrue) {
                    console.log("on passe !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
                    await envoiIsTrue.envoieNull();
                }
                console.log("idClientStripe ==> ", idClientStripe);

                await stripe.customers.update(
                    idClientStripe, {
                        address: {
                            city: resultatAdresse.ville,
                            country: countrynames.getCode(`${resultatAdresse.pays}`),
                            line1: resultatAdresse.ligne1,
                            line2: ligneAdresse,
                            postal_code: resultatAdresse.codePostal,
                            state: resultatAdresse.pays,
                        },
                        phone: resultatAdresse.telephone,
                        shipping: {
                            address: {
                                city: resultatAdresse.ville,
                                country: countrynames.getCode(`${resultatAdresse.pays}`),
                                line1: resultatAdresse.ligne1,
                                line2: ligneAdresse,
                                postal_code: resultatAdresse.codePostal,
                                state: resultatAdresse.pays,
                            },
                            name: `${resultatAdresse.prenom} ${resultatAdresse.nomFamille}`,
                            phone: resultatAdresse.telephone,
                        },
                    }
                );


            } else {

                await stripe.customers.update(
                    idClientStripe, {
                        address: {
                            city: resultatAdresse.ville,
                            country: countrynames.getCode(`${resultatAdresse.nom}`),
                            line1: resultatAdresse.ligne1,
                            line2: ligneAdresse,
                            postal_code: resultatAdresse.codePostal,
                            state: resultatAdresse.pays,
                        },
                        phone: resultatAdresse.telephone,
                    }
                );
            }

            res.status(200).json(userMessage);

        } catch (error) {
            console.trace(error);
            console.log(`Erreur dans la méthode updateAdress du adresseController : ${error.message}`);
            res.status(500).json(error.message);
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
            const fullAdresseInDbForId = await Adresse.findOneForUpdate(req.params.id);

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

            console.log("fullAdresseInDbForId => ", fullAdresseInDbForId);

            const adresseInDb = await Adresse.findOne(req.params.id);
            const adresseDelete = await adresseInDb.delete();
            console.log("adresseDelete => ", adresseDelete);


            res.status(200).json({
                message: `l'adresse id ${req.params.id} a bien été supprimé`
            });

        } catch (error) {
            console.trace('Erreur dans la méthode delete du AdresseController :',
                error);
            res.status(500).json(error.message);
        }
    },

    deleteByIdClient: async (req, res) => {

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


            //re.params.id doit valoir l'id d'un client !
            const adressesToDelete = await Adresse.findByIdClientsansJointure(req.params.id);


            if (adressesToDelete === null) {
                return res.status(404).json({
                    message: "Cette adresse n'existe pas."
                })
            };

            if (adressesToDelete[0].idClient !== req.session.user.idClient) {
                return res.status(403).json({
                    message: "Vous n'avez pas les droits pour accéder a cette ressource"
                })
            };

            await adressesToDelete[0].deleteByIdClient();

            //On renvoit au front le tableau des adresse supprimé, peut êytre pas trés utile... avoir..
            res.status(200).json(adressesToDelete);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteByidClient du AdresseController :',
                error);
            res.status(500).json(error.message);
        }
    },


}

module.exports = adresseController;