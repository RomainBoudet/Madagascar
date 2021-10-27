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

describe(chalk.magenta('Test de validation du userLoginSchema JOI :'), function () {

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


//! Test sur adressePostSchema

const adressePostSchema = require('../app/schemas/adressePostSchema');


describe(chalk.magenta('Test de validation du adressePostSchema JOI :'), function () {

    before(function () {

        mockAddress = {
            password: 'test',
            prenom: 'George',
            nomFamille: 'Washington',
            ligne1: 'The White House 1600 Pennsylvania Ave NW Washington',
            ligne2: 'Appart 2',
            telephone: '+33603420629',
            titre: 'White_house',
            ville: 'Whashington DC',
            pays: 'United States of America',
            codePostal: '07170',
            envoie: 'TRUE',
        };
    });

    it('should validate a valid address', function () {

        // validate sur un schema Joi retourne un objet avec systématiquement une propriétée value et en cas d'érreur, une propriété error 
        expect(adressePostSchema.validate(mockAddress)).not.to.have.property('error');
    });

    it("should not validate the telephone format (without + caractere)", function () {

        // Valider qu'un schéma invalide, retourne une érreur si le mot de passe n'a pas le bon format :
        mockAddress.telephone = '33603420629';
        expect(adressePostSchema.validate(mockAddress)).to.have.property('error');

        const validation = adressePostSchema.validate(mockAddress).error.details[0].path[0];
        // Ne pas oublier que tous les tests intermédaires sont inutiles car déja testé par Joi...
        // je cherche une info significative qui me prouve que l'érreur vient bien du password !
        expect(validation).to.deep.equal('telephone');
    })

    it("should not validate the codePostal format (more than 5 number)", function () {

        mockAddress.codePostal = '072004';
        //et je ré-introduis un téléphone valide :
        mockAddress.telephone = '+33603420629';
        // Valider qu'un schéma invalide me retourne bien une érreur si le mail n'a pas le bon format :
        expect(adressePostSchema.validate(mockAddress)).to.have.property('error');

        const validation2 = adressePostSchema.validate(mockAddress).error.details[0].message;
        expect(validation2).to.equal('Le format de votre code postale est incorrect : Il doit être composé de 5 chiffres.');

    });

});

//! Test sur adresseSchema

// seul le password est required !

const adresseSchema = require('../app/schemas/adresseSchema');


describe(chalk.magenta('Test de validation du adresseSchema JOI :'), function () {

    before(function () {

        mockAddress = {
            password: 'test',
            //prenom: 'George', On enléve certaine données
            nomFamille: 'Washington',
            //ligne1: 'The White House 1600 Pennsylvania Ave NW Washington',
            ligne2: 'Appart 2',
            telephone: '+33603420629',
            titre: 'White_house',
            ville: 'Whashington DC',
            pays: 'United States of America',
            //codePostal: '07170',
            envoie: 'TRUE',
        };
    });

    it('should validate an incomplete address to patch', function () {

        // validate sur un schema Joi retourne un objet avec systématiquement une propriétée value et en cas d'érreur, une propriété error 
        expect(adresseSchema.validate(mockAddress)).not.to.have.property('error');
    });

    it("should not validate the telephone format (without + caractere)", function () {

        mockAddress.telephone = '33603420629';
        expect(adresseSchema.validate(mockAddress)).to.have.property('error');

        const validation = adresseSchema.validate(mockAddress).error.details[0].path[0];
        expect(validation).to.deep.equal('telephone');
    })

    it("should not validate the envoie format (not true)", function () {

        mockAddress.envoie = 'false';
        //et je ré-introduis un téléphone valide :
        mockAddress.telephone = '+33603420629';
        expect(adresseSchema.validate(mockAddress)).to.have.property('error');

        const validation2 = adresseSchema.validate(mockAddress).error.details[0].message;
        expect(validation2).to.equal('La valeur de ce champs ne peut que être true si le champs existe');

    });

});

//! Test sur choixLivraisonSchema

const choixLivraisonSchema = require('../app/schemas/choixLivraisonSchema');


describe(chalk.magenta('Test de validation du choixLivraisonSchema JOI :'), function () {

    before(function () {

        mockLivraison = {
            idTransporteur: 4,
            commentaire: 'Mon magnifique commentaire !',
            sendSmsWhenShipping: true,
        };
    });

    it('should validate a valid shipping choice', function () {

        // validate sur un schema Joi retourne un objet avec systématiquement une propriétée value et en cas d'érreur, une propriété error 
        expect(choixLivraisonSchema.validate(mockLivraison)).not.to.have.property('error');
    });

    it("should not validate the idTransporteur bigger than 4", function () {

        // Valider qu'un schéma invalide, retourne une érreur si le mot de passe n'a pas le bon format :
        mockLivraison.idTransporteur = 5;
        expect(choixLivraisonSchema.validate(mockLivraison)).to.have.property('error');

        const validation = choixLivraisonSchema.validate(mockLivraison).error.details[0].path[0];
        expect(validation).to.deep.equal('idTransporteur');
    })

    it("should not validate the sendSmsWhenShipping format (not boolean)", function () {

        mockLivraison.sendSmsWhenShipping = 'Coucou';
        //et je ré-introduis un téléphone valide :
        mockLivraison.idTransporteur = 2;
        // Valider qu'un schéma invalide me retourne bien une érreur si le mail n'a pas le bon format :
        expect(choixLivraisonSchema.validate(mockLivraison)).to.have.property('error');

        const validation2 = choixLivraisonSchema.validate(mockLivraison).error.details[0].message;
        expect(validation2).to.equal('Seule les valeurs true ou false seront accéptées.');

    });

});

//! Test sur codeSchema

const codeSchema = require('../app/schemas/codeSchema');


describe(chalk.magenta('Test de validation du codeSchema JOI :'), function () {

    before(function () {

        mockCode = {
            code: 105645,
        };
    });

    it('should validate a valid code', function () {
        //console.log(codeSchema.validate(mockCode).error.details[0]);

        expect(codeSchema.validate(mockCode)).not.to.have.property('error');
    });

    it("should not validate code bigger than 6 number", function () {

        mockCode.code = 559790866;
        //console.log(codeSchema.validate(mockCode).error.details[0]);

        expect(codeSchema.validate(mockCode)).to.have.property('error');

        const validation = codeSchema.validate(mockCode).error.details[0].path[0];
        expect(validation).to.deep.equal('code');
    })

    it("should not validate code format (decimal point)", function () {

        mockCode.code = 1.56448;
        expect(codeSchema.validate(mockCode)).to.have.property('error');

        const validation2 = codeSchema.validate(mockCode).error.details[0].message;
        expect(validation2).to.equal('Le champs de votre code doit être un chiffre entier');

    });

});


//! Test sur couponSchema

const couponSchema = require('../app/schemas/couponSchema');


describe(chalk.magenta('Test de validation du couponSchema JOI :'), function () {

    before(function () {

        mockCoupon = {
            ttl: 2,
            postfix: 'Coucou',
            prefix: 'test',
            montant: '14,60',
            idClient: 1,

        };
    });

    it('should validate a valid coupon', function () {

        expect(couponSchema.validate(mockCoupon)).not.to.have.property('error');
    });

    it("should not validate ttl bigger than 365", function () {

        mockCoupon.ttl = 366;
        expect(couponSchema.validate(mockCoupon)).to.have.property('error');

        const validation = couponSchema.validate(mockCoupon).error.details[0].path[0];
        expect(validation).to.deep.equal('ttl');
    })

    it("should not validate postfix longer than 10 caracteres", function () {

        mockCoupon.postfix = 'Morethantencaracters';
        mockCoupon.ttl = 365;

        expect(couponSchema.validate(mockCoupon)).to.have.property('error');

        const validation2 = couponSchema.validate(mockCoupon).error.details[0].message;
        expect(validation2).to.equal('Votre postfix doit avoir une longeur maximum de 10 caractéres !');

    });

});

//! Test sur delCouponSchema

const delCouponSchema = require('../app/schemas/delCouponSchema');


describe(chalk.magenta('Test de validation du delCouponSchema JOI :'), function () {

    before(function () {

        mockCoupon = {
            coupon: 'monmagnifiqueCOUPON007',

        };
    });

    it('should validate a valid coupon', function () {

        expect(delCouponSchema.validate(mockCoupon)).not.to.have.property('error');
    });

    it("should not validate coupon with special sign", function () {

        mockCoupon.coupon = 'monmagnifiqueCOUPON007!?@';
        expect(delCouponSchema.validate(mockCoupon)).to.have.property('error');

        const validation = delCouponSchema.validate(mockCoupon).error.details[0].path[0];
        expect(validation).to.deep.equal('coupon');
    })

    it("should not validate empty coupon", function () {

        mockCoupon.coupon = undefined;
        expect(delCouponSchema.validate(mockCoupon)).to.have.property('error');

        const validation2 = delCouponSchema.validate(mockCoupon).error.details[0].message;
        expect(validation2).to.equal('Le champs de votre coupon ne peut être vide !');

    });

});

//! Test sur emailChoiceSchema

const emailChoiceSchema = require('../app/schemas/emailChoiceShema');


describe(chalk.magenta('Test de validation du delCouponSchema JOI :'), function () {

    before(function () {

        mockEmailChoice = {
            false: false,
        };
    });

    it('should validate a valid email Choice', function () {
        expect(emailChoiceSchema.validate(mockEmailChoice)).not.to.have.property('error');
    });

    it("should not validate email Choice other than boolean", function () {

        mockEmailChoice.false = 'test';
        expect(emailChoiceSchema.validate(mockEmailChoice)).to.have.property('error');

        const validation = emailChoiceSchema.validate(mockEmailChoice).error.details[0].path[0];
        expect(validation).to.deep.equal('false');
    })

    it("should check that 'true' or 'false' keys are present but not both ", function () {
        // test du xor fonctionnel !
        mockEmailChoice.false = false;
        mockEmailChoice.true = true;

        expect(emailChoiceSchema.validate(mockEmailChoice)).to.have.property('error');

        const validation2 = emailChoiceSchema.validate(mockEmailChoice).error.details[0].context.peers;
        expect(validation2).to.deep.equal(['true', 'false']);

    });

});


//! Test sur livraisonPostSchema

const livraisonPostSchema = require('../app/schemas/livraisonPostSchema');


describe(chalk.magenta('Test de validation du livraisonPostSchema JOI :'), function () {

    before(function () {

        mockLivraison = {
            reference: 'LIVRAISON7e2232dd7666496ab3681a2993f1df9b',
            numeroSuivi: '79037862',
            URLSuivi: 'http://blanche.fr',
            poid: 500,
            idClient: 4,
            idCommande: 34,
            idTransporteur: 4,
        };
    });

    it('should validate a valid livraison', function () {
        expect(livraisonPostSchema.validate(mockLivraison)).not.to.have.property('error');
    });

    it("should not validate url other than true url", function () {

        mockLivraison.URLSuivi = 'htp://blanche.fr',
            expect(livraisonPostSchema.validate(mockLivraison)).to.have.property('error');

        const validation = livraisonPostSchema.validate(mockLivraison).error.details[0].path[0];
        expect(validation).to.deep.equal('URLSuivi');
    })

    it("should not validate id transporteur other than between 1 and 4 (5) ", function () {
        mockLivraison.idTransporteur = 5,
            expect(livraisonPostSchema.validate(mockLivraison)).to.have.property('error');

        const validation2 = livraisonPostSchema.validate(mockLivraison).error.details[0].message;
        expect(validation2).to.deep.equal('Le format de votre  URLSuivi est incorrect');

    });

});


//! Test sur livraisonSchema

const livraisonSchema = require('../app/schemas/livraisonSchema');


describe(chalk.magenta('Test de validation du livraisonSchema JOI :'), function () {

    before(function () {

        mockLivraison = {
            reference: 'LIVRAISON7e2232dd7666496ab3681a2993f1df9b',
            //numeroSuivi: '79037862',
            URLSuivi: 'http://blanche.fr',
            poid: 500,
            //idClient:4,
            idCommande: 34,
            idTransporteur: 4,
        };
    });

    it('should validate a valid livraison', function () {
        expect(livraisonSchema.validate(mockLivraison)).not.to.have.property('error');
    });

    it("should not validate weight smaller than 0.5", function () {

        mockLivraison.poid = 0.4,
            expect(livraisonSchema.validate(mockLivraison)).to.have.property('error');

        const validation = livraisonSchema.validate(mockLivraison).error.details[0].path[0];
        expect(validation).to.deep.equal('poid');
    })

    it("should not validate id transporteur bigger than 4 (6) ", function () {
        mockLivraison.idTransporteur = 6,
            mockLivraison.poid = 0.6,

            expect(livraisonSchema.validate(mockLivraison)).to.have.property('error');

        const validation2 = livraisonSchema.validate(mockLivraison).error.details[0].message;
        expect(validation2).to.deep.equal('Le champs de votre  idTransporteur ne peut être supérieur a 4 !');

    });

});


//! Test passwordSchema

const passwordSchema = require('../app/schemas/passwordOnlySchema');


describe(chalk.magenta('Test de validation du passwordSchema JOI :'), function () {

    before(function () {

        mockPassword = {
            password: "ThePasswordenBeton!!22",
        };
    });

    it('should validate a valid password', function () {

        expect(passwordSchema.validate(mockPassword)).not.to.have.property('error');
    });

    it("should not validate password without special caracteres", function () {

        mockPassword.password = "ThePasswordenBeton22";

        expect(passwordSchema.validate(mockPassword)).to.have.property('error');

        const validation = passwordSchema.validate(mockPassword).error.details[0].path[0];
        expect(validation).to.deep.equal('password');
    })

    it("should not validate password smaller than 8 caracteres", function () {

        mockPassword.password = "Smal1!";
        expect(passwordSchema.validate(mockPassword)).to.have.property('error');

        const validation2 = passwordSchema.validate(mockPassword).error.details[0].message;
        expect(validation2).to.equal('Le format de votre mot de passe est incorrect : Il doit contenir au minimum 8 caractéres avec minimum, un chiffre, une lettre majuscule, une lettre minuscule et un carctére spécial parmis : ! @ # $% ^ & *');

    });

});

//! Test phoneNumberSchema

const phoneNumberSchema = require('../app/schemas/phoneNumber');


describe(chalk.magenta('Test de validation du phoneNumberSchema JOI :'), function () {

    before(function () {

        mockPhoneNumber = {
            phoneNumber: "+33665342312",
        };
    });

    it('should validate a valid phoneNumber', function () {

        expect(phoneNumberSchema.validate(mockPhoneNumber)).not.to.have.property('error');
    });

    it("should not validate phoneNumber without +", function () {

        mockPhoneNumber.phoneNumber = "33665342312";

        expect(phoneNumberSchema.validate(mockPhoneNumber)).to.have.property('error');

        const validation = phoneNumberSchema.validate(mockPhoneNumber).error.details[0].path[0];
        expect(validation).to.deep.equal('phoneNumber');
    })

    it("should not validate an empty phoneNumber ", function () {

        mockPhoneNumber.phoneNumber = undefined;
        expect(phoneNumberSchema.validate(mockPhoneNumber)).to.have.property('error');

        const validation2 = phoneNumberSchema.validate(mockPhoneNumber).error.details[0].message;
        expect(validation2).to.equal('le champs de votre numéro de téléphone ne peut être vide');

    });

});

//! Test refundClientSchema

const refundClientSchema = require('../app/schemas/refundClientSchema');


describe(chalk.magenta('Test de validation du refundClientSchema JOI :'), function () {

    before(function () {

        mockRefundClient = {
            commande: "02.45.43567545.87.1",
        };
    });

    it('should validate a valid commande', function () {

        expect(refundClientSchema.validate(mockRefundClient)).not.to.have.property('error');
    });

    it("should not validate commande with letter", function () {

        mockRefundClient.commande = "024543567AE545871";

        console.log(refundClientSchema.validate(mockRefundClient));
        expect(refundClientSchema.validate(mockRefundClient)).to.have.property('error');

        const validation = refundClientSchema.validate(mockRefundClient).error.details[0].path[0];
        expect(validation).to.deep.equal('commande');
    })

    it("should not validate an empty phoneNumber ", function () {

        mockRefundClient.commande = undefined;
        expect(refundClientSchema.validate(mockRefundClient)).to.have.property('error');

        const validation2 = refundClientSchema.validate(mockRefundClient).error.details[0].message;
        expect(validation2).to.equal('Le champs de votre référence commande ne peut être vide !');

    });

});


//!_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_



//!_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_


//! Test sur le model Client !

const db = require('../app/database');

const Client = require('../app/models/client');

const user = {};

describe(chalk.yellow('Model Client'), function () {


    before(async function () {

        const {
            rows
        } = await db.query('INSERT INTO mada.client (prenom, nom_famille, email, password, id_privilege) VALUES ($1, $2, $3 ,$4, $5) RETURNING *;', ['Barack', 'Obama', 'obama@whiteHouse.us', '$2b$10$NTmOgZb2fN1QxewdWOYchOVQXUtUSaW47uOCBhRJ2zi1s2dK4kJsi', 1]);
        user.id = rows[0].id;
    });

    after(async function () {

        await db.query("DELETE FROM mada.client WHERE id = $1", [user.id])

    });

    describe('#findOne', function () {

        it('should validate the findOne methode', function () {

            it('should fetch an instance of Post', async function () {
                const theClient = await Client.findOne(user.id);

                console.log(theClient),

                    expect(theClient).to.be.an.instanceOf(Client)

                expect(theClient).to.have.property('nom_famille').equal('Obama');

                expect(theClient).to.have.property('prenom').equal('Barack');

                expect(theClient).not.to.have.property('adresse');

                theClient.password.should.eql(/$2[ayb]\$.{50,61}$/i);


            })
        })
    });
});