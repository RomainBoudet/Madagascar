const db = require('../database');
const consol = require('../services/colorConsole');

class Facture {

    id;
    reference;
    dateFacturation;
    montantHT;
    montantTTC;
    montantTVA;
    updatedDate;
    idPaiement;
    idClient;


    set date_facturation(val) {
        this.dateFacturation = val;
    }

    set montant_ht(val) {
        this.montantHT = val;
    }

    set montant_ttc(val) {
        this.montantTTC = val;
    }

    set montant_tva(val) {
        this.montantTVA = val;
    }

    set updated_date(val) {
        this.updatedDate = val;
    }

    set id_paiement(val) {
        this.idPaiement = val;
    }

    set id_client(val) {
        this.idClient = val;
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
     * Méthode chargé d'aller chercher les informations relatives à toutes les factures
     * @returns - tous les factures présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAll() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.facture ORDER BY facture.id ASC');

        if (!rows[0]) {
            throw new Error("Aucunes factures dans la BDD");
        }
        consol.model(
            `les informations des ${rows.length} factures ont été demandées !`
        );

        return rows.map((facture) => new Facture(facture));
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à une facture via son id passée en paramétre
     * @param - un id d'une facture
     * @returns - les informations du facture demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOne(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.facture WHERE facture.id = $1;',
            [id]
        );

        if (!rows[0]) {
            throw new Error("Aucun facture avec cet id");
        }

        consol.model(
            `le facture id : ${id} a été demandé en BDD !`
        );

        return new Facture(rows[0]);
    }



    /**
     * Méthode chargé d'aller chercher les informations relatives à un idClient passé en paramétre
     * @param idClient - un idClient d'une facture
     * @returns - les informations d'une facture demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findByIdClient(idClient) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.facture WHERE facture.id_client = $1;',
            [idClient]
        );

        if (!rows[0]) {
            throw new Error("Aucun facture avec cet idClient");
        }

        consol.model(
            `la facture pour le idClient : ${idClient} a été demandé en BDD !`
        );

        return rows.map((id) => new Facture(id));
    }

    /**
     * Méthode chargé d'aller insérer les informations relatives à une factures passé en paramétre
     * @param reference - la reférence d'une facture
     * @param montantHT - le montant HT d'una facture, 
     * @param montantTTC - le montant TTC d'une facture,
     * @param montantTVA - le montant TVA d'une facture
     * @param idPaiement - l'identifiant d'un paiement
     * @param idClient - l'id d'un client
     * @returns - les informations du facture demandées
     * @async - une méthode asynchrone
     */
    async save() {

        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.facture (reference, montant_HT, montant_TTC, montant_TVA, id_paiement, id_client) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`,
            [this.reference, this.montantHT, this.montantTTC, this.montantTVA, this.idPaiement, this.idClient]
        );

        this.id = rows[0].id;
        this.createdDate = rows[0].date_facturation;
        consol.model(
            `le facture id ${this.id} a été inséré à la date du ${this.createdDate} pour le client id ${this.idClient} !`
        );
    }

    /**
     * Méthode chargé d'aller mettre à jour les informations relatives à un facture passé en paramétre
     * @param reference - la reférence d'une facture
     * @param montantHT - le montant HT d'una facture, 
     * @param montantTTC - le montant TTC d'une facture,
     * @param montantTVA - le montant TVA d'une facture
     * @param idPaiement - l'identifiant d'un paiement
     * @param idClient - l'id d'un client
     * @param id - l'identifiant du champs a supprimer
     * @returns - les informations du facture mis à jour
     * @async - une méthode asynchrone
     */
    async update() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.facture SET reference = $1, montant_HT = $2, montant_TTC = $3, montant_TVA = $4, id_paiement = $5, id_client = $6  WHERE id = $7 RETURNING *;`,
            [this.reference, this.montantHT, this.montantTTC, this.montantTVA, this.idPaiement, this.idClient, this.id]
        );
        this.updatedDate = rows[0].updated_date;
        console.log(
            `le facture du client id : ${this.idClient} comprenant le nouveau numéro ${this.adminTelephone} a été mise à jour le ${this.updatedDate} !`
        );
    }




    /**
     * Méthode chargé d'aller supprimer un facture passé en paramétre
     * @param id - l'id d'un facture
     * @async - une méthode asynchrone
     */
    async delete() {
        const {
            rows
        } = await db.query('DELETE FROM mada.facture WHERE facture.id = $1 RETURNING *;', [
            this.id,
        ]);
        consol.model(`le facture id ${this.id} a été supprimé !`);

        return new Facture(rows[0]);
    }

    /**
     * Méthode chargé d'aller supprimer une facture  via l'idClient passé en paramétre
     * @param idClient - l'id d'un client
     * @returns - les informations du facture qui viennent d'être supprimés.
     * @async - une méthode asynchrone
     */
    async deleteByIdClient() {
        const {
            rows
        } = await db.query('DELETE FROM mada.facture WHERE facture.id_client = $1 RETURNING *;', [
            this.idClient
        ]);
        consol.model(`la facture du client id ${this.idClient} a été supprimé !`);

        return rows.map((deletedClient) => new Facture(deletedClient));
    }



}

module.exports = Facture;