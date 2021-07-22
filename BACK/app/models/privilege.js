const db = require('../database');
const consol = require('../services/colorConsole');

class Privilege {

    id;
    nom;
    createdDate;
    updatedDate;



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
     * Méthode chargé d'aller chercher toutes les informations relatives à tous les privileges
     * @returns - tous les privileges présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAll() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.privilege ORDER BY privilege.id ASC');

        if (!rows[0]) {
            throw new Error("Aucun privilege dans la BDD");
        }
        consol.model(
            `les informations des ${rows.length} privileges ont été demandé !`
        );

        return rows.map((privilege) => new Privilege(privilege));
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à un privilege passé en paramétre
     * @param - un id d'un privilege
     * @returns - les informations du privilege demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOne(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.privilege WHERE privilege.id = $1;',
            [id]
        );

        if (!rows[0]) {
            throw new Error("Aucun privilege avec cet id");
        }

        consol.model(
            `le privilege id : ${id} a été demandé en BDD !`
        );

        return new Privilege(rows[0]);
    }


    /**
     * Méthode chargé d'aller insérer les informations relatives à un utilisateur passé en paramétre
     * @param nom - le privilege d'un client
     * @returns - les informations du privilege demandées
     * @async - une méthode asynchrone
     */
    async save() {
        console.log(this);
        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.privilege (nom) VALUES ($1) RETURNING *;`,
            [this.nom]
        );

        this.id = rows[0].id;
        this.createdDate = rows[0].created_date;
        consol.model(
            `le privilege id ${this.id} avec comme nom ${this.nom} a été inséré à la date du ${this.createdDate} !`
        );
    }



    /**
     * Méthode chargé d'aller mettre à jour les informations relatives à un privilege passé en paramétre
     * @param nom - le privilege d'un client
     * @returns - les informations du privilege mis à jour
     * @async - une méthode asynchrone
     */
    async update() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.privilege SET nom = $1, updated_date = now() WHERE id = $2 RETURNING *;`,
            [this.nom, this.id]
        );
        this.updatedDate = rows[0].updated_date;
        console.log(
            `le privilege id : ${this.id} comprenant le nom ${this.nom} a été mise à jour le ${this.updatedDate} !`
        );
    }
    /**
     * Méthode chargé d'aller supprimer un privilege passé en paramétre
     * @param id - l'id d'un privilege
     * @async - une méthode asynchrone
     */
    async delete() {
        const {
            rows
        } = await db.query('DELETE FROM mada.privilege WHERE privilege.id = $1 RETURNING *;', [
            this.id,
        ]);
        consol.model(`le privilege id ${this.id} a été supprimé !`);

        return new Privilege(rows[0]);
    }


}

module.exports = Privilege;