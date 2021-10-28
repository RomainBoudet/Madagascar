require('dotenv').config({
    path: `${__dirname}/../.env.back`
});

const {
    expect
} = require('chai');
const chalk = require('chalk');

//! Tests sur les SCHEMA JOI ----------------------------------------------


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


//! Test refundClientSchema

const refundSchema = require('../app/schemas/refundSchema');


describe(chalk.magenta('Test de validation du refundSchema JOI :'), function () {

    before(function () {

        mockRefund = {
            email: 'test@test.fr',
            //idClient: 34, Soit email soit idClient ! (xor)
            commande: '233.45.65.1',
            montant: 135,
        };
    });

    it('should validate a valid refund', function () {
        expect(refundSchema.validate(mockRefund)).not.to.have.property('error');
    });

    it("should not validate email with wrong format", function () {

        mockRefund.email = "test@test.23";
        expect(refundSchema.validate(mockRefund)).to.have.property('error');

        const validation = refundSchema.validate(mockRefund).error.details[0].path[0];
        expect(validation).to.deep.equal('email');
    })

    it("should check that 'idClient' or 'email' keys are present but not both ", function () {
        // test du xor fonctionnel !
        mockRefund.email = "test@test.de";
        mockRefund.idClient = 23;

        expect(refundSchema.validate(mockRefund)).to.have.property('error');

        const validation2 = refundSchema.validate(mockRefund).error.details[0].context.peers;
        expect(validation2).to.deep.equal(['email', 'idClient']);

    });

});

//! Test resendEmailSchema

const resendEmailSchema = require('../app/schemas/resendEmailSchema');


describe(chalk.magenta('Test de validation du resendEmailSchema JOI :'), function () {

    before(function () {

        mockResendEmail = {
            email: "test@test.de",
        };
    });

    it('should validate a valid email', function () {

        expect(resendEmailSchema.validate(mockResendEmail)).not.to.have.property('error');
    });

    it("should not validate wrong email format (with two @)", function () {

        mockResendEmail.email = "test@@test.de";
        expect(resendEmailSchema.validate(mockResendEmail)).to.have.property('error');

        const validation = resendEmailSchema.validate(mockResendEmail).error.details[0].path[0];
        expect(validation).to.deep.equal('email');
    })

    it("should not validate an empty email ", function () {

        mockResendEmail.email = undefined;
        expect(resendEmailSchema.validate(mockResendEmail)).to.have.property('error');

        const validation2 = resendEmailSchema.validate(mockResendEmail).error.details[0].message;
        expect(validation2).to.equal('Le champs email ne peut être vide.');

    });

});

//! Test resetPwdSchema

const resetPwdSchema = require('../app/schemas/resetPwdSchema');


describe(chalk.magenta('Test de validation du resetPwdSchema JOI :'), function () {

    before(function () {

        mockResetPwdSchema = {
            newPassword: "MyPasswordenBeton45@",
            passwordConfirm: "MyPasswordenBeton45@",

        };
    });

    it('should validate a valid reset password', function () {
        expect(resetPwdSchema.validate(mockResetPwdSchema)).not.to.have.property('error');
    });

    it("should not validate wrong password format (without upper case)", function () {

        mockResetPwdSchema.password = "mypasswordenbéton45@";
        expect(resetPwdSchema.validate(mockResetPwdSchema)).to.have.property('error');

        const validation = resetPwdSchema.validate(mockResetPwdSchema).error.details[0].path[0];
        expect(validation).to.deep.equal('password');
    })

    it("should check that password field can't be alone, without passwordConfirm field ", function () {
        // check .with
        mockResetPwdSchema.passwordConfirm = undefined;

        expect(resetPwdSchema.validate(mockResetPwdSchema)).to.have.property('error');

        const validation2 = resetPwdSchema.validate(mockResetPwdSchema).error.details[0].context.child;

        expect(validation2).to.equal('password');

    });
});

//! Test searchSchema

const searchSchema = require('../app/schemas/searchSchema');


describe(chalk.magenta('Test de validation du searchSchema JOI :'), function () {

    before(function () {

        mockSearch = {
            search: "myCategory",
        };
    });

    it('should validate a valid search', function () {

        expect(searchSchema.validate(mockSearch)).not.to.have.property('error');
    });

    it("should not validate search with special caracteres (mycategorie<link>)", function () {

        mockSearch.search = "mycategorie<link>";
        expect(searchSchema.validate(mockSearch)).to.have.property('error');

        const validation = searchSchema.validate(mockSearch).error.details[0].path[0];
        expect(validation).to.deep.equal('search');
    })

    it("should not validate an empty search ", function () {

        mockSearch.search = undefined;
        expect(searchSchema.validate(mockSearch)).to.have.property('error');

        const validation2 = searchSchema.validate(mockSearch).error.details[0].message;
        expect(validation2).to.equal('Le champs de votre recherche ne peut être vide !');

    });

});


//! Test smsChoiceSchema

const smsChoiceSchema = require('../app/schemas/smsChoiceSchema');


describe(chalk.magenta('Test de validation du smsChoiceSchema JOI :'), function () {

    before(function () {

        mockSmsChoice = {
            true: true,
            //false: false,
        };
    });

    it('should validate a valid sms choice', function () {
        expect(smsChoiceSchema.validate(mockSmsChoice)).not.to.have.property('error');
    });

    it("should not validate email with wrong format", function () {

        mockSmsChoice.true = "coucou";
        expect(smsChoiceSchema.validate(mockSmsChoice)).to.have.property('error');

        const validation = smsChoiceSchema.validate(mockSmsChoice).error.details[0].path[0];
        expect(validation).to.deep.equal('true');
    })

    it("should check that 'idClient' or 'email' keys are present but not both ", function () {
        // test du xor fonctionnel !
        mockSmsChoice.true = true;
        mockSmsChoice.false = false;

        expect(smsChoiceSchema.validate(mockSmsChoice)).to.have.property('error');

        const validation2 = smsChoiceSchema.validate(mockSmsChoice).error.details[0].context.peers;
        expect(validation2).to.deep.equal(['true', 'false']);

    });

});


//! Test transporteurPostSchema

const transporteurPostSchema = require('../app/schemas/transporteurPostSchema');


describe(chalk.magenta('Test de validation du transporteurPostSchema JOI :'), function () {

    before(function () {

        mockTransporteur = {
            nom: "theBestTranporter",
            description: "faster than ever",
            fraisExpedition: 18,
            estimeArrive: 1,
            logo: "https://pixy.org/src/477/4774988.jpg",
        };
    });

    it('should validate a valid transporter', function () {

        expect(transporteurPostSchema.validate(mockTransporteur)).not.to.have.property('error');
    });

    it("should not validate transporter name with special caracteres (my transporter <link>)", function () {

        mockTransporteur.nom = "my transporter <link>";
        expect(transporteurPostSchema.validate(mockTransporteur)).to.have.property('error');

        const validation = transporteurPostSchema.validate(mockTransporteur).error.details[0].path[0];
        expect(validation).to.deep.equal('nom');
    })

    it("should not validate 'frais expedition' bigger than 100", function () {

        mockTransporteur.fraisExpedition = 101;
        mockTransporteur.nom = "my transporter";

        expect(transporteurPostSchema.validate(mockTransporteur)).to.have.property('error');

        const validation2 = transporteurPostSchema.validate(mockTransporteur).error.details[0].message;
        expect(validation2).to.equal('Le champs de votre fraisExpedition ne peut être supérieur a 100 !');

    });
    it("should not validate an empty 'frais expedition' field", function () {

        mockTransporteur.fraisExpedition = undefined;

        expect(transporteurPostSchema.validate(mockTransporteur)).to.have.property('error');

        const validation2 = transporteurPostSchema.validate(mockTransporteur).error.details[0].message;
        expect(validation2).to.equal('Le champs de votre fraisExpedition ne peut être vide !');

    });

});


//! Test transporteurSchema

const transporteurSchema = require('../app/schemas/transporteurShema');


describe(chalk.magenta('Test de validation du transporteurPostSchema JOI :'), function () {

    before(function () {

        mockTransporteur = {
            //nom: "theBestTranporter",
            description: "faster than ever",
            fraisExpedition: 18,
            //estimeArrive:1,
            logo: "https://pixy.org/src/477/4774988.jpg",
        };
    });

    it('should validate a valid transporter with empty field', function () {

        expect(transporteurSchema.validate(mockTransporteur)).not.to.have.property('error');
    });

    it("should not validate transporter logo with not an URI", function () {

        mockTransporteur.logo = "coucou";
        expect(transporteurSchema.validate(mockTransporteur)).to.have.property('error');

        const validation = transporteurSchema.validate(mockTransporteur).error.details[0].path[0];
        expect(validation).to.deep.equal('logo');
    })

    it("should not validate 'description' with special caracteres", function () {

        mockTransporteur.description = 'this is a wrong description <<';
        mockTransporteur.logo = "https://pixy.org/src/477/4774988.jpg";

        expect(transporteurSchema.validate(mockTransporteur)).to.have.property('error');

        const validation2 = transporteurSchema.validate(mockTransporteur).error.details[0].message;
        expect(validation2).to.equal('Le format de votre description est incorrect : Il ne doit pas être composé d\'un de ces caractéres spéciaux : [<>&#=+*/"|] !');

    });

});

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

//! Test userSigninSchema

const userSigninSchema = require('../app/schemas/userSigninSchema');


describe(chalk.magenta('Test de validation du userSigninSchema JOI :'), function () {

    before(function () {

        mockUserSignin = {
            prenom: 'Albert',
            nomFamille: 'Duppontel',
            email: 'bebert@gmail.com',
            password: "MyPasswordenBeton45@",
            passwordConfirm: "MyPasswordenBeton45@",

        };
    });

    it('should validate a valid reset user signin', function () {
        expect(userSigninSchema.validate(mockUserSignin)).not.to.have.property('error');
    });

    it("should not validate family name smaller than  caracteres", function () {

        mockUserSignin.nomFamille = "m";
        expect(userSigninSchema.validate(mockUserSignin)).to.have.property('error');

        const validation = userSigninSchema.validate(mockUserSignin).error.details[0].path[0];
        expect(validation).to.deep.equal('nomFamille');
    })

    it("should check that password field can't be alone, without passwordConfirm field ", function () {
        // check .with
        mockUserSignin.passwordConfirm = undefined;
        mockUserSignin.nomFamille = "Duppontel";

        expect(userSigninSchema.validate(mockUserSignin)).to.have.property('error');

        const validation2 = userSigninSchema.validate(mockUserSignin).error.details[0].context.peer;
        expect(validation2).to.equal('passwordConfirm');

    });
});

//! Test userUpdateSchema

const userUpdateSchema = require('../app/schemas/userUpdateSchema');


describe(chalk.magenta('Test de validation du userUpdateSchema JOI :'), function () {

    before(function () {

        mockUserUpdate = {
            //prenom:'Albert',
            nomFamille: 'Duppontel',
            email: 'bebert@gmail.com',
            password: "oldPasswordenBeton45@",
            newPassword: "MyNewPasswordenBeton45@",
            newPasswordConfirm: "MyNewPasswordenBeton45@",

        };
    });

    it('should validate a valid user update with empty field', function () {
        expect(userUpdateSchema.validate(mockUserUpdate)).not.to.have.property('error');
    });

    it("should not validate email with wrong pattern", function () {

        mockUserUpdate.email = "test@coucou";
        expect(userUpdateSchema.validate(mockUserUpdate)).to.have.property('error');

        const validation = userUpdateSchema.validate(mockUserUpdate).error.details[0].path[0];
        expect(validation).to.deep.equal('email');
    })

    it("should check that newPassword field can't be alone, without newPasswordConfirm field ", function () {
        // check .with
        mockUserUpdate.newPasswordConfirm = undefined;
        mockUserUpdate.email = "Duppontel@albert.fr";

        expect(userUpdateSchema.validate(mockUserUpdate)).to.have.property('error');

        const validation2 = userUpdateSchema.validate(mockUserUpdate).error.details[0].context.peer;
        expect(validation2).to.equal('newPasswordConfirm');

    });

    it("should check that newPassword field can't be different than newPasswordConfirm field ", function () {
        // check .with
        mockUserUpdate.newPasswordConfirm = 'NewPasswordenBeton45@';

        expect(userUpdateSchema.validate(mockUserUpdate)).to.have.property('error');

        const validation2 = userUpdateSchema.validate(mockUserUpdate).error.details[0].context.key;
        expect(validation2).to.equal('newPasswordConfirm');

    });
});

//! Test verifyEmailSchema

const verifyEmailSchema = require('../app/schemas/verifyEmailSchema');


describe(chalk.magenta('Test de validation du verifyEmailSchema JOI :'), function () {

    before(function () {

        mockVerifyEmail = {
            userId: 21,
            token: 'DGGLDOBDGL4577GLBLGLT/LflblbltLLLSFL35764-LLBLT356LLL.GLrjrn',
        };
    });

    it('should validate a valid VerifyEmail schema', function () {
        expect(verifyEmailSchema.validate(mockVerifyEmail)).not.to.have.property('error');
    });

    it("should not validate userId with wrong type", function () {

        mockVerifyEmail.userId = "ECDR";
        expect(verifyEmailSchema.validate(mockVerifyEmail)).to.have.property('error');

        const validation = verifyEmailSchema.validate(mockVerifyEmail).error.details[0].path[0];
        expect(validation).to.deep.equal('userId');
    })

     it("should check that token field is required ", function () {
        // check .with
        mockVerifyEmail.token = undefined;
        mockVerifyEmail.userId = "3456";

        expect(verifyEmailSchema.validate(mockVerifyEmail)).to.have.property('error');

        const validation2 = verifyEmailSchema.validate(mockVerifyEmail).error.details[0].message;
        expect(validation2).to.equal('L\'URL doit contenir un token pour être valide!');

    });

     it("should not validate token field with wrong format", function () {
        
        mockVerifyEmail.token = 'DGGLDOBDGL4577GLBLGLT/LflblbltLLLSFL35764-LLBLT356LLL.GLrjrn<';

        expect(verifyEmailSchema.validate(mockVerifyEmail)).to.have.property('error');

        const validation2 = verifyEmailSchema.validate(mockVerifyEmail).error.details[0].message;
        expect(validation2).to.equal('Votre format de token est incorrect !');

    });  
});


//!_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_



//!_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_

//! Tests sur les SERVICES-------------------------------------------------------------------------------------







//!_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_



//!_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_

//! Tests sur les MODEL-----------------------------------------------------------------------------------------------------------------

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