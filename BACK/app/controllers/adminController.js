const validator = require('validator');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const AdminVerifEmail = require('../models/adminVerifEmail');
const AdminPhone = require('../models/adminPhone');
const Privilege = require('../models/privilege');
const Client = require('../models/client');
const {
    formatLong
} = require('../services/date');

//Config Twillio
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_NUMBER;
const twilio = require('twilio')(accountSid, authToken);

//! a l'avenir, remplacer tous ça par le service date...
const now = new Date(); // l'instant exact de la requête dans un format qui m'écorche pas les yeux ;)
const options = {
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "numeric"
};
const dat = (now.toLocaleDateString("fr", options)) + " " + now.toLocaleTimeString();
const date = dat.charAt(0).toUpperCase() + dat.slice(1);

/**
 * Un objet qui contient des méthodes permettant d'intéragir avec les emails et téléphones des admins pour assurer leur verification avant utilisation
 * Retourne un json
 * @name adminController
 * @method adminController
 * @param {Express.Request} request - l'objet représentant la requête
 * @param {Express.Response} response - l'objet représentant la réponse
 * @return {JSON}  - une donnée en format json
 */
const adminController = {


    updatePrivilege: async (req, res) => {
        try {
            console.log("on passe dans le controler");
            const {
                id
            } = req.params;

            const updateClient = await Client.findOne(id);


            await updateClient.updatePrivilege();
            const message = {
                message: `Votre nouveau privilege a bien été enregistré pour le client id ${id}`
            };

            res.json(message);

        } catch (error) {
            console.log(`Erreur dans la methode updatePrivilege du adminController ${error.message}`);
            res.status(500).json(error.message);
        }
    },



    signInAdmin: async (req, response) => {
        try {

            const {
                prenom,
                nomFamille,
                email,
                password,
                passwordConfirm
            } = req.body;

            // vérif de sécurité en plus de la REGEX de Joi
            //on ne recherche que l'email a un format valide
            if (!validator.isEmail(email)) {
                //le format de l'email est incorrect
                return response.json('Le format de l\'email est incorrect');
            }

            if (!validator.isStrongPassword(password)) {
                //(surplus de sécurité, en plus de la vérif de Joi...)Cette méthode, par défault, matche exactement avec la regex de Joi.
                return response.json('Le format du mot de passe est incorrect : : Il doit contenir au minimum 8 caractéres avec minimum, un chiffre, une lettre majuscule, une lettre minuscule et un carctére spécial parmis : ! @ # $% ^ & *');
            }

            //on checke si le password et la vérif sont bien identiques
            //encore une fois, vérif de sécu en plus de Joi..
            if (password !== passwordConfirm) {
                return response.json(
                    'La confirmation du mot de passe est incorrecte'
                );
            }
            //on check si un utilisateur existe déjà avec cet email
            const userInDb = await Client.findByEmail(email);
            if (userInDb.email) {
                //il y a déjà un utilisateur avec cet email, on envoie une erreur
                return response.json('Cet email n\'est pas disponible');
            }


            /**
             * Une fonction asynchrone qui hash le mot de passe du nouvel utilisateur avant de l'insérer dans la BDD
             * @name hashedPwd
             * @function
             */
            const hashedPwd = await bcrypt.hash(password, 10)

            /**
             * Un fichier json qui contient les informations de l'utilisateur préparé pour être inséré en BDD
             * @type {object} 
             */
            const newUser = {
                email: email,
                password: hashedPwd,
                prenom,
                nomFamille,
            };


            /**
             * On créer une nouvelle instance de client 
             * */
            const userNowInDb = new Client(newUser);

            /**
             * On l'envoie en BDD pour être enregistré EN TANT QU'ADMIN
             */

            const user = await userNowInDb.saveAdmin();
            console.log(user.id);
            await AdminVerifEmail.false(user.id);


            console.log(`L'admin ${newUser.prenom} ${newUser.nomFamille} est désormais enregistré dans la BDD`);

            //! on envoie un message de bienvenue par email


            async function main() {

                //on généree un compte de service SMTP
                // je créer un objet "transporteur" réutilisable à l'aide du transport SMTP par défaut

                const transporter = nodemailer.createTransport({
                    host: 'smtp.gmail.com',
                    port: 465,
                    secure: true, // true for 465, false for other ports
                    auth: {
                        user: process.env.EMAIL,
                        pass: process.env.PASSWORD_EMAIL,
                    },
                });

                // l'envoie d'email définit par l'object "transporter"
                const info = await transporter.sendMail({
                    from: process.env.EMAIL, //l'envoyeur
                    to: `${userNowInDb.email}`, // le ou les receveurs => `${request.body.email}`
                    subject: `Bienvenue sur le site d'artisanat Malgache`, // le sujet du mail
                    text: `Bonjour hÔ vénérable administrateur ${userNowInDb.prenom} ${userNowInDb.nomFamille}.`, // l'envoie du message en format "plain text" ET HTML, permet plus de souplesse pour le receveur, tout le monde n'accepte pas le format html pour des raisons de sécurité sur ces boites mails, moi le premier ! 
                    html: `<h3>Bonjour hÔ vénérable administrateur <span class="username"> ${userNowInDb.prenom} ${userNowInDb.nomFamille}, </span> </h3> <br>`, // Mail a finir de personalisé !!
                });

                console.log("Message sent: %s", info.messageId);
                // le message envoyé ressemble a ça : <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
                console.log(`Un email de bienvenue à bien été envoyé a ${userNowInDb.prenom} ${userNowInDb.nomFamille} via l'adresse email: ${userNowInDb.email} : ${info.response}`);
                // Email bien envoyé : 250 2.0.0 OK  1615639005 y16sm12341865wrh.3 - gsmtp => si tout va bien !

            }
            main().catch(console.error);

            // on renvoie un message au FRONT !

            response.status(200).json({
                email: userNowInDb.email,
                prenom: userNowInDb.prenom,
                nomFamille: userNowInDb.nomFamille,
                message: "Vous pouvez désormais vous connecter"
            });


        } catch (error) {
            console.trace(
                'Erreur dans la méthode SignIn du userController :',
                error);
            response.status(500).json(error.message);
        }
    },


    // attention le nom du service friendly name dans twilio sera le nom donné dans le sms (Votre code de vérification <friendly name> est 992253)
    // le nom de l'expéditeur apparait comme : AUTHMSG

    //changer la longeur du mot de passe ! et le nom du service  ==>> https://www.twilio.com/docs/verify/api/service
    /* client.verify.services('VAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
             .update({codeLength: 7, friendlyName:'mon petit nom!'})
             .then(service => console.log(service.codeLength)); */



    //https://www.twilio.com/docs/verify/verifying-transactions-psd2#
    /* client.verify.services
                 .create({psd2Enabled: true, friendlyName: 'My PSD2 Service'})
                 .then(service => console.log(service.psd2Enabled)); */

    //PSD2 Verification
    /* client.verify.services('VAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
      .verificationChecks
      .create({
         to: '+15017122661',
         amount: '€39.99',
         payee: 'Acme Inc.',
         code: '1234'
       })
      .then(verification_check => console.log(verification_check.status)); */


    //pour une vérif par appel :
    /* client.verify.services('VAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
           .verifications
           .create({sendDigits: '350', to: '+15017122661', channel: 'call'})
           .then(verification => console.log(verification.sid)); */


    //pour retrouver des infos sur un numéro :: https://www.twilio.com/docs/lookup/api
    /* const client = require('twilio')(accountSid, authToken);

client.lookups.v1.phoneNumbers('+15108675310')
                 .fetch({type: ['carrier']})
                 .then(phone_number => console.log(phone_number.carrier)); */

    smsVerify: async (req, res) => {

        // pas d'appel inutile a l'API, on vérifit d'abord..
        

        twilio.verify.services(process.env.SERVICE_SID_VERIFY)
            .verifications
            .create({
                locale: 'fr',
                to: req.body.phoneNumber, //quand numéro twilio ok => req.body.phoneNumber // pour un numéro dynamique. // Si le numéro est en base, il a été testé. On prend direct du formulaire, on test avec twilio.verify et si ok on envoit le format E164 en base direct ! pas d'insertion en base sans test !
                channel: 'sms'
            })
            .then(verification => console.log(verification.status));

        //stockage en session du numéro et pour le réutiliser dans la méthode du smsCheck

        req.session.phoneNumber = req.body.phoneNumber;

        res.status(200).json('Un code par sms vous a été envoyé ! Merci de bien vouloir le renseigner pour terminer le vérification');


        try {
            console.trace(
                'Erreur dans la méthode smsVerify du clientController :',
                error);
            res.status(500).json(error.message);

        } catch (error) {

        }
    },


    smsCheck: async (req, res) => {

        const statut = await twilio.verify.services(process.env.SERVICE_SID_VERIFY)
            .verificationChecks
            .create({
                to: req.session.phoneNumber,
            })
        if (statut.status === 'approved') {

            // le numéro est dispo en format E 164 dans l'objet statut.to !
    
            const data = {};
            data.idClient = req.session.user.idClient;
            data.adminTelephone = statut.to;
            const newPhone = new AdminPhone(data); // et j'insére en BDD dans al foulée le numéro fraichement vérifié.
            await newPhone.save();

            return res.status(200).json('Votre numéro de téléphone a été authentifié avec succés !')

        } else {
            res.status(403).json('Votre numéro de téléphone n\'a pas put être authentifié.')
        }

        try {
            console.trace(
                'Erreur dans la méthode smsCheck du clientController :',
                error);
            res.status(500).json(error.message);

        } catch (error) {

        }
    },





    smsEnvoi: async (req, res) => {

        if (req.body.Body == 'clients?') {

            const clients = await Client.count()
            twilio.messages.create({
                    body: `Il existe ${clients.count} clients enregitré en bdd le ${date}.`,
                    from: process.env.TWILIO_NUMBER,
                    to: process.env.MYNUMBERFORMAT64,
                })
                .then(message => console.log(message.sid));


            res.status(200).json('sms envoyé ;)');
        } else

            res.json('c\'est mieux avaec un body adéquat...');

        try {
            console.trace(
                'Erreur dans la méthode smsEnvoi du clientController :',
                error);
            res.status(500).json(error.message);

        } catch (error) {

        }
    },












    getAllEmailVerif: async (req, res) => {
        try {
            const resultats = await AdminVerifEmail.findAll();

            res.status(200).json(resultats);
        } catch (error) {
            console.trace('Erreur dans la méthode getAllEmailVerif du adminController :',
                error);
            res.status(500).json(error.message);
        }
    },

    getAllPhone: async (req, res) => {
        try {
            const resultats = await AdminPhone.findAll();

            res.status(200).json(resultats);
        } catch (error) {
            console.trace('Erreur dans la méthode getAllPhone du adminController :',
                error);
            res.status(500).json(error.message);
        }
    },

    getAllPrivilege: async (req, res) => {
        try {
            const resultats = await Privilege.findAll();

            res.status(200).json(resultats);
        } catch (error) {
            console.trace('Erreur dans la méthode getAllPrivilege du adminController :',
                error);
            res.status(500).json(error.message);
        }
    },








    getOneEmailVerif: async (req, res) => {
        try {

            const resultat = await AdminVerifEmail.findOne(req.params.id);
            res.json(resultat);

        } catch (error) {
            console.trace('Erreur dans la méthode getOneEmailVerif du adminController :',
                error);
            res.status(500).json(error.message);
        }
    },
    getOnePhone: async (req, res) => {
        try {

            const resultat = await AdminPhone.findOne(req.params.id);
            res.json(resultat);

        } catch (error) {
            console.trace('Erreur dans la méthode getOnePhone du adminController :',
                error);
            res.status(500).json(error.message);
        }
    },
    getOnePrivilege: async (req, res) => {
        try {

            const resultat = await Privilege.findOne(req.params.id);
            res.json(resultat);

        } catch (error) {
            console.trace('Erreur dans la méthode getOnePrivilege du adminController :',
                error);
            res.status(500).json(error.message);
        }
    },









    getEmailVerifByIdClient: async (req, res) => {
        try {
            console.log(req.params);
            const resultat = await AdminVerifEmail.findByIdClient(req.params.id);
            res.json(resultat);

        } catch (error) {
            console.trace('Erreur dans la méthode getEmailVerifByIdClient du adminController :',
                error);
            res.status(500).json(error.message);
        }
    },

    getPhoneByIdClient: async (req, res) => {
        try {
            console.log(req.params);
            const resultat = await AdminPhone.findByIdClient(req.params.id);
            res.json(resultat);

        } catch (error) {
            console.trace('Erreur dans la méthode getPhoneByIdClient du adminController :',
                error);
            res.status(500).json(error.message);
        }
    },










    newVerifEmail: async (req, res) => {
        try {

            const data = {};

            data.idClient = req.body.idClient;

            const newClient = new AdminVerifEmail(data);
            await newClient.true();
            res.json(newClient);
        } catch (error) {
            console.log(`Erreur dans la méthode newVerifEmail du adminController : ${error.message}`);
            res.status(500).json(error.message);
        }
    },

    newPhone: async (req, res) => {
        try {

            const data = {};

            data.idClient = req.body.idClient;
            data.adminTelephone = req.body.adminTelephone;

            const newClient = new AdminPhone(data);
            await newClient.save();
            res.json(newClient);
        } catch (error) {
            console.log(`Erreur dans la méthode newPhone du adminController : ${error.message}`);
            res.status(500).json(error.message);
        }
    },

    newPrivilege: async (req, res) => {
        try {

            const data = {};

            data.nom = req.body.nom;

            const newClient = new Privilege(data);
            await newClient.save();
            res.json(newClient);
        } catch (error) {
            console.log(`Erreur dans la méthode newPrivilege du adminController : ${error.message}`);
            res.status(500).json(error.message);
        }
    },






    deleteVerifEmail: async (req, res) => {

        try {

            const emailInDb = await AdminVerifEmail.findOne(req.params.id);

            const emailDeleted = await emailInDb.delete();

            res.json(emailDeleted);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteVerifEmail du adminController :',
                error);
            res.status(500).json(error.message);
        }
    },

    deletePhone: async (req, res) => {

        try {

            const phoneInDb = await AdminPhone.findOne(req.params.id);

            const phoneDeleted = await phoneInDb.delete();

            res.json(phoneDeleted);

        } catch (error) {
            console.trace('Erreur dans la méthode deletePhone du adminController :',
                error);
            res.status(500).json(error.message);
        }
    },

    deletePrivilege: async (req, res) => {

        try {

            const privilegeInDb = await Privilege.findOne(req.params.id);

            const privilegeDeleted = await privilegeInDb.delete();

            res.json(privilegeDeleted);

        } catch (error) {
            console.trace('Erreur dans la méthode deletePrivilege du adminController :',
                error);
            res.status(500).json(error.message);
        }
    },








    deleteVerifEmailByIdClient: async (req, res) => {

        try {

            const clientsInDb = await AdminVerifEmail.findByIdClient(req.params.id);
            const arrayDeleted = [];
            for (const clientInDb of clientsInDb) {

                const clientHistoConn = await clientInDb.deleteByIdClient();
                arrayDeleted.push(clientHistoConn);
            }


            res.json(arrayDeleted[0]);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteVerifEmailByIdClient du adminController :',
                error);
            res.status(500).json(error.message);
        }
    },

    deletePhoneByIdClient: async (req, res) => {

        try {

            const clientsInDb = await AdminPhone.findByIdClient(req.params.id);
            const arrayDeleted = [];
            for (const clientInDb of clientsInDb) {

                const clientHistoConn = await clientInDb.deleteByIdClient();
                arrayDeleted.push(clientHistoConn);
            }

            res.json(arrayDeleted[0]);

        } catch (error) {
            console.trace('Erreur dans la méthode deletePhoneByIdClient du adminController :',
                error);
            res.status(500).json(error.message);
        }
    },








    updateVerifEmail: async (req, res) => {
        try {

            const {
                id
            } = req.params;

            const updateClient = await AdminVerifEmail.findByIdClient(id);
            console.log(updateClient);

            const verifEmail = req.body.verifEmail;
            const idClient = req.body.idClient;

            let userMessage = {};


            if (verifEmail) {
                updateClient.verifEmail = verifEmail;
                userMessage.verifEmail = 'Votre nouveau verifEmail a bien été enregistré ';
            } else if (!verifEmail) {
                userMessage.verifEmail = 'Votre verifEmail n\'a pas changé';
            }

            if (idClient) {
                updateClient.idClient = idClient;
                userMessage.idClient = 'Votre nouveau idClient a bien été enregistré ';
            } else if (!idClient) {
                userMessage.idClient = 'Votre idClient n\'a pas changé';
            }


            await updateClient.update();

            res.json(userMessage);

        } catch (error) {
            console.log(`Erreur dans la méthode updateVerifEmail du adminController : ${error.message}`);
            res.status(500).json(error.message);
        }
    },

    updatePhone: async (req, res) => {
        try {

            const {
                id
            } = req.params;

            const updateClient = await AdminPhone.findByIdClient(id);

            const adminTelephone = req.body.adminTelephone;
            const idClient = req.body.idClient;

            let userMessage = {};

            if (adminTelephone) {
                updateClient.adminTelephone = adminTelephone;
                userMessage.adminTelephone = 'Votre nouveau adminTelephone a bien été enregistré ';
            } else if (!adminTelephone) {
                userMessage.adminTelephone = 'Votre adminTelephone n\'a pas changé';
            }


            if (idClient) {
                updateClient.idClient = idClient;
                userMessage.idClient = 'Votre nouveau idClient a bien été enregistré ';
            } else if (!idClient) {
                userMessage.idClient = 'Votre idClient n\'a pas changé';
            }

            await updateClient.updateByIdClient();

            res.json(userMessage);

        } catch (error) {
            console.log(`Erreur dans la méthode updatePhone du adminController : ${error.message}`);
            res.status(500).json(error.message);
        }
    },








}

module.exports = adminController;