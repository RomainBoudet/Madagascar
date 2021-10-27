require('dotenv').config({
    path: `${__dirname}/../.env.back`
});

const {
    expect
} = require('chai');
const chalk = require('chalk');

//! test sur mon schéma userLogin

const userLoginSchema = require('../app/schemas/userLoginSchema');

// le mot de passe d'un utilisateur, doit avoir 8 caractéres au minimum, une lettre minuscule, une lettre majuscule, un nombre et un caractéres spécial parmis : (!@#$%^&*)

let mockLogin;

describe(chalk.magenta('Test de validation du userLoginSchema :'), function () {

    //préparer un contexte favorable a l'exécution des test unitaire
    before(function () {
        mockLogin = {
            email: 'test@test.fr',
            password: 'AZEaze123!'
        };

    })

    it('should validate a valid login (password and email)', function () {
        // validate sur un schema Joi retourne un objet avec systématiquement une propriétée value et en cas d'érreur, une propriété error 
        expect(userLoginSchema.validate(mockLogin)).not.to.have.property('error');
    });


    it("should not validate the password format (without special caracteres)", function () {

        // Valider qu'un schéma invalide, retourne une érreur si le mot de passe n'a pas le bon format :
        mockLogin.password = 'mot_de_passe_sans_chiffre';
        expect(userLoginSchema.validate(mockLogin)).to.have.property('error');

        const validation = userLoginSchema.validate(mockLogin).error.details[0].path[0];
        // Ne pas oublier que tous les tests intermédaires sont inutiles car déja testé par Joi...
        // je cherche une info significative qui me prouve que l'érreur vient bien du password !
        expect(validation).to.deep.equal('password');
    })



    it("should not validate the email format (without @)", function () {

        //je remet un bon mot de passe :
        mockLogin.password = 'AZEFDDsdff43@';
        //et j'introduis un mauvais email :
        mockLogin.email = 'coucoutest.fr'

        // Valider qu'un schéma invalide me retourne bien une érreur si le mail n'a pas le bon format :
        expect(userLoginSchema.validate(mockLogin)).to.have.property('error');

        const validation2 = userLoginSchema.validate(mockLogin).error.details[0].message;

        expect(validation2).to.equal('Le format de votre email est incorrect');

    });


});

const db = require('../app/database');

const Client = require('../app/models/client');

const user ={};

describe(chalk.yellow('Model Client'), function () {


    before(async function () {

        const {rows} = await db.query('INSERT INTO mada.client (prenom, nom_famille, email, password, id_privilege) VALUES ($1, $2, $3 ,$4, $5) RETURNING *;', ['Barack', 'Obama', 'obama@whiteHouse.us', '$2b$10$NTmOgZb2fN1QxewdWOYchOVQXUtUSaW47uOCBhRJ2zi1s2dK4kJsi', 1]);
        user.id = rows[0].id;
    });

    after(async function () {

        await db.query("DELETE FROM mada.client WHERE id = $1", [user.id])

    });

    describe('#findOne', function () {

        it('should validate the findOne methode', function () {

            it('should fetch an instance of Post', async function(){
                const theClient = await Client.findOne(user.id);

                expect (theClient).to.be.an.instanceOf(Client)
            })
        })
    });
});