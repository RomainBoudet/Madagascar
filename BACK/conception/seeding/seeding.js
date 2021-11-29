const consol = require('../../app/services/colorConsole')
const db = require('../../app/database');
require('dotenv').config({
    path: `${__dirname}/../../.env.back`
}); // j'aurai toutes les infos de connexion nécessaires 
const chalk = require('chalk');
/**
 *Exécute un commande shell et la retourne comme une promesse pour être "awaité".
 * @param cmd {string}
 * @return {Promise<string>}
 */
 function execShellCommand(cmd) {
    const exec = require('child_process').exec;
    return new Promise((resolve, reject) => {
     exec(cmd, (error, stdout, stderr) => {
      if (error) {
       console.warn(chalk.bold.red `${error}`);
      }
      resolve(stdout? console.log(chalk.bold.green `${stdout}`) : stderr);
     });
    });
   }


const redis = require('../../app/services/redis');

// 
// Aprés la construction d'une BDD vierge => Génération d'un faux jeu de donnée pour mes tables via Faker qui sera donné à un script d'import
//

const faker = require('faker/locale/fr');

faker.locale = 'fr';

const volume = process.env.VOLUMEFAKECUSTUMER;


const seeding = async () => {

    try {

        console.time("Génération de la fonction seeding");

        //! On fait place neuve ! En ligne de commande on supprime la BDD et on la recreer avant de seeder, pour s'assurer qu'elle est vierge.
        // permet de modifier le script SQL en même temps qu'on réalise le fichier de seeding et de toujours avoir la derniére version du script
        // (on aurait également pu lancer la commande dans le package.json en même temps que le démarrage 'npm run seed'... )
        consol.seed("Début dropdb - createdb");
       await execShellCommand("dropdb --if-exists madagascar && createdb madagascar && cd .. && cd data && psql madagascar -f script_postgres.sql")

        // Mettre en place l'option WITH (FORCE) pour supprimer même si la DB est ouvert dans  PGAdmin... les données de la DB sont bien changé sans devoir fermer PG Admin !(?)

        consol.seed("Fin dropdb - createdb. On a une BDD vierge.");

        consol.admin(`Début de la génération des données de seeding ! Un peu de patience... Volume d'enregistrement à générer par table : ${volume} à ${volume*3} selon les tables. 
        ATTENTION => SI pg admin EST OUVERT DURANT CE SCRIPT AVEC DES VALEURS DANS CERTAINES TABLES, CERTAINES CONTRAINTE "UNIQUE" BLOQUERONT LE SCRIPT !`)


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


        

        //! PRODUIT 

        consol.seed(`Début de la génération de fake produits`);
        console.time(`Génération de ${volume*3} produits`);
        const products = [];
        const colors = ["rouge", "vert", "jaune", "bleu", "orange", "violet", "blanc", "noir"];
        const sizes = ["XL", "L", "M", "S", "XS"];
        const arrayNumber4 = Array.from({
            length: 4
        }, (_, i) => i + 1);


        for (let index = 1; index <= volume * 3; index++) {
            const product = {

                name: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                price: Math.floor(faker.commerce.price(10, 100) *100 ),
                color: colors[Math.floor(Math.random() * colors.length)], //faker.internet.color => hex
                size: sizes[Math.floor(Math.random() * sizes.length)],
                quantity: Math.floor(Math.random() * (10 - 1 + 1)) + 1, // un random entre 1 et 10\u{002A}\u{FE0F}\u{20E3}
                image: faker.image.imageUrl(),
                index,
                id_category: Math.floor(Math.random() * (100 - 1 + 1)) + 1,
                id_taxRate: Math.floor(Math.random() * (2 - 1 + 1)) + 1, // un random entre 1 et 2
                id_reduction: arrayNumber4[Math.floor(Math.random() * arrayNumber4.length)],

            };
            products.push(product);
        }
        console.timeEnd(`Génération de ${volume*3} produits`);
        console.table(products);
        consol.seed(`Fin de la génération de fake produits`);



        //! PRODUIT_IMAGE

        consol.seed(`Début de la génération de fake image de produits`);
        console.time(`Génération de ${volume*7} image de produits`);
        const arrayNumber300 = Array.from({
            length: volume * 3
        }, (_, i) => i + 1); // un tableau avec des valeurs allant de 1 a 300 // si on veut commençer a zero => Array.from(Array(10).keys())
        const image_produits = [];

        for (let index = 1; index <= volume * 17; index++) {
            const image_produit = {

                nom: faker.lorem.word(),
                ordre: Math.floor(Math.random() * (5 - 1 + 1)) + 1, // un random entre 1 et 5
                URL: faker.image.image(),
                id_produit: arrayNumber300[Math.floor(Math.random() * arrayNumber300.length)],
                index,
            };
            image_produits.push(image_produit);
        }
        console.timeEnd(`Génération de ${volume*7} image de produits`);
        console.table(image_produits);
        consol.seed(`Fin de la génération de fake image de produits`);


        //! SOUS_CATEGORIE

        const arrayNumber100 = Array.from({
            length: volume
        }, (_, i) => i + 1); // un tableau avec des valeurs allant de 1 a 100 // si on veut commençer a zero => Array.from(Array(10).keys())

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


        // si on change l'ordre ou les noms, on doit mettre à jour le code, au moins dans la méthode updateStatut du commandeController et la méthode newLivraison / startUpdateCommandeFromEmail du livraisonController !
        //! STATUT_COMMANDE

        consol.seed(`Début de la génération de fake statut_commandes`);
        console.time(`Génération de ${volume*5} statut_commandes`);

        const statut_commandes = [];
        const statutCommandes = [{
            nom: 'En attente',
            description: 'Vous avez choisi le paiement par virement ? Ce statut est normal et n’évoluera qu’à partir du moment où le virement sera réalisé et les fonds reçus sur notre compte.'

        }, {
            nom: 'Paiement validé',
            description: 'La commande est validée et va être prise en charge par notre équipe de préparation.'

        }, {
            nom: 'En cours de préparation',
            description: 'La commande est en cours de préparation par notre équipe logistique.'

        }, {
            nom: 'Prêt pour expédition',
            description: 'La préparation de votre commande est terminée. Elle sera remise au transporteur dans la journée.'

        }, {
            nom: 'Expédiée',
            description: "La commande a remis au transporteur. Vous avez dû recevoir un email contenant le numéro de tracking vous permettant de suivre l'acheminement de votre colis. Ce numéro de tracking est également accessible dans votre compte client dans la rubrique Mes commandes / Onglet Expéditions"
        },{
            nom: 'Remboursée',
            description: "La commande a été remboursé. Vous avez dû recevoir un email confirmant ce remboursement"
        },{
            nom: 'Annulée',
            description: "Vous avez choisi d'annuler votre commande ou avez demandé à notre service client de l'annuler ? Vous serez remboursé du montant que vous avez réglé sur le moyen de paiement utilisé.Vous n'avez pas choisi d'annuler votre commande ? Ce statut indique que le paiement en ligne n’a pas abouti (paiement rejeté, coordonnées bancaires non renseignées dans le délai imparti …) Cette commande ne sera pas préparée, vous pouvez faire une nouvelle tentative."

        }]

        for (let index = 1; index <= volume * 5; index++) {
            const statut_commande = {


                randomStatut: statutCommandes[Math.floor(Math.random() * statutCommandes.length)]

            };
            statut_commandes.push(statut_commande);
        }
        console.timeEnd(`Génération de ${volume*5} statut_commandes`);
        console.table(statut_commandes);
        consol.seed(`Fin de la génération de fake statut_commandes`);


        
        //! REDUCTION


        consol.seed(`Début de la génération de fake reductions`);
        console.time(`Génération de 4 reductions`);
        const reductions = [];
        const soldes = ['soldes d\'hiver', 'soldes d\'été', 'soldes de printemps', 'soldes automne'];
        const actifOuNon = ['true', 'false'];
        for (let index = 0; index < 4; index++) {
            const reduction = {
                nom: soldes[index],
                pourcentage_reduction: (Math.random() * (0.5 - 0.01) + 0.01).toFixed(2), // random entre 0.5 et 0.1 pour des %
                actif: actifOuNon[Math.floor(Math.random() * actifOuNon.length)],
                periode_reduction: `[${(faker.date.past()).toISOString().slice(0, 10)}, ${(faker.date.soon()).toISOString().slice(0, 10)}]`, // on récupére que la partie qui convient de la date pour satifaire le format DATERANGE de postgres
                //periode_reduction: `[${(faker.date.past()).toISOString()}, ${(faker.date.soon()).toISOString()}]`,

            };
            reductions.push(reduction);
        }
        console.timeEnd(`Génération de 4 reductions`);
        console.table(reductions);
        consol.seed(`Fin de la génération de fake reductions`);

        //! CARACTERISTIQUE


        // voir produits..


        //! SOUS_CATEGORIE_IMAGE et  CATEGORIE_IMAGE 


        // voir produit_image

        // Si les noms des transporteurs sont changés, il faut changer 'Retrait sur le stand' pzrtout il est présent et dans le choixLivraisonSchéma, mettre les nouveaux noms des transporteurs...
        //! TRANSPORTEUR 

        const transporteurs = [ 
         {
            frais_expedition: Math.floor(12.00*100),
            logo: faker.image.business(),
            nom_transporteur: "La poste Collisimmo",
            estime_arrive: "Livraison dans les 48h a 72h",
            estime_arrive_number: 3,
            description: "Le service colis de La Poste",
            poid: (Math.floor(Math.random() * 15 - 1 + 1).toFixed(2)*100), // random de 1 a 15 kg avec 2 chifre aprés la virgule
            numero_suivi: Math.floor(Math.random() * 99999999 - 999999 + 1) + 999999,
            URL_suivi: faker.internet.url(),
        },
        {
            frais_expedition: Math.floor(13.00*100),
            logo: faker.image.business(),
            nom_transporteur: "Chronopost - Chrono Relais 13",
            estime_arrive: "Chrono Relais 13",
            estime_arrive_number: 1,
            description: "Livraison Chronopost - Livraison avant 13h dans l'un des 15000 points relais et consignes Pickup.",
            poid: (Math.floor(Math.random() * 15 - 1 + 1).toFixed(2)*100), // random de 1 a 15 kg avec 2 chifre aprés la virgule
            numero_suivi: Math.floor(Math.random() * 99999999 - 999999 + 1) + 999999,
            URL_suivi: faker.internet.url(),
        },
        {
            frais_expedition: 0,
            logo: faker.image.business(),
            nom_transporteur: "Retrait sur le stand",
            estime_arrive: "Durant le prochain marché. Nous contacter pour connaitre la date",
            estime_arrive_number: 'Prochain marché',
            description: "Une livraison de la main a la main, sur notre stand",
            poid: Math.floor((Math.random() * 15 - 1 + 1).toFixed(2)*100), // random de 1 a 15 kg avec 2 chifre aprés la virgule
            numero_suivi: Math.floor(Math.random() * 99999999 - 999999 + 1) + 999999,
            URL_suivi: faker.internet.url(),
        },
        {
            frais_expedition: Math.floor(26.00*100),
            logo: faker.image.business(),
            nom_transporteur: "Chronopost - Chrono13",
            estime_arrive: "Chrono13 - Livraison le lendemain avant 13h, colis livrés en matinée partout en France.",
            estime_arrive_number: 1,
            description: "Livraison Chronopost - Livraison en matinée partout en France, remise contre signature.",
            poid: (Math.floor(Math.random() * 15 - 1 + 1).toFixed(2)*100), // random de 1 a 15 kg avec 2 chifre aprés la virgule
            numero_suivi: Math.floor(Math.random() * 99999999 - 999999 + 1) + 999999,
            URL_suivi: faker.internet.url(),
        },
        {
            frais_expedition: Math.floor(12.00*100),
            logo: faker.image.business(),
            nom_transporteur: "DHL",
            estime_arrive: "Livraison entre 1 et 3 jours",
            estime_arrive_number: 3,
            description: "DHL solution logistique",
            poid: (Math.floor(Math.random() * 15 - 1 + 1).toFixed(2)*100), // random de 1 a 15 kg avec 2 chifre aprés la virgule
            numero_suivi: Math.floor(Math.random() * 99999999 - 999999 + 1) + 999999,
            URL_suivi: faker.internet.url(),
        }

    ];


       
        //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!IMPORT DES DONNEES EN BDD!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

        // on a générer des fausses des données, ne reste plus qu'a les importer dans la BDD (dans le bon ordre).

        //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!IMPORT DES DONNEES EN BDD!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!


        //FLAG                                                                                                                                        


        //FLAG                                                                                                                                        




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


        //! PRODUIT 

        consol.seed(`Début de l'import de ${products.length} produits`);
        console.time(`Import de ${products.length} produits`);
        const productsInsert = "INSERT INTO mada.produit (nom, description, prix_HT, image_mini, id_categorie, id_TVA, id_reduction) VALUES ($1, $2, $3 ,$4, $5, $6, $7);";

        for (const product of products) {
            consol.seed(`Import du product ayant pour nom : ${product.name} et id_category : ${product.id_category} et id_reduction : ${product.id_reduction}`);
            const result = await db.query(productsInsert, [product.name, product.description, product.price, product.image, product.id_category, product.id_taxRate, product.id_reduction]);
        }

        consol.seed(`Fin de l'import de ${products.length} produits`);
        console.timeEnd(`Import de ${products.length} produits`);



        //! PRODUIT_IMAGE


        consol.seed(`Début de l'import de ${image_produits.length} images de produits`);
        console.time(`Import de ${image_produits.length} images de produits`);
        const imageProduitsInsert = "INSERT INTO mada.image (nom, ordre, URL, id_produit) VALUES ($1, $2, $3 ,$4);";

        for (const image_produit of image_produits) {
            consol.seed(`Import du product ayant pour nom : ${image_produit.nom} et idproduit : ${image_produit.id_produit}`);
            await db.query(imageProduitsInsert, [image_produit.nom, image_produit.ordre, image_produit.URL, image_produit.id_produit]);
        }

        consol.seed(`Fin de l'import de ${image_produits.length} images de produits`);
        console.timeEnd(`Import de ${image_produits.length} images de produits`);


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

        consol.seed(`Début de l'import de ${statutCommandes.length} statutCommandes`);
        console.time(`Import de ${statutCommandes.length} statutCommandes`);
        const statutCommandesInsert = "INSERT INTO mada.statut_commande (statut, description) VALUES ($1, $2);";

        for (const statut_commande of statutCommandes) {
            consol.seed(`Import du statut_commande nommé : ${statut_commande.nom}`);
            await db.query(statutCommandesInsert, [statut_commande.nom, statut_commande.description]);
        }

        consol.seed(`Fin de l'import de ${statutCommandes.length} statutCommandes`);
        console.timeEnd(`Import de ${statutCommandes.length} statutCommandes`);

        //! TRANPORTEUR 

        consol.seed(`Début de l'import de ${transporteurs.length} transporteurs`);
        console.time(`Import de ${transporteurs.length} transporteurs`);
        const transporteursInsert = "INSERT INTO mada.transporteur (nom, description, frais_expedition, estime_arrive, estime_arrive_number, logo) VALUES ($1, $2, $3, $4, $5, $6);";

        for (const transporteur of transporteurs) {

            consol.seed(`Import du livraison pour le client id ${transporteur.nom_transporteur}`);
            await db.query(transporteursInsert, [transporteur.nom_transporteur, transporteur.description, transporteur.frais_expedition, transporteur.estime_arrive, transporteur.estime_arrive_number, transporteur.logo]);
        }

        consol.seed(`Fin de l'import de ${transporteurs.length} transporteurs`);
        console.timeEnd(`Import de ${transporteurs.length} transporteurs`);


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



//FLAG                                                                                                                                                                           


        //! Mise en place d'un client avec des droits admin.
        // Avec son numéro de tel vérifié et ok pour recevoir des sms !

        consol.seed("Mise en place d'un admin dans la BDD");
        //await db.query(`UPDATE mada.client SET id_privilege='${process.env.MYPRIVILEGE2}', email='${process.env.EMAILTEST2}', prenom='${process.env.MYFIRST2}', nom_famille='${process.env.MYLAST2}' WHERE id = ${process.env.ID2}; `);

        const client = await db.query(`INSERT INTO mada.client (id_privilege, email,  prenom, nom_famille, password) VALUES ('${process.env.MYPRIVILEGE}', '${process.env.EMAILTEST}', '${process.env.MYFIRST}', '${process.env.MYLAST}', '${process.env.PASSWORD}') RETURNING *;`);
        await db.query(`INSERT INTO mada.admin_phone (admin_telephone, sms_new_commande, id_client) VALUES ('${process.env.MYPHONE}', 'true', ${client.rows[0].id});`);
        await db.query(`INSERT INTO mada.admin_verif_email (verif_email, email_new_commande_choice, id_client) VALUES ('true', 'true', ${client.rows[0].id});`);

        consol.seed(`Admin mis en place en client id ${process.env.ID}`)


        //! Mise en place des infos propre au site (nom, phrase de biencvenue, contact..etc.)

        consol.seed("Mise en place des infos du site dans la BDD");
        await db.query(`INSERT INTO mada.shop (nom, adresse1, code_postal, ville, pays, texte_intro, email_contact, telephone) VALUES('${process.env.SITE}', '${process.env.ADRESSE1}', '${process.env.CODEPOSTAL}', '${process.env.VILLE}', '${process.env.PAYS}','${process.env.TEXTEINTRO}', '${process.env.EMAILCONTACTSITE}', '${process.env.TELEPHONESITE}');`);
        consol.seed(`Données du site mis en place pour le site ${process.env.SITE}`);

        consol.seed("Mise en place des infos Twillio dans la BDD");
        await db.query(`INSERT INTO mada.twillio (twillio_number, dev_number, client_number, account_sid, auth_token, sid_verify, created_date) VALUES ('${process.env.TWILIO_NUMBER}', '${process.env.DEV_NUMBER}', '${process.env.DEV_NUMBER}', '${process.env.TWILIO_ACCOUNT_SID}', '${process.env.TWILIO_AUTH_TOKEN}', '${process.env.SERVICE_SID_VERIFY}', now());`);
        consol.seed(`Fin de la mise en place des données pour Twillio`);

        //! Mise en place de la BDD REDIS des infos STRIPE en cas d'érreur de paiement. 

        const arraycodeErreur = ["authentication_required", "approve_with_id", "call_issuer", "card_not_supported", "card_velocity_exceeded", "currency_not_supported", "do_not_honor", "do_not_try_again", "duplicate_transaction", "expired_card", "fraudulent", "incorrect_number", "incorrect_cvc", "insufficient_funds", "incorrect_zip", "invalid_amount", "invalid_cvc", "invalid_account", "invalid_expiry_month", "invalid_expiry_year", "invalid_number", "issuer_not_available", "lost_card", "merchant_blacklist", "new_account_information_available", "no_action_taken", "not_permitted", "offline_pin_required", "online_or_offline_pin_required", "pickup_card", "pin_try_exceeded", "processing_error", "reenter_transaction", "restricted_card", "revocation_of_all_authorizations", "revocation_of_authorization", "security_violation", "service_not_allowed", "stolen_card", "stop_payment_order", "testmode_decline", "transaction_not_allowed", "try_again_later", "withdrawal_count_limit_exceeded", "generic_decline", "card_declined", "requested_block_on_incorrect_cvc"];

        const infoErreur = ["Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte bancaire a été refusée, car la transaction nécessite une authentification. Essayer de relancer le paiement et d'authentifier votre carte bancaire lorsque vous y serez invité. Si vous recevez ce code de refus de paiement aprés une transaction authentifiée, contacter votre banque pour en savoir plus.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Il n’est pas possible d’autoriser le paiement. Vous pouvez retenter le paiement. S’il ne peut toujours pas être traité, vous pouvez contacter votre banque.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte a été refusée pour une raison inconnue. Contacter votre banque pour en savoir plus.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Ce type d’achat n’est pas pris en charge par cette carte bancaire. Contacter votre banque pour en savoir plus.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Vous avez dépassé le solde ou la limite de crédit disponible sur sa carte bancaire. Contacter votre banque pour en savoir plus.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La devise spécifiée n’est pas prise en charge par cette carte bancaire. Contacter votre banque pour en savoir plus.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte a été refusée pour une raison inconnue. Contacter votre banque pour en savoir plus.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte a été refusée pour une raison inconnue. Contacter votre banque pour en savoir plus.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Une transaction du même montant avec les mêmes informations de carte bancaire a été soumise tout récemment. Contacter votre banque pour en savoir plus.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte bancaire a expiré. Merci d'utiliser une autre carte bancaire. Contacter votre banque pour en savoir plus.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Le paiement a été refusé car il a été identifié comme potentiellement frauduleux. Contacter votre banque pour en savoir plus.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Le numéro de carte bancaire est erroné. Merci de réessayer avec le bon numéro de carte bancaire.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Le code CVC est erroné. Merci de réessayer avec le bon CVC.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte bancaire ne dispose pas de fonds suffisants pour effectuer l’achat. Merci d'utiliser un autre moyen de paiement.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Le code postal est erroné. Merci de réessayer avec le bon code postal.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Le montant du paiement n’est pas valide ou dépasse le montant autorisé par l’émetteur de la carte . Contacter votre banque pour en savoir plus.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Le code CVC est erroné. Merci de réessayer avec le bon CVC.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte bancaire, ou le compte auquel elle est connectée, n’est pas valide. Contacter votre banque pour en savoir plus.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Le mois d’expiration n’est pas valide. Merci de réessayer avec la bonne date d’expiration.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. L’année d’expiration n’est pas valide. Merci de réessayer avec la bonne date d’expiration.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Le numéro de carte bancaire est erroné. Merci de réessayer avec le bon numéro de carte bancaire.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Il n’est pas possible de joindre l’émetteur de la carte, donc d’autoriser le paiement.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Le paiement a été refusé, car la carte bancaire a été déclarée perdue.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte a été refusée pour une raison inconnue. Contacter votre banque pour en savoir plus.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte bancaire, ou le compte auquel elle est connectée, n’est pas valide. Contacter votre banque pour en savoir plus.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte a été refusée pour une raison inconnue. Contacter votre banque pour en savoir plus.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Le paiement n’est pas autorisé. Contacter votre banque pour en savoir plus.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte a été refusée, car un code PIN est requis. Contacter votre banque pour en savoir plus.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte a été refusée, car un code PIN est requis. Contacter votre banque pour en savoir plus.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte ne peut pas être utilisée pour effectuer ce paiement (il est possible qu’elle ait été déclarée perdue ou volée). Contacter votre banque pour en savoir plus.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Le nombre de tentatives autorisées de saisie du code PIN a été dépassé.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Une erreur s’est produite lors du traitement de la carte bancaire. Vous pouvez retenter le paiement. Contacter votre banque pour en savoir plus.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Le paiement n’a pas pu être traité par l’émetteur de la carte pour une raison inconnue. Vous pouvez retenter le paiement. ", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte ne peut pas être utilisée pour effectuer ce paiement (il est possible qu’elle ait été déclarée perdue ou volée). Contacter votre banque pour en savoir plus.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte a été refusée pour une raison inconnue. Contacter votre banque pour en savoir plus.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte a été refusée pour une raison inconnue. Contacter votre banque pour en savoir plus.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte a été refusée pour une raison inconnue. Contacter votre banque pour en savoir plus.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte a été refusée pour une raison inconnue. Contacter votre banque pour en savoir plus.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Le paiement a été refusé, car la carte bancaire a été déclarée volée.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte a été refusée pour une raison inconnue. Contacter votre banque pour en savoir plus.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte utilisée est une carte de test. Utilisez une véritable carte bancaire pour effectuer le paiement", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte a été refusée pour une raison inconnue. Contacter votre banque pour en savoir plus.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte a été refusée pour une raison inconnue. Merci de retenter le paiement", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Vous avez dépassé le solde ou la limite de crédit disponible sur votre carte bancaire. Merci d'utiliser un autre moyen de paiement", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte a été refusée pour une raison inconnue. Merci de contacter votre banque pour en savoir plus.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. La carte a été refusée pour une raison inconnue. Merci de contacter votre banque pour en savoir plus.", "Une erreur est survenu lors du paiement ! Vous n'avez pas été débité. Le code CVC est erroné. Merci de réessayer avec le bon CVC." ];

        //console.log("arraycodeErreur.lehgth ==>> ", arraycodeErreur.length);
        //console.log("infoErreur.length ==>> ", infoErreur.length);

        let i = 0;
        for (const item of arraycodeErreur) {

            await redis.set(`mada/codeErreurPaiement:${item}`, infoErreur[i]);
            i += 1;

            console.log(`code érreur "${item}" STRIPE bien inséré dans REDIS!`);
        }

        const arrayCodeEvenementAPIlaposte = ["DR1", "PC1", "PC2", "ET1", "ET2", "ET3", "ET4", "EP1", "DO1", "DO2", "DO3", "PB1", "PB2", "MD2", "ND1", "AG1", "RE1", "DI1", "DI2"];

        const infoEvenement = ["Déclaratif réceptionné", "Pris en charge", "Pris en charge dans le pays d’expédition", "En cours de traitement", "En cours de traitement dans le pays d’expédition", "En cours de traitement dans le pays de destination", "En cours de traitement dans un pays de transit", "En attente de présentation","Entrée en Douane", "Sortie  de Douane", "Retenu en Douane", "Problème en cours", "Problème résolu", "Mis en distribution", "Non distribuable", "En attente d'être retiré au guichet", "Retourné à l'expéditeur", "Distribué", "Distribué à l'expéditeur"];

        let j = 0;
        for (const item of arrayCodeEvenementAPIlaposte) {

            await redis.set(`mada/codeEvenementAPIlaposte:${item}`, infoEvenement[j]);
            j += 1;

            console.log(`code événement "${item}" API La poste bien inséré dans REDIS!`);
        }

        console.timeEnd("Génération de la fonction seeding");
        consol.admin("FIN DE L'IMPORT");



    } catch (error) {
        console.trace(
            'Erreur dans la méthode seeding',
            error);


    }
};

seeding();