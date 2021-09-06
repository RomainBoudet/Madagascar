const Adresse = require('../models/adresse');




const adresseEnvoieFormat = async (idClient) => {

    const adresseData = await Adresse.findByEnvoiTrue(idClient);

    let adresse;

    if (adresseData.ligne2 !== null && adresseData.ligne3 !== null) {
        // adresse avec ligne 1 , 2, 3
        adresse = `${adresseData.prenom} ${adresseData.nomFamille} ${adresseData.ligne1} ${adresseData.ligne2} ${adresseData.ligne3} ${adresseData.codePostal} ${adresseData.ville} ${adresseData.pays} ${adresseData.telephone}`
    }
    if (adresseData.ligne2 !== null && adresseData.ligne3 === null) {
        // adresse avec ligne 1 , 2, 
        adresse = `${adresseData.prenom} ${adresseData.nomFamille} ${adresseData.ligne1} ${adresseData.ligne2} ${adresseData.codePostal} ${adresseData.ville} ${adresseData.pays} ${adresseData.telephone}`
    }
    if (adresseData.ligne2 === null && adresseData.ligne3 === null) {
        // adresse avec ligne 1  
        adresse = `${adresseData.prenom} ${adresseData.nomFamille} ${adresseData.ligne1} ${adresseData.codePostal} ${adresseData.ville} ${adresseData.pays} ${adresseData.telephone}`
    }
    if (adresseData.ligne2 === null && adresseData.ligne3 !== null) {
        // adresse avec ligne 1  , 3
        adresse = `${adresseData.prenom} ${adresseData.nomFamille} ${adresseData.ligne1} ${adresseData.ligne3} ${adresseData.codePostal} ${adresseData.ville} ${adresseData.pays} ${adresseData.telephone}`
    }

    return adresse;
}

const adresseEnvoieFormatHTML = async (idClient) => {

    const adresseData = await Adresse.findByEnvoiTrue(idClient);

    let adresse;

    if (adresseData.ligne2 !== null && adresseData.ligne3 !== null) {
        // adresse avec ligne 1 , 2, 3
        adresse = `${adresseData.prenom} ${adresseData.nomFamille} <br> ${adresseData.ligne1} <br> ${adresseData.ligne2} ${adresseData.ligne3} <br> ${adresseData.codePostal} ${adresseData.ville} <br> ${adresseData.pays} <br> ${adresseData.telephone} <br>`
    }
    if (adresseData.ligne2 !== null && adresseData.ligne3 === null) {
        // adresse avec ligne 1 , 2, 
        adresse = `${adresseData.prenom} ${adresseData.nomFamille} <br> ${adresseData.ligne1} ${adresseData.ligne2} <br> ${adresseData.codePostal} ${adresseData.ville} <br> ${adresseData.pays} <br> ${adresseData.telephone} <br>`
    }
    if (adresseData.ligne2 === null && adresseData.ligne3 === null) {
        // adresse avec ligne 1  
        adresse = `${adresseData.prenom} ${adresseData.nomFamille} <br> ${adresseData.ligne1} <br> ${adresseData.codePostal} ${adresseData.ville} <br> ${adresseData.pays} <br> ${adresseData.telephone} <br>`
    }
    if (adresseData.ligne2 === null && adresseData.ligne3 !== null) {
        // adresse avec ligne 1  , 3
        adresse = `${adresseData.prenom} ${adresseData.nomFamille} <br> ${adresseData.ligne1} ${adresseData.ligne3} <br> ${adresseData.codePostal} ${adresseData.ville} <br> ${adresseData.pays} <br> ${adresseData.telephone} <br>`
    }

    return adresse;
}





module.exports = {
    adresseEnvoieFormat,
    adresseEnvoieFormatHTML
};