const Client = require('../models/client');
const Shop = require('../models/shop');
const AdminVerifEmail = require('../models/adminVerifEmail');
const ClientHistoPass = require('../models/clientHistoPass');

const crypto = require('crypto');
const validator = require('validator');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');




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

            const user = await userNowInDb.save();
            await AdminVerifEmail.false(user.id);

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

                //console.log("Message sent: %s", info.messageId);
                // le message envoyé ressemble a ça : <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
                console.log(`Un email de bienvenue à bien envoyé a ${userNowInDb.prenom} ${userNowInDb.nomFamille} via l'adresse email: ${userNowInDb.email} : ${info.response}`);
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
            //on check si le password et la vérif sont bien identiques (mais Joi pourrait bloquer avant mais impossible de customiser l'erreur dans ce cas...)
            if (newPassword !== newPasswordConfirm) {
                console.log("confirmation du nouveau mot de passe incorect")
                return res.status(403).json(
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

            if (!email || email === undefined) {
                userIdinDb.email = userIdinDb.email;
                message.email = 'Votre email n\'a pas changé';
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

            if (newPassword && newPassword === newPasswordConfirm) {

                console.log("le changement du mot de passe est demandé. Un nouveau mot de passe valide a été proposé")

                const hashedPwd = await bcrypt.hash(newPassword, 10);
                userIdinDb.password = hashedPwd;
                const oldPass = new ClientHistoPass(userIdinDb);
                await oldPass.save();
                message.password = 'le changement du mot de passe est demandé. Un nouveau mot de passe valide a bien été enregistré';
            }
            if (newPassword === password) {
                console.log("Le nouveau mot de passe n'a pas grand chose de nouveau..");
                message.password = 'Votre nouveau mot de passe est le même que precedemment';
            }
            if (!newPassword) {
                console.log("l'ancien mot de passe est conservé.")
                message.password = 'Votre ancien mot de passe est conservé';
            }

            const newUser = new Client(userIdinDb);

            await newUser.update();

            //! on envois deux mails (sur le nouveau et l'ancien) par sécurité en cas de changement d'adresse email dans le profil ! 
            //! ici envoie d'un mail sur l'ancienne adresse pour confirmer le changemet d'information au user ! 

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
                    from: process.env.EMAIL, //l'envoyeur
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

            if (email !== oldEmail && email !== undefined) {

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
                        from: process.env.EMAIL,
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
            res.status(500).json({
                message: 'Erreur lors de la mise a jour des données'
            });
            console.log("Erreur dans la méthode updateClient du clientController : ", error);
        }
    },


    resendEmailLink: async (req, res) => {

        try {

            const {
                email
            } = req.body;

            if (!validator.isEmail(email)) {
                console.log("le format du mot de passe ne convient pas au validator")
                return res.status(403).json(
                    'le format de l\'email est incorrect'
                );

            }

            const userInDb = await Client.findByEmail(email);

            if (typeof userInDb.statut === "undefined") {
                console.log(`l'email ${email} n'existe pas en BDD !`);
                return res.status(404).json("cet email n'existe pas, assurez vous de l'avoir écris correctement.");
            }

            console.log("userInDb => ", userInDb);

            if (userInDb.statut === true) {
                console.log(`${userInDb.prenom} ${userInDb.nomFamille} posséde déja un statut d'email vérifié, avec un statut ${userInDb.verifyemail}. `);
                return res.status(200).json(`Bonjour ${userInDb.prenom} ${userInDb.nomFamille}, votre email à déja été validé avec succés !`);
            }

            // on génére un new token aprés les vérif de base :


            const jwtOptions = {
                issuer: `${userInDb.prenom} ${userInDb.nomFamille}`,
                audience: 'MADAshop',
                algorithm: 'HS512',
                expiresIn: '1h' // si l'utilisateur ne se réauthentifit pas dans l'heure le token sera a nouveau invalide.
            };

            const jwtContent = {
                userId: `${userInDb.id}`,
                jti: userInDb.id + "_" + crypto.randomBytes(9).toString('base64')

            };

            const newToken = await jsonwebtoken.sign(jwtContent, jwtSecret, jwtOptions);

            async function main() {
                const host = req.get('host');
                const link = `https://${host}/v1/verifyEmail?userId=${userInDb.id}&token=${newToken}`;
                console.log("ici host vaut =>", host);
                console.log("ici link vaut => ", link);
                console.log("newToken => ", newToken);

                //le bout de code qui permet le transport de mon code 
                const transporter = nodemailer.createTransport({
                    host: process.env.HOST,
                    port: 465,
                    secure: true, // true for 465, false for other ports
                    auth: {
                        user: process.env.EMAIL,
                        pass: process.env.PASSWORD_EMAIL,
                    },
                });

                const shop = await Shop.findOne(process.env.IDSITE);

                // l'envoie d'email définit par l'object "transporter"
                const info = await transporter.sendMail({
                    from: process.env.EMAIL,
                    to: `${userInDb.email}`, // 
                    subject: `Merci de confirmer votre email pour ${shop.nom}`, // le sujet du mail
                    text: `Bonjour ${userInDb.prenom} ${userInDb.nomFamille}, merci de cliquer sur le lien pour vérifier votre email auprés de ${shop.nom}. ${link}`,
                    html: `<h3>Bonjour <span class="username"> ${userInDb.prenom} ${userInDb.nomFamille}, </span> </h3> <br>
                <p>Vous souhaitez authentifier votre email auprés de<h4>${shop.nom}.</h4></p> <br> 
                <p>Merci de cliquer sur le lien pour vérifier votre email. </p> <br>
                <a href="${link}">cliquez ici pour vérifier votre email. </a> <br>`,
                });

                console.log("Message sent: %s", info.messageId);
                // le message envoyé ressemble a ça : <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
                console.log(`Un email de vérification bien envoyé a ${userInDb.prenom} ${userInDb.nomFamille} via l'adresse email: ${userInDb.email} : ${info.response}`);
                // Email bien envoyé : 250 2.0.0 OK  1615639005 y16sm12341865wrh.3 - gsmtp => si tout va bien !

                // Quand l'utilisateur clique sur le lien, il est renvoyé sur la route verifyEmail ! 
            }
            main().catch("Erreur lors de l'envois du mail dans la méthode updateUser", console.error);

            res.json("Merci de cliquer sur le lien envoyé par mail.");

        } catch (error) {
            console.trace(
                'Erreur dans la méthode resendEmailLink du userController :',
                error);
            res.status(500).json(error.message);
        }
    },




    verifyEmail: async (req, res, err) => {
        try {

            const {
                userId,
                token
            } = req.query;

            const userInDb = await Client.findOne(userId);


            const decodedToken = await jsonwebtoken.verify(token, jwtSecret, {
                audience: 'MADAshop',
                issuer: `${userInDb.prenom} ${userInDb.nomFamille}`,
            }, function (err, decoded) {

                if (err) {
                    return res.json("la validation de votre email a échoué")
                }

                return decoded
            });

            if (userInDb.statut) {
                console.log(`Le mail ${userInDb.email} à déja été authentifié avec succés !`);
                return res.json({
                    message: `Bonjour ${userInDb.prenom}, votre mail ${userInDb.email} a déja été authentifié avec succés ! Vous pouvez désormais fermer cette page.`
                })
                /* return res.status(200).render('verifyEmail', {
                    userInDb,
                    shop
                }); */

            } else if (!decodedToken.userId === userInDb.id && decodedToken.iss == `${userInDb.prenom} ${userInDb.nom}`) {
                console.log(`une érreur est apparu =>`, err)
                return res.json({
                    message: `Bonjour ${userInDb.prenom}, votre mail ${userInDb.email} n'a pas put être identifié suite a une érreur ! Vous pouvez désormais fermer cette page.`
                })
                /* return res.status(401).render('verifyEmailFail', {
                    userInDb,
                    shop
                }); */

            } else {
                await AdminVerifEmail.true(userInDb.id);

                console.log(`Le mail ${userInDb.email} à été authentifié avec succés !`);
                //res.status(200).render('verifyEmailWin', {userInDb, shop})
                return res.json({
                    message: `Bonjour ${userInDb.prenom}, votre mail ${userInDb.email} a été authentifié avec succés ! Vous pouvez désormais fermer cette page.`
                })

            }

        } catch (error) {
            console.trace(
                'Erreur dans la méthode verifyEmail du clientController :',
                error);
            res.status(500).json(error.message);
        }

    },




    new_pwd: async (req, res) => {

        try {
            const {
                email
            } = req.body;

            if (!validator.isEmail(email)) {
                console.log("le format du mot de passe ne convient pas au validator")
                return res.status(403).json(
                    'le format de l\'email est incorrect'
                );
            }

            const userInDb = await Client.findByEmail(email);

            if (typeof userInDb.id === undefined) {
                console.log(`l'email ${email} n'existe pas en BDD !`);
                res.status(404).json("cet email n'existe pas, assurez vous de l'avoir écris correctement.");
            }

            // Je construit un secret dynamique de déchiffrage du token !  => Pour rendre le lien unique est invalide a la seconde où l'utilisateur rentre un nouveau pssword, je prend son hash existant que je concaténe a sa date d'inscription pour en faire la clé secrete du token !
            // Ainsi lorsque l'utilisateur met à jour son mot de passe, nous remplacerons l'ancien hachage par le nouveau, et personne ne pourra plus accéder à la clé secrète qui aura disparu !!
            //Avec la combinaison du hachage du mot de passe de l'utilisateur et de la createdAtdate, le JWT devient un jeton à usage unique, car une fois que l'utilisateur a changé son mot de passe, les appels successifs à cette route généreront un nouveau hachage de mot de passe, et viendront ainsi invalider la clé secrète qui référence le mot de passe .

            // mais pourquoi doubler avec sa date d'inscription => cela permet de garantir que si le mot de passe de l'utilisateur était la cible d'une attaque précédente (sur un autre site web ou l'utilisateur a mis le même password), la date de création de l'utilisateur rendra la clé secrète unique à partir du mot de passe potentiellement divulgué. Même si l'attaquant a craké le code de notre utilisateur, comment pourra-t'il savoir la date, jusqu'a la seconde précise, de création du compte de notre l'utilisateur  ? Bon chance.... 😝 !! 

            const secret = `${userInDb.password}_${userInDb.createdDate}`
            console.log("secret => ", secret);
            // on génére un new token aprés les vérif de base :

            const jwtOptions = {
                issuer: `${userInDb.prenom} ${userInDb.nomFamille}`,
                audience: 'envoiresetpwd',
                algorithm: 'HS512',
                expiresIn: '1h' // si l'utilisateur ne valide pas un new password dans l'heure, le token sera invalide.
            };

            const jwtContent = {
                userId: `${userInDb.id}`,
                jti: userInDb.id + "_" + crypto.randomBytes(9).toString('base64'),

            };

            const newToken = await jsonwebtoken.sign(jwtContent, secret, jwtOptions);
            console.log("newToken =>", newToken);


            async function main() {


                const host = req.get('host');

                const link = `https://${host}/v1/user/reset_pwd?userId=${userInDb.id}&token=${newToken}`;
                //console.log("ici link vaut => ", link);
                //console.log("newToken => ", newToken);

                const transporter = nodemailer.createTransport({
                    host: process.env.HOST,
                    port: 465,
                    secure: true,
                    auth: {
                        user: process.env.EMAIL,
                        pass: process.env.PASSWORD_EMAIL,
                    },
                });

                const shop = await Shop.findOne(process.env.IDSITE);


                const info = await transporter.sendMail({
                    from: process.env.MAIL,
                    to: `${userInDb.email}`,
                    subject: `${shop.nom} : Changement de votre mot de passe`,
                    text: `Bonjour ${userInDb.prenom} ${userInDb.nomFamille}, merci de cliquer sur le lien pour vérifier votre email auprés du site ${shop.nom}. ${link}`,
                    html: `<h3>Bonjour <span class="username"> ${userInDb.prenom} ${userInDb.nomFamille}, </span> </h3> <br>
                  <p>Vous souhaitez réinitialiser votre mot de passe du site ${shop.nom}.</p> <br> 
                  <p>Merci de cliquer sur le lien pour changer votre mot de passe. </p> <br>
                  <a href="${link}">cliquez ici pour changer votre mot de passe. </a><br>`,
                });

                console.log("Message sent: %s", info.messageId);
                // le message envoyé ressemble a ça : <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
                console.log(`Un email de confirmation à bien été envoyé a ${userInDb.prenom} ${userInDb.nomFamille} via l'adresse email: ${userInDb} : ${info.response}`);
                // Email bien envoyé : 250 2.0.0 OK  1615639005 y16sm12341865wrh.3 - gsmtp => si tout va bien !

            }
            main().catch(console.error);


            res.json("Merci de consulter vos emails et de cliquer sur le lien envoyé pour renouveller votre mot de passe.");

        } catch (error) {

            console.trace(
                'Erreur dans la méthode resendEmailLink du clientController :',
                error);
            res.status(500).json(error.message);
        }
    },


    reset_pwd: async (req, res, err) => {
        try {

            // je récupére des infos de la query (userId et token) et du body (newPassword, password)
            const {
                userId,
                token
            } = req.query;


            const {
                passwordConfirm,
                newPassword,
            } = req.body;

            // ETAPE 1 avant de d'insérer quoi que ce soit en BDD ou de verifier que les passwords soient identiques, je m'assure de l'identité de l'utilisateur en déchiffrant le token avec la clé dynamique crée dans la méthode new_pwd. 

            const userInDb = await Client.findOne(userId);

            // premiere vérif, je vérifis le pseudo dans le body et l'id dans la query, si une des deux n'existe pas ou pas égale au même utilisateur.. au revoir !
            if (typeof userInDb.id === 'undefined') {
                console.log("Bonjour, c'est gentil d'être passé mais votre identité n'a pas été reconnu 🤨")
                res.json("Bonjour, c'est gentil d'être passé mais votre identité n'a pas été reconnu 🤨 ")
            }

            // Je reconstitue ma clé secrete pour décoder le token.
            const secret = `${userInDb.password}_${userInDb.createdDate}`


            const decodedToken = await jsonwebtoken.verify(token, secret, {
                audience: 'envoiresetpwd',
                issuer: `${userInDb.prenom} ${userInDb.nomFamille}`
            }, function (err, decoded) {

                if (err) {
                    console.log("La validation de l'identité a échoué : le token émis ne correspond pas au token déchiffré !")
                    res.json("La validation de votre identité pour renouveller votre mot de passe a échoué.", err)
                }
                return decoded
            });

            //ETAPE 2 => check vérif password, hash, mise en BDD et renvoie message + info au Front !

            //on check si le password et la vérif sont bien identiques
            if (newPassword !== passwordConfirm) {
                console.log("confirmation du nouveau mot de passe incorect")
                res.statut(400).json('La confirmation du nouveau mot de passe est incorrecte');
            }

            // On hash le mot de passe avant la mise en BDD :
            const password = await bcrypt.hash(newPassword, 10);

            const newUser = {
                id: userInDb.id,
                password,
            };

            const userUpdatePasssword = new Client(newUser);
            await userUpdatePasssword.updatePwd();
            const oldPass = new ClientHistoPass(userInDb);
            await oldPass.save();

            console.log(`Le password de ${userInDb.prenom} ${userInDb.nomFamille}  à été modifié avec succés !`);

            res.status(200).json({
                message: `Bonjour ${userInDb.prenom} ${userInDb.nomFamille}, votre mot de passe a été modifié avec succés ! Un email de confirmation vous a été envoyé.`
            })
            // ETAPE 3 :
            // On renvoit un petit mail a l'utilisateur pour lui confirmer le changement de mot de passe ! Histoire de bien flooder sa boite mail ! ça fait plaisir... 😁

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

                const shop = await Shop.findOne(process.env.IDSITE);

                const info = await transporter.sendMail({
                    from: process.env.MAIL,
                    to: userInDb.email,
                    subject: `Vos modification d'information sur le site ${shop.nom} ont bien été pris en compte ! ✔`,
                    text: `Bonjour ${userInDb.prenom} ${userInDb.nomFamille}, Votre changement de mot de passe ont bien été pris en compte sur le site ${shop.nom} !`,
                    html: `<h3>Bonjour <span class="username"> ${userInDb.prenom} ${userInDb.nomFamille}, </span> </h3> <br>
                    <p>Vous vous êtes inscrit sur le site ${shop.nom}.</p>
                    <p> Votre changement de mot de passe à bien été pris en compte ! ✔️ </p> <br>
                    <p>En vous remerciant et en espérant vous revoir bientôt sur ${shop.nom} ! 🤗</p>
                    <p> Bonne journée.</p> <br>
                    <a href="http://localhost:8080"> ${shop.nom} </a><br>`,
                });

                console.log("Message sent: %s", info.messageId);
                // le message envoyé ressemble a ça : <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
                console.log(`Email bien envoyé a ${userInDb.prenom} ${userInDb.nomFamille} via l'adresse email: ${userInDb.email} : ${info.response}`);
                // Email bien envoyé : 250 2.0.0 OK  1615639005 y16sm12341865wrh.3 - gsmtp => si tout va bien !

            }
            main().catch("Erreur lors de l'envois du mail dans la méthode updateUser", console.error);

        } catch (error) {
            console.trace(
                'Erreur dans la méthode reset_pwd du clientController :',
                error);
            res.status(500).json(error.message);
        }

    },




    deleteById: async (req, res) => {

        try {

            const {
                password
            } = req.body;
            const clientAuthentifieInDb = await Client.authenticateWhitoutHisto(req.session.user.email, password);
            if (!clientAuthentifieInDb) {
                return res.status(401).json("Erreur d'authentification : vous nêtes pas autoriser a supprimer un utilisateur.");
            }

            const clientInDb = await Client.findUnique(req.params.id);
            if (!clientInDb.id === undefined) {
               return res.status(404).json("Le client qui vous souhaitez supprimer n'existe pas en BDD");
            }
            const client = await clientInDb.delete();

            res.status(200).json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteById du clientController :',
                error);
            res.status(500).json(error.message);
        }
    },

    deleteByEmail: async (req, res) => {

        try {

            const {
                password
            } = req.body;
            const clientAuthentifieInDb = await Client.authenticateWhitoutHisto(req.session.user.email, password);
            if (!clientAuthentifieInDb) {
                return res.status(401).json("Erreur d'authentification : vous nêtes pas autoriser a supprimer un utilisateur.");
            }

            const clientInDb = await Client.findByEmail(req.body.email);
            if (clientInDb.email === undefined) {
                return res.status(404).json("Le client qui vous souhaitez supprimer n'existe pas en BDD");
            }
            const client = await clientInDb.delete();

            res.status(200).json(client);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteByEmail du clientController :',
                error);
            res.status(500).json(error.message);
        }
    },



}

module.exports = clientController;