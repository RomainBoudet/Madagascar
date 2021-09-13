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

    set status_id (val) {
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
            'SELECT * FROM mada.commande WHERE commande.id = $1;',
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
            "SELECT commande.*, client.*, paiement.reference as Ref_paiement, paiement.montant, paiement.methode, paiement.payment_intent, paiement.moyen_paiement, paiement.moyen_paiement_detail, paiement.origine, paiement.derniers_chiffres, paiement.date_paiement, statut_commande.statut, statut_commande.id as status_id FROM mada.commande JOIN mada.client ON client.id = commande.id_client JOIN mada.paiement ON paiement.id_commande = commande.id JOIN mada.statut_commande ON commande.id_commandeStatut = statut_commande.id WHERE commande.reference = $1 AND (statut_commande.statut = 'Paiement validé' OR statut_commande.statut = 'En cours de préparation' OR statut_commande.statut = 'En cours de préparation' OR statut_commande.statut = 'Expédiée');",
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


        const {
            rows,
        } = await db.query(
            "SELECT commande.*, produit.nom, produit.prix_HT, client.*, adresse.prenom as prenom_adresse, adresse.nom_Famille as nom_adresse, adresse.ligne1, adresse.ligne2, adresse.ligne3, adresse.code_postal, adresse.ville, adresse.pays, adresse.telephone, paiement.reference as Ref_paiement, ligne_commande.quantite_commande, paiement.montant, paiement.methode,  paiement.payment_intent, paiement.moyen_paiement, paiement.moyen_paiement_detail, paiement.origine, paiement.derniers_chiffres, paiement.date_paiement, statut_commande.statut, statut_commande.id as status_id FROM mada.commande  JOIN mada.ligne_commande ON ligne_commande.id_commande = commande.id JOIN mada.produit ON ligne_commande.id_produit = produit.id JOIN mada.client ON client.id = commande.id_client JOIN mada.adresse ON adresse.id_client = client.id AND adresse.envoie = true JOIN mada.paiement ON paiement.id_commande = commande.id JOIN mada.statut_commande ON commande.id_commandeStatut = statut_commande.id WHERE commande.reference =  $1 AND (statut_commande.statut = 'Paiement validé' OR statut_commande.statut = 'En cours de préparation' OR statut_commande.statut = 'Prêt pour expédition' OR statut_commande.statut = 'Expédiée');",
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