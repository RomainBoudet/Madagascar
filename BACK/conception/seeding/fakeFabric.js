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

        await exec(" dropdb --if-exists madagascar && createdb madagascar && cd .. && cd data && psql madagascar -f Script_Postgres.sql", (error, stdout, stderr) => {
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

        console.time(`Génération de ${volume} personnes`);
        //!
        const custumers = [];
        for (let index = 1; index <= volume; index++) {
            const user = {
                id_for_fk: index,
                addressCustumer_line1: `${(Math.floor(Math.random() * (100 - 1 + 1)) + 1)} ${faker.address.streetPrefix()} ${faker.address.streetName()} `,
                gender: faker.name.gender(),
                phone: faker.phone.phoneNumberFormat(),
                firstName: faker.name.firstName(),
                lastName: faker.name.lastName(),
                email: index + faker.internet.email(), // l'ajout de l'index me permet de n'avoir que des emails unique (postgres ok)
                password: await bcrypt.hash(process.env.PASSWORDTEST, 10), // Permet de connaitre le mot de passe, juste le sel changeant le hash.. sinon => password: await bcrypt.hash((faker.internet.password() + '!!'), 10), //  => pour obtenir un jeu de password dynamique.
                id_privilege: 1,
                addressCustumer_title: "Maison",


            };
            custumers.push(user);
        }


        console.timeEnd(`Génération de ${volume} personnes`);
        console.table(custumers);
        consol.seed('Fin de la génération de fake custumers');


        //!
        consol.seed(`Début de la génération de fake fournisseurs`);
        console.time(`Génération de ${volume} fournisseurs`);

        const manufacturers = [];

        for (let index = 1; index <= volume; index++) {
            const manufacturer = {

                name: faker.company.companyName(),

            };
            manufacturers.push(manufacturer);
        }
        console.timeEnd(`Génération de ${volume} fournisseurs`);
        console.table(manufacturers);
        consol.seed(`Fin de la génération de fake fournisseurs`);
        //!
        consol.seed(`Début de la génération de fake categories`);
        console.time(`Génération de ${volume} categories`);
        const categories = [];

        for (let index = 1; index <= volume; index++) {
            const category = {

                name: faker.commerce.department(),
                description: "ceci est une description d'une catégorie",
                order: index,
                imageURL: faker.image.image()

            };
            categories.push(category);
        }
        console.timeEnd(`Génération de ${volume} categories`);
        console.table(categories);
        consol.seed(`Fin de la génération de fake categories`);

        //!
        consol.seed(`Début de la génération de taxRates`);
        const taxRates = [{
            value: 0.2,
            name: "Taux normal 20%",
            description: "Une taxe sur les produits représentant des biens et des prestations de services (art. 278 du code général des impôts)"
        }, {
            value: 0.05,
            name: "Taux réduit 5%",
            description: "Une taxe sur l'essentiel des produits alimentaires, les produits de protection hygiénique féminine, équipements et services pour handicapés, livres sur tout support, abonnements gaz et électricité, fourniture de chaleur issue d’énergies renouvelables, fourniture de repas dans les cantines scolaires, billeterie de spectacle vivant et de cinéma"
        }];

        console.table(taxRates);
        consol.seed(`Fin de la génération de taxRates`);

        //!

        consol.seed(`Début de la génération de fake zipCodes`);
        console.time(`Génération de ${volume} zipCodes`);
        const zipCodes = [];

        for (let index = 1; index <= volume; index++) {
            const zipCode = {

                city: faker.address.zipCode(),

            };
            zipCodes.push(zipCode);
        }
        console.timeEnd(`Génération de ${volume} zipCodes`);
        console.table(zipCodes);
        consol.seed(`Fin de la génération de fake zipCode`);

        //! 

        consol.seed(`Début de la génération de fake countries`);
        console.time(`Génération de ${volume} countries`);
        const countries = [];

        for (let index = 1; index <= volume; index++) {
            const country = {

                name: faker.address.country(),

            };
            countries.push(country);
        }
        console.timeEnd(`Génération de ${volume} countries`);
        console.table(countries);
        consol.seed(`Fin de la génération de fake countries`);


        //!

        consol.seed(`Début de la génération de fake cities`);
        console.time(`Génération de ${volume} cities`);
        const cities = [];

        for (let index = 1; index <= volume; index++) {
            const city = {

                name: faker.address.city(),

            };
            cities.push(city);
        }
        console.timeEnd(`Génération de ${volume} cities`);
        console.table(cities);
        consol.seed(`Fin de la génération de fake cities`);

        //!

        consol.seed(`Début de la génération de fake orderedProducts`);
        console.time(`Génération de ${volume*2} orderedProducts`);
        const orderedProducts = [];

        for (let index = 1; index <= volume * 2; index++) {
            const orderedProduct = {

                name: faker.commerce.product(),
                quantity: Math.floor(Math.random() * (5 - 1 + 1)) + 1, // un random entre 1 et 5.
                price: faker.commerce.price(),

            };
            orderedProducts.push(orderedProduct);
        }
        console.timeEnd(`Génération de ${volume*2} orderedProducts`);
        console.table(orderedProducts);
        consol.seed(`Fin de la génération de fake orderedProducts`);

        //!

        consol.seed(`Début de la génération de fake basquetProducts`);
        console.time(`Génération de ${volume*2} basquetProducts`);
        const basquetProducts = [];
        const valideOuNon = ["Panier validé et payé", "Panier non validé"];
        for (let index = 1; index <= volume * 2; index++) {
            const basquetProduct = {

                quantity: Math.floor(Math.random() * (5 - 1 + 1)) + 1, // un random entre 1 et 5.
                dateAdded: faker.date.past(),
                //dateRemoved: faker.date.past(),
                status: valideOuNon[Math.floor(Math.random() * valideOuNon.length)], // un random entre "Validé" ou "non validé"
                imageMini: faker.image.image(),
                custumer: Math.floor(Math.random() * ((volume - 1) - 1 + 1)) + 1, // un random entre 1 et 100 (notre nombre de client en BDD)
            };
            basquetProducts.push(basquetProduct);
        }
        console.timeEnd(`Génération de ${volume*2} basquetProducts`);
        console.table(basquetProducts);
        consol.seed(`Fin de la génération de fake basquetProducts`);

        //!


        // les données nécéssaire a la table addressCustumer sont extraites du tableau custumer.



        //!

        consol.seed(`Début de la génération de fake products`);
        console.time(`Génération de ${volume*3} products`);
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
                quantity: Math.floor(Math.random() * (100 - 1 + 1)) + 1, // un random entre 1 et 100
                id_manufacturer: Math.floor(Math.random() * ((volume - 1) - 1 + 1)) + 1,
                id_category: Math.floor(Math.random() * (100 - 1 + 1)) + 1,
                id_taxRate: Math.floor(Math.random() * (2 - 1 + 1)) + 1, // un random entre 1 et 2

            };
            products.push(product);
        }
        console.timeEnd(`Génération de ${volume*3} products`);
        console.table(products);
        consol.seed(`Fin de la génération de fake products`);

        //!

        consol.seed(`Début de la génération de fake imageProducts`);
        console.time(`Génération de ${volume*3} imageProducts`);
        const descriptions = ["Produit vu de face", "Produit vu de 3/4", "Produit vu de l'arriére", "Produit vu de dessus", "Produit vu de coté"];
        const imageProducts = [];

        for (let index = 1; index <= volume * 3; index++) {
            const imageProduct = {

                descriptionImage: descriptions[Math.floor(Math.random() * descriptions.length)],
                orderImage: 1,
                URLImage: faker.image.image(),
                id_productImage: index,


            };
            imageProducts.push(imageProduct);
        }
        console.timeEnd(`Génération de ${volume*3} imageProducts`);
        console.table(imageProducts);
        consol.seed(`Fin de la génération de fake imageProducts`);

        //!

        consol.seed(`Début de la génération de fake reviews`);
        console.time(`Génération de ${volume*3} reviews`);
        const reviews = [];

        for (let index = 1; index <= volume * 3; index++) {
            const review = {

                rating: Math.floor(Math.random() * (5 - 0 + 1)) + 0, // un random entre 0 et 5,
                text: faker.lorem.sentence(),
                title: faker.lorem.words(),
                id_product: Math.floor(Math.random() * (300 - 1 + 1)) + 1, // un random entre 1 et 300,
                id_custumer: Math.floor(Math.random() * (100 - 1 + 1)) + 1, // un random entre 1 et 100,

            };
            reviews.push(review);
        }
        console.timeEnd(`Génération de ${volume*3} reviews`);
        console.table(reviews);
        consol.seed(`Fin de la génération de fake reviews`);

        //!

        consol.seed(`Début de la génération de fake orderPayements`);
        console.time(`Génération de ${volume/2} orderPayements`);
        const orderPayements = [];

        for (let index = 1; index <= volume / 2; index++) {
            const orderPayement = {

                ref: index + 9000,
                amount: faker.finance.amount(),
                way: faker.finance.transactionDescription(),
                id_order: index,

            };
            orderPayements.push(orderPayement);
        }
        console.timeEnd(`Génération de ${volume/2} orderPayements`);
        console.table(orderPayements);
        consol.seed(`Fin de la génération de fake orderPayements`);

        //!

        consol.seed(`Début de la génération de fake invoices`);
        console.time(`Génération de ${volume/2} invoices`);
        const invoices = [];

        for (let index = 1; index <= volume / 2; index++) {
            const invoice = {

                ref: index + 9000, // une ref UNIQUE
                id_custumer: Math.floor(Math.random() * (100 - 1 + 1)) + 1, // un random entre 1 et 100,
                id_order: index,
            };
            invoices.push(invoice);
        }
        console.timeEnd(`Génération de ${volume/2} invoices`);
        console.table(invoices);
        consol.seed(`Fin de la génération de fake invoices`);



        //!

        consol.seed(`Début de la génération de fake orders`);
        console.time(`Génération de ${volume/2} orders`);
        const status = ["En cours de  préparation", "paiement accepté", "En cours de livraisons", "Livraison éffectuée"];
        const arrayNumber100 = Array.from({
            length: 100
        }, (_, i) => i + 1); // un tableau avec des valeurs allant de 1 a 100 // si on veut commençer a zero => Array.from(Array(10).keys())
        const orders = [];

        for (let index = 1; index <= volume / 2; index++) {
            const order = {

                ref: index + 9000, // une ref UNIQUE
                status: status[Math.floor(Math.random() * status.length)],
                comments: faker.lorem.sentence(),
                id_custumer: arrayNumber100[Math.floor(Math.random() * arrayNumber100.length)],
                trackingNumber: faker.datatype.number({
                    min: 9999,
                    max: 100000,
                    precision: 2
                }),
                linkForTracking: faker.image.imageUrl(),
                weight: faker.datatype.number(9),
            };
            orders.push(order);
        }
        console.timeEnd(`Génération de ${volume/2} orders`);
        console.log(orders);
        consol.seed(`Fin de la génération de fake orders`);


        //!

        consol.seed(`Début de la génération de fake transporters`);
        console.time(`Génération de ${volume/2} transporters`);
        const arrayNumber50 = Array.from({
            length: 50
        }, (_, i) => i + 1);
        const transporters = [];

        const transporteurs = [{
                cost: 7.20,
                logo: faker.image.business(),
                name: "DPD",
                estimateDelivery: "Expédié sous 24 à 48h",
                description: "DPD EN POINT RELAIS PICKUP",
                id_order: arrayNumber50[Math.floor(Math.random() * arrayNumber50.length)],
            }, {
                cost: 14.00,
                logo: faker.image.business(),
                name: "TNT",
                estimateDelivery: "Livraison le lendemain pour toute commande avant 12h00",
                description: "EXPRESS À DOMICILE POUR UNE LIVRAISON À DOMICILE EN FRANCE MÉTROPOLITAINE. LIVRAISON EN MAINS PROPRES ET CONTRE SIGNATURE DÈS LE LENDEMAIN DE L'EXPÉDITION DE VOTRE COMMANDE (1).(1) AVANT 13 HEURES OU EN DÉBUT D'APRÈS-MIDI EN ZONE RURALE.",
                id_order: arrayNumber50[Math.floor(Math.random() * arrayNumber50.length)],
            },
            {
                cost: 0,
                logo: faker.image.business(),
                name: "Retrait sur le stand durant le prochain marché",
                estimateDelivery: "Durant le prochain marché. Nous contacter pour connaitre la date",
                description: "Une livraison de la main a la main, sur notre stand",
                id_order: arrayNumber50[Math.floor(Math.random() * arrayNumber50.length)],
            }, {
                cost: 12.00,
                logo: faker.image.business(),
                name: "La poste Collisimmo",
                estimateDelivery: "Livraison dans les 48h a 72h",
                description: "Le service colis de La Poste",
                id_order: arrayNumber50[Math.floor(Math.random() * arrayNumber50.length)],
            }
        ];

        for (let index = 1; index <= volume / 2; index++) {
            const transporter = {

                randomTransport: transporteurs[Math.floor(Math.random() * transporteurs.length)]

            };
            transporters.push(transporter);
        }

        console.timeEnd(`Génération de ${volume/2} transporters`);
        console.log(transporters); // structure => [{randomTransporter:{}}]  
        consol.seed(`Fin de la génération de fake transporters`);

        //!

        // nb product généré : volume * 3
        // nb basquetProduct généré : volume * 2

        consol.seed(`Début de la génération de fake basquetProduct_has_products`);
        console.time(`Génération de ${volume} basquetProduct_has_products`);
        const arrayNumber300 = Array.from({
            length: 300
        }, (_, i) => i + 1);
        const arrayNumber200 = Array.from({
            length: 200
        }, (_, i) => i + 1);
        const basquetProduct_has_products = [];


        for (let index = 1; index <= volume; index++) {
            const basquetProduct_has_product = {

                id_basquetProduct: arrayNumber200[Math.floor(Math.random() * arrayNumber200.length)],
                id_product: arrayNumber300[Math.floor(Math.random() * arrayNumber300.length)],
            };
            basquetProduct_has_products.push(basquetProduct_has_product);
        }
        console.timeEnd(`Génération de ${volume} basquetProduct_has_products`);
        console.table(basquetProduct_has_products);
        consol.seed(`Fin de la génération de fake basquetProduct_has_products`);



        //!




        //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!IMPORT DES DONNEES EN BDD!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

        // on a générer des fausses des données, ne reste plus qu'a les importer dans la BDD (dans le bon ordre).

        //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!IMPORT DES DONNEES EN BDD!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!



        consol.seed(`Début de l'import des ${volume} fournisseurs`);

        const fournisseursInsert = "INSERT INTO mada.manufacturer (manufacturer_name) VALUES ($1) RETURNING id;";


        for (const manufacturer of manufacturers) {
            consol.seed(`Import du fournisseur nommé : ${manufacturer.name}`);
            const result = await db.query(fournisseursInsert, [manufacturer.name]);
        }

        consol.seed(`Fin de l'import des ${volume} fournisseurs`);

        //!

        consol.seed(`Début de l'import des ${volume} categories`);

        const categoriesInsert = "INSERT INTO mada.category (category_name, category_description, category_order , category_imageURL) VALUES ($1, $2, $3, $4) RETURNING id;";


        for (const category of categories) {
            consol.seed(`Import de la categorie nommé : ${category.name}`);
            const result = await db.query(categoriesInsert, [category.name, category.description, category.order, category.imageURL]);

            // dans result, il y aura une propriété rows qui contiendra nos données
            //category.id = result.rows[0].id; // on stocke l'id directement dans la catégorie correspondante
        }

        consol.seed(`Fin de l'import des ${volume} categories`);


        //!

        consol.seed(`Début de l'import des 2 taxRates`);

        const taxRatesInsert = "INSERT INTO mada.taxRate (taxRate_value, taxRate_name, taxRate_description) VALUES ($1, $2, $3) RETURNING id;";

        for (const taxRate of taxRates) {
            consol.seed(`Import du taxRates nommé : ${taxRate.name}`);
            await db.query(taxRatesInsert, [taxRate.value, taxRate.name, taxRate.description]);
        }

        consol.seed(`Fin de l'import des 2 taxRates`);

        //!

        consol.seed(`Début de l'import de ${volume} zipCodes`);

        const zipCodesInsert = "INSERT INTO mada.zipCode (zipCode_city) VALUES ($1) RETURNING id;";

        for (const zipCode of zipCodes) {
            consol.seed(`Import du zipCode nommé : ${zipCode.city}`);
            await db.query(zipCodesInsert, [zipCode.city]);
        }

        consol.seed(`Fin de l'import de ${volume} zipCodes`);


        //!

        consol.seed(`Début de l'import de ${volume} countries`);

        const countriesInsert = "INSERT INTO mada.country (country_name) VALUES ($1) RETURNING id;";

        for (const country of countries) {
            consol.seed(`Import du country nommé : ${country.name}`);
            await db.query(countriesInsert, [country.name]);
        }

        consol.seed(`Fin de l'import de ${volume} countries`);

        //!


        consol.seed(`Début de l'import de ${volume} cities`);

        const citiesInsert = "INSERT INTO mada.city (city_name) VALUES ($1) RETURNING id;";

        for (const city of cities) {
            consol.seed(`Import du city nommé : ${city.name}`);
            await db.query(citiesInsert, [city.name]);
        }

        consol.seed(`Fin de l'import  de ${volume} cities`);


        //!


        consol.seed(`Début de l'import de ${volume*2} orderedProducts`);

        const orderedProductsInsert = "INSERT INTO mada.orderedProduct (orderedProduct_name, orderedProduct_quantity, orderedProduct_price) VALUES ($1, $2, $3) RETURNING id;";

        for (const orderedProduct of orderedProducts) {
            consol.seed(`Import du orderedProduct nommé : ${orderedProduct.name}`);
            await db.query(orderedProductsInsert, [orderedProduct.name, orderedProduct.quantity, orderedProduct.price]);
        }

        consol.seed(`Fin de l'import de ${volume*2} orderedProducts`);

        //!


        consol.seed("Début de l'import des privileges");
        // je dois importer en premier la table des privileges sinon érreur de clé étrangére avec la table custumer

        const privileges = ['Custumer', 'Administrateur', 'Developpeur'];

        console.time(`Import de ${privileges.length} privileges`);

        const privilegeInsert = "INSERT INTO mada.privilege (privilege_name) VALUES ($1) RETURNING id;";

        for (let i = 0; i < privileges.length; i++) {
            consol.seed(`Import du privilege ${[i]}`);

            const result = await db.query(privilegeInsert, [privileges[i]]);
        }
        consol.seed("Fin de l'import des privileges");
        console.timeEnd(`Import de ${privileges.length} privileges`);

        //!

        consol.seed(`Début de l'import de ${custumers.length} clients`);
        console.time(`Import de ${custumers.length} clients`);
        const custumersInsert = "INSERT INTO mada.custumer (custumer_gender, custumer_firstName, custumer_lastName, custumer_email, custumer_password, id_privilege) VALUES ($1, $2, $3 ,$4, $5, $6) RETURNING id;";

        for (const custumer of custumers) {
            consol.seed(`Import du client prénomé : ${custumer.firstName}`);
            const result = await db.query(custumersInsert, [custumer.gender, custumer.firstName, custumer.lastName, custumer.email, custumer.password, custumer.id_privilege]);
        }

        consol.seed(`Fin de l'import de ${custumers.length} clients`);
        console.timeEnd(`Import de ${custumers.length} clients`);



        //!

        consol.seed(`Début de l'import de ${basquetProducts.length} basquetProducts`);
        console.time(`Import de ${basquetProducts.length} basquetProducts`);
        const basquetProductsInsert = "INSERT INTO mada.basquetProduct (basquetProduct_quantity, basquetProduct_dateAdded, basquetProduct_status, basquetProduct_imageMini, id_custumer) VALUES ($1, $2, $3 ,$4, $5) RETURNING id;";

        for (const basquetProduct of basquetProducts) {
            consol.seed(`Import du basquetProduct du client id : ${basquetProduct.custumer}`);
            const result = await db.query(basquetProductsInsert, [basquetProduct.quantity, basquetProduct.dateAdded, basquetProduct.status, basquetProduct.imageMini, basquetProduct.custumer]);
        }

        consol.seed(`Fin de l'import de ${basquetProducts.length} basquetProducts`);
        console.timeEnd(`Import de ${basquetProducts.length} basquetProducts`);

        //! 

        consol.seed(`Début de l'import de ${custumers.length} addressCustumers`);
        console.time(`Import de ${custumers.length} addressCustumers`);
        const addressCustumersInsert = "INSERT INTO mada.addressCustumer (addressCustumer_title, addressCustumer_firstName, addressCustumer_lastName, addressCustumer_line1, addressCustumer_phone, id_custumer, id_country, id_zipCode) VALUES ($1, $2, $3 ,$4, $5, $6, $7, $8) RETURNING id;";

        for (const addressCustumer of custumers) {
            consol.seed(`Import d l'addressCustumer du client habitant : ${addressCustumer.addressCustumer_line1}`);
            const result = await db.query(addressCustumersInsert, [addressCustumer.addressCustumer_title, addressCustumer.firstName, addressCustumer.lastName, addressCustumer.addressCustumer_line1, addressCustumer.phone, addressCustumer.id_for_fk, addressCustumer.id_for_fk, addressCustumer.id_for_fk]);
        }

        consol.seed(`Fin de l'import de ${custumers.length} addressCustumers`);
        console.timeEnd(`Import de ${custumers.length} addressCustumers`);

        //! 

        consol.seed(`Début de l'import de ${products.length} products`);
        console.time(`Import de ${products.length} products`);
        const productsInsert = "INSERT INTO mada.product (product_name , product_description, product_price, product_color, product_size , product_stockQuantity, id_manufacturer, id_category, id_taxRate) VALUES ($1, $2, $3 ,$4, $5, $6, $7, $8, $9);";

        for (const product of products) {
            consol.seed(`Import du product ayant pour nom : ${product.name} et id_category : ${product.id_category}`);
            const result = await db.query(productsInsert, [product.name, product.description, product.price, product.color, product.size, product.quantity, product.id_manufacturer, product.id_category, product.id_taxRate]);
        }

        consol.seed(`Fin de l'import de ${products.length} products`);
        console.timeEnd(`Import de ${products.length} products`);

        //!

        consol.seed(`Début de l'import de ${imageProducts.length} imageProducts`);
        console.time(`Import de ${imageProducts.length} imageProducts`);
        const imageProductsInsert = "INSERT INTO mada.imageProduct (imageProduct_description , imageProduct_order, imageProduct_URL, id_product) VALUES ($1, $2, $3 ,$4);";

        for (const imageProduct of imageProducts) {
            consol.seed(`Import du imageProduct de l'id_Product : ${imageProduct.id_productImage}`);
            const result = await db.query(imageProductsInsert, [imageProduct.descriptionImage, imageProduct.orderImage, imageProduct.URLImage, imageProduct.id_productImage]);
        }

        consol.seed(`Fin de l'import de ${imageProducts.length} imageProducts`);
        console.timeEnd(`Import de ${imageProducts.length} imageProducts`);

        //!

        consol.seed(`Début de l'import de ${reviews.length} reviews`);
        console.time(`Import de ${reviews.length} reviews`);
        const reviewsInsert = "INSERT INTO mada.review (review_rating , review_text, review_title, id_product, id_custumer) VALUES ($1, $2, $3, $4, $5);";

        for (const review of reviews) {
            consol.seed(`Import de la review de l'id_Product : ${review.id_product}`);
            const result = await db.query(reviewsInsert, [review.rating, review.text, review.title, review.id_product, review.id_custumer]);
        }

        consol.seed(`Fin de l'import de ${reviews.length} reviews`);
        console.timeEnd(`Import de ${reviews.length} reviews`);





        //! order

        consol.seed(`Début de l'import de ${orders.length} orders`);
        console.time(`Import de ${orders.length} orders`);
        const ordersInsert = "INSERT INTO mada.order (order_reference, order_status, order_comments, order_trackingNumber, order_linkForTracking, order_weight, id_custumer) VALUES ($1, $2, $3, $4, $5, $6, $7);";

        for (const order of orders) {
            consol.seed(`Import de la order de l'id_custumer : ${order.id_custumer}`);
            const result = await db.query(ordersInsert, [order.ref, order.status, order.comments, order.trackingNumber, order.linkForTracking, order.weight, order.id_custumer]);
        }

        consol.seed(`Fin de l'import de ${orders.length} orders`);
        console.timeEnd(`Import de ${orders.length} orders`);
        //! Invoice

        consol.seed(`Début de l'import de ${invoices.length} invoices`);
        console.time(`Import de ${invoices.length} invoices`);
        const invoicesInsert = "INSERT INTO mada.invoice (invoice_reference, id_custumer,  id_order) VALUES ($1, $2, $3);";

        for (const invoice of invoices) {
            consol.seed(`Import de l'invoice de l'id_custumer : ${invoice.id_custumer} avec pour ref : ${invoice.ref}`);
            const result = await db.query(invoicesInsert, [invoice.ref, invoice.id_custumer, invoice.id_order]);
        }

        consol.seed(`Fin de l'import de ${invoices.length} invoices`);
        console.timeEnd(`Import de ${invoices.length} invoices`);


        //! orderPayement

        consol.seed(`Début de l'import de ${orderPayements.length} orderPayements`);
        console.time(`Import de ${orderPayements.length} orderPayements`);
        const orderPayementsInsert = "INSERT INTO mada.orderPayement (orderPayement_reference , orderPayement_amount, orderPayement_way, id_order) VALUES ($1, $2, $3, $4);";

        for (const orderPayement of orderPayements) {
            consol.seed(`Import de l'orderPayement ref : ${orderPayement.way}`);
            const result = await db.query(orderPayementsInsert, [orderPayement.ref, orderPayement.amount, orderPayement.way, orderPayement.id_order]);
        }

        consol.seed(`Fin de l'import de ${orderPayements.length} orderPayements`);
        console.timeEnd(`Import de ${orderPayements.length} orderPayements`);


        //! transporter

        consol.seed(`Début de l'import de ${transporters.length} transporters`);
        console.time(`Import de ${transporters.length} transporters`);
        const transportersInsert = "INSERT INTO mada.transporter (transporter_cost, transporter_logo, transporter_name, transporter_estimatedDelivery, transporter_description, id_order) VALUES ($1, $2, $3, $4, $5, $6);";

        for (const transporter of transporters) {
            consol.seed(`Import de du transporter nommé : ${transporter.randomTransport.name}`);
            const result = await db.query(transportersInsert, [transporter.randomTransport.cost, transporter.randomTransport.logo, transporter.randomTransport.name, transporter.randomTransport.estimateDelivery, transporter.randomTransport.description, transporter.randomTransport.id_order]);
        }

        consol.seed(`Fin de l'import de ${transporters.length} transporters`);
        console.timeEnd(`Import de ${transporters.length} transporters`);


        //!
        /* const basquetProduct_has_product = {
                
            id_basquetProduct:  arrayNumber200[Math.floor(Math.random() * arrayNumber200.length)],
            id_product: arrayNumber300[Math.floor(Math.random() * arrayNumber300.length)],
        }; */

        consol.seed(`Début de l'import de ${basquetProduct_has_products.length} basquetProduct_has_products`);
        console.time(`Import de ${basquetProduct_has_products.length} basquetProduct_has_products`);
        const basquetProduct_has_productsInsert = "INSERT INTO mada.basquetProduct_has_product (id_basquetProduct, id_product) VALUES ($1, $2);";

        for (const basquetProduct_has_product of basquetProduct_has_products) {
            consol.seed(`Import de basquetProduct_has_product avec l'id-product  : ${basquetProduct_has_product.id_product}`);
            const result = await db.query(basquetProduct_has_productsInsert, [basquetProduct_has_product.id_basquetProduct , basquetProduct_has_product.id_product]);
        }

        consol.seed(`Fin de l'import de ${basquetProduct_has_products.length} basquetProduct_has_products`);
        console.timeEnd(`Import de ${basquetProduct_has_products.length} basquetProduct_has_products`);

        //!
        // Mise en place d'un custumer avec des droits admin.
        consol.seed("Mise en place d'un admin dans la BDD");
        await db.query(`UPDATE mada.custumer SET id_privilege='${process.env.MYPRIVILEGE}', custumer_email='${process.env.EMAILTEST}', custumer_phoneForAdminOnly='${process.env.MYPHONE}', custumer_firstName='${process.env.MYFIRST}', custumer_lastName='${process.env.MYLAST}' WHERE id = ${process.env.ID}; `);
        await db.query(`INSERT INTO mada.adminVerification (adminVerification_email, adminVerification_phone, id_custumer) VALUES ('true', 'true', ${process.env.ID});`);
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