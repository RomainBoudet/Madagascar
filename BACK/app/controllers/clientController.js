const Client = require('../models/client');
const validator = require('validator');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');



/**
 * Une variable d'environnement qui est présent dans le .env.back contenant la clé secréte utiisé pour générer le token
 * @param {Express.JWT_SECRET} - la clé secréte et sensible qui signe le token envoyé.
 */
const jwtSecret = process.env.JWT_SECRET;

/**
 * Une méthode qui va servir a intéragir avec le model Client pour les intéractions avec la BDD
 * Retourne un json
 * @name clientController
 * @method clientController
 * @param {Express.Request} req - l'objet représentant la requête
 * @param {Express.Response} res - l'objet représentant la réponse
 * @return {JSON}  - une donnée en format json
 */
const clientController = {

    /**
     * Methode chargé d'aller chercher les informations relatives à tous les clients
     * @param {Express.Request} req - l'objet représentant la requête
     * @param {Express.Response} res - l'objet représentant la réponse
     */
    getAll: async (req, res) => {
        try {
            const clients = await Client.findAll();

            res.status(200).json(clients);
        } catch (error) {
            console.trace('Erreur dans la méthode getAllUser du clientController :',
                error);
            res.status(500).json(error.message);
        }
    },

    /**
     * Methode chargé d'aller chercher les informations relatives à un utilisateur
     * @param {Express.Request} req - l'objet représentant la requête
     * @param {Express.Response} res - l'objet représentant la réponse
     * @param {req.params.id} req.params.id - le numéro identifiant un utilisateur précis
     */
    getOne: async (req, res) => {
        try {

            const client = await Client.findOne(req.params.id);
            res.json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode getOne du clientController :',
                error);
            res.status(500).json(error.message);
        }
    },

    /**
     * Methode chargé d'aller chercher les informations relatives à un utilisateur
     * @param {Express.Request} req - l'objet représentant la requête
     * @param {Express.Response} res - l'objet représentant la réponse
     * @param {email}} email - l'email' un utilisateur précis
     */
    getUserbyEmail: async (req, res) => {
        try {

            const {
                email
            } = req.body;

            const client = await Client.findByEmail(email);
            res.json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode getUserbyId du clientController :',
                error);
            res.status(500).json(error.message);
        }
    },






    signIn: async (req, response) => {
        try {

            const {prenom, nomFamille, email, password, passwordConfirm} = req.body;
            
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
            console.log(password, 'est devenu', hashedPwd);

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
             * On créer une nouvelle instance de User 
             * */
            const userNowInDb = new Client(newUser);

            /**
             * On l'envoie en BDD pour être enregistré
             */
            await userNowInDb.save();

            console.log(`L'utilisateur ${newUser.prenom} ${newUser.nomFamille} est désormais enregistré dans la BDD`);

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
                    text: `Bonjour ${userNowInDb.prenom} ${userNowInDb.nomFamille}.`, // l'envoie du message en format "plain text" ET HTML, permet plus de souplesse pour le receveur, tout le monde n'accepte pas le format html pour des raisons de sécurité sur ces boites mails, moi le premier ! 
                    html:`<h3>Bonjour <span class="username"> ${userNowInDb.prenom} ${userNowInDb.nomFamille}, </span> </h3> <br>`,// Mail a finir de personalisé !!
                });

                console.log("Message sent: %s", info.messageId);
                // le message envoyé ressemble a ça : <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
                console.log(`Un email de vérification bien envoyé a ${userNowInDb.prenom} ${userNowInDb.nomFamille} via l'adresse email: ${userNowInDb.email} : ${info.response}`);
                // Email bien envoyé : 250 2.0.0 OK  1615639005 y16sm12341865wrh.3 - gsmtp => si tout va bien !

            }
            main().catch(console.error);

            // on renvoie un message au FRONT !

            console.log("userNowInDb =>", userNowInDb)
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





    new: async (req, res) => {
        try {

            const data = {};

            data.prenom = req.body.prenom;
            data.nomFamille = req.body.nomFamille;
            data.email = req.body.email;
            data.password = req.body.password;

            const newClient = new Client(data);
            await newClient.save();
            res.json(newClient);
        } catch (error) {
            console.log(`Erreur dans la méthode new du clientController : ${error.message}`);
            res.status(500).json(error.message);
        }
    },

    updateClient: async (req, res) => {
        try {

            const {
                id
            } = req.params;

            const updateClient = await Client.findOne(id);


            const prenom = req.body.prenom;
            const nomFamille = req.body.nomFamille;
            const email = req.body.email;
            const password = req.body.password;


            let message = {};

            if (prenom) {
                updateClient.prenom = prenom;
                message.prenom = 'Votre nouveau prenom a bien été enregistré ';
            } else if (!prenom) {
                message.prenom = 'Votre prenom n\'a pas changé';
            }


            if (nomFamille) {
                updateClient.nomFamille = nomFamille;
                message.nomFamille = 'Votre nouveau nom de famille a bien été enregistré ';
            } else if (!nomFamille) {
                message.nomFamille = 'Votre nom de famille n\'a pas changé';
            }


            if (email) {
                updateClient.email = email;
                message.email = 'Votre nouveau email a bien été enregistré ';
            } else if (!email) {
                message.email = 'Votre email n\'a pas changé';
            }


            if (password) {
                updateClient.password = password;
                message.password = 'Votre nouveau password a bien été enregistré ';
            } else if (!password) {
                message.password = 'Votre password n\'a pas changé';
            }

            await updateClient.update();
            // si je veux renvoyer les données ET les infos textuels de ce qui a été modifié dans le même objet : spread opérator
            //const userMessage = {...message, ...newClient};
            // et je devrais renommer les clés de l'objet "message" pour qu'elles ne soient pas identique avec l'autre objet..
            res.json(message);

        } catch (error) {
            console.log(`Erreur dans la methode updateClient du clientController ${error.message}`);
            res.status(500).json(error.message);
        }
    },




    delete: async (req, res) => {

        try {

            const clientInDb = await Client.findOne(req.params.id);

            const client = await clientInDb.delete();

            res.json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode delete du clientController :',
                error);
            res.status(500).json(error.message);
        }
    },


}

module.exports = clientController;