const consol = require('../../app/services/colorConsole')
const db = require('../../app/database');
require('dotenv').config({
    path: `${__dirname}/../../.env.back`
}); // j'aurai toutes les infos de connexion nécessaires 
const bcrypt = require('bcrypt');

// Construction d'un faux jeu de donnée pour mes tables via Faker qui sera donné à un script d'import

const faker = require('faker');

faker.locale = 'fr';

const volume = process.env.VOLUMEFAKECUSTUMER;

const myPasswordTest = process.env.PASSWORDTEST;

const custumers = [];



const fakeData = async () => {

    consol.seed('Début de la génération !')

    console.time(`Génération de ${volume} personnes`);

    for (let index = 0; index < volume; index++) {
        const user = {

            gender: faker.name.gender(),
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            email: index + faker.internet.email(), // l'ajout de l'index me permet de n'avoir que des emails unique (postgres ok)
            password: await bcrypt.hash(myPasswordTest, 10), // Permet de connaitre le mot de passe, juste le sel changeant le hash.. sinon => password: await bcrypt.hash((faker.internet.password() + '!!'), 10), //  => pour obtenir un jeu de password dynamique.
            id_privilege: 1
        };
        custumers.push(user);
    }


    console.timeEnd(`Génération de ${volume} personnes`);
    consol.seed('Fin de la génération de fake custumers');
    console.table(custumers);

    // Import des données en BDD

    consol.seed("Début de l'import des privileges");
    // je dois importer en premier la table des privileges sinon érreur de clé étrangére avec la table custumer

    const privileges = ['Custumer', 'Administrateur', 'Developpeur'];

    console.time(`Import de ${privileges.length} privileges`);

    const privilegeInsert = "INSERT INTO mada.privilege (privilege_name) VALUES ($1) RETURNING id;";

    await db.query('TRUNCATE TABLE mada.privilege RESTART IDENTITY CASCADE;'); // on supprime ce qui se trouve dans la table avant (TRUNCATE comparé a DELETE va ré-initialiser la valeur de l’auto-incrément et est plus rapide). CASCADE car des données sont liées, attention, plus de 13 tables liées entre elles vont être supprimées..

    for (let i = 0; i < privileges.length; i++) {
        consol.seed(`Import du privilege ${[i]}` );

        const result = await db.query(privilegeInsert, [privileges[i]]);

        // dans result, il y aura une propriété rows qui contiendra nos données
        privileges.id = result.rows[0].id; // on stocke l'id directement dans la catégorie correspondante

    }
    consol.seed("Fin de l'import des privileges");
    console.timeEnd(`Import de ${privileges.length} privileges`);

    consol.seed(`Début de l'import de ${custumers.length} clients`);
    console.time(`Import de ${custumers.length} clients`);
    const custumersInsert = "INSERT INTO mada.custumer (custumer_gender, custumer_firstName, custumer_lastName, custumer_email, custumer_password, id_privilege) VALUES ($1, $2, $3 ,$4, $5, $6) RETURNING id;";


    await db.query('DELETE FROM mada.custumer;');

    for (const custumer of custumers) {
        consol.seed(`Import du client prénomé : ${custumer.firstName}`);
        const result = await db.query(custumersInsert, [custumer.gender, custumer.firstName, custumer.lastName, custumer.email, custumer.password, custumer.id_privilege]);

        // dans result, il y aura une propriété rows qui contiendra nos données
        custumer.id = result.rows[0].id; // on stocke l'id directement dans la catégorie correspondante
    }
    
    consol.seed(`Fin de l'import de ${custumers.length} clients`);
    console.timeEnd(`Import de ${custumers.length} clients`);
};

fakeData();



