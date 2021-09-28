const nodemailer = require('nodemailer');

//Config MAIL a sortir du controller ...
//Sendgrid ou MailGun serait préférable en prod...
//https://medium.com/how-tos-for-coders/send-emails-from-nodejs-applications-using-nodemailer-mailgun-handlebars-the-opensource-way-bf5363604f54
const transporter = nodemailer.createTransport({
    host: process.env.HOST,
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD_EMAIL,
    },
});

// Config pour les templates et le moteur handlebars lié a Nodemailer
const options = {
    viewEngine: {
        extName: ".hbs",
        partialsDir: path.resolve(__dirname, "./views"),
        defaultLayout: false
    },
    extName: ".hbs",
    viewPath: path.resolve(__dirname, "../views"),
};

transporter.use('compile', hbs(options));


//! A finir pour un envoie de Mail a chaque possibilité de l'API pour la méthode startUpdateCommandeFromEmail !

const sendEmail = async (argument) => {

    try {
        // l'envoie d'email définit par l'object "transporter"
        const info = await transporter.sendMail({
            from: process.env.EMAIL, //l'envoyeur
            to: session.user.email,
            subject: "a faire !", // le sujet du mail
            text: argument,
           
            template: 'matemplateReponse',
            context: "a faire !",

        });
        console.log(`Un email de réponse suite a tentative de mise a jour du statut d'une commande à bien été envoyé a ${session.user.prenom} ${session.user.nomFamille} via l'adresse email: ${session.user.email} : ${info.response}`);
    } catch (error) {
        console.trace("erreur dans le service sendEmail", error);
        res.statut(500).end();


    }
};

module.exports = {
    sendEmail
};