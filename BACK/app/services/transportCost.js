const Transporteur = require('../models/transporteur');

const redis = require('../services/redis');


const transportCost = async (totalPoid, nomTranporteur) => {

    if (nomTranporteur === 'Retrait sur le stand') {
        //Un retrait sur le stant a été demandé, le transport sera offert
        return Number(0);
    }

    let transporteur;

    try {
        transporteur = await Transporteur.findOneName(nomTranporteur);
    } catch (error) {
        console.log("Erreur dans le service transportCost lors de la récupération d'un transporteur")
        throw new Error("Erreur dans le service transportCost lors de la récupération d'un transporteur");
    }

    if (transporteur === null || transporteur === undefined) {
        console.log("Erreur dans le service transportCost lors de la récupération d'un transporteur, le transporteur choisi n'existe pas !")
        throw new Error("Erreur dans le service transportCost lors de la récupération d'un transporteur, le transporteur choisi n'existe pas !");

    }

    
    // On remplace tous les espaces par des tirets _ et passage en Lower cases du nom du transporteur pour s'en servir comme variable\u{1F936}
    // Le remplacement globale ne peut se faire qu'avec les mots clé global et ignore dans la REGEX.
    const space = / /gi;
    let goodTransporter = nomTranporteur.replace(space, '_').toLowerCase();

    // Je récupére ma gamme de poid pour mon transporteur
    let poidTransporteur;
    try {
        poidTransporteur = await redis.get(`mada/poid${goodTransporter}`).then(JSON.parse);
    } catch (error) {
        console.log("Erreur dans la récupération, via REDIS, de la gamme de poids, dans le service transportCost", error);
    }

    // Si je veux la valeur du tableau la plus proche de totalPoid. Pas demandé ici.
    /* const closest = poidTransporteur.reduce(function(prev, curr) {
      return (Math.abs(curr - totalPoid) < Math.abs(prev - totalPoid) ? curr : prev);
    }); */

    // Je détermine le poid en selectionnant l'intervalle supérieur le plus proche du totalPoid
    // Je récupére la valeur dans le tableau qui est supérieur a previous et inférieur a current, et dans ce cas je renvoie la valeur current. Le inférieur ou égale permet d'inclura la borne supérieur
    // Un colie de 2000 gr sera dans la classe de 1000gr a 2000 gr. 
    const maxWeigth = poidTransporteur.reduce(function (prev, curr) {

        return ((prev < totalPoid) && (totalPoid <= curr)) ? curr : prev

    });

    //Je questionne REDIS pour connaitre le tarif associé a cette gamme de poid

    let tarif;
    try {
        tarif = await redis.get(`mada/tarif_${goodTransporter}:${maxWeigth}gramme`)
    } catch (error) {
        console.log("erreur dans la récupération, via REDIS,  du prix du transport, dans le service transportCost", error);
    }

    return Number(tarif);

}

module.exports = {
    transportCost,
}