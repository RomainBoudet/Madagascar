const Adresse = require('../models/adresse');




const adresseEnvoieFormat = async (idClient) => {

    const adresseData = await Adresse.findByEnvoiTrue(idClient);


    if (adresseData.ligne2 !== null && adresseData.ligne3 !== null) {
        // adresse avec ligne 1 , 2, 3
        adresse = `${adresse.prenom} ${adresse.nomFamille} ${adresse.ligne1} ${adresse.ligne2} ${adresse.ligne3} ${adresse.codePostal} ${adresse.ville} ${adresse.pays} ${adresse.telephone}`
    }
    if (adresseData.ligne2 !== null && adresseData.ligne3 === null) {
        // adresse avec ligne 1 , 2, 
        adresse = `${adresse.prenom} ${adresse.nomFamille} ${adresse.ligne1} ${adresse.ligne2} ${adresse.codePostal} ${adresse.ville} ${adresse.pays} ${adresse.telephone}`
    }
    if (adresseData.ligne2 === null && adresseData.ligne3 === null) {
        // adresse avec ligne 1  
        adresse = `${adresse.prenom} ${adresse.nomFamille} ${adresse.ligne1} ${adresse.codePostal} ${adresse.ville} ${adresse.pays} ${adresse.telephone}`
    }
    if (adresseData.ligne2 === null && adresseData.ligne3 !== null) {
        // adresse avec ligne 1  , 3
        adresse = `${adresse.prenom} ${adresse.nomFamille} ${adresse.ligne1} ${adresse.ligne3} ${adresse.codePostal} ${adresse.ville} ${adresse.pays} ${adresse.telephone}`
    }

    return adresse;
}

const adresseEnvoieFormatHTML = async (idClient) => {

    const adresseData = await Adresse.findByEnvoiTrue(idClient);


    if (adresseData.ligne2 !== null && adresseData.ligne3 !== null) {
        // adresse avec ligne 1 , 2, 3
        adresse = `${adresse.prenom} ${adresse.nomFamille} <br> ${adresse.ligne1} ${adresse.ligne2} ${adresse.ligne3} <br> ${adresse.codePostal} ${adresse.ville} <br> ${adresse.pays} <br> ${adresse.telephone} <br>`
    }
    if (adresseData.ligne2 !== null && adresseData.ligne3 === null) {
        // adresse avec ligne 1 , 2, 
        adresse = `${adresse.prenom} ${adresse.nomFamille} <br> ${adresse.ligne1} ${adresse.ligne2} <br> ${adresse.codePostal} ${adresse.ville} <br> ${adresse.pays} <br> ${adresse.telephone} <br>`
    }
    if (adresseData.ligne2 === null && adresseData.ligne3 === null) {
        // adresse avec ligne 1  
        adresse = `${adresse.prenom} ${adresse.nomFamille} <br> ${adresse.ligne1} <br> ${adresse.codePostal} ${adresse.ville} <br> ${adresse.pays} <br> ${adresse.telephone} <br>`
    }
    if (adresseData.ligne2 === null && adresseData.ligne3 !== null) {
        // adresse avec ligne 1  , 3
        adresse = `${adresse.prenom} ${adresse.nomFamille} <br> ${adresse.ligne1} ${adresse.ligne3} <br> ${adresse.codePostal} ${adresse.ville} <br> ${adresse.pays} <br> ${adresse.telephone} <br>`
    }

    return adresse;
}





module.exports = {
    adresseEnvoieFormat,
    adresseEnvoieFormatHTML
};