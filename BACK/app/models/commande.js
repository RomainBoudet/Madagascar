const db = require('../database');
const consol = require('../services/colorConsole');

class Commande {

    id;
    reference;
    dateAchat;
    commentaire;
    montant;
    updatedDate;
    idCommandeStatut;
    idClient;


    set date_achat(val) {
        this.dateAchat = val;
    }

    set updated_date(val) {
        this.updatedDate = val;
    }

    set id_commandestatut(val) {
        this.idCommandeStatut = val;
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
     * Méthode chargé d'aller chercher les informations relatives à tous les commandes
     * @returns - tous les commandes présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAll() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.commande ORDER BY commande.id ASC');

        if (!rows[0]) {
            throw new Error("Aucun commandes dans la BDD");
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

        if (!rows[0]) {
            throw new Error("Aucun commande avec cet id");
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

        if (!rows[0]) {
            throw new Error("Aucune commande avec cet idClient");
        }

        consol.model(
            `la commande avec l'idClient : ${idClient} a été demandé en BDD !`
        );

        return rows.map((id) => new Commande(id));
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

        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.commande (reference, date_achat, commentaire, id_commandeStatut, id_client) VALUES ($1, now(), $2, $3, $4) RETURNING *;`,
            [this.reference, this.commentaire, this.idCommandeStatut, this.idClient]
        );

        this.id = rows[0].id;
        this.createdDate = rows[0].date_achat;
        consol.model(
            `la commande id ${this.id} a été inséré à la date du ${this.createdDate} avec comme statut de commande ${this.idCommandeStatut} !`
        );
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
            `UPDATE mada.commande SET reference = $1, commentaire = $2, updated_date=now(), id_commandeStatut = $3, id_client = $4  WHERE id = $5 RETURNING *;`,
            [this.reference, this.commentaire, this.idCommandeStatut, this.idClient, this.id]
        );
        this.updatedDate = rows[0].updated_date;
        console.log(
            `la commande id ${this.id} avec le statut ${this.idCommandeStatut} et la référence ${this.reference} a été mise à jour le ${this.updatedDate} !`
        );
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