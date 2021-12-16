// je require les info de connexion qui sont dans un point env précis en passant en argument la localisation du .env.back 
require('dotenv').config({
    path: `${__dirname}/.env.back`
});

// module natif de Node.js pour intéragir avec les fichier systéme
//parce que c'est beau la couleur ;)
const chalk = require('chalk');
//Mise en place d'un logger pour garder une trace écrite des connexion
const logger = require('./app/services/logger');

// on require les modules nécéssaire : 
const cors = require('cors');
const express = require('express');
const session = require('express-session');
const redisSession = require('redis');
const helmet = require('helmet');
const router = require('./app/router');
const cookieParser = require("cookie-parser");


//connect-redis permet d'utiliser Redis avec express-session pour stocker les cookies de la session sur Redis et non en mémoire (pas bien en prod!)
let RedisStore = require('connect-redis')(session);
let redisClient = redisSession.createClient();

const app = express();

//on utilise la variable d'environnement PORT pour attribuer un port à notre appli express ou port par défault
const port = process.env.PORT || 5000;

// Mise en place de swagger pour plus tard quand on voudra documenter notre API => https://www.npmjs.com/package/express-swagger-generator 
//-----------------------------------------------------------------------------------
const expressSwagger = require('express-swagger-generator')(app);
let optionsSwagger = require('./swagger-config.json');
optionsSwagger.basedir = __dirname; // __dirname désigne le dossier du point d'entrée
optionsSwagger.swaggerDefinition.host = `localhost`;// replace with <your_domain_name>
expressSwagger(optionsSwagger);


//app.use(express.static(__dirname + '/public'));

//Nos Middlewares :
//-----------------------------------------------------------------------------------

// module de log d'identification : me donne l'ip, l'heure et l'url de chaque connexion => en console ET en dur dans le dossier logs

app.use(logger);


// le parser JSON qui récupère le payload quand il y en a un et le transforme en objet JS disponible sous request.body
// Je récupére un rawBody sur les les routes du webhook de STRIPE pour verifier la signature STRIPE
app.use(express.json({
    verify: (req, _, buf) => {
        const url = req.originalUrl;
        if (url.startsWith('/v1/webhookpaiement')) {
            req.rawBody = buf
        }
        if (url.startsWith('/v1/webhookpaiementSEPA')) {
            req.rawBody = buf
        }
        if (url.startsWith('/v1/webhookRefundFail')) {
            req.rawBody = buf
        }
        if (url.startsWith('/v1/webhookRefund')) {
            req.rawBody = buf
        }
    }
}));

//cookie parser, qui me permet d'avoir accés a req.cookies dans mes MW auth, admin, en transformant mes cookies en un bel objet  
app.use(cookieParser(process.env.SECRET));

// on va devoir gérer des données en POST, on ajoute le middleware urlencoded pour récupérer les infos dans request.body 

app.use(express.urlencoded({
    extended: true
}));

//helmet : https://expressjs.com/fr/advanced/best-practice-security.html 
//https://blog.risingstack.com/node-js-security-checklist/
// hsts définit l’en-tête Strict-Transport-Security qui impose des connexions (HTTP sur SSL/TLS) sécurisées au serveur. 
// une gestion fine de la CSP => https://ponyfoo.com/articles/content-security-policy-in-express-apps 
// CSP ==>  https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP 
app.use(helmet());

// configuration de nos header !
app.use(helmet.contentSecurityPolicy({
        directives: { //je dois configurer la CSP pour autoriser mon serveur a utiliser du CSS et mes images cloud pour le rendu de la validation du mail
            defaultSrc: [`'self'`], // le fallback, pas présent par défault, 
            imgSrc: [`self`, `filedn.eu`], //je configure helmet pour la CSP : ok pour aller chercher mes images sur mon cloud perso, tout le reste, ça dégage !
            //styleSrc: [(_, res) => `'nonce-${ res.locals.nonce }'`], // je peux utiliser res ici je suis dans un app.use ! Je convertis dynamiquement le nonce de ma vue avec cette méthode, sans avoir besoin de mettre 'unsafe-inline' pour lire CSS de ma vue, ce qui affaiblirait considérablement ma CSP ! 
            //upgradeInsecureRequests: [], // On convertit tout ce qui rentre en HTTP et HTTPS direct ! //TODO décommenter
            //reportUri: `/api/csp/report`, ==>> a prévoir une url pour l'admin pour savoir quelle ressource ont été bloqué par ma CSP ! et a loggé avec Winston aussi
        },
        //reportOnly: true
    }),
    helmet.dnsPrefetchControl({
        allow: true, //j'autorise la prélecture DNS pour ganer du temps sur mobile.. => https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-DNS-Prefetch-Control
    }),
    helmet.expectCt({
        maxAge: 0,
        enforce: false, //demander qu'un navigateur applique toujours l'exigence de transparence du certificat SSL ! //TODO  repasser a true
        //reportUri: "https://example.com/report", Pourrait être intérresant de se prévoir une url pour l'admin avec aussi 
    }))


// ATTENTION cette protection contre les reflextive XSS pourrait être la porte ouverte pour les attaques XS search.. :
//https://infosecwriteups.com/xss-auditor-the-protector-of-unprotected-f900a5e15b7b
//https://portswigger.net/research/top-10-web-hacking-techniques-of-2019
//https://github.com/xsleaks/xsleaks/wiki/Browser-Side-Channels
// risque de XS leak important, des attaquant peuvent soutirer des infos en provoquant des faux postive, l'API XSS filter étant sensible a ce type d'attaque..
// cette option override celle de helmet qui la méttait a 0
app.use((req, res, next) => {
    res.setHeader("X-XSS-Protection", "1; mode=block");
    next();
});




//mise en place du système de sessions pour stocker les infos utilisateur // https://www.npmjs.com/package/express-session
app.use(
    session({
        store: new RedisStore({
            client: redisClient
        }), // et nos cookies sont stockés sur REDIS !
        resave: true, // Resauver la session à chaque requête -> pour prolonger la durée de vie
        saveUninitialized: false, // Permet de sauver automatiquement la session d'un visiteur sans que j'ai à l'intialiser moi-même
        secret: process.env.SECRET, // le .env est dans la variable SECRET du .env.back
        cookie: {
            secure: true, //si true, la navigateur n'envoit que des cookie sur du HTTPS
            maxAge: 1000 * 60 * 60 * 24 * 15, // ça fait une heure * 24h * 15 jours
            httpOnly: true, // Garantit que le cookie n’est envoyé que sur HTTP(S), pas au JavaScript du client, ce qui renforce la protection contre les attaques de type cross-site scripting.
            sameSite: 'Strict', //le mode Strict empêche l’envoi d’un cookie de session dans le cas d’un accès au site via un lien externe//https://blog.dareboost.com/fr/2017/06/securisation-cookies-attribut-samesite/
            //!il faudra définir les options de sécurité pour accroitre la sécurité. (https://expressjs.com/fr/advanced/best-practice-security.html)
            //domain: '<yourdomainname>', // Indique le domaine du cookie ; utilisez cette option pour une comparaison avec le domaine du serveur dans lequel l’URL est demandée. S’ils correspondent, vérifiez ensuite l’attribut de chemin.
            //path: 'foo/bar', Indique le chemin du cookie ; utilisez cette option pour une comparaison avec le chemin demandé. Si le chemin et le domaine correspondent, envoyez le cookie dans la demande.
            //expires: expiryDate, Utilisez cette option pour définir la date d’expiration des cookies persistants.
        },
    })
);

 

// https://expressjs.com/en/resources/middleware/cors.html
// Je require le middleware pour dire à express d'être plus permissif sur l'origine des requête
app.use(cors({
    optionsSuccessStatus: 200,
    credentials: true, // pour envoyer des cookies et des en-têtes d'autorisations faut rajouter une autorisation avec l'option credential
    origin: "*",//! a pas oublier pour la prod ! => remplacer par le bon nom de domaine
    methods: "GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS", // ok via un array aussi
    allowedHeaders: ['Content-Type', 'x-xsrf-token'],
}));


//FIN DES MIDDLEWARES----------------------------------------------------------------------

// on préfixe notre router avec un V1 qui sera inclus devant chaque nom de route. Permet de faire évoluer l'app avec une V2 plus facilement.
app.use('/v1', router);

//404 :
app.use((req, res) => {
    //res.redirect(`https://localhost:4000/api-docs#/`);
    res.status(404).redirect(`/api-docs`);
  });


/* Puis on créer notre serveur HTTPS avec les option qui sont le certificat et la clé */
app.listen(port, () => {
    console.log(chalk.cyan `API Mada Running on`, chalk.magenta.bold.inverse `https`, chalk.cyan `://localhost:${port}`);
});