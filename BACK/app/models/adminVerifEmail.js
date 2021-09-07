const db = require('../database');
const consol = require('../services/colorConsole');

class AdminVerifEmail {


    id;
    verifEmail;
    dateVerifEmail;
    idClient;



    set verif_email(val) {
        this.verifEmail = val;
    }

    set date_verif_email(val) {
        this.dateVerifEmail = val;
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
     * Méthode chargé d'aller chercher toutes les informations relatives à tous les adminVerifEmails
     * @returns - tous les adminVerifEmails présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAll() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.admin_verif_email ORDER BY admin_verif_email.id ASC');

        if (!rows[0]) {
            throw new Error("Aucun adminVerifEmail dans la BDD");
        }
        consol.model(
            `les informations des ${rows.length} adminVerifEmails ont été demandé !`
        );

        return rows.map((adminVerifEmail) => new AdminVerifEmail(adminVerifEmail));
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à un adminVerifEmail passé en paramétre
     * @param id - un id d'un adminVerifEmail
     * @returns - les informations du adminVerifEmail demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOne(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.admin_verif_email WHERE admin_verif_email.id = $1;',
            [id]
        );

        if (!rows[0]) {
            throw new Error("Aucun admin_verif_email avec cet id");
        }

        consol.model(
            `le adminVerifEmail id : ${id} a été demandé en BDD !`
        );

        return new AdminVerifEmail(rows[0]);
    }

    /**
     * Méthode chargé d'aller chercher les informations relatives à un admin_verif_email passé en paramétre
     * @param idClient - un idClient d'un client_historique_connexion
     * @returns - les informations du client_historique_connexion demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findByIdClient(idClient) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.admin_verif_email WHERE admin_verif_email.id_client = $1;',
            [idClient]
        );

        if (!rows[0]) {
            return null;
        }

        consol.model(
            `le statut de l'email pour le idClient : ${idClient} a été demandé en BDD !`
        );

        return new AdminVerifEmail(rows[0]);
    }

    /**
     * Méthode chargé d'aller insérer les informations relatives à un utilisateur passé en paramétre
     * @param verifEmail - le staut 'true' ou 'false' d'un email d'un client ayant le privilege Admin. Ici TRUE en dur..
     * @param idClient - l'id d'un client ayanty le privilege Admin
     * @returns - les informations du adminVerifEmail demandées
     * @async - une méthode asynchrone
     */
    static async true(id) {

        const {
            rows,
        } = await db.query(
            `UPDATE mada.admin_verif_email SET verif_email = 'true', date_verif_email = now() WHERE id_client = $1 RETURNING *;`,
            [id]
        );

     
        this.verifEmail = rows[0].verif_email;
        this.createdDate = rows[0].date_verif_email;
        consol.model(
            `le adminVerifEmail id ${id} avec comme statut ${this.verifEmail} a été mis a jour à la date du ${this.createdDate} !`
        );
    }

     /**
     * Méthode chargé d'aller insérer les informations relatives à un utilisateur passé en paramétre
     * @param verifEmail - le statut 'false' d'un email d'un client ayant le privilege Admin.
     * @param idClient - l'id d'un client ayanty le privilege Admin
     * @returns - les informations du adminVerifEmail demandées
     * @async - une méthode asynchrone
     */
      static async false(id) {

        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.admin_verif_email (verif_email, id_client) VALUES ('false', $1) RETURNING *;`,
            [id]
        );

     
        this.verifEmail = rows[0].verif_email;
        consol.model(
            `le adminVerifEmail id ${id} avec comme statut ${this.verifEmail} a été inséré avec succés !`
        );
    }




    /**
     * Méthode chargé d'aller mettre à jour les informations relatives à un adminVerifEmail passé en paramétre
     * @param  verifEmail - le statut d'un email d'un client avec privilege Admin
     * @param idClient - l'id d'un client avec privilege Admin
     * @returns - les informations du adminVerifEmail mis à jour
     * @async - une méthode asynchrone
     */
     async update() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.admin_verif_email SET verif_email = $1, id_client = $2 WHERE id = $3 RETURNING *;`,
            [this.verifEmail, this.idClient, this.id]
        );

        console.log(
            `le adminVerifEmail id : ${this.id} du client id ${this.idClient} a été mise à jour  !`
        );
    }
 

    /**
     * Méthode chargé d'aller supprimer le statut d'un email d'un client admin via l'id du statut passé en paramétre
     * @param id - l'id d'un adminVerifEmail
     * @returns - les informations du adminVerifEmail qui viennent d'être supprimés.
     * @async - une méthode asynchrone
     */
    async delete() {
        const {
            rows
        } = await db.query('DELETE FROM mada.admin_verif_email WHERE admin_verif_email.id = $1 RETURNING *;', [
            this.id,
        ]);
        consol.model(`le adminVerifEmail id ${this.id} a été supprimé !`);

        return new AdminVerifEmail(rows[0]);
    }

    /**
     * Méthode chargé d'aller supprimer le statut d'un email d'un client admin via l'idClient du statut passé en paramétre
     * Afin de supprimer plus facilement toute trace d'un client si demande de suppression de compte. A voir si je la garde dans le temps...
     * @param idClient - l'id d'un client d'un historique de connexion
     * @returns - les informations du adminVerifEmail qui viennent d'être supprimés.
     * @async - une méthode asynchrone
     */
    async deleteByIdClient() {


        const {
            rows
        } = await db.query('DELETE FROM mada.admin_verif_email WHERE admin_verif_email.id_client = $1 RETURNING *;', [
            this.idClient
        ]);
        consol.model(`l'historique de password du client id ${this.idClient} a été supprimé !`);

        return rows.map((deletedClient) => new AdminVerifEmail(deletedClient));
    }


}

module.exports = AdminVerifEmail;