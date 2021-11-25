const Commande = require('../models/commande');
const StatutCommande = require('../models/statutCommande');
const LigneCommande = require('../models/ligneCommande');
const ProduitRetour = require('../models/produitRetour');
const AdminVerifEmail = require('../models/adminVerifEmail');






//config mail
const Imap = require('imap');
const {
    simpleParser
} = require('mailparser');
const MailListener = require("mail-listener2");

// distance de Levenshtein, correction orthographe
const {
    distance,
    closest
} = require('fastest-levenshtein');
const {
    sendEmail
} = require('../services/sendEmail');

const {
    formatLong,
    formatJMAHMSsecret,
    formatCoupon,
    formatLongSeconde,
    dayjs,
    formatLongSansHeure,
    addWeekdays,
    formatJMA,
} = require('../services/date');

/**
 * Une méthode qui va servir a intéragir avec le model Commande pour les intéractions avec la BDD
 * Retourne un json
 * @name commandeController
 * @param {Express.Request} req - l'objet représentant la requête
 * @param {Express.Response} res - l'objet représentant la réponse
 * @return {JSON}  - une donnée en format json
 */
const commandeController = {


    //! une méthode permettant de changer le statut d'une commande afin de suivre l'evolution d'une commande pour le client !


    updateStatut: async (req, res) => {
        try {

            // ici je n'autorise que certain statut a être updaté ! 
            // les statuts : 2 = Paiement validé, 3 = En cours de préparation, 4 = Prêt pour expédition, 
            // le statut Expédié n'est pas traité ici, une route dédié lui est attribué pour une insertion des données dans la table livraison sur la route /admin/livraison/new
            // par mesure de sécurité et pour plus de liberté, j'autorise néanmoins le Developpeur a changé tout statut comme il le souhaite ! 


            if (req.session.user.privilege === 'Client') {
                return res.status(403).json({
                    message: "Vous n'avez pas les droits pour accéder a cette ressource"
                })
            };
            //! parser un email : https://medium.com/@akinremiolumide96/reading-email-data-with-node-js-cdacaa174cc7 

            //RAPPEL des statuts de commande : 1 = En attente, 2 = Paiement validé, 3 = En cours de préparation, 4 = Prêt pour expédition, 5 = Expédiée, 6 = Remboursée, 7 = Annulée;

            //pour une API flexible on prend soit une réference de commande soit un id de commande et soit le nom d'un statut soit sont id !
            // et on autorise l'admin a faire 3 faute par statut, on on le corrige automatiquement ! sinon on lui propose le plus proche statut existant... Merci Levenshtein !

            //! je fait le tri si c'est une référence de commande ou un id de commande !

            const regRefCommande = /^([0-9]*[.]{1}[0-9]*)*$/; // pour une référence de commande
            const number = /^[0-9]*$/; // pour un id de commande
            const notNumber = /[^0-9]+/; // a utiliser pour discriminer le statut de commande en format string. 

            // on vérifit que la confirmation de statut est conforme au statut !
            // sécurité supplémentaire de Joi..
            if (req.body.statut !== req.body.confirmStatut) {
                console.log("La confirmation de votre statut doit être identique a votre statut !");
                return res.status(200).json({
                    message: "La confirmation de votre statut doit être identique a votre statut !"
                })
            }

            let commandeInDb;
            let statutInDb;

            //! Cette partie de code permettait de donner plus de pouvoir au role developpeur, lui permettant de passer certains statut de commande aux statuts souhaité
            //! Jugée unsafe et non utile a posteriori...

            /* if (req.session.user.privilege === 'Developpeur') {

                if (regRefCommande.test(req.body.commande)) {
                    // ici commande est une référence
                    commandeInDb = await Commande.findOneCommande(req.body.commande);

                    if (commandeInDb === null || commandeInDb === undefined) {
                        console.log("Cette référence de commande n'éxiste pas !");
                        return res.status(200).json({
                            message: "Cette référence de commande n'éxiste pas !"
                        })
                    }

                } else if (number.test(req.body.commande)) {
                    // ici commande est un identifiant
                    commandeInDb = await Commande.findOne(req.body.commande);

                    if (commandeInDb === null || commandeInDb === undefined) {
                        console.log("Cette identifiant de commande n'éxiste pas !");
                        return res.status(200).json({
                            message: "Cette identifiant de commande n'éxiste pas !"
                        })
                    }

                } else {
                    console.log("votre commande n'a pas le format souhaité ! Elle doit avoir soit le format d'une réference soit celui d'un identifiant.");
                    return res.status(200).json({
                        message: "votre commande n'a pas le format souhaité ! Elle doit avoir soit le format d'une réference soit celui d'un identifiant."
                    })
                }


                if (number.test(req.body.statut)) {

                    // ici req.body.statut est un identifiant !
                    statutInDb = await StatutCommande.findOne(req.body.statut);

                    // Je vérifis que le statut proposé pour update existe !
                    if (statutInDb === null || statutInDb === undefined) {
                        console.log("Cette identifiant de statut n'éxiste pas !")
                        return res.status(200).json({
                            message: "Cette identifiant de statut n'éxiste pas !"
                        })
                    }
                    // J'avertit l'admin si le statut qu'il souhaiterais mettre a jour est déja le statut existant !
                    if (Number(req.body.statut) === commandeInDb.idCommandeStatut) {
                        console.log("Le statut proposé pour cette commande est déja celui existant !")
                        return res.status(200).json({
                            message: "Le statut proposé pour cette commande est déja celui existant !"
                        })
                    }
                    // J'avertit l'admin si sa mise a jour ne suit pas un ordre logique... si il a sauté des étapes..
                    // simple avertissement, on ne "return" pas !
                    if (Number(req.body.statut) !== (commandeInDb.idCommandeStatut + 1)) {
                        console.log("Votre mise a jour de statut ne suit pas l'ordre logique... ")
                        res.status(200).json({
                            message: `Votre mise a jour de statut ne suit pas l'ordre logique... vous êtes passé de ${commandeInDb.idCommandeStatut} à ${req.body.statut}  (RAPPEL: 1 = En attente, 2 = Paiement validé, 3 = En cours de préparation, 4 = Prêt pour expédition, 5 = Expédiée, 6 = Remboursée, 7 = Annulée)`
                        })
                    }

                } else if (notNumber.test(req.body.statut)) {

                    // je construit un tableau composé de mes statut, dynamiquement !
                    const arrayStatut = [];
                    let allStatuts;
                    try {
                        allStatuts = await StatutCommande.findAll();
                        for (const item of allStatuts) {
                            arrayStatut.push(item.statut);
                        }

                    } catch (error) {
                        console.log(`erreur dans la méthode upDateSatut du CommandeController ! lors de la recherche de tous les statuts ! ${error}`);
                        return res.statut(500).end();
                    }

                    // Ici j'ai une string sans chiffre dans le formulaire, j'utilise la distance de Levenshtein pour réorienter une potentielle érreur de l'admin !
                    // Je calcul toutes les distance de Levenstein entre le mot proposé et ceux de mon tableau et je prends la plus petite. 
                    let arrayDistance = [];
                    for (const item of arrayStatut) {
                        const theDistance = distance(req.body.statut, item);
                        arrayDistance.push(theDistance);
                        //console.log("theDistance == ", theDistance);
                    }

                    const isDistInf3 = (element) => element <= 3;
                    const indexSmallDistance = arrayDistance.findIndex(isDistInf3);
                    // console.log("indexSmallDistance == ", indexSmallDistance);

                    // si indexSmallDistance vaut -1 alors aucun match !!
                    if (indexSmallDistance === -1 || indexSmallDistance === undefined) {

                        // Je prospose néanmoins a l'admin le mot le plus proche possible de sa demande !
                        const closeWord = closest(req.body.statut, arrayStatut);
                        console.log(`Aucun statut existant ne correspond a votre demande de statut, vouliez-vous indiqué le statut : '${closeWord}' ?`);
                        return res.status(200).json({
                            message: `Aucun statut existant ne correspond a votre demande de statut, vouliez-vous indiqué le statut : '${closeWord}' ?`
                        })
                    }

                    // ici indexSmallDistance est forcemment inférieur a 3 ou moins, on convertit le statut entrée par l'admin en statut existant le plus proche !  
                    req.body.statut = arrayStatut[indexSmallDistance];

                    // J'avertit l'admin si le statut qu'il souhaiterais mettre a jour est déja le statut existant !
                    if (req.body.statut === commandeInDb.statut) {
                        console.log("Le statut proposé pour cette commande est déja celui existant !")
                        return res.status(200).json({
                            message: "Le statut proposé pour cette commande est déja celui existant !"
                        })
                    }

                    // j'avertit l'admin si ca mise a jour ne suit pas un ordre logique... si il a sauté des étapes..
                    // simple avertissement, on ne "return" pas !
                    const isStatut = (element) => element === req.body.statut;
                    const indexStatut = arrayStatut.findIndex(isStatut);

                    const isStatut2 = (element) => element === commandeInDb.statut;
                    const indexStatutCommande = arrayStatut.findIndex(isStatut2);

                    if (indexStatut !== (indexStatutCommande + 1)) {
                        console.log("commandeInDb.statut == ", commandeInDb.statut);
                        console.log("Votre mise a jour de statut ne suit pas l'ordre logique... ")
                        res.status(200).json({
                            message: `Votre mise a jour de statut ne suit pas l'ordre logique... vous êtes passé de '${commandeInDb.statut}' à '${req.body.statut}'  (RAPPEL: 1 = En attente, 2 = Paiement validé, 3 = En cours de préparation, 4 = Prêt pour expédition, 5 = Expédiée, 6 = Remboursée, 7 = Annulée)`
                        })
                    }


                    // je dois ici retrouver l'objet du tableau allStatuts contentant la valeur de req.body.statut dans un de ces objets
                    statutInDb = allStatuts.find(element => element.statut === req.body.statut);


                    // par défault je ne devrais jamais rentrer dans ce else, soit statut est un nombre, soit il est pas un nombre, pas de 3ieme choix !
                } else {
                    console.log("votre statut n'a pas le format souhaité ! il doit avoir soit le format d'un nom de statut soit celui d'un identifiant (nombre).");
                    return res.status(200).json({
                        message: "votre statut n'a pas le format souhaité ! il doit avoir soit le format d'un nom de statut soit celui d'un identifiant (nombre)."
                    })
                }


            } else { */

            //! Ici dans le role administrateur, toutes les commandes selon leurs statuts ne peuvent être updaté !
            //! seuls ces statuts sont autorisé a être modifiés : 2 = Paiement validé, 3 = En cours de préparation, 4 = Prêt pour expédition,
            //! le statut Expédié n'est pas traité ici, une route dédié lui est attribué pour une insertion des données dans la table livraison sur la route /admin/livraison/new


            if (regRefCommande.test(req.body.commande)) {
                // ici commande est une référence
                commandeInDb = await Commande.findOneCommandeLimited(req.body.commande);

                if (commandeInDb === null || commandeInDb === undefined) {
                    console.log("Cette référence de commande n'éxiste pas ou son statut n'est pas compatible avec une mise a jour manuel !");
                    return res.status(200).json({
                        message: "Cette référence de commande n'éxiste pas ou son statut n'est pas compatible avec une mise a jour manuel !"
                    })
                }

            } else if (number.test(req.body.commande)) {
                // ici commande est un identifiant
                commandeInDb = await Commande.findOneLimited(req.body.commande);

                if (commandeInDb === null || commandeInDb === undefined) {
                    console.log("Cette référence de commande n'éxiste pas ou son statut n'est pas compatible avec une mise a jour manuel !");
                    return res.status(200).json({
                        message: "Cette référence de commande n'éxiste pas ou son statut n'est pas compatible avec une mise a jour manuel !"
                    })
                }

            } else {
                console.log("votre commande n'a pas le format souhaité ! Elle doit avoir soit le format d'une réference soit celui d'un identifiant.");
                return res.status(200).json({
                    message: "votre commande n'a pas le format souhaité ! Elle doit avoir soit le format d'une réference soit celui d'un identifiant."
                })
            }


            if (number.test(req.body.statut)) {

                // ici req.body.statut est un identifiant !
                statutInDb = await StatutCommande.findOneLimited(req.body.statut);

                // Je vérifis que le statut proposé pour update existe !
                if (statutInDb === null || statutInDb === undefined) {
                    console.log("votre statut n'a pas le format souhaité !")
                    return res.status(200).json({
                        message: "votre statut n'a pas le format souhaité !"
                    })
                }
                // J'avertit l'admin si le statut qu'il souhaiterais mettre a jour est déja le statut existant !
                if (Number(req.body.statut) === commandeInDb.idCommandeStatut) {
                    console.log("Le statut proposé pour cette commande est déja celui existant !")
                    return res.status(200).json({
                        message: "Le statut proposé pour cette commande est déja celui existant !"
                    })
                }
                // j'avertit l'admin si sa mise a jour ne suit pas un ordre logique... si il a sauté des étapes..
                // simple avertissement, on ne "return" pas !
                if (Number(req.body.statut) !== (commandeInDb.idCommandeStatut + 1)) {
                    console.log("Votre mise a jour de statut ne suit pas l'ordre logique... ")
                    res.status(200).json({
                        message: `Votre mise a jour de statut ne suit pas l'ordre logique... vous êtes passé de ${commandeInDb.idCommandeStatut} à ${req.body.statut}  (RAPPEL: 1 = En attente, 2 = Paiement validé, 3 = En cours de préparation, 4 = Prêt pour expédition, 5 = Expédiée, 6 = Remboursée, 7 = Annulée)`
                    })
                }


            } else if (notNumber.test(req.body.statut)) {

                // je construit un tableau composé de mes statut, dynamiquement !
                const arrayStatut = [];
                let allStatuts;
                try {
                    allStatuts = await StatutCommande.findAllLimited();
                    for (const item of allStatuts) {
                        arrayStatut.push(item.statut);
                    }

                } catch (error) {
                    console.log(`erreur dans la méthode upDateSatut du CommandeController ! lors de la recherche de tous les statuts ! ${error}`);
                    return res.statut(500).end();
                }

                // Ici j'ai une string sans chiffre dans le formulaire, j'utilise la distance de Levenshtein pour réorienter une potentielle érreur de l'admin !
                // Je calcul toutes les distance de Levenstein entre le mot proposé et ceux de mon tableau et je prends la plus petite. 
                let arrayDistance = [];
                for (const item of arrayStatut) {
                    const theDistance = distance(req.body.statut, item);
                    arrayDistance.push(theDistance);
                    //console.log("theDistance == ", theDistance);
                }

                const isDistInf3 = (element) => element <= 3;
                const indexSmallDistance = arrayDistance.findIndex(isDistInf3);
                // console.log("indexSmallDistance == ", indexSmallDistance);

                // si indexSmallDistance vaut -1 alors aucun match !!
                if (indexSmallDistance === -1 || indexSmallDistance === undefined) {

                    // Je prospose néanmoins a l'admin le mot le plus proche possible de sa demande !
                    const closeWord = closest(req.body.statut, arrayStatut);
                    console.log(`Aucun statut existant ne correspond a votre demande de statut, vouliez-vous indiqué le statut : '${closeWord}' ?`);
                    return res.status(200).json({
                        message: `Aucun statut existant ne correspond a votre demande de statut, vouliez-vous indiqué le statut : '${closeWord}' ?`
                    })
                }

                // ici indexSmallDistance est forcemment inférieur a 3 ou moins, on convertit le statut entrée par l'admin en statut existant le plus proche !  
                req.body.statut = arrayStatut[indexSmallDistance];

                // J'avertit l'admin si le statut qu'il souhaiterais mettre a jour est déja le statut existant !
                if (req.body.statut === commandeInDb.statut) {
                    console.log("Le statut proposé pour cette commande est déja celui existant !")
                    return res.status(200).json({
                        message: "Le statut proposé pour cette commande est déja celui existant !"
                    })
                }

                // j'avertit l'admin si ca mise a jour ne suit pas un ordre logique... si il a sauté des étapes..
                // simple avertissement, on ne "return" pas !
                const isStatut = (element) => element === req.body.statut;
                const indexStatut = arrayStatut.findIndex(isStatut);

                const isStatut2 = (element) => element === commandeInDb.statut;
                const indexStatutCommande = arrayStatut.findIndex(isStatut2);

                if (indexStatut !== (indexStatutCommande + 1)) {
                    console.log("commandeInDb.statut == ", commandeInDb.statut);
                    console.log("Votre mise a jour de statut ne suit pas l'ordre logique... ")
                    res.status(200).json({
                        message: `Votre mise a jour de statut ne suit pas l'ordre logique... vous êtes passé de '${commandeInDb.statut}' à '${req.body.statut}'  (RAPPEL: 1 = En attente, 2 = Paiement validé, 3 = En cours de préparation, 4 = Prêt pour expédition, 5 = Expédiée, 6 = Remboursée, 7 = Annulée)`
                    })
                }


                // je dois ici retrouver l'objet du tableau allStatuts contentant la valeur de req.body.statut dans un de ces objets
                statutInDb = allStatuts.find(element => element.statut === req.body.statut);


                // par défault je ne devrais jamais rentrer dans ce else, soit statut est un nombre, soit il est pas un nombre, pas de 3ieme choix !
            } else {
                console.log("votre statut n'a pas le format souhaité ! il doit avoir soit le format d'un nom de statut soit celui d'un identifiant (nombre).");
                return res.status(200).json({
                    message: "votre statut n'a pas le format souhaité ! il doit avoir soit le format d'un nom de statut soit celui d'un identifiant (nombre)."
                })
            }

            console.log("statutInDb  == ", statutInDb);
            console.log("commandeInDb  == ", commandeInDb);

            // j'insére cet update en BDD !
            const data = {
                idCommandeStatut: statutInDb.id,
                id: commandeInDb.id,
            }

            const newUpdate = new Commande(data);
            const updateDone = await newUpdate.updateStatutCommande();

            console.log("updateDone == ", updateDone);


            res.status(200).end();
        } catch (error) {
            console.trace('Erreur dans la méthode  updateStatut du commandeController :',
                error);
            res.status(500).end();
        }
    },

    // DOC :
    // https://dev.to/akinmyde/reading-email-data-with-node-js-bjf
    // https://www.npmjs.com/package/imap 
    // exemple : https://github.com/accakks/Sending-and-Receiving-Emails-using-node.js/blob/master/receiver.js

    getEmail: async (req, res) => {
        try {


            const imapConfig = {
                user: process.env.EMAIL,
                password: process.env.PASSWORD_EMAIL,
                host: process.env.HOST,
                port: 993,
                tls: true,
            };


            const getEmails = () => {
                try {
                    const imap = new Imap(imapConfig);
                    imap.once('ready', () => {
                        imap.openBox('INBOX', false, () => {


                            /* 
The following message flags are valid types that do not have arguments:

'ALL' - All messages.
'ANSWERED' - Messages with the Answered flag set.
'DELETED' - Messages with the Deleted flag set.
'DRAFT' - Messages with the Draft flag set.
'FLAGGED' - Messages with the Flagged flag set.
'NEW' - Messages that have the Recent flag set but not the Seen flag.
'SEEN' - Messages that have the Seen flag set.
'RECENT' - Messages that have the Recent flag set.
'OLD' - Messages that do not have the Recent flag set. This is functionally equivalent to "!RECENT" (as opposed to "!NEW").
'UNANSWERED' - Messages that do not have the Answered flag set.
'UNDELETED' - Messages that do not have the Deleted flag set.
'UNDRAFT' - Messages that do not have the Draft flag set.
'UNFLAGGED' - Messages that do not have the Flagged flag set.
'UNSEEN' - Messages that do not have the Seen flag set.

The following are valid types that require string value(s):

search(< array >criteria, < function >callback) - (void) - Searches the currently open mailbox for messages using given criteria. criteria is a list describing what you want to find. For criteria types that require arguments, use an array instead of just the string criteria type name (e.g. ['FROM', 'foo@bar.com']). Prefix criteria types with an "!" to negate.

'BCC' - Messages that contain the specified string in the BCC field.
'CC' - Messages that contain the specified string in the CC field.
'FROM' - Messages that contain the specified string in the FROM field.
'SUBJECT' - Messages that contain the specified string in the SUBJECT field.
'TO' - Messages that contain the specified string in the TO field.
'BODY' - Messages that contain the specified string in the message body.//! intéressant !
'TEXT' - Messages that contain the specified string in the header OR the message body.//! intéressant !
'KEYWORD' - Messages with the specified keyword set.
'HEADER' - Requires two string values, with the first being the header name and the second being the value to search for. If this second string is empty, all messages that contain the given header name will be returned.

The following are valid types that require a string parseable by JavaScript's Date object OR a Date instance:

'BEFORE' - Messages whose internal date (disregarding time and timezone) is earlier than the specified date.
'ON' - Messages whose internal date (disregarding time and timezone) is within the specified date.
'SINCE' - Messages whose internal date (disregarding time and timezone) is within or later than the specified date.
'SENTBEFORE' - Messages whose Date header (disregarding time and timezone) is earlier than the specified date.
'SENTON' - Messages whose Date header (disregarding time and timezone) is within the specified date.
'SENTSINCE' - Messages whose Date header (disregarding time and timezone) is within or later than the specified date. */


                            imap.search(['UNSEEN', ['SINCE', new Date()]], (err, results) => {

                                /* Valid options properties are:

* **markSeen** - _boolean_ - Mark message(s) as read when fetched. **Default:** false
* **struct** - _boolean_ - Fetch the message structure. **Default:** false
* **envelope** - _boolean_ - Fetch the message envelope. **Default:** false
* **size** - _boolean_ - Fetch the RFC822 size. **Default:** false
* **modifiers** - _object_ - Fetch modifiers defined by IMAP extensions. **Default:** (none)
* **extensions** - _array_ - Fetch custom fields defined by IMAP extensions, e.g. ['X-MAILBOX', 'X-REAL-UID']. **Default:** (none)
* **bodies** - _mixed_ - A string or Array of strings containing the body part section to fetch. **Default:** (none) Example sections:

    * 'HEADER' - The message header
    * 'HEADER.FIELDS (TO FROM SUBJECT)' - Specific header fields only
    * 'HEADER.FIELDS.NOT (TO FROM SUBJECT)' - Header fields only that do not match the fields given
    * 'TEXT' - The message body
    * '' - The entire message (header + body)
    * 'MIME' - MIME-related header fields only (e.g. 'Content-Type')

    **Note:** You can also prefix `bodies` strings (i.e. 'TEXT', 'HEADER', 'HEADER.FIELDS', and 'HEADER.FIELDS.NOT' for `message/rfc822` messages and 'MIME' for any kind of message) with part ids. For example: '1.TEXT', '1.2.HEADER', '2.MIME', etc.
    **Note 2:** 'HEADER*' sections are only valid for parts whose content type is `message/rfc822`, including the root part (no part id). */

                                const f = imap.fetch(results, {
                                    bodies: ''
                                });
                                f.on('message', msg => {
                                    msg.on('body', stream => {
                                        simpleParser(stream, async (err, parsed) => {
                                            const {
                                                from,
                                                subject,
                                                textAsHtml,
                                                text
                                            } = parsed;
                                            console.log("from ===== ", from);
                                            console.log("text ===== ", text);
                                            /* 
                                            Ici je peux entrer la logique métier ! et faire le tri de ce que je recois dans le body, avec le mot "text"
                                            */
                                        });
                                    });
                                    msg.once('attributes', attrs => {
                                        const {
                                            uid
                                        } = attrs;
                                        imap.addFlags(uid, ['\\Seen'], () => {
                                            // Je marque l'email comme étant lu aprés son ouverture !
                                            console.log('Marked as read!');
                                        });
                                    });
                                });
                                f.once('error', ex => {
                                    return Promise.reject(ex);
                                });
                                f.once('end', () => {
                                    console.log('Done fetching all messages!');
                                    imap.end();
                                });
                            });
                        });
                    });

                    imap.once('error', err => {
                        console.log(err);
                    });

                    imap.once('end', () => {
                        console.log('Connection ended');
                    });

                    imap.connect();
                } catch (ex) {
                    console.log('an error occurred');
                }
            };

            getEmails();


            res.status(200).end();
        } catch (error) {
            console.trace('Erreur dans la méthode getEmail du commandeController :',
                error);
            res.status(500).end();
        }
    },

    // ATTENTION avec le flag markseen a true dans la classe MailListener, les nouveaux email d'érreur renvoyé a l'admin en cas d'érreur seront marqué comme lu et peu visible dans la messagerie d'email.
    startUpdateCommandeFromEmail: async (req, res) => {
        try {

            const mailListener = new MailListener({
                username: process.env.EMAIL,
                password: process.env.PASSWORD_EMAIL,
                host: process.env.HOST,
                port: 993,
                tls: true,
                connTimeout: 10000, // Default by node-imap
                authTimeout: 5000, // Default by node-imap,
                debug: console.log, // Or your custom function with only one incoming argument. Default: null
                tlsOptions: {
                    rejectUnauthorized: false
                },
                mailbox: "INBOX", // mailbox to monitor
                searchFilter: ["UNSEEN"], // the search filter being used after an IDLE notification has been retrieved
                markSeen: true, // all fetched email wil lbe marked as seen and not fetched next time
                fetchUnreadOnStart: false, // use it only if you want to get all unread email on lib start. Default is `false`,
                mailParserOptions: {
                    streamAttachments: false
                }, // options to be passed to mailParser lib.
                attachments: false, // download attachments as they are encountered to the project directory
                //attachmentOptions: { directory: "attachments/" } // specify a download directory for attachments
            });

            mailListener.start();

            mailListener.on("mail", async function (mail, seqno, attributes) {
                // do something with mail object including attachments
                //console.log("emailParsed ======", mail);
                const {
                    from,
                    subject,
                    textAsHtml,
                    text
                } = mail;

                //! l'email doit avoir un sujet précis : "update statut"
                if (subject !== "update statut") {
                    console.log("Le sujet du mail ne convient pas !");
                    return res.status(403).end();
                }

                const email = from[0].address;
                const name = from[0].name;
                console.log("email == ", email);

                //! J'autorise un updtate du statut seulement si l'envoie provient d'un email d'un statut Administrateur ou Develeoppeur avec un email vérifié et qui veut recevoir des new commandes via emails !

                let arrayEmailAdmin = [];
                let adminsMail;
                try {
                    adminsMail = await AdminVerifEmail.findAllAdminEmailTrue();

                    console.log("adminsMail == ", adminsMail);
                } catch (error) {
                    console.trace('Erreur lors de la recherche des email vérifiés, dans la méthode StartUpdateCommandeFromEmail du commandeController :',
                        error);
                    res.status(500).end();
                }

                for (const item of adminsMail) {
                    arrayEmailAdmin.push(item.email);
                }

                if (arrayEmailAdmin.length < 1) {

                    console.log("Un email non autorisé a éssayé de modifier le statut d'une commande !");
                    return res.status(403).end();
                }

                const emailFound = arrayEmailAdmin.find(element => element = email);

                if (emailFound === undefined || emailFound === null) {
                    console.log("Un email non autorisé a éssayé de modifier le statut d'une commande !");
                    return res.status(403).end();
                }



                //! Je vérifit qu'il contient bien la syntaxe choisit via une regex !

                let commandeInDb;
                let statutInDb;

                const string1 = text.split(' : ');
                console.log("string1 == ", string1);
                const commande = string1[0];
                let statut = string1[1];

                console.log("commande == ", commande);
                console.log("statut == ", statut);

                // variable pour les envoie d'email !
                const contextMail = {};
                let textMail = '';
                const template = 'reponseAPInewSatut';
                contextMail.message2 = `Aucun statut de commande n'a été mis a jour suite a cette érreur ! Pour rappel, la commande peut être indiqué par son identifiant ou sa référence de commande, sans espace avant. Séparé d'un espace et du signe ":", puis du nouveau statut souhaité en renseigant soit son identifiant soit son nom.`;
                contextMail.message3 = "";
                contextMail.message4 = "";
                contextMail.name = name;
                contextMail.commande = commande;
                let subjectMail = `❌ uptate statut : Une érreur est apparu ! ❌ `;

                const regRefCommande = /^([0-9]*[.]{1}[0-9]*)*$/; // pour une référence de commande
                const number = /^[0-9]*$/; // pour un id de commande
                const notNumber = /[^0-9]+/; // a utiliser pour discriminer le statut de commande en format string. 
                //const string = /^[a-zA-Z]*$/;


                if (regRefCommande.test(commande)) {
                    // ici commande est une référence
                    commandeInDb = await Commande.findOneCommandeLimited(commande);

                    if (commandeInDb === null || commandeInDb === undefined) {
                        console.log("Cette référence de commande n'éxiste pas ou son statut n'est pas compatible avec une mise a jour manuel !");

                        // on prépare l'envoi d'un mail, avec 5 arguments : un email, un subject, un objet context, une string text et une template.
                        contextMail.message = `Le ${formatLongSeconde(Date.now())} vous avez tenté de mettre a jour le statut d'une commande en renseignant sa référence de commande via la méthode par email. La référence de commande renseigné (${commande}) n'éxiste pas ou son statut n'est pas compatible avec une mise a jour manuel !`;
                        textMail = contextMail.message;
                        sendEmail(email, subjectMail, contextMail, textMail, template);
                        return
                    }

                } else if (number.test(commande)) {
                    // ici commande est un identifiant
                    commandeInDb = await Commande.findOneLimited(commande);

                    if (commandeInDb === null || commandeInDb === undefined) {
                        console.log("Cet identifiant de commande n'éxiste pas ou son statut n'est pas compatible avec une mise a jour manuel !");

                        // on prépare l'envoi d'un mail, avec 5 arguments : un email, un subject, un objet context, une string text et une template.
                        contextMail.message = `Le ${formatLongSeconde(Date.now())} vous avez tenté de mettre a jour le statut d'une commande en renseignant son identifiant de commande via la méthode par email. Son identifiant de commande renseigné (${commande}) n'éxiste pas ou son statut n'est pas compatible avec une mise a jour manuel !`;
                        textMail = contextMail.message;
                        sendEmail(email, subjectMail, contextMail, textMail, template);
                        return
                    }

                } else {
                    console.log("votre commande n'a pas le format souhaité ! Elle doit avoir soit le format d'une réference soit celui d'un identifiant.");
                    // on prépare l'envoi d'un mail, avec 5 arguments : un email, un subject, un objet context, une string text et une template.
                    contextMail.message = `Le ${formatLongSeconde(Date.now())} vous avez tenté de mettre a jour le statut d'une commande en renseignant son identifiant ou sa référence de commande (${commande}) via la méthode par email. La commande renseigné n'éxiste pas ou son statut n'est pas compatible avec une mise a jour manuel !`;
                    textMail = contextMail.message;
                    sendEmail(email, subjectMail, contextMail, textMail, template);
                    return
                }


                if (number.test(Number(statut))) {

                    // ici statut est un identifiant !
                    statutInDb = await StatutCommande.findOneLimited(statut);

                    // Je vérifis que le statut proposé pour update existe !
                    if (statutInDb === null || statutInDb === undefined) {
                        console.log("votre commande n'a pas le statut souhaité !")
                        // on prépare l'envoi d'un mail, avec 5 arguments : un email, un subject, un objet context, une string text et une template.
                        contextMail.message = `Le ${formatLongSeconde(Date.now())} vous avez tenté de mettre a jour le statut d'une commande en renseignant un identifiant de statut de commande via la méthode par email. L'identifiant du statut de commande renseigné (${commande}) n'éxiste pas ou son statut n'est pas compatible avec une mise a jour manuel !`;
                        textMail = contextMail.message;
                        sendEmail(email, subjectMail, contextMail, textMail, template);
                        return
                    }
                    // J'avertit l'admin si le statut qu'il souhaiterais mettre a jour est déja le statut existant !
                    if (Number(statut) === commandeInDb.idCommandeStatut) {
                        console.log("Le statut proposé pour cette commande est déja celui existant !");
                        // on prépare l'envoi d'un mail, avec 5 arguments : un email, un subject, un objet context, une string text et une template.
                        contextMail.message = `Le ${formatLongSeconde(Date.now())} vous avez tenté de mettre a jour le statut d'une commande en renseignant un identifiant de statut de commande via la méthode par email. L'identifiant du statut de commande renseigné (${statut}) pour cette commande (${commande}) est déja identique a celui existant !`;
                        textMail = contextMail.message;
                        sendEmail(email, subjectMail, contextMail, textMail, template);
                        return
                    }
                    // j'avertit l'admin si sa mise a jour ne suit pas un ordre logique... si il a sauté des étapes..
                    // simple avertissement, on ne "return" pas !
                    if (Number(statut) !== (commandeInDb.idCommandeStatut + 1)) {
                        console.log(`Votre mise a jour de statut ne suit pas l'ordre logique... vous êtes passé de ${commandeInDb.idCommandeStatut} à ${statut}  (RAPPEL: 1 = En attente, 2 = Paiement validé, 3 = En cours de préparation, 4 = Prêt pour expédition, 5 = Expédiée, 6 = Remboursée, 7 = Annulée)`);

                        contextMail.message3 = `Néanmoins, vous avez tenté de mettre a jour le statut d'une commande en renseignant un identifiant de statut de commande via la méthode par email. L'identifiant du statut de commande renseigné (${statut}) pour cette commande (${commande}) ne suit pas l'ordre logique... vous êtes passé de "${commandeInDb.idCommandeStatut}" à "${statut}"  (RAPPEL: 1 = En attente, 2 = Paiement validé, 3 = En cours de préparation, 4 = Prêt pour expédition, 5 = Expédiée, 6 = Remboursée, 7 = Annulée) !`;
                    }


                } else if (notNumber.test(statut)) {

                    // je construit un tableau composé de mes statut, dynamiquement !
                    const arrayStatut = [];
                    let allStatuts;
                    try {
                        allStatuts = await StatutCommande.findAllLimited();
                        for (const item of allStatuts) {
                            arrayStatut.push(item.statut);
                        }

                    } catch (error) {
                        console.log(`erreur dans la méthode upDateSatut du CommandeController ! lors de la recherche de tous les statuts ! ${error}`);
                        contextMail.message = `Le ${formatLongSeconde(Date.now())} vous avez tenté de mettre a jour le statut d'une commande en renseignant un nom de statut de commande via la méthode par email. Une érreur est apparu lors de la recherche de tous les statuts de commande existant en base de donnée.`;
                        textMail = contextMail.message;
                        sendEmail(email, subjectMail, contextMail, textMail, template);
                        return res.statut(500).end();
                    }

                    // Ici j'ai une string sans chiffre dans le formulaire, j'utilise la distance de Levenshtein pour réorienter une potentielle érreur de l'admin !
                    // Je calcul toutes les distance de Levenstein entre le mot proposé et ceux de mon tableau et je prends la plus petite. 
                    let arrayDistance = [];
                    for (const item of arrayStatut) {
                        const theDistance = distance(statut, item);
                        arrayDistance.push(theDistance);
                        console.log("theDistance == ", theDistance);
                    }

                    const isDistInf3 = (element) => element <= 3;
                    const indexSmallDistance = arrayDistance.findIndex(isDistInf3);
                    console.log("indexSmallDistance == ", indexSmallDistance);

                    // si indexSmallDistance vaut -1 alors aucun match !!
                    if (indexSmallDistance === -1 || indexSmallDistance === undefined) {

                        // Je prospose néanmoins a l'admin le mot le plus proche possible de sa demande (dans une certaine mesure de 8) !

                        if (indexSmallDistance < 8) {

                            const closeWord = closest(statut, arrayStatut);
                            console.log(`Aucun statut existant ne correspond a votre demande de statut, vouliez-vous indiqué le statut : '${closeWord}' ?`);
                            contextMail.message = `Le ${formatLongSeconde(Date.now())} vous avez tenté de mettre a jour le statut d'une commande en renseignant un nom de statut de commande via la méthode par email. Aucun statut existant ne correspond a votre demande de statut, vouliez-vous indiqué le statut : '${closeWord}' ?`;
                            textMail = contextMail.message;
                            sendEmail(email, subjectMail, contextMail, textMail, template);
                            return;
                        } else {

                            console.log(`Aucun statut existant ne correspond a votre demande de statut...`);
                            contextMail.message = `Le ${formatLongSeconde(Date.now())} vous avez tenté de mettre a jour le statut d'une commande en renseignant un nom de statut de commande via la méthode par email. Aucun statut existant ne correspond a votre demande de statut...`;
                            textMail = contextMail.message;
                            sendEmail(email, subjectMail, contextMail, textMail, template);
                            return;
                        }

                    }

                    // ici indexSmallDistance est forcemment inférieur a 3 ou moins, on convertit le statut entrée par l'admin en statut existant le plus proche !  
                    statut = arrayStatut[indexSmallDistance];

                    // J'avertit l'admin si le statut qu'il souhaiterais mettre a jour est déja le statut existant !
                    if (statut === commandeInDb.statut) {
                        console.log("Le statut proposé pour cette commande est déja celui existant !");
                        contextMail.message = `Le ${formatLongSeconde(Date.now())} vous avez tenté de mettre a jour le statut d'une commande en renseignant un nomde statut de commande via la méthode par email. Le nom de commande renseigné (${statut}) pour cette commande (${commande}) est déja identique a celui existant !`;
                        textMail = contextMail.message;
                        sendEmail(email, subjectMail, contextMail, textMail, template);
                        return;
                    }

                    // j'avertit l'admin si ca mise a jour ne suit pas un ordre logique... si il a sauté des étapes..
                    // simple avertissement, on ne "return" pas !
                    const isStatut = (element) => element === statut;
                    const indexStatut = arrayStatut.findIndex(isStatut);

                    const isStatut2 = (element) => element === commandeInDb.statut;
                    const indexStatutCommande = arrayStatut.findIndex(isStatut2);

                    if (indexStatut !== (indexStatutCommande + 1)) {
                        //console.log("commandeInDb.statut == ", commandeInDb.statut);
                        console.log(`Votre mise a jour de statut ne suit pas l'ordre logique... vous êtes passé de '${commandeInDb.statut}' à '${statut}'  (RAPPEL: 1 = En attente, 2 = Paiement validé, 3 = En cours de préparation, 4 = Prêt pour expédition, 5 = Expédiée, 6 = Remboursée, 7 = Annulée)`);

                        contextMail.message3 = `Néanmoins, vous avez tenté de mettre a jour le statut d'une commande en renseignant un nom de statut de commande via la méthode par email. Le nom du statut de commande renseigné (${statut}) pour cette commande (${commande}) ne suit pas l'ordre logique... vous êtes passé de "${commandeInDb.statut}" à "${statut}"  (RAPPEL: 1 = En attente, 2 = Paiement validé, 3 = En cours de préparation, 4 = Prêt pour expédition, 5 = Expédiée, 6 = Remboursée, 7 = Annulée) !`;

                    }

                    // je dois ici retrouver l'objet du tableau allStatuts contentant la valeur de req.body.statut dans un de ces objets
                    statutInDb = allStatuts.find(element => element.statut === statut);
                }

                //console.log("statutInDb  == ", statutInDb);
                //console.log("commandeInDb  == ", commandeInDb);
                // j'insére cet update en BDD !
                const data = {
                    idCommandeStatut: statutInDb.id,
                    id: commandeInDb.id,
                }

                const newUpdate = new Commande(data);
                const updateDone = await newUpdate.updateStatutCommande();


                console.log("updateDone == ", updateDone);


                contextMail.message = `Le ${formatLongSeconde(Date.now())} vous avez mis a jour le statut d'une commande en renseignant un nom de statut de commande via la méthode par email. Ce changement de statut a été validé avec succées ! La commande "${commande}" a bien été mis a jour en passant au statut "${statut}".`;
                textMail = contextMail.message;
                contextMail.message2 = "";
                subjectMail = ` 🎉 uptate statut : Changement de statut effectué avec succées pour la commande (${commande}) !`;

                sendEmail(email, subjectMail, contextMail, textMail, template);

                res.status(200).end();


            });



            res.status(200).end();
        } catch (error) {
            console.trace('Erreur dans la méthode StartUpdateCommandeFromEmail du commandeController :',
                error);
            res.status(500).end();
        }
    },

    stopUpdateCommandeFromEmail: async (req, res) => {
        try {

            //! Ne fonctionne pas, si je le ferme je ne peux plus le rouvrir sans arréter l'instance Node...

            const mailListener = new MailListener({
                username: process.env.EMAIL,
                password: process.env.PASSWORD_EMAIL,
                host: process.env.HOST,
                port: 993,
                tls: true,
                connTimeout: 10000, // Default by node-imap
                authTimeout: 5000, // Default by node-imap,
                debug: console.log, // Or your custom function with only one incoming argument. Default: null
                tlsOptions: {
                    rejectUnauthorized: false
                },
                mailbox: "INBOX", // mailbox to monitor
                searchFilter: ["UNSEEN"], // the search filter being used after an IDLE notification has been retrieved
                markSeen: true, // all fetched email wil lbe marked as seen and not fetched next time
                fetchUnreadOnStart: true, // use it only if you want to get all unread email on lib start. Default is `false`,
                mailParserOptions: {
                    streamAttachments: false
                }, // options to be passed to mailParser lib.
                attachments: false, // download attachments as they are encountered to the project directory
                //attachmentOptions: { directory: "attachments/" } // specify a download directory for attachments
            });


            mailListener.stop();


            console.log("Serveur mail Listener arrété !")
            res.status(200).end();
        } catch (error) {
            console.trace('Erreur dans la méthode stopUpdateCommandeFromEmail du commandeController :',
                error);
            res.status(500).end();
        }
    },

    getAll: async (req, res) => {
        try {
            const commandes = await Commande.findAll();

            res.status(200).json(commandes);
        } catch (error) {
            console.trace('Erreur dans la méthode getAll du commandeController :',
                error);
            res.status(500).end();
        }
    },
    getAllLigneCommande: async (req, res) => {
        try {
            const commandes = await LigneCommande.findAll();

            res.status(200).json(commandes);
        } catch (error) {
            console.trace('Erreur dans la méthode getAllLigneCommande du commandeController :',
                error);
            res.status(500).end();
        }
    },

    getAllStatutCommande: async (req, res) => {
        try {
            const commandes = await StatutCommande.findAll();

            res.status(200).json(commandes);
        } catch (error) {
            console.trace('Erreur dans la méthode getAllStatutCommande du commandeController :',
                error);
            res.status(500).end();
        }
    },




    getOne: async (req, res) => {
        try {

            const commande = await Commande.findOne(req.params.id);
            res.json(commande);

        } catch (error) {
            console.trace('Erreur dans la méthode getOne du commandeController :',
                error);
            res.status(500).end();
        }
    },
    getOneLigneCommande: async (req, res) => {
        try {

            const commande = await LigneCommande.findOne(req.params.id);
            res.json(commande);

        } catch (error) {
            console.trace('Erreur dans la méthode getOneLigneCommande du commandeController :',
                error);
            res.status(500).end();
        }
    },

    getOneStatutCommande: async (req, res) => {
        try {

            const commande = await StatutCommande.findOne(req.params.id);
            res.json(commande);

        } catch (error) {
            console.trace('Erreur dans la méthode getOneStatutCommande du commandeController :',
                error);
            res.status(500).end();
        }
    },


    getByIdClient: async (req, res) => {
        try {

            const commande = await Commande.findByIdClient(req.params.id);
            res.json(commande);

        } catch (error) {
            console.trace('Erreur dans la méthode getByIdClient du commandeController :',
                error);
            res.status(500).end();
        }
    },
    getLigneCommandeByIdCommande: async (req, res) => {
        try {

            const commande = await LigneCommande.findByIdCommande(req.params.id);
            res.json(commande);

        } catch (error) {
            console.trace('Erreur dans la méthode getLigneCommandeByIdCommande du commandeController :',
                error);
            res.status(500).end();
        }
    },






    new: async (req, res) => {
        try {

            const data = {};

            data.reference = req.body.reference;
            data.commentaire = req.body.commentaire;
            data.idCommandeStatut = req.body.idCommandeStatut;
            data.idClient = req.body.idClient;



            const newCommande = new Commande(data);

            await newCommande.save();
            res.json(newCommande);
        } catch (error) {
            console.log(`Erreur dans la méthode new du commandeController : ${error.message}`);
            res.status(500).end();
        }
    },
    newLigneCommande: async (req, res) => {
        try {

            const data = {};

            data.quantiteCommande = req.body.quantiteCommande;
            data.idProduit = req.body.idProduit;
            data.idCommande = req.body.idCommande;

            const newCommande = new LigneCommande(data);

            await newCommande.save();
            res.json(newCommande);
        } catch (error) {
            console.log(`Erreur dans la méthode newLigneCommande du commandeController : ${error.message}`);
            res.status(500).end();
        }
    },
    newStatutCommande: async (req, res) => {
        try {

            const data = {};

            data.statut = req.body.statut;
            data.description = req.body.description;


            const newCommande = new StatutCommande(data);

            await newCommande.save();
            res.json(newCommande);
        } catch (error) {
            console.log(`Erreur dans la méthode newStatutCommande du commandeController : ${error.message}`);
            res.status(500).end();
        }
    },

    update: async (req, res) => {
        try {

            const {
                id
            } = req.params;

            if (Object.keys(req.body).length === 0) {
                return res.status(200).json({
                    message: 'Vous n\'avez envoyé aucune données à modifier.'
                });
            }

            const updateCommande = await Commande.findOne(id);


            const reference = req.body.reference;
            const commentaire = req.body.commentaire;
            const idCommandeStatut = req.body.idCommandeStatut;
            const idClient = req.body.idClient;


            let message = {};

            if (reference) {
                updateCommande.reference = reference;
                message.reference = 'Votre nouveau reference a bien été enregistré ';
            } else if (!reference) {
                message.reference = 'Votre reference n\'a pas changé';
            }


            if (commentaire) {
                updateCommande.commentaire = commentaire;
                message.commentaire = 'Votre nouveau commentaire a bien été enregistré ';
            } else if (!commentaire) {
                message.commentaire = 'Votre nom de commentaire n\'a pas changé';
            }


            if (idCommandeStatut) {
                updateCommande.idCommandeStatut = idCommandeStatut;
                message.idCommandeStatut = 'Votre nouveau idCommandeStatut a bien été enregistré ';
            } else if (!idCommandeStatut) {
                message.idCommandeStatut = 'Votre idCommandeStatut n\'a pas changé';
            }


            if (idClient) {
                updateCommande.idClient = idClient;
                message.idClient = 'Votre nouveau idClient a bien été enregistré ';
            } else if (!idClient) {
                message.idClient = 'Votre idClient n\'a pas changé';
            }

            await updateCommande.update();

            res.json(message);

        } catch (error) {
            console.log(`Erreur dans la methode update du commandeController ${error.message}`);
            res.status(500).end();
        }
    },
    updateLigneCommande: async (req, res) => {
        try {

            const {
                id
            } = req.params;

            if (Object.keys(req.body).length === 0) {
                return res.status(200).json({
                    message: 'Vous n\'avez envoyé aucune données à modifier.'
                });
            }

            const updateCommande = await LigneCommande.findOne(id);


            const quantiteCommande = req.body.quantiteCommande;
            const idProduit = req.body.idProduit;
            const idCommande = req.body.idCommande;


            let message = {};

            if (quantiteCommande) {
                updateCommande.quantiteCommande = quantiteCommande;
                message.quantiteCommande = 'Votre nouveau quantiteCommande a bien été enregistré ';
            } else if (!quantiteCommande) {
                message.quantiteCommande = 'Votre quantiteCommande n\'a pas changé';
            }


            if (idProduit) {
                updateCommande.idProduit = idProduit;
                message.idProduit = 'Votre nouveau idProduit a bien été enregistré ';
            } else if (!idProduit) {
                message.idProduit = 'Votre idProduit n\'a pas changé';
            }


            if (idCommande) {
                updateCommande.idCommande = idCommande;
                message.idCommande = 'Votre nouveau idCommande a bien été enregistré ';
            } else if (!idCommande) {
                message.idCommande = 'Votre idCommande n\'a pas changé';
            }



            await updateCommande.update();

            res.json(message);

        } catch (error) {
            console.log(`Erreur dans la methode updateLigneCommande du commandeController ${error.message}`);
            res.status(500).end();
        }
    },

    updateStatutCommande: async (req, res) => {
        try {

            const {
                id
            } = req.params;

            if (Object.keys(req.body).length === 0) {
                return res.status(200).json({
                    message: 'Vous n\'avez envoyé aucune données à modifier.'
                });
            }

            const updateCommande = await StatutCommande.findOne(id);


            const statut = req.body.statut;
            const description = req.body.description;


            let message = {};

            if (statut) {
                updateCommande.statut = statut;
                message.statut = 'Votre nouveau statut a bien été enregistré ';
            } else if (!statut) {
                message.statut = 'Votre statut n\'a pas changé';
            }


            if (description) {
                updateCommande.description = description;
                message.description = 'Votre nouveau description a bien été enregistré ';
            } else if (!description) {
                message.description = 'Votre nom de description n\'a pas changé';
            }


            await updateCommande.update();

            res.json(message);

        } catch (error) {
            console.log(`Erreur dans la methode updateStatutCommande du commandeController ${error.message}`);
            res.status(500).end();
        }
    },





    delete: async (req, res) => {

        try {

            const commandeInDb = await Commande.findOne(req.params.id);

            const commande = await commandeInDb.delete();

            res.json(commande);

        } catch (error) {
            console.trace('Erreur dans la méthode delete du commandeController :',
                error);
            res.status(500).end();
        }
    },
    deleteLigneCommande: async (req, res) => {

        try {

            const commandeInDb = await LigneCommande.findOne(req.params.id);

            const commande = await commandeInDb.delete();

            res.json(commande);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteLigneCommande du commandeController :',
                error);
            res.status(500).end();
        }
    },

    deleteStatutCommande: async (req, res) => {

        try {

            const commandeInDb = await StatutCommande.findOne(req.params.id);

            const commande = await commandeInDb.delete();

            res.json(commande);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteStatutCommande du commandeController :',
                error);
            res.status(500).end();
        }
    },


    deleteByIdClient: async (req, res) => {

        try {

            const commandesInDb = await Commande.findByIdClient(req.params.id);
            const arrayDeleted = [];
            for (const commandeInDb of commandesInDb) {

                const commande = await commandeInDb.deleteByIdClient();
                arrayDeleted.push(commande);
            }


            res.json(arrayDeleted[0]);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteByIdClient du commandeController :',
                error);
            res.status(500).end();
        }
    },
    deleteLigneCommandeByIdCommande: async (req, res) => {

        try {

            const commandesInDb = await LigneCommande.findByIdCommande(req.params.id);
            const arrayDeleted = [];
            for (const commandeInDb of commandesInDb) {

                const commande = await commandeInDb.deleteByIdCommande();
                arrayDeleted.push(commande);
            }


            res.json(arrayDeleted[0]);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteLigneCommandeByIdCommande du commandeController :',
                error);
            res.status(500).end();
        }
    },

    //! PRODUIT RETOUR

    getAllProduitRetour: async (req, res) => {
        try {
            const commandes = await ProduitRetour.findAll();

            res.status(200).json(commandes);
        } catch (error) {
            console.trace('Erreur dans la méthode getAllProduitRetour du commandeController :',
                error);
            res.status(500).end();
        }
    },
    getOneProduitRetour: async (req, res) => {
        try {

            const commande = await ProduitRetour.findOne(req.params.id);
            res.json(commande);

        } catch (error) {
            console.trace('Erreur dans la méthode getOneProduitRetour du commandeController :',
                error);
            res.status(500).end();
        }
    },
    newProduitRetour: async (req, res) => {
        try {

            const data = {};

            data.quantite = req.body.quantite;
            data.commentaire = req.body.commentaire;
            data.idCommandeLigne = req.body.idCommandeLigne;


            const newCommande = new ProduitRetour(data);

            await newCommande.save();
            res.json(newCommande);
        } catch (error) {
            console.log(`Erreur dans la méthode newProduitRetour du commandeController : ${error.message}`);
            res.status(500).end();
        }
    },
    updateProduitRetour: async (req, res) => {
        try {

            const {
                id
            } = req.params;

            if (Object.keys(req.body).length === 0) {
                return res.status(200).json({
                    message: 'Vous n\'avez envoyé aucune données à modifier.'
                });
            }

            const updateCommande = await ProduitRetour.findOne(id);


            const quantite = req.body.quantite;
            const commentaire = req.body.commentaire;
            const idCommandeLigne = req.body.idCommandeLigne;


            let message = {};

            if (quantite) {
                updateCommande.quantite = quantite;
                message.quantite = 'Votre nouveau quantite a bien été enregistré ';
            } else if (!quantite) {
                message.quantite = 'Votre quantite n\'a pas changé';
            }


            if (commentaire) {
                updateCommande.commentaire = commentaire;
                message.commentaire = 'Votre nouveau commentaire a bien été enregistré ';
            } else if (!commentaire) {
                message.commentaire = 'Votre commentaire n\'a pas changé';
            }


            if (idCommandeLigne) {
                updateCommande.idCommandeLigne = idCommandeLigne;
                message.idCommandeLigne = 'Votre nouveau idCommandeLigne a bien été enregistré ';
            } else if (!idCommandeLigne) {
                message.idCommandeLigne = 'Votre idCommandeLigne n\'a pas changé';
            }


            await updateCommande.update();

            res.json(message);

        } catch (error) {
            console.log(`Erreur dans la methode updateProduitRetour du commandeController ${error.message}`);
            res.status(500).end();
        }
    },
    deleteProduitRetour: async (req, res) => {

        try {

            const commandeInDb = await ProduitRetour.findOne(req.params.id);

            const commande = await commandeInDb.delete();

            res.json(commande);

        } catch (error) {
            console.trace('Erreur dans la méthode deleteProduitRetour  du commandeController :',
                error);
            res.status(500).end();
        }
    },



}

module.exports = commandeController;