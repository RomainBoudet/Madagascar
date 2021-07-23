const db = require('../database');
const consol = require('../services/colorConsole');

class AdminVerifPhone {


    id;
    verifPhone;
    dateVerifPhone;
    idClient;



    set verif_phone(val) {
        this.verifPhone = val;
    }

    set date_verif_phone(val) {
        this.dateVerifPhone = val;
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
     * Méthode chargé d'aller chercher toutes les informations relatives à tous les adminVerifPhones
     * @returns - tous les adminVerifPhones présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAll() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.admin_verif_telephone ORDER BY admin_verif_telephone.id ASC');

        if (!rows[0]) {
            throw new Error("Aucun adminVerifPhone dans la BDD");
        }
        consol.model(
            `les informations des ${rows.length} adminVerifPhones ont été demandé !`
        );

        return rows.map((adminVerifPhone) => new AdminVerifPhone(adminVerifPhone));
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à un adminVerifPhone passé en paramétre
     * @param id - un id d'un adminVerifPhone
     * @returns - les informations du adminVerifPhone demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOne(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.admin_verif_telephone WHERE admin_verif_telephone.id = $1;',
            [id]
        );

        if (!rows[0]) {
            throw new Error("Aucun admin_verif_telephone avec cet id");
        }

        consol.model(
            `le adminVerifPhone id : ${id} a été demandé en BDD !`
        );

        return new AdminVerifPhone(rows[0]);
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
            'SELECT * FROM mada.admin_verif_telephone WHERE admin_verif_telephone.id_client = $1;',
            [idClient]
        );

        if (!rows[0]) {
            throw new Error("Aucun admin_verif_telephone avec cet idClient");
        }

        consol.model(
            `le statut de l'email pour le idClient : ${idClient} a été demandé en BDD !`
        );

        return new AdminVerifPhone(rows[0]);
    }

    /**
     * Méthode chargé d'aller insérer les informations relatives à un utilisateur passé en paramétre
     * @param verifEmail - le staut 'true' ou 'false' d'un email d'un client ayant le privilege Admin. Ici TRUE en dur..
     * @param idClient - l'id d'un client ayanty le privilege Admin
     * @returns - les informations du adminVerifPhone demandées
     * @async - une méthode asynchrone
     */
    async true() {

        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.admin_verif_telephone (verif_phone, id_client) VALUES (TRUE, $1) RETURNING *;`,
            [this.idClient]
        );

        this.id = rows[0].id;
        this.verifPhone = rows[0].verif_phone;
        this.createdDate = rows[0].date_verif_phone;
        consol.model(
            `le adminVerifPhone id ${this.id} avec comme statut ${this.verifPhone} a été inséré à la date du ${this.createdDate} !`
        );
    }




    /**
     * Méthode chargé d'aller mettre à jour les informations relatives à un adminVerifPhone passé en paramétre
     * @param  verifEmail - le statut d'un email d'un client avec privilege Admin
     * @param idClient - l'id d'un client avec privilege Admin
     * @returns - les informations du adminVerifPhone mis à jour
     * @async - une méthode asynchrone
     */
     async update() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.admin_verif_telephone SET verif_phone = $1, id_client = $2 WHERE id = $3 RETURNING *;`,
            [this.verifPhone, this.idClient, this.id]
        );

        console.log(
            `le adminVerifPhone id : ${this.id} du client id ${this.idClient} a été mise à jour  !`
        );
    }
 

    /**
     * Méthode chargé d'aller supprimer le statut d'un email d'un client admin via l'id du statut passé en paramétre
     * @param id - l'id d'un adminVerifPhone
     * @returns - les informations du adminVerifPhone qui viennent d'être supprimés.
     * @async - une méthode asynchrone
     */
    async delete() {
        const {
            rows
        } = await db.query('DELETE FROM mada.admin_verif_telephone WHERE admin_verif_telephone.id = $1 RETURNING *;', [
            this.id,
        ]);
        consol.model(`le adminVerifPhone id ${this.id} a été supprimé !`);

        return new AdminVerifPhone(rows[0]);
    }

    /**
     * Méthode chargé d'aller supprimer le statut d'un email d'un client admin via l'idClient du statut passé en paramétre
     * Afin de supprimer plus facilement toute trace d'un client si demande de suppression de compte. A voir si je la garde dans le temps...
     * @param idClient - l'id d'un client d'un historique de connexion
     * @returns - les informations du adminVerifPhone qui viennent d'être supprimés.
     * @async - une méthode asynchrone
     */
    async deleteByIdClient() {


        const {
            rows
        } = await db.query('DELETE FROM mada.admin_verif_telephone WHERE admin_verif_telephone.id_client = $1 RETURNING *;', [
            this.idClient
        ]);
        consol.model(`l'historique de password du client id ${this.idClient} a été supprimé !`);

        return rows.map((deletedClient) => new AdminVerifPhone(deletedClient));
    }


}

module.exports = AdminVerifPhone;