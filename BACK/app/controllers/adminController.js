const validator = require('validator');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const AdminVerifEmail = require('../models/adminVerifEmail');
const AdminPhone = require('../models/adminPhone');
const Privilege = require('../models/privilege');
const Client = require('../models/client');
const Paiement = require('../models/paiement');
const Twillio = require('../models/twillio');
const {
    formatLong
} = require('../services/date');
const {
    exec
} = require("child_process");


//Config Twillio
//const dataTwillio = async () => await Twillio.findFirst();
//const twilio = require('twilio')(dataTwillio.accountSid, dataTwillio.authToken);

//! a l'avenir, remplacer tout ça par le service date...
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


    //! TWILLIO SMS -------------------------------------------------------------------------------------------------------------------------------

    //Le délai d'attente max lors de la vérification du code est de 10 minutes max => https://www.twilio.com/docs/verify/api/verification-check
    // la doc :https://www.twilio.com/docs/verify/api/verification  
    /*Pour valider un phoneNumber en front on utilisera => const number = client.lookups.phoneNumbers(req.body.phoneNumber).fetch(); //https://www.twilio.com/docs/lookup/api  API gratuite : https://www.twilio.com/fr/lookup  */
    // et on regardera : https://www.youtube.com/watch?v=gjh5gOalYcM

    smsVerify: async (req, res, error) => {

        const dataTwillio = await Twillio.findFirst();
        const twilio = require('twilio')(dataTwillio.accountSid, dataTwillio.authToken);

        try {
            // pas d'appel inutile a l'API, on vérifit d'abord..
            const phoneInDb = await AdminPhone.findByIdClient(req.session.user.idClient);
        
            if (!phoneInDb === null) {
                return res.status(200).json('Votre numéro de téléphone a déja été vérifié avec succés !')
            }
            //Malgrés la validator en backup, ne pas oublier que Joi sanctionnera avant si le format neconvient pas...
            if (validator.isMobilePhone(req.body.phoneNumber, 'fr-FR', {strictMode:true})) {

                twilio.verify.services(dataTwillio.sidVerify)
                    .verifications
                    .create({
                        locale: 'fr',
                        to: req.body.phoneNumber,
                        channel: 'sms',
                    })
                    .then(verification => console.log(verification.status));

                //stockage en session du numéro et pour le réutiliser dans la méthode du smsCheck
                req.session.phoneNumber = req.body.phoneNumber;
                res.status(200).json('Un code par sms vous a été envoyé ! Merci de bien vouloir le renseigner pour terminer le vérification');

            } else {
                console.log('Votre numéro de téléphone ne correspond pas au format souhaité !');
                return res.status(404).json('Erreur dans la méthode smsVerify du clientController');
            }
        } catch (error) {
            console.trace(
                'Erreur dans la méthode smsVerify du clientController :',
                error);
            res.status(500).json('Erreur lors de la vérification de votre numéro de téléphone');
        }
    },


    smsCheck: async (req, res) => {
        const dataTwillio = await Twillio.findFirst();
        const twilio = require('twilio')(dataTwillio.accountSid, dataTwillio.authToken);

        try {
            const statut = await twilio.verify.services(process.env.SERVICE_SID_VERIFY)
                .verificationChecks
                .create({
                    to: req.session.phoneNumber,
                    code: req.body.code,
                })
            if (statut.status === 'approved') {

                const data = {};
                data.idClient = req.session.user.idClient;
                data.adminTelephone = statut.to;
                const newPhone = new AdminPhone(data); // et j'insére en BDD le numéro fraichement vérifié.
                await newPhone.save();
                req.session.phoneNumber = false;
                return res.status(200).json('Votre numéro de téléphone a été authentifié avec succés !')

            } else {
                req.session.phoneNumber = false;
                res.status(403).json('Votre numéro de téléphone n\'a pas put être authentifié.')
            }

        } catch (error) {
            console.trace(
                'Erreur dans la méthode smsCheck du clientController :',
                error);
            res.status(500).json('Erreur lors de la vérification de votre numéro de téléphone');
        }
    },

    // pas plus de 153 caractéres pa envoi.... !
    smsSend: async (_, res) => {
        const dataTwillio = await Twillio.findFirst();
        const twilio = require('twilio')(dataTwillio.accountSid, dataTwillio.authToken);

        if (!(validator.isMobilePhone(dataTwillio.twillioNumber, 'en-GB', {strictMode:true}) && validator.isMobilePhone(dataTwillio.devNumber, 'fr-FR', {strictMode:true}) )) {
            return res.status(404).json('Votre numéro de téléphone ne correspond pas au format souhaité !')
        }
        try {
            const clients = await Client.count()
            twilio.messages.create({
                    body: `Il existe ${clients.count} clients enregitré en bdd le ${date}.`,
                    from: dataTwillio.twillioNumber,
                    to: dataTwillio.devNumber,

                })
                .then(message => console.log(message.sid));
            res.status(200).json('Sms bien envoyé !');

        } catch (error) {
            console.trace(
                'Erreur dans la méthode smsSend du clientController :',
                error);
            res.status(500).json('Erreur lors de la vérification de votre numéro de téléphone');
        }
    },

    

    //https://www.twilio.com/docs/sms/tutorials/how-to-receive-and-reply-node-js
    // pour tester via ngrok => (en ligne de commande) ngrok http https://localhost:3000 -region eu
    // a insérer dans la console Twillio => dans l'onglet Active number, dans Messaging, A MESSAGE COMES IN Webhook, => https://4b4c0118e42b.eu.ngrok.io/v1/response
    // pas plus de 153 caractéres par envoi.... !
    smsRespond: async (req, res) => {
        const dataTwillio = await Twillio.findFirst();
        const twilio = require('twilio')(dataTwillio.accountSid, dataTwillio.authToken);
        if (!(validator.isMobilePhone(dataTwillio.twillioNumber, 'en-GB', {strictMode:true}) && validator.isMobilePhone(dataTwillio.devNumber, 'fr-FR', {strictMode:true}) )) {
            return res.status(404).json('Votre numéro de téléphone ne correspond pas au format souhaité !')
        }
        try {
            if (req.body.Body == 'Clients ?') {
                const clients = await Client.count()
                twilio.messages.create({
                        body: `Il existe ${clients.count} clients enregitré en bdd le ${date}.`,
                        from: dataTwillio.twillioNumber,
                        to: dataTwillio.devNumber,
                    })
                    .then(message => console.log(message.sid));

                return;

            } else if (req.body.Body == 'Paiement ?') {

                const paiement = await Paiement.getLastPaiement()
                twilio.messages.create({
                        body: `Dernier paiement le ${formatLong(paiement.datePaiement)}, montant : ${paiement.montant}€.`,
                        from: dataTwillio.twillioNumber,
                        to: dataTwillio.devNumber,
                    })
                    .then(message => console.log(message.sid));

                return;

            } else if (req.body.Body == 'ça roule ?') {

                twilio.messages.create({
                        body: `Ouaip, ça roule, on s'occupe 😉`,
                        from: dataTwillio.twillioNumber,
                        to: dataTwillio.devNumber,
                    })
                    .then(message => console.log(message.sid));

                return;

            } else if (req.body.Body == 'Balance ?') {

                const balance = await twilio.balance.fetch()
                twilio.messages.create({
                        body: `La balance du compte Twillio est de ${balance.balance}$.`,
                        from: dataTwillio.twillioNumber,
                        to: dataTwillio.devNumber,
                    })
                    .then(message => console.log(message.sid));

                return;

            } else {

                return res.status(404).json("Aucune commande avec ce paramétre")

            }
        } catch (error) {
            console.trace(
                'Erreur dans la méthode smsRespond du clientController :',
                error);
            res.status(500).json('Erreur lors de la vérification de votre numéro de téléphone');

        }
    },

    //! TWILLIO MANAGEMENT -------------------------------------------------------------------------------------------------------------------------

    smsBalance: async (_, res) => {
        const dataTwillio = await Twillio.findFirst();
        const twilio = require('twilio')(dataTwillio.accountSid, dataTwillio.authToken);

        if (!(validator.isMobilePhone(dataTwillio.twillioNumber, 'en-GB', {strictMode:true}) && validator.isMobilePhone(dataTwillio.devNumber, 'fr-FR', {strictMode:true}) )) {
            return res.status(404).json('Votre numéro de téléphone ne correspond pas au format souhaité !')
        }
        try {
            const balance = await twilio.balance.fetch()
                twilio.messages.create({
                        body: `La balance du compte Twillio est de ${balance.balance}$.`,
                        from: dataTwillio.twillioNumber,
                        to: dataTwillio.devNumber,
                    })
                    .then(message => console.log(message.sid));

                return res.status(200).json('Sms bien envoyé !');
            

        } catch (error) {
            console.trace(
                'Erreur dans la méthode smsSend du clientController :',
                error);
            res.status(500).json('Erreur lors de la vérification de votre numéro de téléphone');
        }
    },

    getAllTwillio: async (req, res) => {
        try {
            const resultats = await Twillio.findAll();

            res.status(200).json(resultats);
        } catch (error) {
            console.trace('Erreur dans la méthode getAllTwillio du adminController :',
                error);
            res.status(500).json(error.message);
        }
    },

    getOneTwillio: async (req, res) => {
        try {

            const resultat = await Twillio.findOne(req.params.id);
            res.json(resultat);

        } catch (error) {
            console.trace('Erreur dans la méthode getOneTwillio du adminController :',
                error);
            res.status(500).json(error.message);
        }
    },
    newTwillio: async (req, res) => {
        try {

            const data = {};

            data.twillioNumber = req.body.twillioNumber;
            data.devNumber = req.body.devNumber;
            data.clientNumber = req.body.clientNumber;
            data.accountSid = req.body.accountSid;
            data.authToken = req.body.authToken;
            data.sidVerify = req.body.sidVerify;
            console.log(data);
            const newClient = new Twillio(data);
            await newClient.save();
            res.json(newClient);
        } catch (error) {
            console.log(`Erreur dans la méthode newTwillio du adminController : ${error.message}`);
            res.status(500).json(error.message);
        }
    },
    updateTwillio: async (req, res) => {
        try {

            const {
                id
            } = req.params;

            const updateClient = await Twillio.findOne(id);

            const twillioNumber = req.body.twillioNumber;
            const devNumber = req.body.devNumber;
            const clientNumber = req.body.clientNumber;
            const accountSid = req.body.accountSid;
            const authToken= req.body.authToken;
            const sidVerify= req.body.sidVerify;
            
            let userMessage = {};

            if (twillioNumber) {
                updateClient.twillioNumber = twillioNumber;
                userMessage.twillioNumber = 'Votre nouveau twillioNumber a bien été enregistré ';
            } else if (!twillioNumber) {
                userMessage.twillioNumber = 'Votre twillioNumber n\'a pas changé';
            }


            if (devNumber) {
                updateClient.devNumber = devNumber;
                userMessage.devNumber = 'Votre nouveau devNumber a bien été enregistré ';
            } else if (!devNumber) {
                userMessage.devNumber = 'Votre devNumber n\'a pas changé';
            }

            if (clientNumber) {
                updateClient.clientNumber = clientNumber;
                userMessage.clientNumber = 'Votre nouveau clientNumber a bien été enregistré ';
            } else if (!clientNumber) {
                userMessage.clientNumber = 'Votre clientNumber n\'a pas changé';
            }
            if (accountSid) {
                updateClient.accountSid = accountSid;
                userMessage.accountSid = 'Votre nouveau accountSid a bien été enregistré ';
            } else if (!accountSid) {
                userMessage.accountSid = 'Votre accountSid n\'a pas changé';
            }
            if (authToken) {
                updateClient.authToken = authToken;
                userMessage.authToken = 'Votre nouveau authToken a bien été enregistré ';
            } else if (!authToken) {
                userMessage.authToken = 'Votre authToken n\'a pas changé';
            }
            if (sidVerify) {
                updateClient.sidVerify = sidVerify;
                userMessage.sidVerify = 'Votre nouveau sidVerify a bien été enregistré ';
            } else if (!sidVerify) {
                userMessage.sidVerify = 'Votre sidVerify n\'a pas changé';
            }
            if (devNumber) {
                updateClient.devNumber = devNumber;
                userMessage.devNumber = 'Votre nouveau devNumber a bien été enregistré ';
            } else if (!devNumber) {
                userMessage.devNumber = 'Votre devNumber n\'a pas changé';
            }


            await updateClient.update();

            res.json(userMessage);

        } catch (error) {
            console.log(`Erreur dans la méthode updateTwillio du adminController : ${error.message}`);
            res.status(500).json(error.message);
        }
    },
    deleteTwillio: async (req, res) => {

        try {

            const twillioInDb = await Twillio.findOne(req.params.id);

            const twillioDeleted = await twillioInDb.delete();

            res.json(twillioDeleted);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteTwillio du adminController :',
                error);
            res.status(500).json(error.message);
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



    // Pour vérifier un payement, twillio nous fournit également une méthode psd2 => Payment Service Directive 2  => https://www.twilio.com/blog/dynamic-linking-psd2      //https://www.twilio.com/docs/verify/verifying-transactions-psd2#
    smsVerifypsd2: async (req, res) => {
        try {
            twilio.verify.services(process.env.SERVICE_SID_MADASHOP)
                .verifications
                .create({
                    locale: 'fr',
                    amount: '€39.99', //a dynamiser si on utilise la méthode...
                    payee: 'MADAshop', // 
                    to: req.body.phoneNumber,
                    channel: 'sms'
                })
            req.session.phoneNumber = req.body.phoneNumber;
            return res.status(200).json('Un code par sms vous a été envoyé ! Merci de bien vouloir le renseigner pour terminer le vérification');

        } catch (error) {
            console.trace(
                'Erreur dans la méthode smsVerify du clientController :',
                error);
            res.status(500).json(error.message);
        }
    },


    smsCheckpsd2: async (req, res) => {

        try {
            const statut = await twilio.verify.services(process.env.SERVICE_SID_MADASHOP)
                .verificationChecks
                .create({
                    to: req.session.phoneNumber,
                    amount: req.body.amount,
                    payee: req.body.payee,
                    code: req.body.code,
                })
            console.log(statut);
            if (statut.status === 'approved') {

                const data = {};
                data.idClient = req.session.user.idClient;
                data.adminTelephone = statut.to;
                const newPhone = new AdminPhone(data);
                await newPhone.save();

                return res.status(200).json('Votre numéro de téléphone a été authentifié avec succés !')

            } else {
                res.status(403).json('Votre numéro de téléphone n\'a pas put être authentifié.')
            }

        } catch (error) {
            console.trace(
                'Erreur dans la méthode smsCheck du clientController :',
                error);
            res.status(500).json(error.message);
        }
    },




}

module.exports = adminController;