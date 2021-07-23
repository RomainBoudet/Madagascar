const db = require('../database');
const consol = require('../services/colorConsole');

class AdminPhone {

    id;
    adminTelephone;
    createdDate;
    updatedDate;
    idClient;

    set admin_telephone(val) {
        this.adminTelephone = val;
    }

    set created_date(val) {
        this.createdDate = val;
    }

    set updated_date(val) {
        this.updatedDate = val;
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
     * Méthode chargé d'aller chercher toutes les informations relatives à tous les admin_phones
     * @returns - tous les admin_phones présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAll() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.admin_phone ORDER BY admin_phone.id ASC');

        if (!rows[0]) {
            throw new Error("Aucun admin_phone dans la BDD");
        }
        consol.model(
            `les informations des ${rows.length} admin_phones ont été demandé !`
        );

        return rows.map((adminPhone) => new AdminPhone(adminPhone));
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à un admin_phone passé en paramétre
     * @param - un id d'un admin_phone
     * @returns - les informations du admin_phone demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOne(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.admin_phone WHERE admin_phone.id = $1;',
            [id]
        );

        if (!rows[0]) {
            throw new Error("Aucun admin_phone avec cet id");
        }

        consol.model(
            `le admin_phone id : ${id} a été demandé en BDD !`
        );

        return new AdminPhone(rows[0]);
    }



    /**
     * Méthode chargé d'aller chercher les informations relatives à un admin_verif_telephone passé en paramétre
     * @param idClient - un idClient d'un client_historique_connexion
     * @returns - les informations du client_historique_connexion demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findByIdClient(idClient) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.admin_phone WHERE admin_phone.id_client = $1;',
            [idClient]
        );

        if (!rows[0]) {
            throw new Error("Aucun admin_phone avec cet idClient");
        }

        consol.model(
            `le statut de l'admin_phone pour le idClient : ${idClient} a été demandé en BDD !`
        );

        return new AdminPhone(rows[0]);
    }

    /**
     * Méthode chargé d'aller insérer les informations relatives à un utilisateur passé en paramétre
     * @param adminTelephone - le telephone d'un administrateur
     * @param idClient - l'id d'un client avec le privilege Administrateur
     * @returns - les informations du admin_phone demandées
     * @async - une méthode asynchrone
     */
    async save() {

        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.admin_phone (admin_telephone, id_client) VALUES ($1,$2) RETURNING *;`,
            [this.adminTelephone, this.idClient]
        );

        this.id = rows[0].id;
        this.createdDate = rows[0].created_date;
        consol.model(
            `le admin_phone id ${this.id} a été inséré à la date du ${this.createdDate} !`
        );
    }



    /**
     * Méthode chargé d'aller mettre à jour les informations relatives à un admin_phone passé en paramétre
     * @param adminTelephone - le telephone d'un administrateur
     * @param id - l'identifiant du champs a supprimer
     * @returns - les informations du admin_phone mis à jour
     * @async - une méthode asynchrone
     */
    async updateByIdClient() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.admin_phone SET admin_telephone = $1, updated_date = now() WHERE id_client = $2 RETURNING *;`,
            [this.adminTelephone, this.idClient]
        );
        this.updatedDate = rows[0].updated_date;
        console.log(
            `le admin_phone du client id : ${this.idClient} comprenant le nouveau numéro ${this.adminTelephone} a été mise à jour le ${this.updatedDate} !`
        );
    }
    /**
     * Méthode chargé d'aller supprimer un admin_phone passé en paramétre
     * @param id - l'id d'un admin_phone
     * @async - une méthode asynchrone
     */
    async delete() {
        const {
            rows
        } = await db.query('DELETE FROM mada.admin_phone WHERE admin_phone.id = $1 RETURNING *;', [
            this.id,
        ]);
        consol.model(`le admin_phone id ${this.id} a été supprimé !`);

        return new AdminPhone(rows[0]);
    }

    /**
     * Méthode chargé d'aller supprimer le téléphone d'un client admin via l'idClient du statut passé en paramétre
     * @param idClient - l'id d'un client
     * @returns - les informations du admin_phone qui viennent d'être supprimés.
     * @async - une méthode asynchrone
     */
    async deleteByIdClient() {


        const {
            rows
        } = await db.query('DELETE FROM mada.admin_phone WHERE admin_phone.id_client = $1 RETURNING *;', [
            this.idClient
        ]);
        consol.model(`l'admin_phone du client id ${this.idClient} a été supprimé !`);

        return rows.map((deletedClient) => new AdminPhone(deletedClient));
    }



}

module.exports = AdminPhone;