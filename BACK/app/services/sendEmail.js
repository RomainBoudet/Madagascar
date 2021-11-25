const nodemailer = require('nodemailer');
const path = require('path');
const hbs = require('nodemailer-express-handlebars');
var helpers = require('handlebars-helpers')();



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


const sendEmail = async (email, subject, context, text, template) => {

    try {
        // l'envoie d'email définit par l'object "transporter"
        const info = await transporter.sendMail({
            from: process.env.EMAIL, //l'envoyeur
            to: email, // le receveur du mail.
            subject, // le sujet du mail
            text, // une variante en texte si pas de html
            template, // une vue hbs
            context, // l'objet que je passe a ma vue, contenant les variables pour mon email !

        });
        console.log(`Un email à bien été envoyé a ${email} : ${info.response}`);
    } catch (error) {
        console.trace("erreur dans le service sendEmail", error);
    }
};

module.exports = {
    sendEmail
};