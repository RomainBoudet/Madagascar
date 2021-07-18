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
                description: "ceci est une description d'une catégorie",
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
                addressCustumer_line1: `${(Math.floor(Math.random() * (100 - 1 + 1)) + 1)} ${faker.address.streetPrefix()} ${faker.address.streetName()} `,
                phone: faker.phone.phoneNumberFormat(),
                prenom: faker.name.firstName(),
                nom_famille: faker.name.lastName(),
                email: index + faker.internet.email(), // l'ajout de l'index me permet de n'avoir que des emails unique (postgres ok)
                password: await bcrypt.hash(process.env.PASSWORDTEST, 10), // Permet de connaitre le mot de passe, juste le sel changeant le hash.. sinon => password: await bcrypt.hash((faker.internet.password() + '!!'), 10), //  => pour obtenir un jeu de password dynamique.
                id_privilege: 1,
                addressCustumer_title: "Maison",
            };
            custumers.push(user);
        }


        console.timeEnd(`Génération de ${volume} clients`);
        console.table(custumers);
        consol.seed('Fin de la génération de fake clients');


        //! PANIER


        consol.seed(`Début de la génération de fake paniers`);
        console.time(`Génération de ${volume*2} paniers`);
        const basquetProducts = [];
        //const valideOuNon = ["Panier validé et payé", "Panier non validé"];
        for (let index = 1; index <= volume * 2; index++) {
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
        console.timeEnd(`Génération de ${volume*2} paniers`);
        console.table(basquetProducts);
        consol.seed(`Fin de la génération de fake paniers`);




















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

        const privileges = ['Custumer', 'Administrateur', 'Developpeur'];

        console.time(`Import de ${privileges.length} privileges`);

        const privilegeInsert = "INSERT INTO mada.privilege (nom) VALUES ($1);";

        for (let i = 0; i < privileges.length; i++) {
            consol.seed(`Import du privilege ${[i]}`);

            const result = await db.query(privilegeInsert, [privileges[i]]);
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

        //! 

        


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