const Commande = require('../models/commande');
const Facture = require('../models/facture');
const fs = require('fs');
const PdfPrinter = require('pdfmake');
const path = require('path');

const {
    formatLong,
    formatJMAHMSsecret,
    formatJMA,
    formatCoupon,
    formatLongSeconde,
    dayjs,
    formatLongSansHeure,
    addWeekdays,
    formatJMATiret,
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
            // ICI LE findCommandeFactures VA RECHERCHER QUE LES ADRESSES DÉFINIT POUR LES FACTURATION !
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
    produit_nom: 'Unbranded Soft Shoes',
    couleur: 'bleu',
    taille: 'M',
    montant: 254,
    quantite_commande: 2,
    id_produit: 96,
    prix_ht: 8300,
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
  }
], */

            // Je vérifit que le client qui a passé la commmande et le même en session !!
            if (req.session.user.privilege === "Client" && commande.idClient !== req.session.user.idClient) {

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
                            text: '',
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
                                    fontSize: 28,
                                    bold: true,
                                    alignment: 'right',
                                    margin: [0, 0, 0, 15],
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
                                                    text: '00001',
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
                                                    text: 'June 01, 2016',
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
                                                    fontSize: 14,
                                                    alignment: 'right',
                                                    color: 'green',
                                                    width: 100,
                                                },
                                            ],
                                        },
                                        {
                                            columns: [{
                                                    text: 'Référence de commande :',
                                                    color: '#aaaaab',
                                                    bold: true,
                                                    fontSize: 12,
                                                    alignment: 'right',
                                                    width: '*',
                                                },
                                                {
                                                    text: '125.12556566.654.15.23',
                                                    bold: true,
                                                    fontSize: 10,
                                                    alignment: 'right',
                                                    color: 'blue',
                                                    width: 100,
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        ],
                    },
                    {
                        columns: [{
                                text: '',
                                color: '#aaaaab',
                                bold: true,
                                fontSize: 14,
                                alignment: 'left',
                                margin: [0, 20, 0, 5],
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
                                text: 'Nom du shop \n Adresse du Shop, ligne 1. \n Adresse du shop ligne 2',
                                bold: true,
                                color: '#333333',
                                alignment: 'left',
                            },
                            {
                                text: 'Nom du client \n adresse du client livraison ligne 1 \n Adresse du client livraison ligne 2 \n Adresse du client livraison ligne 3',
                                bold: true,
                                color: '#333333',
                                alignment: 'left',
                            },
                            {
                                text: 'Nom du client \n adresse du client facturation ligne 1 \n Adresse du client facturation ligne 2 \n Adresse du client facturation ligne 3',
                                bold: true,
                                color: '#333333',
                                alignment: 'left',
                            },
                        ],
                    },
                    '\n\n',
                    {
                        width: '100%',
                        alignment: 'center',
                        text: 'Facture N° 123',
                        bold: true,
                        margin: [0, 10, 0, 10],
                        fontSize: 15,
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
                            widths: ['*', 80, 80],
                            body: [
                                [{
                                        text: 'ITEM DESCRIPTION',
                                        fillColor: '#eaf2f5',
                                        border: [false, true, false, true],
                                        margin: [0, 5, 0, 5],
                                        textTransform: 'uppercase',
                                    },
                                    {
                                        text: 'ITEM DESCRIPTION',
                                        fillColor: '#eaf2f5',
                                        border: [false, true, false, true],
                                        margin: [0, 5, 0, 5],
                                        textTransform: 'uppercase',
                                    },
                                    {
                                        text: 'ITEM TOTAL',
                                        border: [false, true, false, true],
                                        alignment: 'right',
                                        fillColor: '#eaf2f5',
                                        margin: [0, 5, 0, 5],
                                        textTransform: 'uppercase',
                                    },
                                ],
                                [{
                                        text: 'Item 1',
                                        border: [false, false, false, true],
                                        margin: [0, 5, 0, 5],
                                        alignment: 'left',
                                    },
                                    {
                                        text: 'Item 144',
                                        border: [false, false, false, true],
                                        margin: [0, 5, 0, 5],
                                        alignment: 'left',
                                    },
                                    {
                                        border: [false, false, false, true],
                                        text: '$999.99',
                                        fillColor: '#f5f5f5',
                                        alignment: 'right',
                                        margin: [0, 5, 0, 5],
                                    },
                                ],
                                [{
                                        text: 'Item 2',
                                        border: [false, false, false, true],
                                        margin: [0, 5, 0, 5],
                                        alignment: 'left',
                                    },
                                    {
                                        text: 'Item 144',
                                        border: [false, false, false, true],
                                        margin: [0, 5, 0, 5],
                                        alignment: 'left',
                                    },
                                    {
                                        text: '$999.99',
                                        border: [false, false, false, true],
                                        fillColor: '#f5f5f5',
                                        alignment: 'right',
                                        margin: [0, 5, 0, 5],
                                    },
                                ],
                            ],
                        },
                    },
                    '\n',
                    '\n\n',
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
                            widths: ['*', 'auto'],
                            body: [
                                [{
                                        text: 'Payment Subtotal1',
                                        border: [false, true, false, true],
                                        alignment: 'right',
                                        margin: [0, 5, 0, 5],
                                    },
                                    {
                                        border: [false, true, false, true],
                                        text: '$999.991',
                                        alignment: 'right',
                                        fillColor: '#f5f5f5',
                                        margin: [0, 5, 0, 5],
                                    },
                                ],
                                [{
                                        text: 'Payment Subtotal',
                                        border: [false, true, false, true],
                                        alignment: 'right',
                                        margin: [0, 5, 0, 5],
                                    },
                                    {
                                        border: [false, true, false, true],
                                        text: '$999.99',
                                        alignment: 'right',
                                        fillColor: '#f5f5f5',
                                        margin: [0, 5, 0, 5],
                                    },
                                ],
                                [{
                                        text: 'Payment Processing Fee',
                                        border: [false, false, false, true],
                                        alignment: 'right',
                                        margin: [0, 5, 0, 5],
                                    },
                                    {
                                        text: '$999.99',
                                        border: [false, false, false, true],
                                        fillColor: '#f5f5f5',
                                        alignment: 'right',
                                        margin: [0, 5, 0, 5],
                                    },
                                ],
                                [{
                                        text: 'Total Amount',
                                        bold: true,
                                        fontSize: 20,
                                        alignment: 'right',
                                        border: [false, false, false, true],
                                        margin: [0, 5, 0, 5],
                                    },
                                    {
                                        text: 'USD $999.99',
                                        bold: true,
                                        fontSize: 20,
                                        alignment: 'right',
                                        border: [false, false, false, true],
                                        fillColor: '#f5f5f5',
                                        margin: [0, 5, 0, 5],
                                    },
                                ],
                            ],
                        },
                    },
                    '\n\n',
                    {
                        text: 'NOTES',
                        style: 'notesTitle',
                    },
                    {
                        text: 'Some notes goes here \n Notes second line',
                        style: 'notesText',
                    },
                ],
                styles: {
                    notesTitle: {
                        fontSize: 10,
                        bold: true,
                        margin: [0, 50, 0, 3],
                    },
                    notesText: {
                        fontSize: 10,
                    },
                },
                defaultStyle: {
                    columnGap: 20,
                    //font: 'Quicksand',
                },


                /*  header: {
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
                                            text: '',
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
                                                    fontSize: 28,
                                                    bold: true,
                                                    alignment: 'right',
                                                    margin: [0, 0, 0, 15],
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
                                                                    text: '00001',
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
                                                                    text: 'June 01, 2016',
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
                                                                    fontSize: 14,
                                                                    alignment: 'right',
                                                                    color: 'green',
                                                                    width: 100,
                                                                },
                                                            ],
                                                        },
                                                    ],
                                                },
                                            ],
                                        ],
                                    },
                                    {
                                        columns: [{
                                                text: 'From',
                                                color: '#aaaaab',
                                                bold: true,
                                                fontSize: 14,
                                                alignment: 'left',
                                                margin: [0, 20, 0, 5],
                                            },
                                            {
                                                text: 'To',
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
                                                text: 'Your Name \n Your Company Inc.',
                                                bold: true,
                                                color: '#333333',
                                                alignment: 'left',
                                            },
                                            {
                                                text: 'Client Name \n Client Company',
                                                bold: true,
                                                color: '#333333',
                                                alignment: 'left',
                                            },
                                        ],
                                    },
                                    {
                                        columns: [{
                                                text: 'Address',
                                                color: '#aaaaab',
                                                bold: true,
                                                margin: [0, 7, 0, 3],
                                            },
                                            {
                                                text: 'Address',
                                                color: '#aaaaab',
                                                bold: true,
                                                margin: [0, 7, 0, 3],
                                            },
                                        ],
                                    },
                                    {
                                        columns: [{
                                                text: '9999 Street name 1A \n New-York City NY 00000 \n   USA',
                                                style: 'invoiceBillingAddress',
                                            },
                                            {
                                                text: '1111 Other street 25 \n New-York City NY 00000 \n   USA',
                                                style: 'invoiceBillingAddress',
                                            },
                                        ],
                                    },
                                    '\n\n',
                                    {
                                        width: '100%',
                                        alignment: 'center',
                                        text: 'Invoice No. 123',
                                        bold: true,
                                        margin: [0, 10, 0, 10],
                                        fontSize: 15,
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
                                            widths: ['*', 80],
                                            body: [
                                                [{
                                                        text: 'ITEM DESCRIPTION',
                                                        fillColor: '#eaf2f5',
                                                        border: [false, true, false, true],
                                                        margin: [0, 5, 0, 5],
                                                        textTransform: 'uppercase',
                                                    },
                                                    {
                                                        text: 'ITEM TOTAL',
                                                        border: [false, true, false, true],
                                                        alignment: 'right',
                                                        fillColor: '#eaf2f5',
                                                        margin: [0, 5, 0, 5],
                                                        textTransform: 'uppercase',
                                                    },
                                                ],
                                                [{
                                                        text: 'Item 1',
                                                        border: [false, false, false, true],
                                                        margin: [0, 5, 0, 5],
                                                        alignment: 'left',
                                                    },
                                                    {
                                                        border: [false, false, false, true],
                                                        text: '$999.99',
                                                        fillColor: '#f5f5f5',
                                                        alignment: 'right',
                                                        margin: [0, 5, 0, 5],
                                                    },
                                                ],
                                                [{
                                                        text: 'Item 2',
                                                        border: [false, false, false, true],
                                                        margin: [0, 5, 0, 5],
                                                        alignment: 'left',
                                                    },
                                                    {
                                                        text: '$999.99',
                                                        border: [false, false, false, true],
                                                        fillColor: '#f5f5f5',
                                                        alignment: 'right',
                                                        margin: [0, 5, 0, 5],
                                                    },
                                                ],
                                            ],
                                        },
                                    },
                                    '\n',
                                    '\n\n',
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
                                            widths: ['*', 'auto'],
                                            body: [
                                                [{
                                                        text: 'Payment Subtotal',
                                                        border: [false, true, false, true],
                                                        alignment: 'right',
                                                        margin: [0, 5, 0, 5],
                                                    },
                                                    {
                                                        border: [false, true, false, true],
                                                        text: '$999.99',
                                                        alignment: 'right',
                                                        fillColor: '#f5f5f5',
                                                        margin: [0, 5, 0, 5],
                                                    },
                                                ],
                                                [{
                                                        text: 'Payment Processing Fee',
                                                        border: [false, false, false, true],
                                                        alignment: 'right',
                                                        margin: [0, 5, 0, 5],
                                                    },
                                                    {
                                                        text: '$999.99',
                                                        border: [false, false, false, true],
                                                        fillColor: '#f5f5f5',
                                                        alignment: 'right',
                                                        margin: [0, 5, 0, 5],
                                                    },
                                                ],
                                                [{
                                                        text: 'Total Amount',
                                                        bold: true,
                                                        fontSize: 20,
                                                        alignment: 'right',
                                                        border: [false, false, false, true],
                                                        margin: [0, 5, 0, 5],
                                                    },
                                                    {
                                                        text: 'USD $999.99',
                                                        bold: true,
                                                        fontSize: 20,
                                                        alignment: 'right',
                                                        border: [false, false, false, true],
                                                        fillColor: '#f5f5f5',
                                                        margin: [0, 5, 0, 5],
                                                    },
                                                ],
                                            ],
                                        },
                                    },
                                    '\n\n',
                                    {
                                        text: 'NOTES',
                                        style: 'notesTitle',
                                    },
                                    {
                                        text: 'Some notes goes here \n Notes second line',
                                        style: 'notesText',
                                    },
                                ],
                                styles: {
                                    notesTitle: {
                                        fontSize: 10,
                                        bold: true,
                                        margin: [0, 50, 0, 3],
                                    },
                                    notesText: {
                                        fontSize: 10,
                                    },
                                },
                                defaultStyle: {
                                    columnGap: 20,
                                    //font: 'Quicksand',
                                }, */


                /* content: [
                        // Header
                        {
                            columns: [
                                {
                                    image: 'data:image/png;base64,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',
                                    width: 150
                                },
                                    
                                [
                                    {
                                        text: 'INVOICE', 
                                        style: 'invoiceTitle',
                                        width: '*'
                                    },
                                    {
                                      stack: [
                                           {
                                               columns: [
                                                    {
                                                        text:'Invoice #', 
                                                        style:'invoiceSubTitle',
                                                        width: '*'
                                                        
                                                    }, 
                                                    {
                                                        text:'00001',
                                                        style:'invoiceSubValue',
                                                        width: 100
                                                        
                                                    }
                                                    ]
                                           },
                                           {
                                               columns: [
                                                   {
                                                       text:'Date Issued',
                                                       style:'invoiceSubTitle',
                                                       width: '*'
                                                   }, 
                                                   {
                                                       text:'June 01, 2016',
                                                       style:'invoiceSubValue',
                                                       width: 100
                                                   }
                                                   ]
                                           },
                                           {
                                               columns: [
                                                   {
                                                       text:'Due Date',
                                                       style:'invoiceSubTitle',
                                                       width: '*'
                                                   }, 
                                                   {
                                                       text:'June 05, 2016',
                                                       style:'invoiceSubValue',
                                                       width: 100
                                                   }
                                                   ]
                                           },
                                       ]
                                    }
                                ],
                            ],
                        },
                        // Billing Headers
                        {
                            columns: [
                                {
                                    text: 'Billing From',
                                    style:'invoiceBillingTitle',
                                    
                                },
                                {
                                    text: 'Billing To',
                                    style:'invoiceBillingTitle',
                                    
                                },
                            ]
                        },
                        // Billing Details
                        {
                            columns: [
                                {
                                    text: 'Your Name \n Your Company Inc.',
                                    style: 'invoiceBillingDetails'
                                },
                                {
                                    text: 'Client Name \n Client Company',
                                    style: 'invoiceBillingDetails'
                                },
                            ]
                        },
                        // Billing Address Title
                        {
                            columns: [
                                {
                                    text: 'Address',
                                    style: 'invoiceBillingAddressTitle'
                                },
                                {
                                    text: 'Address',
                                    style: 'invoiceBillingAddressTitle'
                                },
                            ]
                        },
                        // Billing Address
                        {
                            columns: [
                                {
                                    text: '9999 Street name 1A \n New-York City NY 00000 \n   USA',
                                    style: 'invoiceBillingAddress'
                                },
                                {
                                    text: '1111 Other street 25 \n New-York City NY 00000 \n   USA',
                                    style: 'invoiceBillingAddress'
                                },
                            ]
                        },
                        // Line breaks
                        '\n\n',
                        // Items
                        {
                          table: {
                            // headers are automatically repeated if the table spans over multiple pages
                            // you can declare how many rows should be treated as headers
                            headerRows: 1,
                            widths: [ '*', 40, 'auto', 40, 'auto', 80 ],
                    
                            body: [
                              // Table Header
                              [ 
                                  {
                                      text: 'Product',
                                      style: 'itemsHeader'
                                  }, 
                                  {
                                      text: 'Qty',
                                      style: [ 'itemsHeader', 'center']
                                  }, 
                                  {
                                      text: 'Price',
                                      style: [ 'itemsHeader', 'center']
                                  }, 
                                  {
                                      text: 'Tax',
                                      style: [ 'itemsHeader', 'center']
                                  }, 
                                  {
                                      text: 'Discount',
                                      style: [ 'itemsHeader', 'center']
                                  }, 
                                  {
                                      text: 'Total',
                                      style: [ 'itemsHeader', 'center']
                                  } 
                              ],
                              // Items
                              // Item 1
                              [ 
                                  [
                                      {
                                          text: 'Item 1',
                                          style:'itemTitle'
                                      },
                                      {
                                          text: 'Item Description',
                                          style:'itemSubTitle'
                                          
                                      }
                                  ], 
                                  {
                                      text:'1',
                                      style:'itemNumber'
                                  }, 
                                  {
                                      text:'$999.99',
                                      style:'itemNumber'
                                  }, 
                                  {
                                      text:'0%',
                                      style:'itemNumber'
                                  }, 
                                  {
                                      text: '0%',
                                      style:'itemNumber'
                                  },
                                  {
                                      text: '$999.99',
                                      style:'itemTotal'
                                  } 
                              ],
                              // Item 2
                              [ 
                                  [
                                      {
                                          text: 'Item 2',
                                          style:'itemTitle'
                                      }, 
                                      {
                                          text: 'Item Description',
                                          style:'itemSubTitle'
                                          
                                      }
                                  ], 
                                  {
                                      text:'1',
                                      style:'itemNumber'
                                  }, 
                                  {
                                      text:'$999.99',
                                      style:'itemNumber'
                                  }, 
                                  {
                                      text:'0%',
                                      style:'itemNumber'
                                  }, 
                                  {
                                      text: '0%',
                                      style:'itemNumber'
                                  },
                                  {
                                      text: '$999.99',
                                      style:'itemTotal'
                                  } 
                              ],
                              // END Items
                            ]
                          }, // table
                        //  layout: 'lightHorizontalLines'
                        },
                     // TOTAL
                        {
                          table: {
                            // headers are automatically repeated if the table spans over multiple pages
                            // you can declare how many rows should be treated as headers
                            headerRows: 0,
                            widths: [ '*', 80 ],
                    
                            body: [
                              // Total
                              [ 
                                  {
                                      text:'Subtotal',
                                      style:'itemsFooterSubTitle'
                                  }, 
                                  { 
                                      text:'$2000.00',
                                      style:'itemsFooterSubValue'
                                  }
                              ],
                              [ 
                                  {
                                      text:'Tax 21%',
                                      style:'itemsFooterSubTitle'
                                  },
                                  {
                                      text: '$523.13',
                                      style:'itemsFooterSubValue'
                                  }
                              ],
                              [ 
                                  {
                                      text:'TOTAL',
                                      style:'itemsFooterTotalTitle'
                                  }, 
                                  {
                                      text: '$2523.93',
                                      style:'itemsFooterTotalValue'
                                  }
                              ],
                            ]
                          }, // table
                          layout: 'lightHorizontalLines'
                        },
                        // Signature
                        {
                            columns: [
                                {
                                    text:'',
                                },
                                {
                                    stack: [
                                        { 
                                            text: '_________________________________',
                                            style:'signaturePlaceholder'
                                        },
                                        { 
                                            text: 'Your Name',
                                            style:'signatureName'
                                            
                                        },
                                        { 
                                            text: 'Your job title',
                                            style:'signatureJobTitle'
                                            
                                        }
                                        ],
                                   width: 180
                                },
                            ]
                        },
                        { 
                            text: 'NOTES',
                            style:'notesTitle'
                        },
                        { 
                            text: 'Some notes goes here \n Notes second line',
                            style:'notesText'
                        }
                    ],
                    styles: {
                        // Document Header
                        documentHeaderLeft: {
                            fontSize: 10,
                            margin: [5,5,5,5],
                            alignment:'left'
                        },
                        documentHeaderCenter: {
                            fontSize: 10,
                            margin: [5,5,5,5],
                            alignment:'center'
                        },
                        documentHeaderRight: {
                            fontSize: 10,
                            margin: [5,5,5,5],
                            alignment:'right'
                        },
                        // Document Footer
                        documentFooterLeft: {
                            fontSize: 10,
                            margin: [5,5,5,5],
                            alignment:'left'
                        },
                        documentFooterCenter: {
                            fontSize: 10,
                            margin: [5,5,5,5],
                            alignment:'center'
                        },
                        documentFooterRight: {
                            fontSize: 10,
                            margin: [5,5,5,5],
                            alignment:'right'
                        },
                        // Invoice Title
                        invoiceTitle: {
                            fontSize: 22,
                            bold: true,
                            alignment:'right',
                            margin:[0,0,0,15]
                        },
                        // Invoice Details
                        invoiceSubTitle: {
                            fontSize: 12,
                            alignment:'right'
                        },
                        invoiceSubValue: {
                            fontSize: 12,
                            alignment:'right'
                        },
                        // Billing Headers
                        invoiceBillingTitle: {
                            fontSize: 14,
                            bold: true,
                            alignment:'left',
                            margin:[0,20,0,5],
                        },
                        // Billing Details
                        invoiceBillingDetails: {
                            alignment:'left'
                
                        },
                        invoiceBillingAddressTitle: {
                            margin: [0,7,0,3],
                            bold: true
                        },
                        invoiceBillingAddress: {
                            
                        },
                        // Items Header
                        itemsHeader: {
                            margin: [0,5,0,5],
                            bold: true
                        },
                        // Item Title
                        itemTitle: {
                            bold: true,
                        },
                        itemSubTitle: {
                            italics: true,
                            fontSize: 11
                        },
                        itemNumber: {
                            margin: [0,5,0,5],
                            alignment: 'center',
                        },
                        itemTotal: {
                            margin: [0,5,0,5],
                            bold: true,
                            alignment: 'center',
                        },
                
                        // Items Footer (Subtotal, Total, Tax, etc)
                        itemsFooterSubTitle: {
                            margin: [0,5,0,5],
                            bold: true,
                            alignment:'right',
                        },
                        itemsFooterSubValue: {
                            margin: [0,5,0,5],
                            bold: true,
                            alignment:'center',
                        },
                        itemsFooterTotalTitle: {
                            margin: [0,5,0,5],
                            bold: true,
                            alignment:'right',
                        },
                        itemsFooterTotalValue: {
                            margin: [0,5,0,5],
                            bold: true,
                            alignment:'center',
                        },
                        signaturePlaceholder: {
                            margin: [0,70,0,0],   
                        },
                        signatureName: {
                            bold: true,
                            alignment:'center',
                        },
                        signatureJobTitle: {
                            italics: true,
                            fontSize: 10,
                            alignment:'center',
                        },
                        notesTitle: {
                          fontSize: 10,
                          bold: true,  
                          margin: [0,50,0,3],
                        },
                        notesText: {
                          fontSize: 10
                        },
                        center: {
                            alignment:'center',
                        },
                    },
                    defaultStyle: {
                        columnGap: 20,
                    } */


                // ...
            };

            const options = {
                // ...
            }

            const pdfDoc = printer.createPdfKitDocument(docDefinition);
            pdfDoc.pipe(fs.createWriteStream(`Factures/client:_${emailWithoutSlash}/${nomFacture}.pdf`));
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