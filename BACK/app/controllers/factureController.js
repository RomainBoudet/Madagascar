const Commande = require('../models/commande');
const Facture = require('../models/facture');
const fs = require('fs');
const PdfPrinter = require('pdfmake');
const path = require('path');

const {
    formatLong,
    formatJMAHMSsecret,
    formatCoupon,
    formatLongSeconde,
    dayjs,
    formatLongSansHeure,
    addWeekdays,
} = require('../services/date');



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


    facture: async (req, res) => {
        try {

            // Infos du client, de l'adresse du client, de la commande, de ligne_commande, du paiement, des produits, des cararctéristiques, 
            let commande;

            try {
                commande = await Commande.findCommandeFactures(req.params.id);
                console.log(commande);
            } catch (error) {
                console.trace('Erreur dans la méthode facture du factureController :',
                    error);
                res.status(500).end();
            }

            /* [
  Commande {
    id: 500,
    reference: 'COMMANDE/0f75bcbd-b997-418d-a33b-8ef68c16bea3 ',
    dateAchat: 2021-10-02T20:01:27.133Z,
    commentaire: 'ratione recusandae temporibus',
    sendSmsShipping: false,
    updatedDate: null,
    idCommandeStatut: 2,
    idClient: 93,
    idTransporteur: 2,
    produit_nom: 'Awesome Fresh Shoes',
    couleur: 'violet',
    taille: 'XS',
    quantite_commande: 2,
    prix_ht: 4400,
    taux: 0.05,
    idclient: 93,
    client_nom: 'Morin',
    client_prenom: 'Vianney',
    email: '93Clotaire51@gmail.com',
    adresse_prenom: 'Vianney',
    adresse_nomfamille: 'Morin',
    adresse1: '37 Passage Roux de Tilsitt ',
    adresse2: null,
    adresse3: null,
    codepostal: 28823,
    ville: 'Simonview',
    pays: 'Libye',
    telephone: '+33596781196',
    transporteur: 'TNT'
  }, */

            // Je vérifit que le client qui a passé la commmande et le même en session !!
            if (req.session.user.privilege === "Client" && commande.idClient !== req.session.user.idClient) {

                console.log("Vous n'avez pas les droits pour accéder a cette ressource.");
                return res.status(403).end();
            }

            // Maintenant je peux générer mon pdf !
            //! a intégrer !!
            const articles = [];
            commande.map(article => (`${articles.push(article.id_produit+"-"+article.quantite_commande)}`));
            articlesBought = articles.join('-');
            const referenceFacture = `${commande[0].idClient}-${commande[0].montant}-${formatJMAHMSsecret(new Date())}-${articlesBought}`;

            console.log("referenceFacture == ", referenceFacture);

            var fonts = {
                Roboto: {
                    normal: path.join(__dirname, '..', '..', 'conception', '/fonts/Roboto-Regular.ttf'),
                    bold: path.join(__dirname, '..', '..', 'conception', '/fonts/Roboto-Medium.ttf'),
                    italics: path.join(__dirname, '..', '..', 'conception', '/fonts/Roboto-Italic.ttf'),
                    bolditalics: path.join(__dirname, '..', '..', 'conception', '/fonts/Roboto-MediumItalic.ttf'),
                }
            };

            var printer = new PdfPrinter(fonts);

            var docDefinition = {

                content: [
                    'First paragraph',
                    'Another paragraph, this time a little bit longer to make sure, this line will be divided into at least two lines'
                ]


                // ...
            };

            var options = {
                // ...
            }

            var pdfDoc = printer.createPdfKitDocument(docDefinition);
            pdfDoc.pipe(fs.createWriteStream(`Factures/${referenceFacture}.pdf`));
            pdfDoc.end();


           

            res.status(200).end();
        } catch (error) {
            console.trace('Erreur dans la méthode getAll du factureController :',
                error);
            res.status(500).json(error.message);
        }
    },

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

            if (Object.keys(req.body).length === 0) {
                return res.status(200).json({
                    message: 'Vous n\'avez envoyé aucune données à modifier.'
                });
            }

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
                message.idClient = 'Votre idClient n\'a pas changé';
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
            console.trace('Erreur dans la méthode deleteUByIdClient du factureController :',
                error);
            res.status(500).json(error.message);
        }
    },


}

module.exports = factureController;