const Commande = require('../models/commande');
const Facture = require('../models/facture');
const Shop = require('../models/shop');

const fs = require('fs');
const PdfPrinter = require('pdfmake');
const path = require('path');

const {
    formatJMA,
} = require('../services/date');

const {
    textShopFacture,
    textAdresseLivraison,
    textAdresseFacturation,
    facturePhone
} = require('../services/adresse');


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

            // Infos du client, de l'adresse du client, de la commande, de ligne_commande, du paiement, des produits, des cararctéristiques, de la TVA, des reductions de produits, 
            let commande;
            // ICI LE findCommandeFactures VA RECHERCHER QUE LES ADRESSES DÉFINIT POUR LES FACTURATION ! On va chercher les adresses de livraison avec le service textAdresseLivraison 
            try {
                commande = await Commande.findCommandeFactures(req.params.id);
            } catch (error) {
                console.trace('Erreur dans la méthode facture du factureController :',
                    error);
                res.status(500).end();
            }

            if (commande === null || commande === undefined || commande === []) {
                console.log('Aucune commande n\'existe pour cet identifiant de commande !');
                return res.status(500).json('Aucune commande n\'existe pour cet identifiant de commande !');
            }

            let shop;
            try {
                shop = await Shop.findOne(1);
            } catch (error) {
                console.trace('Erreur dans la méthode facture du factureController :',
                    error);
                res.status(500).end();
            }
            //console.log(shop);


            // Je vérifit que le client qui a passé la commmande et le même en session !!
            if (req.session.user.privilege === "Client" && commande[0].idClient !== req.session.user.idClient) {

                console.log("Vous n'avez pas les droits pour accéder a cette ressource.");
                return res.status(403).end();
            }

            // Maintenant je peux générer mon pdf !


            const nomFacture = `${commande[0].client_nom}_${commande[0].client_prenom}__${commande[0].reference}`;

            // Je m'assure que l'email ne contient pas de slash, je le remplace par une série de tiret sinon.
            const email = commande[0].email;
            const emailWithoutSlash = email.replace("/", "____________________"); // En partant du principe qu'aucun mail ne contient 20 "_". 

            // Je créer un dossier pour ranger ma facture selon le mail du client. J'utilise l'option récursive pour ne pas avoir d'érreur si le dossier "mail" client exite déja.
            fs.mkdir(`./Factures/client:_${emailWithoutSlash}`, {
                recursive: true
            }, (err) => {
                if (err) {
                    console.log(`Un érreur est arrivé au cour de la création du nouveau dossier == ./Factures/client:_${emailWithoutSlash} pour ranger la factures !`, err);
                    return;
                }
            });


            //!Calcul des infos pour la facture :

            // Si pas de réduction, la valeur vaut 0
            for (const item of commande) {

                if (item.reduction === null || item.reduction === undefined) {
                    item.reduction = 0;
                }
            }
            // Calcul des valeurs des totaux.
            // Je n'oubli pas de réafficher les prix unitaires en comprenant de possible réductions...
            commande.map(article => (article.prixHTAvecReduc = parseInt((article.prix_ht) * (1 - article.reduction)), article.montantTax = Math.round(article.prixHTAvecReduc * article.taux)));
            const arrayTotalPrixAvecReduc = [];
            const arrayTotalTax = [];
            commande.map(article => (arrayTotalPrixAvecReduc.push(article.prixHTAvecReduc * article.quantite_commande), arrayTotalTax.push(article.montantTax * article.quantite_commande)));
            const accumulator = (previousValue, currentValue) => previousValue + currentValue;
            console.log(commande);
            //console.log("arrayTotalPrixAvecReduc == ", arrayTotalPrixAvecReduc);
            //console.log("arrayTotalTax == ", arrayTotalTax);

            const totalProduit = (arrayTotalPrixAvecReduc.reduce(accumulator)) / 100;
            const fraisExpedition = commande[0].frais_expedition / 100;
            const totalHT = totalProduit + fraisExpedition;
            const totalTax = (arrayTotalTax.reduce(accumulator)) / 100;
            const totalTTC = totalHT + totalTax;

            //console.log("totalProduit ==", totalProduit);
            //console.log("fraisExpedition == ", fraisExpedition);
            //console.log("totalHT == ", totalHT);
            //console.log("totalTax == ", totalTax);
            //console.log("totalTTC == ",totalTTC);

            // Si retrait sur le stand, on affiche pas d'adresse de livraison !
            let adresseLivraison;
            if (commande[0].idTransporteur === 3) {

                adresseLivraison = `Vous n'avez pas choisi \n de livraison mais un retrait \n sur le stand lors du \n prochain marché.`

            } else {

                adresseLivraison = await textAdresseLivraison(commande[0].idClient);
            }

            const theBody = [
                [{
                        text: 'Produit',
                        fillColor: '#eaf2f5',
                        border: [false, true, false, true],
                        margin: [0, 5, 0, 5],
                        textTransform: 'uppercase',
                    },
                    {
                        text: 'Référence produit',
                        fillColor: '#eaf2f5',
                        border: [false, true, false, true],
                        margin: [0, 5, 0, 5],
                        textTransform: 'uppercase',
                    },
                    {
                        text: 'Taux de taxe',
                        border: [false, true, false, true],
                        alignment: 'right',
                        fillColor: '#eaf2f5',
                        margin: [0, 5, 0, 5],
                        textTransform: 'uppercase',
                    },
                    {
                        text: 'Prix unitaire (HT)',
                        border: [false, true, false, true],
                        alignment: 'right',
                        fillColor: '#eaf2f5',
                        margin: [0, 5, 0, 5],
                        textTransform: 'uppercase',
                    },
                    {
                        text: 'Qté',
                        border: [false, true, false, true],
                        alignment: 'right',
                        fillColor: '#eaf2f5',
                        margin: [0, 5, 0, 5],
                        textTransform: 'uppercase',
                    },
                    {
                        text: 'Total (HT)',
                        border: [false, true, false, true],
                        alignment: 'right',
                        fillColor: '#eaf2f5',
                        margin: [0, 5, 0, 5],
                        textTransform: 'uppercase',
                    },
                ],
            ];

            for (const item of commande) {

                const itemToPush = [{
                        text: item.produit_nom,
                        border: [false, false, false, true],
                        margin: [0, 5, 0, 5],
                        alignment: 'left',
                    },
                    {
                        text: item.id_produit,
                        border: [false, false, false, true],
                        margin: [0, 5, 0, 5],
                        alignment: 'left',
                    },

                    {
                        border: [false, false, false, true],
                        text: `${item.taux*100}%`,
                        fillColor: '#f5f5f5',
                        alignment: 'right',
                        margin: [0, 5, 0, 5],
                    },
                    {
                        border: [false, false, false, true],
                        text: `${item.prixHTAvecReduc/100}€`, // on montre le prix avec reduction fraichement calculée !
                        fillColor: '#f5f5f5',
                        alignment: 'right',
                        margin: [0, 5, 0, 5],
                    },
                    {
                        border: [false, false, false, true],
                        text: item.quantite_commande,
                        fillColor: '#f5f5f5',
                        alignment: 'right',
                        margin: [0, 5, 0, 5],
                    },
                    {
                        border: [false, false, false, true],
                        text: `${(item.quantite_commande*item.prixHTAvecReduc)/100}€`,
                        fillColor: '#f5f5f5',
                        alignment: 'right',
                        margin: [0, 5, 0, 5],
                    },
                ];

                theBody.push(itemToPush);
            };

            const fonts = {
                Roboto: {
                    normal: path.join(__dirname, '..', '..', 'conception', '/fonts/Roboto-Regular.ttf'),
                    bold: path.join(__dirname, '..', '..', 'conception', '/fonts/Roboto-Medium.ttf'),
                    italics: path.join(__dirname, '..', '..', 'conception', '/fonts/Roboto-Italic.ttf'),
                    bolditalics: path.join(__dirname, '..', '..', 'conception', '/fonts/Roboto-MediumItalic.ttf'),
                }
            };

            const printer = new PdfPrinter(fonts);

            var docDefinition = {
                // Si je veux   plus tard, ajouter des headers ou footers...
                header: {
                    columns: [{
                            text: '',
                            style: 'documentHeaderLeft'
                        },
                        {
                            text: '',
                            style: 'documentHeaderCenter'
                        },
                        {
                            text: '',
                            style: 'documentHeaderRight'
                        }
                    ]
                },
                footer: {
                    columns: [{
                            text: '',
                            style: 'documentFooterLeft'
                        },
                        {
                            text: ``,
                            style: 'documentFooterCenter'
                        },
                        {
                            text: '',
                            style: 'documentFooterRight'
                        }
                    ]
                },

                content: [{
                        columns: [{
                                image: 'conception/logo2.jpg',
                                width: 150,
                            },
                            [{
                                    text: 'Facture',
                                    color: '#333333',
                                    width: '*',
                                    fontSize: 30,
                                    bold: true,
                                    alignment: 'right',
                                    margin: [0, 0, 0, 10], // margin: [left, top, right, bottom]

                                },
                                {
                                    stack: [{
                                            columns: [{
                                                    text: 'Facture N° :',
                                                    color: '#aaaaab',
                                                    bold: true,
                                                    width: '*',
                                                    fontSize: 12,
                                                    alignment: 'right',
                                                },
                                                {
                                                    text: `${commande[0].id}`,
                                                    bold: true,
                                                    color: '#333333',
                                                    fontSize: 12,
                                                    alignment: 'right',
                                                    width: 100,
                                                },
                                            ],
                                        },

                                        {
                                            columns: [{
                                                    text: 'Date :',
                                                    color: '#aaaaab',
                                                    bold: true,
                                                    width: '*',
                                                    fontSize: 12,
                                                    alignment: 'right',
                                                },
                                                {
                                                    text: `${formatJMA(commande[0].dateAchat)}`,
                                                    bold: true,
                                                    color: '#333333',
                                                    fontSize: 12,
                                                    alignment: 'right',
                                                    width: 100,
                                                },
                                            ],
                                        },
                                        {
                                            columns: [{
                                                    text: 'Statut :',
                                                    color: '#aaaaab',
                                                    bold: true,
                                                    fontSize: 12,
                                                    alignment: 'right',
                                                    width: '*',
                                                },
                                                {
                                                    text: 'PAYÉ',
                                                    bold: true,
                                                    fontSize: 18,
                                                    alignment: 'right',
                                                    color: 'green',
                                                    width: 100,
                                                },
                                            ],
                                        },
                                        {
                                            columns: [{
                                                    text: 'Transporteur :',
                                                    color: '#aaaaab',
                                                    bold: true,
                                                    fontSize: 12,
                                                    alignment: 'right',
                                                    width: '*',
                                                },
                                                {
                                                    text: `${commande[0].transporteur}`,
                                                    bold: false,
                                                    alignment: 'right',
                                                    width: 100,
                                                },
                                            ],
                                        },
                                        {
                                            columns: [{
                                                    text: 'Moyen de paiement :',
                                                    color: '#aaaaab',
                                                    bold: true,
                                                    fontSize: 12,
                                                    alignment: 'right',
                                                    width: '*',
                                                },
                                                {
                                                    text: `${commande[0].moyenPaiement}`,
                                                    bold: false,
                                                    alignment: 'right',
                                                    width: 100,
                                                },
                                            ],
                                        },

                                    ],
                                },
                            ],
                        ],
                    },
                    '\n\n',
                    {
                        columns: [{
                                text: `${shop.nom}`,
                                bold: true,
                                fontSize: 16,
                                alignment: 'left',
                                margin: [0, 0, 0, 5],
                            },
                            {
                                text: 'Adresse de livraison',
                                color: '#aaaaab',
                                bold: true,
                                fontSize: 14,
                                alignment: 'left',
                                margin: [0, 20, 0, 5],
                            },
                            {
                                text: 'Adresse de facturation',
                                color: '#aaaaab',
                                bold: true,
                                fontSize: 14,
                                alignment: 'left',
                                margin: [0, 20, 0, 5],
                            },
                        ],
                    },

                    {
                        columns: [{
                                text: await textShopFacture(),
                                bold: true,
                                color: '#333333',
                                alignment: 'left',

                            },
                            {
                                text: adresseLivraison,
                                bold: true,
                                color: '#333333',
                                alignment: 'left',
                            },
                            {
                                text: await textAdresseFacturation(commande[0].idClient),
                                bold: true,
                                color: '#333333',
                                alignment: 'left',
                            },
                        ],
                    },
                    '\n\n',
                    {
                        width: '100%',
                        alignment: 'left',
                        text: `Facture N°${commande[0].id} / Commande référence : ${commande[0].reference}`,
                        bold: true,
                        margin: [0, 10, 0, 10],
                        fontSize: 13,
                    },
                    {
                        layout: {
                            defaultBorder: false,
                            hLineWidth: function (i, node) {
                                return 1;
                            },
                            vLineWidth: function (i, node) {
                                return 1;
                            },
                            hLineColor: function (i, node) {
                                if (i === 1 || i === 0) {
                                    return '#bfdde8';
                                }
                                return '#eaeaea';
                            },
                            vLineColor: function (i, node) {
                                return '#eaeaea';
                            },
                            hLineStyle: function (i, node) {
                                // if (i === 0 || i === node.table.body.length) {
                                return null;
                                //}
                            },
                            // vLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
                            paddingLeft: function (i, node) {
                                return 10;
                            },
                            paddingRight: function (i, node) {
                                return 10;
                            },
                            paddingTop: function (i, node) {
                                return 2;
                            },
                            paddingBottom: function (i, node) {
                                return 2;
                            },
                            fillColor: function (rowIndex, node, columnIndex) {
                                return '#fff';
                            },
                        },
                        table: {
                            headerRows: 1,
                            widths: ['*', 54, 50, 80, 30, 50],
                            body: theBody,
                        },
                    },
                    '\n',

                    {
                        layout: {
                            defaultBorder: false,
                            hLineWidth: function (i, node) {
                                return 1;
                            },
                            vLineWidth: function (i, node) {
                                return 1;
                            },
                            hLineColor: function (i, node) {
                                return '#eaeaea';
                            },
                            vLineColor: function (i, node) {
                                return '#eaeaea';
                            },
                            hLineStyle: function (i, node) {
                                // if (i === 0 || i === node.table.body.length) {
                                return null;
                                //}
                            },
                            // vLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
                            paddingLeft: function (i, node) {
                                return 10;
                            },
                            paddingRight: function (i, node) {
                                return 10;
                            },
                            paddingTop: function (i, node) {
                                return 3;
                            },
                            paddingBottom: function (i, node) {
                                return 3;
                            },
                            fillColor: function (rowIndex, node, columnIndex) {
                                return '#fff';
                            },
                        },
                        table: {
                            headerRows: 1,
                            alignment: 'right',
                            widths: ['*', 90, 60],
                            body: [
                                [{
                                        text: '',
                                        border: [false, false, false, false],
                                        alignment: 'right',
                                        margin: [0, 5, 0, 5],
                                    }, {
                                        text: 'Total produits',
                                        border: [false, true, false, true],
                                        alignment: 'right',
                                        margin: [0, 5, 0, 5],
                                    },
                                    {
                                        border: [false, true, false, true],
                                        text: `${totalProduit}€`,
                                        alignment: 'right',
                                        fillColor: '#f5f5f5',
                                        margin: [0, 5, 0, 5],
                                    },
                                ],
                                [{
                                        text: '',
                                        border: [false, false, false, false],
                                        alignment: 'right',
                                        margin: [0, 5, 0, 5],
                                    }, {
                                        text: 'Frais d\expédition',
                                        border: [false, true, false, true],
                                        alignment: 'right',
                                        margin: [0, 5, 0, 5],
                                    },
                                    {
                                        border: [false, true, false, true],
                                        text: `${fraisExpedition}€`,
                                        alignment: 'right',
                                        fillColor: '#f5f5f5',
                                        margin: [0, 5, 0, 5],
                                    },
                                ],
                                [{
                                        text: '',
                                        border: [false, false, false, false],
                                        alignment: 'right',
                                        margin: [0, 5, 0, 5],
                                    }, {
                                        text: 'Total (HT)',
                                        border: [false, false, false, true],
                                        alignment: 'right',
                                        margin: [0, 5, 0, 5],
                                    },
                                    {
                                        text: `${totalHT}€`,
                                        border: [false, false, false, true],
                                        fillColor: '#f5f5f5',
                                        alignment: 'right',
                                        margin: [0, 5, 0, 5],
                                    },
                                ],
                                [{
                                        text: '',
                                        border: [false, false, false, false],
                                        alignment: 'right',
                                        margin: [0, 5, 0, 5],
                                    }, {
                                        text: 'Total Taxes',
                                        alignment: 'right',
                                        border: [false, false, false, true],
                                        margin: [0, 5, 0, 5],
                                    },
                                    {
                                        text: `${totalTax}€`,
                                        alignment: 'right',
                                        border: [false, false, false, true],
                                        fillColor: '#f5f5f5',
                                        margin: [0, 5, 0, 5],
                                    },
                                ],
                                [{
                                        text: '',
                                        border: [false, false, false, false],
                                        alignment: 'right',
                                        margin: [0, 5, 0, 5],
                                    }, {
                                        text: 'Total TTC',
                                        bold: true,
                                        fontSize: 12,
                                        alignment: 'right',
                                        border: [false, false, false, true],
                                        margin: [0, 5, 0, 5],
                                    },
                                    {
                                        text: `${totalTTC}€`,
                                        bold: true,
                                        fontSize: 12,
                                        alignment: 'right',
                                        border: [false, false, false, true],
                                        fillColor: '#f5f5f5',
                                        margin: [0, 5, 0, 5],
                                    },
                                ],
                            ],
                        },
                    },
                    '\n',
                    {
                        text: `Pour toute assistance, merci de nous contacter par téléphone : ${facturePhone(shop.telephone)}  ou par email : ${shop.emailContact}`,
                        style: 'notesTitle',
                    },

                ],
                styles: {
                    notesTitle: {
                        fontSize: 10,
                        alignment: 'center',
                        bold: true,
                        margin: [0, 8, 0, 2], // margin: [left, top, right, bottom]
                    },
                    notesText: {
                        fontSize: 10,
                    },
                },
                defaultStyle: {
                    columnGap: 10,
                    //font: 'Quicksand',
                },


            };

            const options = {
                // ...
            }

            const pdfDoc = printer.createPdfKitDocument(docDefinition);
            pdfDoc.pipe(fs.createWriteStream(`Factures/client:_${emailWithoutSlash}/${nomFacture}.pdf`));
            pdfDoc.end();




            res.status(200).end();
        } catch (error) {
            console.trace('Erreur dans la méthode facture du factureController :',
                error);
            res.status(500).json(error.message);
        }
    },


    getFacture: async (req, res) => {
        try {
            // Attend un req.body.idCommande

            let commande;

            try {
                commande = await Commande.findOneWithClient(req.body.idCommande) // les commandes avec statut : en attente ou annulée ne seront pas selectionné.
            } catch (error) {
                console.trace('Erreur dans la méthode getFacture du factureController, pour la recherche de la commande :',
                    error);
                return res.status(500).end();
            }


            if (commande === null || commande === undefined) {

                console.log("Aucune commande n'existe avec cet identifiant de commande.");
                return res.status(200).json("Aucune commande n'existe avec cet identifiant de commande.");
            }

            if ((req.session.user.privilege === 'Client') && (req.session.user.idClient !== commande.idClient)) {
                console.log("Vous n'avez pas les droit pour accéder a ala ressource.");
                return res.status(403).json("Vous n'avez pas les droit pour accéder a ala ressource.");
            }

            // Je me prémuni des email avec des slash qui pourrait court-circuiter mon chemin d'accés. Remplacement des / par des __ 
            const email = commande.email;
            const emailWithoutSlash = email.replace("/", "____________________"); // En partant du principe qu'aucun mail ne contient 20 "_". 

            res.sendFile(path.resolve(__dirname + `../../../Factures/client:_${emailWithoutSlash}/${commande.nomFamille}_${commande.prenom}__${commande.reference}.pdf`));
            res.setHeader('Content-type', 'application/pdf');


        } catch (error) {
            console.trace('Erreur dans la méthode getFacture du factureController :',
                error);
            res.status(500).end();
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