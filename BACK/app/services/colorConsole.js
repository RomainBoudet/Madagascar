const chalk = require('chalk');

// Pour un grand choix de couleur hex... : https://htmlcolorcodes.com/ 

const consol = {


    model: function (msg) {
        console.log(chalk.yellow(msg));
        // du jaune => info provenant des models
    },

    controller: function (msg) {
        console.log(chalk.hex('#00f6f0')(msg));
        // du bleu turquoise => info provenant des controllers
    },

    redis: function (msg) {
        console.log(chalk.hex('#FF8800')(msg));
        // du orange => info provenant du service cache de redis
    },

    forget: function (msg) {
        console.log(chalk.hex('#585F5A')(msg));
        // du gris clair => un message peu important en filigrane en console
    },

    router: function (msg) {
        console.log(chalk.green(msg));
        // du vert => infos provenant du router
    },

    admin: function (msg) {
        console.log(chalk.hex('#CB4335')(msg));
        // du rouge foncé => infos provenant du AdminMW
    },

    auth: function (msg) {
        console.log(chalk.hex('#F1948A')(msg));
        // du rouge clair => infos provenant du authMW
    },

    dev: function (msg) {
        console.log(chalk.hex('#F322CD')(msg));
        // du rose => infos provenant du devMW
    },

    seed: function (msg) {
        console.log(chalk.hex('#29F319')(msg));
        // du vert fluo pour le seeding
    }
    // La couleur des log, en magenta, est géré directement dans le logger.
};

module.exports = consol;