const db = require('../database');
const consol = require('../services/colorConsole');

class Twillio {

    id;
    twillioNumber;
    devNumber;
    clientNumber;
    accountSid;
    authToken;
    sidVerify;
    createdDate;
    updatedDate;





    set twillio_number(val) {
        this.twillioNumber = val;
    }
    set dev_number(val) {
        this.devNumber = val;
    }
    set client_number(val) {
        this.clientNumber = val;
    }
    set account_sid(val) {
        this.accountSid = val;
    }
    set auth_token(val) {
        this.authToken = val;
    }
    set sid_verify(val) {
        this.sidVerify = val;
    }
    set created_date(val) {
        this.createdDate = val;
    }
    set updated_date(val) {
        this.updatedDate = val;
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
     * Méthode chargé d'aller chercher les informations relatives à toutes les infos twillios
     * @returns - tous les twillio présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAll() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.twillio ORDER BY twillio.id ASC');

        if (!rows[0]) {
            throw new Error("Aucun twillio dans la BDD");
        }
        consol.model(
            `les informations des ${rows.length} twillios ont été demandées !`
        );

        return rows.map((twillio) => new Twillio(twillio));
    }

    /**
     * Méthode chargé d'aller chercher les informations relatives la premiére info twillio
     * @returns - la 1ére info twillio présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findFirst() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.twillio ORDER BY twillio.id ASC LIMIT 1');

        if (!rows[0]) {
            throw new Error("Aucun twillio dans la BDD");
        }
        this.id = rows[0].id;
        consol.model(
            `la première info avec l'id ${this.id} a été demandées !`
        );

        return new Twillio(rows[0]);
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à une info twillio via son id passée en paramétre
     * @param - un id d'une twillio
     * @returns - les informations du twillio demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOne(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.twillio WHERE twillio.id = $1;',
            [id]
        );

        if (!rows[0]) {
            throw new Error("Aucun twillio avec cet id");
        }

        consol.model(
            `le twillio id : ${id} a été demandé en BDD !`
        );

        return new Twillio(rows[0]);
    }


    /**
     * Méthode chargé d'aller insérer les informations relatives à une twillios passé en paramétre
     * @param quantite - 
     * @param idProduit - 
     * @returns - les informations du twillio demandées
     * @async - une méthode asynchrone
     */
    async save() {

        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.twillio (twillio_number, dev_number, client_number, account_sid, auth_token, sid_verify, created_date) VALUES ($1, $2, $3, $4, $5, $6, now()) RETURNING *;`,
            [this.twillioNumber, this.devNumber, this.clientNumber, this.accountSid, this.authToken, this.sidVerify]
        );

        this.id = rows[0].id;
        this.createdDate = rows[0].created_date;
        consol.model(
            `la twillio id ${this.id} a été inséré à la date du ${this.createdDate} !`
        );
    }

    /**
     * Méthode chargé d'aller mettre à jour les informations relatives à des infos twillio passé en paramétre
     * @param twillioNumber -
     * @param devNumber - 
     * @param clientNumber -
     * @param accountSid -
     * @param authToken -
     * @param sidVerify -
     * @param id - l'identifiant du champs a mettre a jour
     * @returns - les informations du twillio mis à jour
     * @async - une méthode asynchrone
     */
    async update() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.twillio SET twillio_number = $1, dev_number = $2, client_number = $3, account_sid = $4, auth_token = $5, sid_verify = $6, updated_date = now() WHERE id = $7  RETURNING *;`,
            [this.twillioNumber, this.devNumber, this.clientNumber, this.accountSid, this.authToken, this.sidVerify, this.id]
        );
        this.updatedDate = rows[0].updated_date;
        console.log(
            `l'info twillio id ${this.id} a été mis a jour à la date du ${this.updatedDate} !`
        );
        return new Twillio(rows[0]);

    }


    /**
     * Méthode chargé d'aller mettre à jour uniquement le numéro de téléphone du client pour un accés admin.
     * @param clientNumber -
     * @param id - l'identifiant du champs a mettre a jour
     * @returns - les informations du twillio mis à jour
     * @async - une méthode asynchrone
     */
    async updateClientNumber() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.twillio SET client_number = $1, updated_date = now() WHERE id = $2  RETURNING *;`,
            [this.clientNumber, this.id]
        );
        this.updatedDate = rows[0].updated_date;
        console.log(
            `l'info twillio id ${this.id} a été mis a jour à la date du ${this.updatedDate} !`
        );
        return new Twillio(rows[0]);

    }


    /**
     * Méthode chargé d'aller supprimer un twillio passé en paramétre
     * @param id - l'id d'un twillio
     * @async - une méthode asynchrone
     */
    async delete() {
        const {
            rows
        } = await db.query('DELETE FROM mada.twillio WHERE twillio.id = $1 RETURNING *;', [
            this.id,
        ]);
        consol.model(`l'info twillio id ${this.id} a été supprimé !`);

        return new Twillio(rows[0]);
    }



}

module.exports = Twillio;