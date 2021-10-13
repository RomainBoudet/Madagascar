const Adresse = require('../models/adresse');
const Shop = require('../models/shop');


const facturePhone = (telephone) => {

    //Un format plus visuel pour le numéro de téléphone dans les factures...
    const nicePhone1 = Array.from(telephone);
    //console.log("nicePhone1 == ", nicePhone1); // ['+', '3', '3', '6','0', '3', '7', '2','0', '7', '4', '1']
    const nicePhone2 = ` 0${nicePhone1.slice(3).join('')}`;
    //console.log("nicePhone2 == ", nicePhone2); //0603720741
    const nicePhone = nicePhone2.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1-$2-$3-$4-$5");
    //console.log("nicePhone == ", nicePhone); // 06-03-72-07-41

    return nicePhone;

};

const adresseEnvoieFormat = async (idClient) => {
    let adresse;
    let adresseData;
    try {
        adresseData = await Adresse.findByEnvoiTrue(idClient);
    } catch (error) {
        console.log(`Erreur dans le service Adresse, function adresseEnvoieFormat  : ${error.message}`);
        console.trace(error);
        res.status(500).end();
    }

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

//! Pourrait être supprimé.. ne semble plus utilisé...
const adresseEnvoieFormatHTML = async (idClient) => {
    let adresse;
    let adresseData;

    try {
        adresseData = await Adresse.findByEnvoiTrue(idClient);

    } catch (error) {
        console.log(`Erreur dans le service Adresse, function dresseEnvoieFormatHTML : ${error.message}`);
        console.trace(error);
        res.status(500).end();
    }


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


const textShopFacture = async () => {
    let shopAdresse;
    let adresseData;
    try {
        adresseData = await Shop.findOne(1);
    } catch (error) {
        console.log(`Erreur dans le service Adresse, function textShopFacture  : ${error.message}`);
        console.trace(error);
        res.status(500).end();
    }


    if (adresseData.adresse2 !== null && adresseData.adresse3 !== null) {
        // adresse avec ligne 1 , 2, 3
        shopAdresse = `${adresseData.nom} \n ${adresseData.adresse1} \n ${adresseData.adresse2} \n ${adresseData.adresse3} \n ${adresseData.codePostal} ${adresseData.ville} \n ${adresseData.pays} \n ${facturePhone(adresseData.telephone)}`
    }
    if (adresseData.adresse2 !== null && adresseData.adresse3 === null) {
        // adresse avec ligne 1 , 2, 
        shopAdresse = `${adresseData.nom} \n ${adresseData.adresse1} \n ${adresseData.adresse2} \n ${adresseData.codePostal} ${adresseData.ville} \n ${adresseData.pays} \n ${facturePhone(adresseData.telephone)}`
    }
    if (adresseData.adresse2 === null && adresseData.adresse3 === null) {
        // adresse avec ligne 1  
        shopAdresse = `${adresseData.nom} \n ${adresseData.adresse1} \n ${adresseData.codePostal} ${adresseData.ville} \n ${adresseData.pays} \n ${facturePhone(adresseData.telephone)}`
    }
    if (adresseData.adresse2 === null && adresseData.adresse3 !== null) {
        // adresse avec ligne 1  , 3
        shopAdresse = `${adresseData.nom} \n ${adresseData.adresse1} \n ${adresseData.adresse3} \n ${adresseData.codePostal} ${adresseData.ville} \n ${adresseData.pays} \n ${facturePhone(adresseData.telephone)}`
    }

    return shopAdresse;
}


const textAdresseLivraison = async (idClient) => {
    let adresse;
    let adresseData;
    try {
        adresseData = await Adresse.findByEnvoiTrue(idClient);
    } catch (error) {
        console.log(`Erreur dans le service Adresse, function textAdresseLivraison  : ${error.message}`);
        console.trace(error);
        res.status(500).end();
    }


    if (adresseData.ligne2 !== null && adresseData.ligne3 !== null) {
        // adresse avec ligne 1 , 2, 3
        adresse = `${adresseData.prenom} ${adresseData.nomFamille} \n ${adresseData.ligne1} \n ${adresseData.ligne2} \n ${adresseData.ligne3} \n ${adresseData.codePostal} ${adresseData.ville} \n ${adresseData.pays} \n ${facturePhone(adresseData.telephone)}`
    }
    if (adresseData.ligne2 !== null && adresseData.ligne3 === null) {
        // adresse avec ligne 1 , 2, 
        adresse = `${adresseData.prenom} ${adresseData.nomFamille} \n ${adresseData.ligne1} \n ${adresseData.ligne2} \n ${adresseData.codePostal} ${adresseData.ville} \n ${adresseData.pays} \n ${facturePhone(adresseData.telephone)}`
    }
    if (adresseData.ligne2 === null && adresseData.ligne3 === null) {
        // adresse avec ligne 1  
        adresse = `${adresseData.prenom} ${adresseData.nomFamille} \n ${adresseData.ligne1} \n ${adresseData.codePostal} ${adresseData.ville} \n ${adresseData.pays} \n ${facturePhone(adresseData.telephone)}`
    }
    if (adresseData.ligne2 === null && adresseData.ligne3 !== null) {
        // adresse avec ligne 1  , 3
        adresse = `${adresseData.prenom} ${adresseData.nomFamille} \n ${adresseData.ligne1} \n ${adresseData.ligne3} \n ${adresseData.codePostal} ${adresseData.ville} \n ${adresseData.pays} \n ${facturePhone(adresseData.telephone)}`
    }

    return adresse;
}

const textAdresseFacturation = async (idClient) => {
    let adresse;
    let adresseData;
    try {
        adresseData = await Adresse.findByFacturationTrue(idClient);
    } catch (error) {
        console.log(`Erreur dans le service Adresse, function textAdresseFacturation  : ${error.message}`);
        console.trace(error);
        res.status(500).end();
    }


    if (adresseData.ligne2 !== null && adresseData.ligne3 !== null) {
        // adresse avec ligne 1 , 2, 3
        adresse = `${adresseData.prenom} ${adresseData.nomFamille} \n ${adresseData.ligne1} \n ${adresseData.ligne2} \n ${adresseData.ligne3} \n ${adresseData.codePostal} ${adresseData.ville} \n ${adresseData.pays} \n ${facturePhone(adresseData.telephone)}`
    }
    if (adresseData.ligne2 !== null && adresseData.ligne3 === null) {
        // adresse avec ligne 1 , 2, 
        adresse = `${adresseData.prenom} ${adresseData.nomFamille} \n ${adresseData.ligne1} \n ${adresseData.ligne2} \n ${adresseData.codePostal} ${adresseData.ville} \n ${adresseData.pays} \n ${facturePhone(adresseData.telephone)}`
    }
    if (adresseData.ligne2 === null && adresseData.ligne3 === null) {
        // adresse avec ligne 1  
        adresse = `${adresseData.prenom} ${adresseData.nomFamille} \n ${adresseData.ligne1} \n ${adresseData.codePostal} ${adresseData.ville} \n ${adresseData.pays} \n ${facturePhone(adresseData.telephone)}`
    }
    if (adresseData.ligne2 === null && adresseData.ligne3 !== null) {
        // adresse avec ligne 1  , 3
        adresse = `${adresseData.prenom} ${adresseData.nomFamille} \n ${adresseData.ligne1} \n ${adresseData.ligne3} \n ${adresseData.codePostal} ${adresseData.ville} \n ${adresseData.pays} \n ${facturePhone(adresseData.telephone)}`
    }

    return adresse;
}


module.exports = {
    adresseEnvoieFormat,
    adresseEnvoieFormatHTML,
    textShopFacture,
    textAdresseLivraison,
    textAdresseFacturation,
    facturePhone
};