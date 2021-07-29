const db = require('../database');
const consol = require('../services/colorConsole');

class ClientHistoConn {

    id;
    connexionSucces;
    connexionDate;
    idClient;


    set connexion_succes(val) {
        this.connexionSucces = val;
    }

    set connexion_date(val) {
        this.connexionDate = val;
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
     * Méthode chargé d'aller chercher toutes les informations relatives à tous les client_historique_connexions
     * @returns - tous les client_historique_connexions présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAll() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.client_historique_connexion ORDER BY client_historique_connexion.id ASC');

        if (!rows[0]) {
            throw new Error("Aucun client_historique_connexion dans la BDD");
        }
        consol.model(
            `les informations des ${rows.length} client_historique_connexions ont été demandé !`
        );

        return rows.map((clientHistoConn) => new ClientHistoConn(clientHistoConn));
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à un client_historique_connexion passé en paramétre
     * @param id - un id d'un client_historique_connexion
     * @returns - les informations du client_historique_connexion demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOne(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.client_historique_connexion WHERE client_historique_connexion.id = $1;',
            [id]
        );

        if (!rows[0]) {
            throw new Error("Aucun client_historique_connexion avec cet id");
        }

        consol.model(
            `le client_historique_connexion id : ${id} a été demandé en BDD !`
        );

        return new ClientHistoConn(rows[0]);
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à un client_historique_connexion passé en paramétre
     * @param idClient - un idClient d'un client_historique_connexion
     * @returns - les informations du client_historique_connexion demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findByIdClient(idClient) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.client_historique_connexion WHERE client_historique_connexion.id_client = $1;',
            [idClient]
        );

        if (!rows[0]) {
            throw new Error("Aucun client_historique_connexion avec cet idClient");
        }

        consol.model(
            `l'historique de connexion pour le idClient : ${idClient} a été demandé en BDD !`
        );

        return rows.map((clientHistoConn) => new ClientHistoConn(clientHistoConn));
    }


    /**
     * Méthode chargé d'aller passer a true la valeur de la connexion d'un utilisateur passé en paramétre
     * @param  connexionSucces - le succes ou non de connexion d'un client
     * @param  idClient - l'id du client lié au succes de connexion
     * @returns - les informations du client_historique_connexion demandées
     * @async - une méthode asynchrone
     */
    static async true(idClient) {
        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.client_historique_connexion (connexion_succes, id_client) VALUES ('true', $1) RETURNING *;`,
            [idClient]
        );

        this.id = rows[0].id;
        this.connexionSucces = rows[0].connexion_succes;
        this.connexionDate = rows[0].connexion_date;
        consol.model(
            `le client id ${idClient} a effectué une connexion avec le status  ${this.connexionSucces} à la date du : ${this.connexionDate} !`
        );
    }

    /**
     * Méthode chargé d'aller passer a false la valeur de la connexion d'un utilisateur passé en paramétre
     * @param  connexionSucces - le succes ou non de connexion d'un client
     * @param  idClient - l'id du client lié au succes de connexion
     * @returns - les informations du client_historique_connexion demandées
     * @async - une méthode asynchrone
     */
    static  async false(idClient) {
        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.client_historique_connexion (connexion_succes, id_client) VALUES ('false', $1) RETURNING *;`,
            [idClient]
        );

        this.id = rows[0].id;
        this.connexionSucces = rows[0].connexion_succes;
        this.connexionDate = rows[0].connexion_date;
        consol.model(
            `le client id ${idClient} a effectué une connexion avec le status  ${this.connexionSucces} à la date du : ${this.connexionDate} !`
        );
    }

    // Ces enregitrement n'ont pas vocation a être modifié pour quelques raisons que ce soit. Pas de methode update ici.

    /**
     * Méthode chargé d'aller supprimer un client_historique_connexion passé en paramétre
     * @param id - l'id d'un client_historique_connexion
     * @async - une méthode asynchrone
     */
    async delete() {
        const {
            rows
        } = await db.query('DELETE FROM mada.client_historique_connexion WHERE client_historique_connexion.id = $1 RETURNING *;', [
            this.id,
        ]);
        consol.model(`l'historique de connexion id ${this.id} a été supprimé !`);

        return new ClientHistoConn(rows[0]);
    }

    /**
     * Méthode chargé d'aller supprimer un client_historique_connexion passé en paramétre
     * Afin de supprimer plus facilement toute trace d'un client si demande de suppression de compte. A voir si je la garde dans le temps...
     * @param idClient - l'id d'un client d'un historique de connexion
     * @async - une méthode asynchrone
     */
    async deleteByIdClient() {


        const {
            rows
        } = await db.query('DELETE FROM mada.client_historique_connexion WHERE client_historique_connexion.id_client = $1 RETURNING *;', [
            this.idClient
        ]);
        consol.model(`l'historique de connexion du client id ${this.idClient} a été supprimé !`);
        
        return rows.map((deletedClient) => new ClientHistoConn(deletedClient));
    }


}

module.exports = ClientHistoConn;