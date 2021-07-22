const db = require('../database');
const consol = require('../services/colorConsole');

class ClientHistoPass {

    id;
    passwordHash;
    createdDate;

    set password_hash(val) {
        this.passwordHash = val;
    }

    set id_client(val) {
        this.idClient = val;
    }

    set created_date(val) {
        this.createdDate = val;
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
     * Méthode chargé d'aller chercher toutes les informations relatives à tous les client_historique_passwords
     * @returns - tous les client_historique_passwords présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAll() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.client_historique_password ORDER BY client_historique_password.id ASC');

        if (!rows[0]) {
            throw new Error("Aucun client_historique_password dans la BDD");
        }
        consol.model(
            `les informations des ${rows.length} client_historique_passwords ont été demandé !`
        );

        return rows.map((clientHistoPass) => new ClientHistoPass(clientHistoPass));
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à un client_historique_password passé en paramétre
     * @param id - un id d'un client_historique_password
     * @returns - les informations du client_historique_password demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOne(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.client_historique_password WHERE client_historique_password.id = $1;',
            [id]
        );

        if (!rows[0]) {
            throw new Error("Aucun client_historique_password avec cet id");
        }

        consol.model(
            `le client_historique_password id : ${id} a été demandé en BDD !`
        );

        return new ClientHistoPass(rows[0]);
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à un client_historique_password passé en paramétre
     * @param idClient - un idClient d'un client_historique_connexion
     * @returns - les informations du client_historique_connexion demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
     static async findByIdClient(idClient) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.client_historique_password WHERE client_historique_password.id_client = $1;',
            [idClient]
        );

        if (!rows[0]) {
            throw new Error("Aucun client_historique_password avec cet idClient");
        }

        consol.model(
            `l'historique de password pour le idClient : ${idClient} a été demandé en BDD !`
        );

        return rows.map((clientHistoConn) => new ClientHistoPass(clientHistoConn));
    }

    /**
     * Méthode chargé d'aller insérer les informations relatives à un utilisateur passé en paramétre
     * @param  password_hash - l'ancien password hash d'un client
     * @param  idClient - l'id du client lié a l'ancien hash du password
     * @returns - les informations du client_historique_password demandées
     * @async - une méthode asynchrone
     */
    async save() {
        console.log(this);
        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.client_historique_password (password_hash, id_client) VALUES ($1, $2) RETURNING *;`,
            [this.passwordHash, this.idClient]
        );

        this.id = rows[0].id;
        this.createdDate = rows[0].created_date;
        consol.model(
            `l'ancien password hash id ${this.id} avec comme hash ${this.passwordHash} a été inséré à la date du ${this.createdDate} !`
        );
    }

   
    /**
     * Méthode chargé d'aller supprimer un client_historique_password passé en paramétre
     * @param id - l'id d'un client_historique_password
     * @async - une méthode asynchrone
     */
    async delete() {
        const {
            rows
        } = await db.query('DELETE FROM mada.client_historique_password WHERE client_historique_password.id = $1 RETURNING *;', [
            this.id,
        ]);
        consol.model(`l'ancien password hash id ${this.id} a été supprimé !`);

        return new ClientHistoPass(rows[0]);
    }

    /**
     * Méthode chargé d'aller supprimer un client_historique_password passé en paramétre
     * Afin de supprimer plus facilement toute trace d'un client si demande de suppression de compte. A voir si je la garde dans le temps...
     * @param idClient - l'id d'un client d'un historique de connexion
     * @async - une méthode asynchrone
     */
     async deleteByIdClient() {


        const {
            rows
        } = await db.query('DELETE FROM mada.client_historique_password WHERE client_historique_password.id_client = $1 RETURNING *;', [
            this.idClient
        ]);
        consol.model(`l'historique de password du client id ${this.idClient}  a été supprimé !`);
        
        return rows.map((deletedClient) => new ClientHistoPass(deletedClient));
    }


}

module.exports = ClientHistoPass;