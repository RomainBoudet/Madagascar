const Client = require('../models/client');
const Shop = require('../models/shop');

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
                    text: `Bonjour ${userNowInDb.prenom} ${userNowInDb.nomFamille}.`,
                    html: `<h3>Bonjour <span class="username"> ${userNowInDb.prenom} ${userNowInDb.nomFamille}, </span> </h3> <br>`, // Mail a finir de personaliser !!
                });

                console.log("Message sent: %s", info.messageId);
                // le message envoyé ressemble a ça : <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
                console.log(`Un email de vérification bien envoyé a ${userNowInDb.prenom} ${userNowInDb.nomFamille} via l'adresse email: ${userNowInDb.email} : ${info.response}`);
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



    /**
     * Methode chargé d'aller mettre a jour les informations relatives à un client
     * @param {Express.Request} req - l'objet représentant la requête
     * @param {Express.Response} res - l'objet représentant la réponse
     * @param {req.params.id} req.params.id - le numéro identifiant un utilisateur précis
     * @param {req.body} req.body - les informations d'un utilisateur 

     */
    updateClient: async (req, res) => {


        try {
            //on vérifie si le user existe en BDD via à son ID
            const userIdinDb = await Client.findOne(req.params.id);
            // on extrait les infos du body //
            const {
                password,
                newPassword,
                newPasswordConfirm,
                prenom,
                nomFamille,
                email,
            } = req.body;
            const oldEmail = userIdinDb.email; // on l'utilisera ultérieurement pour un envoi d'email...
            let message = {};

            // on vérifit si l'utilisateur existe en BDD
            if (!userIdinDb.id === 'undefined' && userIdinDb.email === 'undefined') {
                console.log(`Cet utilisateur n'est pas enregistré en base de données`)
                return res.status(404).json(`Erreur lors de la mise a jour`)
            };
            //on vérifit que l'utiisateur a bien rentré son mot de passe pour changer un paramétre de son profil
            if (!password) {
                return res.status(403).json('Votre mot de passe est nécéssaire pour une mise a jour de votre profil')
            };
            
            // on vérifit que l'utilisateur est bien authentifié .
            if (await bcrypt.compare(password, userIdinDb.password)) {
                console.log("L'utilisateur est bien authentifié !")
            } else {
                console.log("Le mot de passe proposé pour changer le profil n'est pas valide !")
                return res.status(403).json('Erreur lors de la mise a jour')
            };
            //on check si le password et la vérif sont bien identiques
            if (newPassword !== newPasswordConfirm) {
                console.log("confirmation du nouveau mot de passe incorect")
                return res.json(
                    'La confirmation du nouveau mot de passe est incorrecte'
                );
            };

            // on ne change que les paramètres envoyés

            if (prenom) {
                userIdinDb.prenom = prenom;
                message.prenom = 'Votre nouveau prénom a bien été enregistré';
            } else if (!prenom) {
                message.prenom = 'Votre prénom n\'a pas changé';
            }

            if (nomFamille) {
                userIdinDb.nomFamille = nomFamille;
                message.nomFamille = 'Votre nouveau nom de famille a bien été enregistré';
            } else if (!nomFamille) {
                message.nomFamille = 'Votre nom de famille n\'a pas changé';
            }

            if (!email || email === 'undefined') {
                userIdinDb.email = userIdinDb.email;
                message.emailAdress = 'Votre email n\'a pas changé';
            } else {
               
                if (email !== userIdinDb.email && (validator.isEmail(email) === true)) {
                    userIdinDb.email = email;
                    console.log("Votre mail est modifié.");
                    message.email = 'Votre nouvel email a bien été enregistré';
                    message.général = 'Vous avez changé votre email, par mesure de sécurité, une notification par email vous a été envoyé sur votre ancien et nouvel email, vous confirmant la mise a jour de votre profil. Votre précédent email a été supprimé de la base de donnée, vous ne recevrez plus d\'envoie de notre part sur cet email. Les changements précédent ont bien été enregistré.';
                } else if (email === userIdinDb.email) {
                    console.log("Votre ancien mail est conservé.");
                    message.email = 'Votre email est le même que precedemment';
                    message.général = 'Un email vous a été envoyé vous confirmant la mise a jour de votre profil. les changements précédent ont bien été enregistré.'

                } else if (email !== userIdinDb.email && (validator.isEmail(email) === false)) {
                    console.log("Le format de votre nouvel mail est incorect, votre ancien mail est conservé.");
                    message.email = 'Le format de votre nouvel email est incorect, votre ancien email est conservé.';
                    message.général = 'Un email vous a été envoyé vous confirmant la mise a jour de votre profil. les changements précédent ont bien été enregistré.'
                }

            }





            // on vérifit le password : si un nouveau est inséré, on le compare à la confirmation, on le hash et on le met dans l'objet.
            if (newPassword && newPassword !== userIdinDb.password && newPassword === newPasswordConfirm) {

                console.log("le changement du mot de passe est demandé. Un nouveau mot de passe valide a été proposé")

                const hashedPwd = await bcrypt.hash(newPassword, 10);
                userIdinDb.password = hashedPwd;

                message.password = 'le changement du mot de passe est demandé. Un nouveau mot de passe valide a bien été enregistré';

            } else if (newPassword === password) {
                console.log("Le nouveau mot de passe n'a pas grand chose de nouveau..");
                message.password = 'Votre nouveau mot de passe est le même que precedemment';
            } else if (!newPassword) {
                console.log("l'ancien mot de passe est conservé.")
                message.password = 'Votre ancien mot de passe est conservé';
            }

            console.log("userInDb apres les modif et avant la mise en BDD => ", userIdinDb);
            const newUser = new Client(userIdinDb);

            await newUser.update();

            //! on envois deux mails (sur le nouveau et l'ancien) par sécurité en cas de changement d'adresse email dans le profil ! 
            //! ici envoie d'un mail sur la nouvelle adresse pour confirmer le changemet d'information au user ! 

            const shop = await Shop.findOne(process.env.IDSITE); // cela me permet de stocker les infos propre au site en BDD (nom du site, tel et mail de contact, et phrase de bienvenue personalisable). Si l'admin du site veux les changer, j'ai juste a inséer en BDD les nouvelles données, ce qui les répercuteras les modif partout il y aura besoin. 

            async function main() {

                const transporter = nodemailer.createTransport({
                    host: process.env.HOST,
                    port: 465,
                    secure: true, // true for 465, false for other ports
                    auth: {
                        user: process.env.EMAIL,
                        pass: process.env.PASSWORD_EMAIL,
                    },
                });
                const info = await transporter.sendMail({
                    from: shop.emailContact, //l'envoyeur
                    to: newUser.email,
                    subject: `Vos modification d'information sur le site de vente en ligne ${shop.nom} ont bien été pris en compte ! ✔`,
                    text: `Bonjour ${newUser.prenom} ${newUser.nomFamille},`,
                    html: `<h3>Bonjour <span class="username"> ${newUser.prenom} ${newUser.nomFamille}, </span> </h3> <br> Vous avez récemment changé vos informations personnelles dans la configuration de votre compte. 😊 <br>
                    Vos changement ont bien été pris en compte ! ✔️<br>
                    En vous remerciant et en espérant vous revoir bientôt sur ${shop.nom} !<br> 🤗
                    Bonne journée. <br>`, // le contenu du mail en format html.
                });

                console.log("Message sent: %s", info.messageId);
                // le message envoyé ressemble a ça : <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
                console.log(`Email bien envoyé a ${newUser.prenom} ${newUser.nomFamille} via la nouvelle adresse email: ${newUser.email} : ${info.response}`);
                // Email bien envoyé : 250 2.0.0 OK  1615639005 y16sm12341865wrh.3 - gsmtp => si tout va bien !

            }
            main().catch("Erreur lors de l'envois du nouveau mail dans la méthode updateClient", console.error);

            //! fin du premier envoi d'email a la nouvelle adresse mail du user



            if (email !== oldEmail && email !== 'undefined' ) {

                //! ici envoie d'un mail sur son ancienne adresse email pour confirmer le changemet d'information au user par sécurité ! 
                //! Un attaquant qui tenterais de changer un mail dans le profil aprés avoir dérobé le mot de passe du user serait démasqué et le user s'en rendrait compte sur sa boite mail.
                async function main() {

                    const transporter = nodemailer.createTransport({
                        host: process.env.HOST,
                        port: 465,
                        secure: true,
                        auth: {
                            user: process.env.EMAIL,
                            pass: process.env.PASSWORD_EMAIL,
                        },
                    });

                    const info = await transporter.sendMail({
                        from: shop.emailContact,
                        to: oldEmail,
                        subject: `Vos modification d'information sur le site de vente en ligne ${shop.nom} ont bien été pris en compte ! ✔`,
                        text: `Bonjour ${newUser.prenom} ${newUser.nomFamille},`,
                        html: `<h3>Bonjour <span class="username"> ${newUser.prenom} ${newUser.nomFamille}, </span> </h3>   <br>
                        Vous avez récemment changé vos informations personnelles dans la configuration de votre compte. 😊 <br>
                        Vos changement ont bien été pris en compte ! ✔️<br>
                        Vous avez changé d'adresse email, Ce sera le dernier email sur cette adresse.<br>
                        Une notification vous a également été envoyé sur votre nouvel email.<br>
                        En vous remerciant et en espérant vous revoir sur ${shop.nom} ! 🤗<br>
                        Bonne journée.`,
                    });

                    console.log("Message sent: %s", info.messageId);
                    // le message envoyé ressemble a ça : <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
                    console.log(`Email bien envoyé a ${newUser.prenom} ${newUser.nomFamille} via l'ancienne adresse email: ${oldEmail} : ${info.response}`);
                    // Email bien envoyé : 250 2.0.0 OK  1615639005 y16sm12341865wrh.3 - gsmtp => si tout va bien !

                }
                main().catch("Erreur lors de l'envois de l'ancien mail dans la méthode updateClient", console.error);

            }

            res.status(200).json(message);

            console.log(`L'utilisateur ${newUser.prenom} ${newUser.nomFamille} avec l'id : ${newUser.id} a bien été modifié.`);

        } catch (error) {
            res.status(500).json({message:'Erreur lors de la mise a jour des données'});
            console.log("Erreur dans la méthode updateClient du clientController : ", error);
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