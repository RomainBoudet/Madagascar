const consol = require('../../app/services/colorConsole')
const db = require('../../app/database');
require('dotenv').config({
    path: `${__dirname}/../../.env.back`
}); // j'aurai toutes les infos de connexion nécessaires 
const bcrypt = require('bcrypt'); // pour hasher les fake passwords
const {
    exec
} = require("child_process");

// 
// Aprés la construction d'une BDD vierge => Génération d'un faux jeu de donnée pour mes tables via Faker qui sera donné à un script d'import
//

const faker = require('faker/locale/fr');

faker.locale = 'fr';

const volume = process.env.VOLUMEFAKECUSTUMER;


const fakeData = async () => {

    try {



        console.time("Génération de la fonction fakeData");

        //! On fait place neuve ! En ligne de commande on supprime la BDD et on la recreer avant de seeder, pour s'assurer qu'elle est vierge.
        // permet de modifier le script SQL en même temps qu'on réalise le fichier de seeding et de toujours avoir la derniére version du script
        // (on aurait également pu lancer la commande dans le package.json en même temps que le démarrage 'npm run seed'... )
        consol.seed("Début dropdb - createdb");

        await exec(" dropdb --if-exists madagascar && createdb madagascar && cd .. && cd data && psql madagascar -f SQL_MADA_V22.sql", (error, stdout, stderr) => {
            if (error) {
                consol.seed(`error: ${error.message}`);
                return;
            }
            if (stderr) {
                consol.seed(`stderr: ${stderr}`);
                return;
            }
            consol.seed(`stdout: ${stdout}`);
        });

        // Mettre en place l'option WITH (FORCE) pour supprimer même si la DB est ouvert dans  PGAdmin... les données de la DB sont bien changé sans devoir fermer PG Admin !(?)

        consol.seed("Fin dropdb - createdb. On a une BDD vierge.");

        consol.admin(`Début de la génération de Fake data ! Un peu de patience... Volume d'enregistrement à générer par table : ${volume} à ${volume*3} selon les tables. 
        ATTENTION => SI pg admin EST OUVERT DURANT CE SCRIPT AVEC DES VALEURS DANS CERTAINES TABLES, CERTAINES CONTRAINTE "UNIQUE" BLOQUERONT LE SCRIPT !`)



        //! FOURNISSEUR

        consol.seed(`Début de la génération de fake fournisseurs`);
        console.time(`Génération de ${volume} fournisseurs`);

        const manufacturers = [];

        for (let index = 1; index <= volume; index++) {
            const manufacturer = {

                name: faker.company.companyName(),
                logo: faker.image.business(),

            };
            manufacturers.push(manufacturer);
        }
        console.timeEnd(`Génération de ${volume} fournisseurs`);
        console.table(manufacturers);
        consol.seed(`Fin de la génération de fake fournisseurs`);


        //! CATEGORIES


        consol.seed(`Début de la génération de fake categories`);
        console.time(`Génération de ${volume} categories`);
        const categories = [];

        for (let index = 1; index <= volume; index++) {
            const category = {

                name: faker.commerce.department(),
                description: faker.lorem.sentences(),
                ordre: index,
                imageURL: faker.image.image()

            };
            categories.push(category);
        }
        console.timeEnd(`Génération de ${volume} categories`);
        console.table(categories);
        consol.seed(`Fin de la génération de fake categories`);


        //! TVA


        consol.seed(`Début de la génération de TVA`);
        const taxRates = [{
            taux: 0.20,
            nom: "Taux normal 20%"
        }, {
            taux: 0.05,
            nom: "Taux réduit 5%"
        }];

        console.table(taxRates);
        consol.seed(`Fin de la génération de TVA`);


        //! CODE POSTALE


        consol.seed(`Début de la génération de fake code postales`);
        console.time(`Génération de ${volume} code postales`);
        const zipCodes = [];

        for (let index = 1; index <= volume; index++) {
            const zipCode = {

                city: faker.address.zipCode(),

            };
            zipCodes.push(zipCode);
        }
        console.timeEnd(`Génération de ${volume} code postales`);
        console.table(zipCodes);
        consol.seed(`Fin de la génération de fakecode postales`);


        //! PAYS


        consol.seed(`Début de la génération de fake pays`);
        console.time(`Génération de ${volume} pays`);
        const countries = [];

        for (let index = 1; index <= volume; index++) {
            const country = {

                name: faker.address.country(),

            };
            countries.push(country);
        }
        console.timeEnd(`Génération de ${volume} pays`);
        console.table(countries);
        consol.seed(`Fin de la génération de fake pays`);


        //! VILLES


        consol.seed(`Début de la génération de fake villes`);
        console.time(`Génération de ${volume} villes`);
        const cities = [];

        for (let index = 1; index <= volume; index++) {
            const city = {

                name: faker.address.city(),
                id_pays: index,

            };
            cities.push(city);
        }
        console.timeEnd(`Génération de ${volume} villes`);
        console.table(cities);
        consol.seed(`Fin de la génération de fake villes`);




        //! CLIENTS


        console.time(`Génération de ${volume} clients`);

        const custumers = [];
        for (let index = 1; index <= volume; index++) {
            const user = {
                id_for_pk: index,
                ligne1: `${(Math.floor(Math.random() * (100 - 1 + 1)) + 1)} ${faker.address.streetPrefix()} ${faker.address.streetName()} `,
                telephone: faker.phone.phoneNumberFormat(),
                prenom: faker.name.firstName(),
                nom_famille: faker.name.lastName(),
                email: index + faker.internet.email(), // l'ajout de l'index me permet de n'avoir que des emails unique (postgres ok)
                password: await bcrypt.hash(process.env.PASSWORDTEST, 10), // Permet de connaitre le mot de passe, juste le sel changeant le hash.. sinon => password: await bcrypt.hash((faker.internet.password() + '!!'), 10), //  => pour obtenir un jeu de password dynamique.
                id_privilege: 1,
                titre: "Maison",
            };
            custumers.push(user);
        }


        console.timeEnd(`Génération de ${volume} clients`);
        console.table(custumers);
        consol.seed('Fin de la génération de fake clients');


        //! PANIER


        consol.seed(`Début de la génération de fake paniers`);
        console.time(`Génération de ${volume*3} paniers`);
        const basquetProducts = [];
        //const valideOuNon = ["Panier validé et payé", "Panier non validé"];
        for (let index = 1; index <= volume * 3; index++) {
            const basquetProduct = {

                total: faker.commerce.price(),
                //quantity: Math.floor(Math.random() * (5 - 1 + 1)) + 1, // un random entre 1 et 5.
                dateAdded: faker.date.past(),
                //dateRemoved: faker.date.past(),
                //status: valideOuNon[Math.floor(Math.random() * valideOuNon.length)], // un random entre "Validé" ou "non validé"
                //imageMini: faker.image.image(),
                custumer: Math.floor(Math.random() * ((volume - 1) - 1 + 1)) + 1, // un random entre 1 et 100 (notre nombre de client en BDD)
            };
            basquetProducts.push(basquetProduct);
        }
        console.timeEnd(`Génération de ${volume*3} paniers`);
        console.table(basquetProducts);
        consol.seed(`Fin de la génération de fake paniers`);


        //! PRODUIT 

        consol.seed(`Début de la génération de fake produits`);
        console.time(`Génération de ${volume*3} produits`);
        const products = [];
        const colors = ["rouge", "vert", "jaune", "bleu", "orange", "violet", "blanc", "noir"];
        const sizes = ["XL", "L", "M", "S", "XS"];
        for (let index = 1; index <= volume * 3; index++) {
            const product = {

                name: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                price: faker.commerce.price(),
                color: colors[Math.floor(Math.random() * colors.length)], //faker.internet.color => hex
                size: sizes[Math.floor(Math.random() * sizes.length)],
                quantity: Math.floor(Math.random() * (10 - 1 + 1)) + 1, // un random entre 1 et 10
                index,
                id_category: Math.floor(Math.random() * (100 - 1 + 1)) + 1,
                id_taxRate: Math.floor(Math.random() * (2 - 1 + 1)) + 1, // un random entre 1 et 2

            };
            products.push(product);
        }
        console.timeEnd(`Génération de ${volume*3} produits`);
        console.table(products);
        consol.seed(`Fin de la génération de fake produits`);



        //! PRODUIT_IMAGE

        consol.seed(`Début de la génération de fake image de produits`);
        console.time(`Génération de ${volume*3} image de produits`);
        const arrayNumber300 = Array.from({
            length: volume*3
        }, (_, i) => i + 1); // un tableau avec des valeurs allant de 1 a 300 // si on veut commençer a zero => Array.from(Array(10).keys())
        const image_produits = [];

        for (let index = 1; index <= volume * 3; index++) {
            const image_produit = {

                nom: faker.lorem.word(),
                ordre: Math.floor(Math.random() * (5 - 1 + 1)) + 1, // un random entre 1 et 5
                URL: faker.image.imageUrl(),
                id_produit: arrayNumber300[Math.floor(Math.random() * arrayNumber300.length)],
                index,
            };
            image_produits.push(image_produit);
        }
        console.timeEnd(`Génération de ${volume*3} image de produits`);
        console.table(image_produits);
        consol.seed(`Fin de la génération de fake image de produits`);


        //! AVIS


        consol.seed(`Début de la génération de fake avis`);
        console.time(`Génération de ${volume*3} avis`);
        const arrayNumber100 = Array.from({
            length: volume
        }, (_, i) => i + 1); // un tableau avec des valeurs allant de 1 a 100 // si on veut commençer a zero => Array.from(Array(10).keys())
        const avis = [];

        for (let index = 1; index <= volume * 3; index++) {
            const avi = {

                notation: Math.floor(Math.random() * (5 - 1 + 1)) + 1, // un random entre 1 et 5,
                text: faker.lorem.sentence(),
                titre: faker.lorem.words(),
                id_produit: arrayNumber300[Math.floor(Math.random() * arrayNumber300.length)], // un random entre 1 et 300,
                id_client: arrayNumber100[Math.floor(Math.random() * arrayNumber100.length)], // un random entre 1 et 100,

            };
            avis.push(avi);
        }
        console.timeEnd(`Génération de ${volume*3} avis`);
        console.table(avis);
        consol.seed(`Fin de la génération de fake avis`);

        //! SOUS_CATEGORIE


        consol.seed(`Début de la génération de fake sous_categories`);
        console.time(`Génération de ${volume / 3} sous_categories`);
        const sous_categories = [];

        for (let index = 1; index <= volume / 3; index++) {
            const sous_categorie = {


                nom: faker.lorem.word(),
                description: faker.lorem.sentence(),
                id_categorie: arrayNumber100[Math.floor(Math.random() * arrayNumber100.length)], // un random entre 1 et 100,

            };
            sous_categories.push(sous_categorie);
        }
        console.timeEnd(`Génération de ${volume/3} sous_categories`);
        console.table(sous_categories);
        consol.seed(`Fin de la génération de fake sous_categories`);


        //! STATUT_COMMANDE

        consol.seed(`Début de la génération de fake statut_commandes`);
        console.time(`Génération de ${volume} statut_commandes`);
        
        const statut_commandes = [];
        const statutCommandes = [{
            nom: 'en attente',
            description: 'Vous avez choisi le paiement par virement ? Ce statut est normal et n’évoluera qu’à partir du moment où le virement sera réalisé et les fonds reçus sur notre compte.'

        }, {
            nom: 'annulée',
            description: "Vous avez choisi d'annuler votre commande ou avez demandé à notre service client de l'annuler ? Vous serez remboursé du montant que vous avez réglé sur le moyen de paiement utilisé.Vous n'avez pas choisi d'annuler votre commande ? Ce statut indique que le paiement en ligne n’a pas abouti (paiement rejeté, coordonnées bancaires non renseignées dans le délai imparti …) Cette commande ne sera pas préparée, vous pouvez faire une nouvelle tentative."

        }, {
            nom: 'en cours de traitement',
            description: 'La commande est validée et va être prise en charge par notre équipe de préparation.'

        }, {
            nom: 'en cours de préparation',
            description: 'La commande est en cours de préparation par notre équipe logistique.'

        }, {
            nom: 'prêt pour expédition',
            description: 'La préparation de votre commande est terminée. Elle sera remise au transporteur dans la journée.'

        }, {
            nom: 'expédiée',
            description: "La commande a remis au transporteur. Vous avez dû recevoir un email contenant le numéro de tracking vous permettant de suivre l'acheminement de votre colis. Ce numéro de tracking est également accessible dans votre compte client dans la rubrique Mes commandes / Onglet Expéditions"
        }]

        for (let index = 1; index <= volume; index++) {
            const statut_commande = {


                randomStatut: statutCommandes[Math.floor(Math.random() * statutCommandes.length)]

            };
            statut_commandes.push(statut_commande);
        }
        console.timeEnd(`Génération de ${volume} statut_commandes`);
        console.table(statut_commandes);
        consol.seed(`Fin de la génération de fake statut_commandes`);


        //! COMMANDE

        consol.seed(`Début de la génération de fake commandes`);
        console.time(`Génération de ${volume} commandes`);

        const commandes = [];

        for (let index = 1; index <= volume; index++) {
            const commande = {
                idClient: index,
                ref: `COMMANDE/${9000+index} `, // une ref UNIQUE
                commentaire: faker.lorem.words(),
                id_commandeStatut: index,

            };
            commandes.push(commande);
        }
        console.timeEnd(`Génération de ${volume} commandes`);
        console.table(commandes);
        consol.seed(`Fin de la génération de fake commandes`);


        //! PAIEMENT


        consol.seed(`Début de la génération de fake paiements`);
        console.time(`Génération de ${volume} paiements`);
        const paiements = [];

        for (let index = 1; index <= volume; index++) {
            const paiement = {

                ref: `PAIEMENT/${9000+index} `,
                methode: faker.finance.transactionDescription(),
                montant: faker.finance.amount(),
                id_client: index,
                id_commande: index,

            };
            paiements.push(paiement);
        }
        console.timeEnd(`Génération de ${volume} paiements`);
        console.table(paiements);
        consol.seed(`Fin de la génération de fake paiements`);

        //! LIVRAISON


        consol.seed(`Début de la génération de fake livraisons`);
        console.time(`Génération de ${volume} livraisons`);
        const livraisons = [];

        const transporteurs = [{

                frais_expedition: 7.20,
                logo: faker.image.business(),
                nom_transporteur: "DPD",
                description: "DPD en point relai pickup",
                estime_arrive: "Expédié sous 24 à 48h",
                poid: (Math.random() * 15 - 1 + 1).toFixed(2), // random de 1 a 15 kg avec 2 chifre aprés la virgule
                numero_suivi: Math.floor(Math.random() * 99999999 - 999999 + 1) + 999999,
                URL_suivi: faker.internet.url(),
            }, {
                frais_expedition: 14.00,
                logo: faker.image.business(),
                nom_transporteur: "TNT",
                estime_arrive: "Livraison le lendemain pour toute commande avant 12h00",
                description: "EXPRESS À DOMICILE POUR UNE LIVRAISON À DOMICILE EN FRANCE MÉTROPOLITAINE. LIVRAISON EN MAINS PROPRES ET CONTRE SIGNATURE DÈS LE LENDEMAIN DE L'EXPÉDITION DE VOTRE COMMANDE (1).(1) AVANT 13 HEURES OU EN DÉBUT D'APRÈS-MIDI EN ZONE RURALE.",
                poid: (Math.random() * 15 - 1 + 1).toFixed(2),
                numero_suivi: Math.floor(Math.random() * 99999999 - 999999 + 1) + 999999,
                URL_suivi: faker.internet.url(),
            },
            {
                frais_expedition: 0,
                logo: faker.image.business(),
                nom_transporteur: "Retrait sur le stand durant le prochain marché",
                estime_arrive: "Durant le prochain marché. Nous contacter pour connaitre la date",
                description: "Une livraison de la main a la main, sur notre stand",
                poid: (Math.random() * 15 - 1 + 1).toFixed(2),
                numero_suivi: Math.floor(Math.random() * 99999999 - 999999 + 1) + 999999,
                URL_suivi: faker.internet.url(),
            }, {
                frais_expedition: 12.00,
                logo: faker.image.business(),
                nom_transporteur: "La poste Collisimmo",
                estime_arrive: "Livraison dans les 48h a 72h",
                description: "Le service colis de La Poste",
                poid: (Math.random() * 15 - 1 + 1).toFixed(2),
                numero_suivi: Math.floor(Math.random() * 99999999 - 999999 + 1) + 999999,
                URL_suivi: faker.internet.url(),
            }

        ];

        for (let index = 1; index <= volume; index++) {
            const livraison = {

                randomTransport: transporteurs[Math.floor(Math.random() * transporteurs.length)],
                indexClientCommande: index,

            };
            livraisons.push(livraison);
        }

        console.timeEnd(`Génération de ${volume} livraisons`);
        console.table(livraisons.randomTransport); // structure => [{randomTransport:{}}]  
        consol.seed(`Fin de la génération de fake livraisons`);


        //! CLIENT_ADRESSE


        // voir client...


        //! FACTURE


        consol.seed(`Début de la génération de fake factures`);
        console.time(`Génération de ${volume} factures`);
        const factures = [];
        const randomMontants = [];
        for (let index = 1; index <= volume * 2; index++) {
            const randomMontant = faker.commerce.price();

            randomMontants.push(randomMontant);
        }

        for (let index = 1; index <= volume; index++) {
            const facture = {
                id_client: index,
                ref: `FACTURE/${9000+index} `,
                montant_HT: randomMontants[index],
                montant_TTC: (parseInt(randomMontants[index]) + (parseInt(randomMontants[index]) * 0.2)).toFixed(2),
                montant_TVA: 0.2,
                id_paiement: index,

            };
            factures.push(facture);
        }
        console.timeEnd(`Génération de ${volume} factures`);
        console.table(factures);
        consol.seed(`Fin de la génération de fake factures`);


        //! STOCK

        // voir produits..


        //! REDUCTION


        consol.seed(`Début de la génération de fake reductions`);
        console.time(`Génération de ${volume/4} reductions`);
        const reductions = [];
        const soldes = ['soldes d\'hiver', 'soldes d\'été', 'soldes de printemps', 'soldes automne'];
        const actifOuNon = ['true', 'false'];
        for (let index = 1; index <= volume/4; index++) {
            const reduction = {
                idClient: index,
                nom: soldes[Math.floor(Math.random() * soldes.length)],
                pourcentage_reduction: (Math.random()).toFixed(2), // un random entre 0.1 et 0.8 avec deux chiffres aprés la virgules
                actif: actifOuNon[Math.floor(Math.random() * actifOuNon.length)],
                periode_reduction: `[${(faker.date.past()).toISOString().slice(0, 10)}, ${(faker.date.soon()).toISOString().slice(0, 10)}]`, // on récupére que la partie qui convient de la date pour satifaire le format DATERANGE de postgres
                //periode_reduction: `[${(faker.date.past()).toISOString()}, ${(faker.date.soon()).toISOString()}]`,

            };
            reductions.push(reduction);
        }
        console.timeEnd(`Génération de ${volume/4} reductions`);
        console.table(reductions);
        consol.seed(`Fin de la génération de fake reductions`);



        //! CARACTERISTIQUE


        // voir produits..


        //! SOUS_CATEGORIE_IMAGE et  CATEGORIE_IMAGE 


        // voir produit_image


        //! LIGNE_COMMANDE

        //100 commandes
        //100 client
        //100 factures
        //300 produits

        consol.seed(`Début de la génération de fake ligne_commandes`);
        console.time(`Génération de ${volume*3} ligne_commandes`);
        
        //const arrayNumberClient = Array.from(Array(101).keys()) // génére un tableau qui commence a zéro et va a 101
        const arrayNumberProduits = Array.from({
            length: volume*3
        }, (_, i) => i + 1); // génére un tableau qui commence a 1 et va à 300

        const arrayNumberVolumeDivideBy2 = Array.from({
            length: volume/2
        }, (_, i) => i + 1);

        
        const ligne_commandes = [];

        for (let index = 1; index <= volume * 3; index++) {
            const ligne_commande = {
                index,
                id_client: arrayNumberVolumeDivideBy2[Math.floor(Math.random() * arrayNumberVolumeDivideBy2.length)],
                id_commande: arrayNumberVolumeDivideBy2[Math.floor(Math.random() * arrayNumberVolumeDivideBy2.length)],
                id_produit: arrayNumberProduits[Math.floor(Math.random() * arrayNumberProduits.length)],
                quantite_commande: Math.floor(Math.random() * (5 - 1 + 1)) + 1, // un random entre 1 et 5.

            };
            ligne_commandes.push(ligne_commande);
        }
        console.timeEnd(`Génération de ${volume*3} ligne_commandes`);
        console.table(ligne_commandes);
        consol.seed(`Fin de la génération de fake ligne_commandes`);


        //! LIGNE_LIVRAISON


        consol.seed(`Début de la génération de fake ligne_livraisons`);
        console.time(`Génération de ${volume*3} ligne_livraisons`);


        const ligne_livraisons = [];

        for (let index = 1; index <= volume * 3; index++) {
            const ligne_livraison = {

                id_livraison: arrayNumberVolumeDivideBy2[Math.floor(Math.random() * arrayNumberVolumeDivideBy2.length)],
                id_commandeLigne: arrayNumberVolumeDivideBy2[Math.floor(Math.random() * arrayNumberVolumeDivideBy2.length)],
                quantite_livraison: Math.floor(Math.random() * (5 - 1 + 1)) + 1,
            };
            ligne_livraisons.push(ligne_livraison);
        }
        console.timeEnd(`Génération de ${volume*3} ligne_livraisons`);
        console.table(ligne_livraisons);
        consol.seed(`Fin de la génération de fake ligne_livraisons`);


        //! LIGNE_PANIER


        consol.seed(`Début de la génération de fake ligne_paniers`);
        console.time(`Génération de ${volume*3} ligne_paniers`);
        const arrayNumberPanier = Array.from(Array((volume*3)+1).keys())

        const ligne_paniers = [];

        for (let index = 1; index <= volume * 3; index++) {
            const ligne_panier = {

                id_produit: arrayNumberPanier[index], //300 produits
                id_panier: arrayNumberPanier[index], //300 paniers
                quantite: Math.floor(Math.random() * (5 - 1 + 1)) + 1,
            };
            ligne_paniers.push(ligne_panier);
        }
        console.timeEnd(`Génération de ${volume*3} ligne_paniers`);
        console.table(ligne_paniers);
        consol.seed(`Fin de la génération de fake ligne_paniers`);


        //! PRODUIT_COMMANDE_RETOURNE


        consol.seed(`Début de la génération de fake produit_commande_retournes`);
        console.time(`Génération de 10 produit_commande_retournes`);

        const random = [10, 45, 2, 100, 87, 55, 18, 48, 76, 64, 37];
        const produit_commande_retournes = [];

        for (let index = 1; index <= 10; index++) {
            const produit_commande_retourne = {

                id_livraisonLigne: random[index],
                quantite: 1,
                commentaire: faker.lorem.words(),
            };
            produit_commande_retournes.push(produit_commande_retourne);
        }
        console.timeEnd(`Génération de 10 produit_commande_retournes`);
        console.table(produit_commande_retournes);
        consol.seed(`Fin de la génération de fake produit_commande_retournes`);


        //! CLIENT_HISTORIQUE_PASSWORD



        consol.seed(`Début de la génération de fake client_historique_passwords`);
        console.time(`Génération de ${volume/2} client_historique_passwords`);

        const client_historique_passwords = [];

        for (let index = 1; index <= volume / 2; index++) {
            const client_historique_password = {

                id_client: index,
                password_hash: await bcrypt.hash(process.env.PASSWORDTESTOLD, 10),
            };
            client_historique_passwords.push(client_historique_password);
        }
        console.timeEnd(`Génération de ${volume/2} client_historique_passwords`);
        console.table(client_historique_passwords);
        consol.seed(`Fin de la génération de fake client_historique_passwords`);


        //! VILLE_a_CODEPOSTAL


        consol.seed(`Début de la génération de fake ville_a_codePostales`);
        console.time(`Génération de ${volume} ville_a_codePostales`);

        const ville_a_codePostales = [];

        for (let index = 1; index <= volume; index++) {
            const ville_a_codePostale = {

                id_ville: index,
                id_codePostale: index,
            };
            ville_a_codePostales.push(ville_a_codePostale);
        }
        console.timeEnd(`Génération de ${volume} ville_a_codePostales`);
        console.table(ville_a_codePostales);
        consol.seed(`Fin de la génération de fake ville_a_codePostale`);


        //! DEDUIT



        consol.seed(`Début de la génération de fake deductions`);
        console.time(`Génération de ${volume/4} deductions`);

        const deductions = [];

        for (let index = 1; index <= volume/4; index++) {
            const deduction = {

                id_reduction: index,
                id_produit: index,
            };
            deductions.push(deduction);
        }
        console.timeEnd(`Génération de ${volume/4} deductions`);
        console.table(deductions);
        consol.seed(`Fin de la génération de fake deduction`);


        //! FOURNIE 


        consol.seed(`Début de la génération de fake fournies`);
        console.time(`Génération de ${volume} fournies`);

        const fournies = [];

        for (let index = 1; index <= volume; index++) {
            const fournie = {

                id_fournisseur: index,
                id_produit: index,
            };
            fournies.push(fournie);
        }
        console.timeEnd(`Génération de ${volume} fournies`);
        console.table(fournies);
        consol.seed(`Fin de la génération de fake fournies`);




        //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!IMPORT DES DONNEES EN BDD!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

        // on a générer des fausses des données, ne reste plus qu'a les importer dans la BDD (dans le bon ordre).

        //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!IMPORT DES DONNEES EN BDD!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!













        //! FOURNISSEUR



        consol.seed(`Début de l'import des ${volume} fournisseurs`);

        const fournisseursInsert = "INSERT INTO mada.fournisseur (nom, logo) VALUES ($1, $2);";


        for (const manufacturer of manufacturers) {
            consol.seed(`Import du fournisseur nommé : ${manufacturer.name}`);
            await db.query(fournisseursInsert, [manufacturer.name, manufacturer.logo]);
        }

        consol.seed(`Fin de l'import des ${volume} fournisseurs`);

        //! CATEGORIES

        consol.seed(`Début de l'import des ${volume} categories`);

        const categoriesInsert = "INSERT INTO mada.categorie (nom, description, ordre) VALUES ($1, $2, $3);";


        for (const category of categories) {
            consol.seed(`Import de la categorie nommé : ${category.name}`);
            const result = await db.query(categoriesInsert, [category.name, category.description, category.ordre]);

            // dans result, il y aura une propriété rows qui contiendra nos données
            //category.id = result.rows[0].id; // on stocke l'id directement dans la catégorie correspondante
        }

        consol.seed(`Fin de l'import des ${volume} categories`);


        //! TVA

        consol.seed(`Début de l'import des 2 taxRates`);

        const taxRatesInsert = "INSERT INTO mada.TVA (taux, nom) VALUES ($1, $2);";

        for (const taxRate of taxRates) {
            consol.seed(`Import du taxRates nommé : ${taxRate.nom}`);
            await db.query(taxRatesInsert, [taxRate.taux, taxRate.nom]);
        }

        consol.seed(`Fin de l'import des 2 taxRates`);

        //! CODE POSTALES

        consol.seed(`Début de l'import de ${volume} code_postales`);

        const zipCodesInsert = "INSERT INTO mada.code_postal (code_postal) VALUES ($1);";

        for (const zipCode of zipCodes) {
            consol.seed(`Import du code_postale nommé : ${zipCode.city}`);
            await db.query(zipCodesInsert, [zipCode.city]);
        }

        consol.seed(`Fin de l'import de ${volume} code_postales`);


        //! PAYS

        consol.seed(`Début de l'import de ${volume} pays`);

        const countriesInsert = "INSERT INTO mada.pays (nom) VALUES ($1);";

        for (const country of countries) {
            consol.seed(`Import du pays nommé : ${country.name}`);
            await db.query(countriesInsert, [country.name]);
        }

        consol.seed(`Fin de l'import de ${volume} pays`);

        //! VILLES


        consol.seed(`Début de l'import de ${volume} cities`);

        const citiesInsert = "INSERT INTO mada.ville (nom, id_pays) VALUES ($1, $2);";

        for (const city of cities) {
            consol.seed(`Import du city nommé : ${city.name}`);
            await db.query(citiesInsert, [city.name, city.id_pays]);
        }

        consol.seed(`Fin de l'import  de ${volume} cities`);



        //! PRIVILEGES


        consol.seed("Début de l'import des privileges");
        // je dois importer en premier la table des privileges sinon érreur de clé étrangére avec la table custumer

        const privileges = ['Client', 'Administrateur', 'Developpeur'];

        console.time(`Import de ${privileges.length} privileges`);

        const privilegeInsert = "INSERT INTO mada.privilege (nom) VALUES ($1);";

        for (let i = 0; i < privileges.length; i++) {
            consol.seed(`Import du privilege ${[i]}`);

            await db.query(privilegeInsert, [privileges[i]]);
        }
        consol.seed("Fin de l'import des privileges");
        console.timeEnd(`Import de ${privileges.length} privileges`);

        //! CLIENTS

        consol.seed(`Début de l'import de ${custumers.length} clients`);
        console.time(`Import de ${custumers.length} clients`);
        const custumersInsert = "INSERT INTO mada.client (prenom, nom_famille, email, password, id_privilege) VALUES ($1, $2, $3 ,$4, $5);";

        for (const custumer of custumers) {
            consol.seed(`Import du client prénomé : ${custumer.prenom}`);
            const result = await db.query(custumersInsert, [custumer.prenom, custumer.nom_famille, custumer.email, custumer.password, custumer.id_privilege]);
        }

        consol.seed(`Fin de l'import de ${custumers.length} clients`);
        console.timeEnd(`Import de ${custumers.length} clients`);



        //! PANIER

        consol.seed(`Début de l'import de ${basquetProducts.length} panier`);
        console.time(`Import de ${basquetProducts.length} panier`);
        const basquetProductsInsert = "INSERT INTO mada.panier (total, id_client) VALUES ($1, $2);";

        for (const basquetProduct of basquetProducts) {
            consol.seed(`Import du panier du client id : ${basquetProduct.custumer}`);
            const result = await db.query(basquetProductsInsert, [basquetProduct.total, basquetProduct.custumer]);
        }

        consol.seed(`Fin de l'import de ${basquetProducts.length} panier`);
        console.timeEnd(`Import de ${basquetProducts.length} panier`);

        //! PRODUIT 

        consol.seed(`Début de l'import de ${products.length} produits`);
        console.time(`Import de ${products.length} produits`);
        const productsInsert = "INSERT INTO mada.produit (nom, description, prix_HT, id_categorie, id_TVA) VALUES ($1, $2, $3 ,$4, $5);";

        for (const product of products) {
            consol.seed(`Import du product ayant pour nom : ${product.name} et id_category : ${product.id_category}`);
            const result = await db.query(productsInsert, [product.name, product.description, product.price, product.id_category, product.id_taxRate]);
        }

        consol.seed(`Fin de l'import de ${products.length} produits`);
        console.timeEnd(`Import de ${products.length} produits`);



        //! PRODUIT_IMAGE


        consol.seed(`Début de l'import de ${image_produits.length} images de produits`);
        console.time(`Import de ${image_produits.length} images de produits`);
        const imageProduitsInsert = "INSERT INTO mada.produit_image (nom, ordre, URL, id_produit) VALUES ($1, $2, $3 ,$4);";

        for (const image_produit of image_produits) {
            consol.seed(`Import du product ayant pour nom : ${image_produit.nom} et idproduit : ${image_produit.id_produit}`);
            await db.query(imageProduitsInsert, [image_produit.nom, image_produit.ordre, image_produit.URL, image_produit.id_produit]);
        }

        consol.seed(`Fin de l'import de ${image_produits.length} images de produits`);
        console.timeEnd(`Import de ${image_produits.length} images de produits`);


        //! AVIS

        consol.seed(`Début de l'import de ${avis.length} avis`);
        console.time(`Import de ${avis.length} avis`);
        const avisInsert = "INSERT INTO mada.avis (notation, avis, titre, id_client, id_produit) VALUES ($1, $2, $3, $4, $5);";

        for (const avi of avis) {
            consol.seed(`Import de l'avis de l'id_produit : ${avi.id_produit}`);
            await db.query(avisInsert, [avi.notation, avi.text, avi.titre, avi.id_client, avi.id_produit]);
        }
        consol.seed(`Fin de l'import de ${avis.length} avis`);
        console.timeEnd(`Import de ${avis.length} avis`);


        //! SOUS_CATEGORIE


        consol.seed(`Début de l'import de ${sous_categories.length} sous_categories`);
        console.time(`Import de ${sous_categories.length} sous_categories`);
        const sous_categoriesInsert = "INSERT INTO mada.sous_categorie (nom, description, id_categorie) VALUES ($1, $2, $3);";

        for (const sous_categorie of sous_categories) {
            consol.seed(`Import de sous_categories de l'id_produit : ${sous_categorie.id_categorie}`);
            await db.query(sous_categoriesInsert, [sous_categorie.nom, sous_categorie.description, sous_categorie.id_categorie]);
        }
        consol.seed(`Fin de l'import de ${sous_categories.length} sous_categories`);
        console.timeEnd(`Import de ${sous_categories.length} sous_categories`);


        //! STATUT_COMMANDE

        consol.seed(`Début de l'import de ${statut_commandes.length} statut_commandes`);
        console.time(`Import de ${statut_commandes.length} statut_commandes`);
        const statut_commandesInsert = "INSERT INTO mada.statut_commande (statut, description) VALUES ($1, $2);";

        for (const statut_commande of statut_commandes) {
            consol.seed(`Import du statut_commande nommé : ${statut_commande.randomStatut.nom}`);
            await db.query(statut_commandesInsert, [statut_commande.randomStatut.nom, statut_commande.randomStatut.description]);
        }

        consol.seed(`Fin de l'import de ${statut_commandes.length} statut_commandes`);
        console.timeEnd(`Import de ${statut_commandes.length} statut_commandes`);


        //! COMMANDE


        consol.seed(`Début de l'import de ${commandes.length} commandes`);
        console.time(`Import de ${commandes.length} commandes`);
        const commandesInsert = "INSERT INTO mada.commande (reference, commentaire, id_commandeStatut, id_client) VALUES ($1, $2, $3, $4);";

        for (const commande of commandes) {
            consol.seed(`Import de la commande pour l'ID client ${commande.idClient} et l'id commande statut : ${commande.id_commandeStatut}`);
            await db.query(commandesInsert, [commande.ref, commande.commentaire, commande.id_commandeStatut, commande.idClient, ]);
        }

        consol.seed(`Fin de l'import de ${commandes.length} commandes`);
        console.timeEnd(`Import de ${commandes.length} commandes`);


        //! PAIEMENT 


        consol.seed(`Début de l'import de ${paiements.length} paiements`);
        console.time(`Import de ${paiements.length} paiements`);
        const paiementsInsert = "INSERT INTO mada.paiement (reference, methode, montant, id_commande) VALUES ($1, $2, $3, $4);";

        for (const paiement of paiements) {
            consol.seed(`Import du paiement ref ${paiement.ref} et l'id commande ${paiement.id_commande}`);
            await db.query(paiementsInsert, [paiement.ref, paiement.methode, paiement.montant, paiement.id_commande]);
        }

        consol.seed(`Fin de l'import de ${paiements.length} paiements`);
        console.timeEnd(`Import de ${paiements.length} paiements`);


        //! LIVRAISON


        consol.seed(`Début de l'import de ${livraisons.length} livraisons`);
        console.time(`Import de ${livraisons.length} livraisons`);
        const livraisonsInsert = "INSERT INTO mada.livraison (frais_expedition, nom_transporteur, description, numero_suivi, URL_suivi, poid, estime_arrive, id_client, id_commande) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);";

        for (const livraison of livraisons) {
            consol.seed(`Import du livraison pour le client id ${livraison.indexClientCommande} et l'id commande ${livraison.indexClientCommande}`);
            await db.query(livraisonsInsert, [livraison.randomTransport.frais_expedition, livraison.randomTransport.nom_transporteur, livraison.randomTransport.description, livraison.randomTransport.numero_suivi, livraison.randomTransport.URL_suivi, livraison.randomTransport.poid, livraison.randomTransport.estime_arrive, livraison.indexClientCommande, livraison.indexClientCommande]);
        }

        consol.seed(`Fin de l'import de ${livraisons.length} livraisons`);
        console.timeEnd(`Import de ${livraisons.length} livraisons`);


        //! CLIENT_ADRESSE


        consol.seed(`Début de l'import de ${custumers.length} adresses client`);
        console.time(`Import de ${custumers.length} adresses client`);
        const client_adressesInsert = "INSERT INTO mada.client_adresse (prenom, nom_famille, ligne1, telephone, titre, id_client, id_ville) VALUES ($1, $2, $3 ,$4, $5, $6, $7);";

        for (const addressCustumer of custumers) {
            consol.seed(`Import de l'addresse du client habitant : ${addressCustumer.ligne1} avec l'id : ${addressCustumer.id_for_pk}`);
            await db.query(client_adressesInsert, [addressCustumer.prenom, addressCustumer.nom_famille, addressCustumer.ligne1, addressCustumer.telephone, addressCustumer.titre, addressCustumer.id_for_pk, addressCustumer.id_for_pk]);
        }

        consol.seed(`Fin de l'import de ${custumers.length} adresses`);
        console.timeEnd(`Import de ${custumers.length} adresses client`);

        //! FACTURE


        consol.seed(`Début de l'import de ${factures.length} factures`);
        console.time(`Import de ${factures.length} factures`);
        const facturesInsert = "INSERT INTO mada.facture (reference, montant_HT, montant_TTC, montant_TVA, id_paiement, id_client) VALUES ($1, $2, $3, $4, $5, $6);";

        for (const facture of factures) {
            consol.seed(`Import de la facture de l'id_client : ${facture.id_client} avec pour ref : ${facture.ref} et id du paiement : ${facture.id_paiement}`);
            await db.query(facturesInsert, [facture.ref, facture.montant_HT, facture.montant_TTC, facture.montant_TVA, facture.id_paiement, facture.id_client]);
        }

        consol.seed(`Fin de l'import de ${factures.length} factures`);
        console.timeEnd(`Import de ${factures.length} factures`);


        //! STOCK

        consol.seed(`Début de l'import de ${products.length} stocks`);
        console.time(`Import de ${products.length} stocks`);
        const stocksInsert = "INSERT INTO mada.stock (quantite, id_produit) VALUES ($1, $2);";

        for (const stock of products) {
            consol.seed(`Import du stock du produit : ${stock.index} avec pour quantité : ${stock.quantity}`);
            await db.query(stocksInsert, [stock.quantity, stock.index]);
        }

        consol.seed(`Fin de l'import de ${products.length} stocks`);
        console.timeEnd(`Import de ${products.length} stocks`);


        //! REDUCTION


        consol.seed(`Début de l'import de ${reductions.length} reductions`);
        console.time(`Import de ${reductions.length} reductions`);
        const reductionsInsert = "INSERT INTO mada.reduction (nom, pourcentage_reduction, actif, periode_reduction ) VALUES ($1, $2, $3, $4);";

        for (const reduction of reductions) {
            consol.seed(`Import de la reduction de nomée : ${reduction.nom} avec comme valeur : ${reduction.pourcentage_reduction}`);
            await db.query(reductionsInsert, [reduction.nom, reduction.pourcentage_reduction, reduction.actif, reduction.periode_reduction]);
        }

        consol.seed(`Fin de l'import de ${reductions.length} reductions`);
        console.timeEnd(`Import de ${reductions.length} reductions`);

        //! CARACTERISTIQUE


        consol.seed(`Début de l'import de ${products.length} caracteristiques`);
        console.time(`Import de ${products.length} caracteristiques`);
        const caracteristiquesInsert = "INSERT INTO mada.caracteristique (couleur, taille, id_produit) VALUES ($1, $2, $3);";

        for (const product of products) {
            consol.seed(`Import de la caracteristique ayant pour couleur : ${product.color} et taille : ${product.size} pour le produit id : ${product.index}`);
            await db.query(caracteristiquesInsert, [product.color, product.size, product.index]);
        }

        consol.seed(`Fin de l'import de ${products.length} caracteristiques`);
        console.timeEnd(`Import de ${products.length} caracteristiques`);



        //! CATEGORIE_IMAGE


        consol.seed(`Début de l'import de ${image_produits.slice(0,33).length} images de categories`);
        console.time(`Import de ${image_produits.slice(0,33).length} images de categories`);
        const imageCategoriesInsert = "INSERT INTO mada.categorie_image (nom, URL, id_categorie) VALUES ($1, $2, $3);";

        for (const image_produit of image_produits.slice(0, 33)) {
            consol.seed(`Import de l'image URL : ${image_produit.URL} pour la la categorie : ${image_produit.index}`);
            await db.query(imageCategoriesInsert, [image_produit.nom, image_produit.URL, image_produit.index]);
        }

        consol.seed(`Fin de l'import de ${image_produits.slice(0,33).length} images de categories`);
        console.timeEnd(`Import de ${image_produits.slice(0,33).length} images de categories`);


        //! SOUS_CATEGORIE_IMAGE


        consol.seed(`Début de l'import de ${image_produits.slice(0,33).length} images de sous-categories`);
        console.time(`Import de ${image_produits.slice(0,33).length} images de sous-categories`);
        const imageSousCategoriesInsert = "INSERT INTO mada.sous_categorie_image (nom, URL, id_sousCategorie) VALUES ($1, $2, $3);";

        for (const image_produit of image_produits.slice(0, 33)) {
            consol.seed(`Import de l'image URL : ${image_produit.URL} pour la sous_categorie : ${image_produit.index}`);
            await db.query(imageSousCategoriesInsert, [image_produit.nom, image_produit.URL, image_produit.index]);
        }

        consol.seed(`Fin de l'import de ${image_produits.slice(0,33).length} images de sous-categories`);
        console.timeEnd(`Import de ${image_produits.slice(0,33).length} images de sous-categories`);


        //! LIGNE_COMMANDE


        consol.seed(`Début de l'import de ${ligne_commandes.length} ligne_commandes`);
        console.time(`Import de ${ligne_commandes.length} ligne_commandes`);
        const ligne_commandesInsert = "INSERT INTO mada.ligne_commande ( quantite_commande, id_produit, id_commande) VALUES ($1, $2, $3);";

        for (const ligne_commande of ligne_commandes) {
            consol.seed(`Import de la ligne_commande pour la commande id : ${ligne_commande.id_commande} avec l'index numéro ${ligne_commande.index}`);
            await db.query(ligne_commandesInsert, [ligne_commande.quantite_commande, ligne_commande.id_produit, ligne_commande.id_commande]);
        }

        consol.seed(`Fin de l'import de ${ligne_commandes.length} ligne_commandes`);
        console.timeEnd(`Import de ${ligne_commandes.length} ligne_commandes`);


        //! LIGNE_LIVRAISON


        consol.seed(`Début de l'import de ${ligne_livraisons.length} ligne_livraisons`);
        console.time(`Import de ${ligne_livraisons.length} ligne_livraisons`);
        const ligne_livraisonsInsert = "INSERT INTO mada.ligne_livraison (quantite_livraison, id_livraison, id_commandeLigne) VALUES ($1, $2, $3);";

        for (const ligne_livraison of ligne_livraisons) {
            consol.seed(`Import de la ligne_livraison pour la ligne commande id : ${ligne_livraison.id_commandeLigne}`);
            await db.query(ligne_livraisonsInsert, [ligne_livraison.quantite_livraison, ligne_livraison.id_livraison, ligne_livraison.id_commandeLigne]);
        }

        consol.seed(`Fin de l'import de ${ligne_livraisons.length} ligne_livraisons`);
        console.timeEnd(`Import de ${ligne_livraisons.length} ligne_livraisons`);


        //! LIGNE_PANIER

        consol.seed(`Début de l'import de ${ligne_paniers.length} ligne_paniers`);
        console.time(`Import de ${ligne_paniers.length} ligne_paniers`);
        const ligne_paniersInsert = "INSERT INTO mada.ligne_panier (quantite, id_produit, id_panier) VALUES ($1, $2, $3);";

        for (const ligne_panier of ligne_paniers) {
            consol.seed(`Import de la ligne_panier pour la le panier id : ${ligne_panier.id_panier} et le produit id : ${ligne_panier.id_produit}`);
            await db.query(ligne_paniersInsert, [ligne_panier.quantite, ligne_panier.id_produit, ligne_panier.id_panier]);
        }
        consol.seed(`Fin de l'import de ${ligne_paniers.length} ligne_paniers`);
        console.timeEnd(`Import de ${ligne_paniers.length} ligne_paniers`);



        //! PRODUIT_COMMANDE_RETOURNE


        consol.seed(`Début de l'import de ${produit_commande_retournes.length} produit_commande_retournes`);
        console.time(`Import de ${produit_commande_retournes.length} produit_commande_retournes`);
        const produit_commande_retournesInsert = "INSERT INTO mada.produit_commande_retourne (quantite, commentaire, id_livraisonLigne) VALUES ($1, $2, $3);";

        for (const produit_commande_retourne of produit_commande_retournes) {
            consol.seed(`Import de produit_commande_retourne pour l'id livraison ligne  : ${produit_commande_retourne.id_livraisonLigne}`);
            await db.query(produit_commande_retournesInsert, [produit_commande_retourne.quantite, produit_commande_retourne.commentaire, produit_commande_retourne.id_livraisonLigne]);
        }
        consol.seed(`Fin de l'import de ${produit_commande_retournes.length} produit_commande_retournes`);
        console.timeEnd(`Import de ${produit_commande_retournes.length} produit_commande_retournes`);



        //! CLIENT_HISTORIQUE_PASWORD


        consol.seed(`Début de l'import de ${client_historique_passwords.length} client_historique_passwords`);
        console.time(`Import de ${client_historique_passwords.length} client_historique_passwords`);
        const client_historique_passwordsInsert = "INSERT INTO mada.client_historique_password (password_hash, id_client) VALUES ($1, $2);";

        for (const client_historique_password of client_historique_passwords) {
            consol.seed(`Import de client_historique_password pour le client id  : ${client_historique_password.id_client}`);
            await db.query(client_historique_passwordsInsert, [client_historique_password.password_hash, client_historique_password.id_client]);
        }
        consol.seed(`Fin de l'import de ${client_historique_passwords.length} client_historique_passwords`);
        console.timeEnd(`Import de ${client_historique_passwords.length} client_historique_passwords`);



        //! VILLE_a_CODEPOSTAL


        consol.seed(`Début de l'import de ${ville_a_codePostales.length} ville_a_codePostales`);
        console.time(`Import de ${ville_a_codePostales.length} ville_a_codePostales`);
        const ville_a_codePostalesInsert = "INSERT INTO mada.ville_a_codePostal (id_ville, id_codePostal) VALUES ($1, $2);";

        for (const ville_a_codePostale of ville_a_codePostales) {
            consol.seed(`Import de ville_a_codePostale pour la ville id  : ${ville_a_codePostale.id_ville} et id_codePostal ${ville_a_codePostale.id_codePostale}`);
            await db.query(ville_a_codePostalesInsert, [ville_a_codePostale.id_ville, ville_a_codePostale.id_codePostale]);
        }
        consol.seed(`Fin de l'import de ${ville_a_codePostales.length} ville_a_codePostales`);
        console.timeEnd(`Import de ${ville_a_codePostales.length} ville_a_codePostales`);


        //! DEDUIT


        consol.seed(`Début de l'import de ${deductions.length} reductions`);
        console.time(`Import de ${deductions.length} reductions`);
        const reductionInsert = "INSERT INTO mada.deduit (id_reduction, id_produit) VALUES ($1, $2);";

        for (const reduction of deductions) {
            consol.seed(`Import de reduction pour le produit id  : ${reduction.id_produit}`);
            await db.query(reductionInsert, [reduction.id_reduction, reduction.id_produit]);
        }
        consol.seed(`Fin de l'import de ${deductions.length} reductions`);
        console.timeEnd(`Import de ${deductions.length} reductions`);


        //! FOURNIT

        consol.seed(`Début de l'import de ${fournies.length} fournies`);
        console.time(`Import de ${fournies.length} fournies`);
        const fournieInsert = "INSERT INTO mada.fournie (id_fournisseur, id_produit) VALUES ($1, $2);";

        for (const fournie of fournies) {
            consol.seed(`Import de fournie pour le produit id  : ${fournie.id_produit}`);
            await db.query(fournieInsert, [fournie.id_fournisseur, fournie.id_produit]);
        }
        consol.seed(`Fin de l'import de ${fournies.length} fournies`);
        console.timeEnd(`Import de ${fournies.length} fournies`);





        //! Mise en place d'un client avec des droits admin.

        consol.seed("Mise en place d'un admin dans la BDD");
        await db.query(`UPDATE mada.client SET id_privilege='${process.env.MYPRIVILEGE}', email='${process.env.EMAILTEST}', prenom='${process.env.MYFIRST}', nom_famille='${process.env.MYLAST}' WHERE id = ${process.env.ID}; `);
        await db.query(`INSERT INTO mada.admin_verif_telephone (verif_phone, id_client) VALUES ('true', ${process.env.ID});`);
        await db.query(`INSERT INTO mada.admin_verif_email (verif_email, id_client) VALUES ('true', ${process.env.ID});`);
        await db.query(`INSERT INTO mada.admin_phone (admin_telephone, id_client) VALUES ('${process.env.MYPHONE}', ${process.env.ID});`);

        consol.seed(`Admin mis en place en client id ${process.env.ID}`)


        console.timeEnd("Génération de la fonction fakeData");
        consol.admin("FIN DE L'IMPORT");



    } catch (error) {
        console.trace(
            'Erreur dans la méthode fakeData de la fakeFabric :',
            error);
        res.status(500).json(error.message);

    }
};

fakeData();