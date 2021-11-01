const Commande = require('../models/commande');
const Shop = require('../models/shop');
const {
    v4: uuidv4
} = require('uuid');


const fs = require('fs');
const {
    promisify
} = require('util');
const mkdirAsync = promisify(fs.mkdir);
const createWriteStreamAsync = promisify(fs.createWriteStream);
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

const redis = require('../services/redis');


const facture = async (idCommande) => {


    try {


        // Infos du client, de l'adresse du client, de la commande, de ligne_commande, du paiement, des produits, des cararctéristiques, de la TVA, des reductions de produits, 
        let commande;
        //console.log("idCommande == ", idCommande);
        // ICI LE findCommandeFactures VA RECHERCHER QUE LES ADRESSES DÉFINIT POUR LES FACTURATION ! On va chercher les adresses de livraison avec le service textAdresseLivraison 
        try {
            commande = await Commande.findCommandeFactures(idCommande);
        } catch (error) {
            return console.trace('Erreur dans la méthode facture du factureController :',
                error);
        }
        //console.log('commande ==', commande);
        if (commande === null || commande === undefined || commande === []) {
            return console.log('Aucune commande n\'existe pour cet identifiant de commande, dommage.. !');
        }

        let shop;
        try {
            shop = await Shop.findFirst();
        } catch (error) {
            return console.trace('Erreur dans la méthode facture du factureController :',
                error);
        }
        //console.log(shop);


        const nomFacture = `${commande[0].client_nom}_${commande[0].client_prenom}__${commande[0].reference}`;

        // Je m'assure que l'email ne contient pas de slash, je le remplace par un uuid.
        // "/" est un caractére acceptable pour un email, mais ça me "casse" mon chemin. Je remplace donc ce caratére dans le cas ou celui ci serait présent. https://www.rfc-editor.org/rfc/rfc5321  https://www.rfc-editor.org/rfc/rfc5322 ou plus simplement https://en.wikipedia.org/wiki/Email_address#Local-part 
        const email = commande[0].email;
        const emailWithoutSlash = email.replace("/", `${uuidv4()}`); // En partant du principe qu'aucun mail n'existe avec cet uuid... 

        // Email contenant un slash /
        const reg = /\//ig;
        if (reg.test(email)) {
            // Je stocke l'info dans redis pour pouvoir refaire la conversion lorqu'on demandera la facture avec cet email particulier.
            await redis.set(`mada/replaceEmailWithSlashForFacturePath:${email}`, emailWithoutSlash);
        }
        // Je créer un dossier pour ranger ma facture selon le mail du client. J'utilise l'option récursive pour ne pas avoir d'érreur si le dossier "mail" client exite déja.
        fs.mkdir(`./Factures/client:_${emailWithoutSlash}`, {
            recursive: true
        }, (err) => {
            if (err) {
                console.log(`Un érreur est arrivé au cour de la création du nouveau dossier == ./Factures/client:_${emailWithoutSlash} pour ranger les factures !`, err);
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

        const totalProduit = (arrayTotalPrixAvecReduc.reduce(accumulator)) / 100;
        const fraisExpedition = commande[0].frais_expedition / 100;
        const totalHT = totalProduit + fraisExpedition;
        const totalTax = (arrayTotalTax.reduce(accumulator)) / 100;
        const totalTTC = totalHT + totalTax;

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
                                    text: 'Frais d\'expédition',
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

        try {
            pdfDoc.pipe(await createWriteStreamAsync(`Factures/client:_${emailWithoutSlash}/${nomFacture}.pdf`));

        } catch (error) {
            console.trace("Erreur dans le service facture, lors de l'appel de createWriteStreamAsync ", error);
        }
       
        pdfDoc.end();


    } catch (error) {
        return console.trace('Erreur dans le service facture :',
            error);
    }

}

const factureRefund = async (idCommande) => {

    try {

        // Infos du client, de l'adresse du client, de la commande, de ligne_commande, du paiement, des produits, des cararctéristiques, de la TVA, des reductions de produits, 
        let commande;
        // ICI LE findCommandeFactures VA RECHERCHER QUE LES ADRESSES DÉFINIT POUR LES FACTURATION ! On va chercher les adresses de livraison avec le service textAdresseLivraison 
        try {
            commande = await Commande.findCommandeFactures(idCommande);
        } catch (error) {
            return console.trace('Erreur dans la méthode factureRefund du factureController :',
                error);
        }

        if (commande === null || commande === undefined || commande === []) {
            return console.log('Aucune commande n\'existe pour cet identifiant de commande !');
        }

        let shop;
        try {
            shop = await Shop.findFirst();
        } catch (error) {
            return console.trace('Erreur dans la méthode factureRefund du factureController :',
                error);
        }
        //console.log(shop);


        const nomFacture = `${commande[0].client_nom}_${commande[0].client_prenom}__${commande[0].reference}`;
        // Je m'assure que l'email ne contient pas de slash, je le remplace par un uuid.
        // "/" est un caractére acceptable pour un email, mais ça me "casse" mon chemin. Je remplace donc ce caratére dans le cas ou celui ci serait présent. https://www.rfc-editor.org/rfc/rfc5321  https://www.rfc-editor.org/rfc/rfc5322 ou plus simplement https://en.wikipedia.org/wiki/Email_address#Local-part 
        const email = commande[0].email;
        const emailWithoutSlash = email.replace("/", `${uuidv4()}`); // En partant du principe qu'aucun mail n'existe avec cet uuid... 

        // Email contenant un slash /
        const reg = /\//ig;
        if (reg.test(email)) {
            // Je stocke l'info dans redis pour pouvoir refaire la conversion lorqu'on demandera la facture avec cet email particulier.
            await redis.set(`mada/replaceEmailWithSlashForFacturePath:${email}`, emailWithoutSlash);

        }
        // Je créer un dossier pour ranger ma facture selon le mail du client. J'utilise l'option récursive pour ne pas avoir d'érreur si le dossier "mail" client exite déja.
        fs.mkdir(`./Factures/client:_${emailWithoutSlash}`, {
            recursive: true
        }, (err) => {
            if (err) {
                console.log(`Un érreur est arrivé au cour de la création du nouveau dossier == ./Factures/client:_${emailWithoutSlash} pour ranger les factures !`, err);
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

        const totalProduit = (arrayTotalPrixAvecReduc.reduce(accumulator)) / 100;
        const fraisExpedition = commande[0].frais_expedition / 100;
        const totalHT = totalProduit + fraisExpedition;
        const totalTax = (arrayTotalTax.reduce(accumulator)) / 100;
        const totalTTC = totalHT + totalTax;

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
            watermark: {
                text: 'REMBOURSÉE',
                color: 'red',
                opacity: 0.1,
                bold: false,
                italics: false
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
                                                text: 'REMBOURSÉE',
                                                bold: true,
                                                fontSize: 13,
                                                alignment: 'right',
                                                color: 'red',
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
                                    text: 'Frais d\'expédition',
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




    } catch (error) {
        return console.trace('Erreur dans le service factureRefund :',
            error);
    }

}

module.exports = {
    facture,
    factureRefund,
}