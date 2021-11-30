const db = require('../database');
const consol = require('../services/colorConsole');

class Commande {

    id;
    reference;
    dateAchat;
    commentaire;
    sendSmsShipping;
    updatedDate;
    idCommandeStatut;
    idClient;
    idTransporteur;


    set date_achat(val) {
        this.dateAchat = val;
    }

    set updated_date(val) {
        this.updatedDate = val;
    }

    set created_date(val) {
        this.createdDate = val;
    }

    set send_sms_shipping(val) {
        this.sendSmsShipping = val;
    }

    set id_commandestatut(val) {
        this.idCommandeStatut = val;
    }

    set id_client(val) {
        this.idClient = val;
    }

    set nom_famille(val) {
        this.nomFamille = val;
    }

    set id_privilege(val) {
        this.idPrivilege = val;
    }

    set ref_paiement(val) {
        this.refPaiement = val;
    }
    set payment_intent(val) {
        this.paymentIntent = val;
    }

    set moyen_paiement(val) {
        this.moyenPaiement = val;
    }

    set moyen_paiement_detail(val) {
        this.moyenPaiementDetail = val;
    }

    set derniers_chiffres(val) {
        this.derniersChiffres = val;
    }


    set date_paiement(val) {
        this.datePaiement = val;
    }

    set status_id(val) {
        this.statusId = val;
    }

    set id_transporteur(val) {
        this.idTransporteur = val;
    }


    /**
     * @constructor
     */
    constructor(data = {}) {
        for (const prop in data) {
            this[prop] = data[prop];
        }
    }

    /**
     * Méthode chargé d'aller chercher les informations relatives à tous les commandes
     * @returns - tous les commandes présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAll() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.commande ORDER BY commande.id ASC');

        if (!rows[0] || rows[0] === undefined) {
            return null;
        }
        consol.model(
            `les informations des ${rows.length} commandes ont été demandées !`
        );

        return rows.map((commande) => new Commande(commande));
    }

    /**
     * Méthode chargé d'aller chercher les informations relatives à tous les commandes
     * @returns - tous les commandes présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findViewCommande(id) {
        const {
            rows
        } = await db.query("SELECT produit.nom as produit_nom, caracteristique.couleur, caracteristique.taille, commande.id, commande.reference, commande.updated_date, commande.commentaire, commande.send_sms_shipping, commande.id_client, commande.id_commandeStatut, commande.id_transporteur, commande.date_achat, CAST(ligne_commande.quantite_commande as INTEGER), CAST (produit.prix_HT as INTEGER), CAST (tva.taux as FLOAT), client.id as idClient, adresse.prenom as adresse_prenom, adresse.nom_famille as adresse_nomFamille, adresse.ligne1 as adresse1, adresse.ligne2 as adresse2, adresse.ligne3 as adresse3, CAST (adresse.code_postal as INTEGER) as codePostal, adresse.ville, adresse.pays, adresse.telephone, transporteur.nom as transporteur FROM mada.commande  JOIN mada.ligne_commande ON ligne_commande.id_commande = commande.id JOIN mada.produit ON produit.id = ligne_commande.id_produit JOIN mada.tva ON tva.id = produit.id_tva JOIN mada.caracteristique ON caracteristique.id_produit = produit.id JOIN mada.client ON client.id = commande.id_client  JOIN mada.adresse ON client.id = adresse.id_client AND adresse.envoie = TRUE JOIN mada.transporteur ON commande.id_transporteur = transporteur.id WHERE commande.id = $1 ORDER BY produit.nom ASC;", [id]);

        if (!rows[0] || rows[0] === undefined) {
            return null;
        }
        consol.model(
            `les produit de la commande ${id} ont été demandées !`
        );

        return rows.map((commande) => new Commande(commande));
    }

/**
     * Méthode chargé d'aller chercher les informations relatives à une commande 
     * @returns - une commande présente en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
 static async findCommandeFactures(id) {
    const {
        rows
    } = await db.query("SELECT produit.nom as produit_nom, caracteristique.couleur, caracteristique.taille, commande.id, commande.reference, paiement.montant, paiement.moyen_paiement, paiement.moyen_paiement_detail, commande.updated_date, commande.commentaire, commande.send_sms_shipping, commande.id_client, commande.id_commandeStatut, commande.id_transporteur, commande.date_achat, CAST(ligne_commande.quantite_commande as INTEGER), produit.id as id_produit, CAST (produit.prix_HT as INTEGER), CAST (tva.taux as FLOAT), CAST (reduction.pourcentage_reduction as FLOAT) as reduction, client.id as idClient, client.nom_famille as client_nom,client.prenom as client_prenom,client.email,adresse.prenom as adresse_prenom, adresse.nom_famille as adresse_nomFamille,adresse.ligne1 as adresse1, adresse.ligne2 as adresse2, adresse.ligne3 as adresse3, CAST (adresse.code_postal as INTEGER) as codePostal, adresse.ville, adresse.pays, adresse.telephone, transporteur.nom as transporteur, CAST(transporteur.frais_expedition as INTEGER) FROM mada.commande JOIN mada.paiement ON paiement.id_commande = commande.id JOIN mada.ligne_commande ON ligne_commande.id_commande = commande.id JOIN mada.produit ON produit.id = ligne_commande.id_produit JOIN mada.tva ON tva.id = produit.id_tva LEFT JOIN mada.reduction ON reduction.id = produit.id_reduction AND reduction.actif = TRUE AND reduction.periode_reduction::daterange @> current_date::date JOIN mada.caracteristique ON caracteristique.id_produit = produit.id JOIN mada.client ON client.id = commande.id_client  JOIN mada.adresse ON client.id = adresse.id_client AND adresse.facturation = TRUE JOIN mada.transporteur ON commande.id_transporteur = transporteur.id WHERE commande.id = $1 ORDER BY produit.nom ASC;", [id]);

    if (!rows[0] || rows[0] === undefined) {
        return null;
    }
    /* consol.model(
        `les produit de la commande ${id} ont été demandées !`
    ); */

    return rows.map((commande) => new Commande(commande));
}


    /**
     * Méthode chargé d'aller chercher les informations relatives à une commande via son id passée en paramétre
     * @param - un id d'une commande
     * @returns - les informations d'une commande demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOne(id) {


        const {
            rows,
        } = await db.query(
            'SELECT commande.*, statut_commande.statut FROM mada.commande JOIN mada.statut_commande ON commande.id_commandeStatut = statut_commande.id WHERE commande.id = $1;',
            [id]
        );

        if (!rows[0] || rows[0] === undefined) {
            return null;
        }

        consol.model(
            `la commande id : ${id} a été demandé en BDD !`
        );

        return new Commande(rows[0]);
    }

    /**
     * Méthode chargé d'aller chercher les informations relatives à une commande via son id passée en paramétre
     * @param - un id d'une commande
     * @returns - les informations d'une commande demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
     static async findOneWithClient(id) {


        const {
            rows,
        } = await db.query(
            "SELECT commande.*, client.prenom, client.nom_famille, client.email, statut_commande.statut FROM mada.commande JOIN mada.statut_commande ON commande.id_commandeStatut = statut_commande.id JOIN mada.client ON client.id = commande.id_client WHERE commande.id = $1 AND (statut_commande.statut = 'Paiement validé' OR statut_commande.statut = 'En cours de préparation' OR statut_commande.statut = 'Prêt pour expédition' OR statut_commande.statut = 'Expédiée' OR statut_commande.statut = 'Remboursée');",
            [id]
        );

        if (!rows[0] || rows[0] === undefined) {
            return null;
        }

        consol.model(
            `la commande id : ${id} a été demandé en BDD !`
        );

        return new Commande(rows[0]);
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à une commande via son id passée en paramétre
     * @param - un id d'une commande
     * @returns - les informations d'une commande demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOneLimited(id) {


        const {
            rows,
        } = await db.query(
            "SELECT commande.*, statut_commande.statut FROM mada.commande JOIN mada.statut_commande ON commande.id_commandeStatut = statut_commande.id WHERE commande.id = $1 AND (statut_commande.statut = 'Paiement validé' OR statut_commande.statut = 'En cours de préparation' OR statut_commande.statut = 'Prêt pour expédition');",
            [id]
        );

        if (!rows[0] || rows[0] === undefined) {
            return null;
        }

        consol.model(
            `la commande id : ${id} a été demandé en BDD !`
        );

        return new Commande(rows[0]);
    }

    /**
     * Méthode chargé d'aller chercher les informations relatives à une commande via sa référence passée en paramétre
     * @param - une référence d'une commande
     * @returns - les informations d'une commande demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOneCommande(id) {


        const {
            rows,
        } = await db.query(
            'SELECT commande.*, statut_commande.statut FROM mada.commande JOIN mada.statut_commande ON commande.id_commandeStatut = statut_commande.id WHERE commande.reference = $1;',
            [id]
        );

        if (!rows[0] || rows[0] === undefined) {
            return null;
        }

        consol.model(
            `la commande id : ${id} a été demandé en BDD !`
        );

        return new Commande(rows[0]);
    }

    /**
     * Méthode chargé d'aller chercher les informations relatives à une commande via sa référence passée en paramétre
     * @param - une référence d'une commande
     * @returns - les informations d'une commande demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOneCommandeLimited(id) {


        const {
            rows,
        } = await db.query(
            "SELECT commande.*, statut_commande.statut FROM mada.commande JOIN mada.statut_commande ON commande.id_commandeStatut = statut_commande.id WHERE commande.reference = $1 AND (statut_commande.statut = 'Paiement validé' OR statut_commande.statut = 'En cours de préparation' OR statut_commande.statut = 'Prêt pour expédition');",
            [id]
        );

        if (!rows[0] || rows[0] === undefined) {
            return null;
        }

        consol.model(
            `la commande id : ${id} a été demandé en BDD !`
        );

        return new Commande(rows[0]);
    }

    /**
     * Méthode chargé d'aller chercher les informations relatives à un idCommande passé en paramétre
     * @param idClient - un idCommande d'une commande
     * @returns - les informations d'une commande demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findByIdClient(idClient) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.commande WHERE commande.id_client = $1;',
            [idClient]
        );

        if (!rows[0] || rows[0] === undefined) {
            return null;
        }

        consol.model(
            `la commande avec l'idClient : ${idClient} a été demandé en BDD !`
        );

        return rows.map((id) => new Commande(id));
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à une référence comande passé en paramétre
     * @param commande - une référence d'une commande
     * @returns - les informations d'une commande demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findByRefCommande(commande) {


        const {
            rows,
        } = await db.query(
            "SELECT commande.*, client.*, paiement.reference as Ref_paiement, paiement.montant, paiement.methode, paiement.payment_intent, paiement.moyen_paiement, paiement.moyen_paiement_detail, paiement.origine, paiement.derniers_chiffres, paiement.date_paiement, statut_commande.statut, statut_commande.id as status_id FROM mada.commande JOIN mada.client ON client.id = commande.id_client JOIN mada.paiement ON paiement.id_commande = commande.id JOIN mada.statut_commande ON commande.id_commandeStatut = statut_commande.id WHERE commande.reference = $1 AND (statut_commande.statut = 'Paiement validé' OR statut_commande.statut = 'En cours de préparation' OR statut_commande.statut = 'Prêt pour expédition' OR statut_commande.statut = 'Expédiée');",
            [commande]
        );

        if (!rows[0] || rows[0] === undefined) {
            return null;
        }
        consol.model(
            `la commande avec la référence : ${commande} et avec un statut compatible avec un remboursement a été demandé en BDD !`
        );

        return new Commande(rows[0]);
    }

    /**
     * Méthode chargé d'aller chercher les informations relatives à une référence comande passé en paramétre
     * @param commande - une référence d'une commande
     * @returns - les informations d'une commande demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findById(commande) {


        const {
            rows,
        } = await db.query(
            "SELECT commande.*, client.*, paiement.reference as Ref_paiement, paiement.montant, paiement.methode, paiement.payment_intent, paiement.moyen_paiement, paiement.moyen_paiement_detail, paiement.origine, paiement.derniers_chiffres, paiement.date_paiement, statut_commande.statut, statut_commande.id as status_id FROM mada.commande JOIN mada.client ON client.id = commande.id_client JOIN mada.paiement ON paiement.id_commande = commande.id JOIN mada.statut_commande ON commande.id_commandeStatut = statut_commande.id WHERE commande.id = $1 ;",
            [commande]
        );

        if (!rows[0] || rows[0] === undefined) {
            return null;
        }
        consol.model(
            `la commande avec la référence : ${commande} et avec un statut compatible avec un remboursement a été demandé en BDD !`
        );

        return new Commande(rows[0]);
    }

    /**
     * Méthode chargé d'aller chercher les informations relatives à une référence comande passé en paramétre
     * ne renvoit une commande que si sont statut est "Paiement Validé"
     * @param commande - une référence d'une commande
     * @returns - les informations d'une commande demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findByRefCommandeForClient(commande) {
        //valeur de l'objet en sortie du model : nommé sous la let "refCommandeOk" dans le paiementController
        /* refCommandeOk ==>>  [
         Commande {
            id: 101,
            reference: '101.4590.14092021010031.104.1',
            dateAchat: 2021-09-13T23:00:31.705Z,
            commentaire: null,
            sendSmsShipping: false,
            updatedDate: null,
            idCommandeStatut: 3,
            idClient: 101,
            idTransporteur: 1,
            nom: 'Awesome Metal Fish',
            prix_ht: '38.00',
            image_mini: 'http://placeimg.com/640/480',
            id_produit: 104,
            reduction: '0.03',
            tva: '0.05',
            stock: 9,
            prenom: 'Pierre',
            nomFamille: 'Achat',
            email: 'achat@r-boudet.fr',
            password: '$2b$10$MTPoKEam6a0We6X9VnLvo.uCsZUJYNEtzFecIAysPQPJY.W.cSzt6',
            createdDate: 2021-09-13T21:55:05.173Z,
            idPrivilege: 1,
            prenom_adresse: 'Pierre',
            nom_adresse: 'Achat',
            ligne1: '35 rue du Moulin bily',
            ligne2: null,
            ligne3: null,
            code_postal: '22380',
            ville: 'Saint cast',
            pays: 'FRANCE',
            telephone: '+33603720612',
            transporteur: 'DPD',
            refPaiement: '420284242.101.4590.14092021010031.104.1',
            quantite_commande: 1,
            montant: '38.70',
            methode: 'moyen_de_paiement:card/_marque:_visa/_type_de_carte:_credit/_pays_origine:_US/_mois_expiration:_4/_annee_expiration:_2028/_4_derniers_chiffres:_4242',
            paymentIntent: 'pi_3JZO8HLNa9FFzz1X1avEP75I',
            moyenPaiement: 'card',
            moyenPaiementDetail: 'visa credit',
            origine: 'UNITED STATES',
            derniersChiffres: '4242',
            datePaiement: 2021-09-13T23:00:31.708Z,
            statut: 'Paiement validé',
            statusId: 3
          }
          Commande {
          }
        ] */
        const {
            rows,
        } = await db.query(
            "SELECT commande.*, commande.id as commandeId, produit.nom, produit.prix_HT, produit.image_mini, produit.id as id_produit, reduction.pourcentage_reduction as reduction, tva.taux as tva, stock.quantite as stock, client.*, adresse.prenom as prenom_adresse, adresse.nom_Famille as nom_adresse, adresse.ligne1, adresse.ligne2, adresse.ligne3, adresse.code_postal, adresse.ville, adresse.pays, adresse.telephone, transporteur.nom as transporteur, paiement.reference as Ref_paiement, ligne_commande.quantite_commande, paiement.montant, paiement.methode, paiement.payment_intent, paiement.moyen_paiement, paiement.moyen_paiement_detail, paiement.origine, paiement.derniers_chiffres, paiement.date_paiement, statut_commande.statut, statut_commande.id status_id FROM mada.commande JOIN mada.transporteur ON commande.id_transporteur = transporteur.id JOIN mada.ligne_commande ON ligne_commande.id_commande = commande.id JOIN mada.produit ON ligne_commande.id_produit = produit.id JOIN mada.tva ON produit.id_tva = tva.id JOIN mada.stock ON stock.id_produit = produit.id JOIN mada.reduction ON produit.id_reduction = reduction.id JOIN mada.client ON client.id = commande.id_client JOIN mada.adresse ON adresse.id_client = client.id AND adresse.envoie = true JOIN mada.paiement ON paiement.id_commande = commande.id JOIN mada.statut_commande ON commande.id_commandeStatut = statut_commande.id WHERE commande.reference = $1 AND (statut_commande.statut = 'Paiement validé' OR statut_commande.statut = 'En cours de préparation' OR statut_commande.statut = 'Prêt pour expédition' OR statut_commande.statut = 'Expédiée');",
            [commande]
        );

        if (!rows[0] || rows[0] === undefined) {
            return null;
        }
        consol.model(
            `la commande avec la référence : ${commande} et avec un statut compatible avec un remboursement a été demandé en BDD !`
        );

        return rows.map((Commandes) => new Commande(Commandes));
    }
    /**
     * Méthode chargé d'aller insérer les informations relatives à une commande passé en paramétre
     * @param reference - la reférence d'une commande
     * @param dateAchat - la date de création de la commande
     * @param commentaire - le commentaire d'un commande
     * @param idCommandeStatut - le montant d'un commande
     * @param idClient - l'identifiant d'une commande
     * @returns - les informations du commande demandées
     * @async - une méthode asynchrone
     */
    async save() {

        let query;

        const data = [
            this.reference,
            this.idCommandeStatut,
            this.idClient,
            this.idTransporteur,
        ];
        // si j'ai le commentaire et/ou le sendSmsWhenShipping, je l'insére.. 
        if (this.commentaire && this.sendSmsShipping) {
            query = "INSERT INTO mada.commande (reference, date_achat, id_commandeStatut, id_client, id_transporteur, commentaire, send_sms_shipping) VALUES ($1, now(), $2, $3, $4, $5, $6) RETURNING *;";
            data.push(this.commentaire);
            data.push(this.sendSmsShipping);
        } else if (this.commentaire) {
            query = "INSERT INTO mada.commande (reference, date_achat, id_commandeStatut, id_client, id_transporteur, commentaire) VALUES ($1, now(), $2, $3, $4, $5) RETURNING *;";
            data.push(this.commentaire);
        } else if (this.sendSmsShipping) {
            query = "INSERT INTO mada.commande (reference, date_achat, id_commandeStatut, id_client, id_transporteur, send_sms_shipping) VALUES ($1, now(), $2, $3, $4, $5) RETURNING *;";
            data.push(this.sendSmsShipping);
        } else {
            //sinon, je fais sans... commentaire aura la valeur null dans la BDD et le sendSmsWhenShipping aura la valeur FALSE.
            query = "INSERT INTO mada.commande (reference, date_achat, id_commandeStatut, id_client, id_transporteur) VALUES ($1, now(), $2, $3, $4) RETURNING *;"
        }

        const {
            rows,
        } = await db.query(
            query, data
        );

        this.id = rows[0].id;
        this.createdDate = rows[0].date_achat;
        consol.model(
            `la commande id ${this.id} a été inséré à la date du ${this.createdDate} avec comme statut de commande ${this.idCommandeStatut} !`
        );
        return new Commande(rows[0]);

    }

    /**
     * Méthode chargé d'aller mettre à jour les informations relatives à une commande passé en paramétre
     * @param reference - la reférence d'une commande
     * @param dateAchat - la date de création de la commande
     * @param commentaire - le commentaire d'un commande
     * @param idCommandeStatut - le montant d'un commande
     * @param idClient - l'identifiant d'une commande
     * @param id - l'identifiant du champs a mettre a jour
     * @returns - les informations du commande mis à jour
     * @async - une méthode asynchrone
     */
    async update() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.commande SET reference = $1, commentaire = $2, updated_date=now(), id_commandeStatut = $3, id_client = $4, id_transporteur = $5  WHERE id = $6 RETURNING *;`,
            [this.reference, this.commentaire, this.idCommandeStatut, this.idClient, this.idTransporteur, this.id]
        );
        this.updatedDate = rows[0].updated_date;
        console.log(
            `la commande id ${this.id} avec le statut ${this.idCommandeStatut} et la référence ${this.reference} a été mise à jour le ${this.updatedDate} !`
        );
        return new Commande(rows[0]);

    }

    /**
     * Méthode chargé d'aller mettre à jour les informations relatives à une commande passé en paramétre avec le statut choisi
     * @param idCommandeStatut - le montant d'un commande
     * @param id - l'identifiant du champs a mettre a jour
     * @returns - les informations du commande mis à jour
     * @async - une méthode asynchrone
     */
    async updateStatutCommande() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.commande SET updated_date=now(), id_commandeStatut = $1  WHERE id = $2 RETURNING *;`,
            [this.idCommandeStatut, this.id]
        );
        
        this.updatedDate = rows[0].updated_date;
        console.log(
            `la commande id ${this.id} avec le statut ${this.idCommandeStatut} a été mise à jour le ${this.updatedDate} !`
        );
        return new Commande(rows[0]);

    }


    /**
     * Méthode chargé d'aller supprimer un commande passé en paramétre
     * @param id - l'id d'un commande
     * @async - une méthode asynchrone
     */
    async delete() {
        const {
            rows
        } = await db.query('DELETE FROM mada.commande WHERE commande.id = $1 RETURNING *;', [
            this.id,
        ]);
        consol.model(`la commande id ${this.id} a été supprimé (ainsi que potentiellement: la livraison, la ligne de commande, la ligne de livraison...) !`);

        return new Commande(rows[0]);
    }

    /**
     * Méthode chargé d'aller supprimer une commande  via l'idCommande passé en paramétre
     * @param idClient - l'id d'une commande
     * @returns - les informations du commande qui viennent d'être supprimés.
     * @async - une méthode asynchrone
     */
    async deleteByIdClient() {
        const {
            rows
        } = await db.query('DELETE FROM mada.commande WHERE commande.id_client = $1 RETURNING *;', [
            this.idClient
        ]);

        //this.id = rows[0].id;
        consol.model(`la ou les commandes avec l'idClient ${this.idClient} a / ont été supprimé ! (ainsi que potentiellement: la livraison, la ligne de commande, la ligne de livraison...)`);

        return rows.map((deletedCommande) => new Commande(deletedCommande));
    }



}

module.exports = Commande;