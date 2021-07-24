const db = require('../database');
const consol = require('../services/colorConsole');

class ClientCodePostal {


    id;
    codePostal;

    set code_postal(val) {
        this.codePostal = val;
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
     * Méthode chargé d'aller chercher toutes les informations relatives à tous les code_postal des villes
     * @returns - tous les ClientCodePostals présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAll() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.code_postal ORDER BY code_postal.id ASC');

        if (!rows[0]) {
            throw new Error("Aucune code_postal dans la BDD");
        }
        consol.model(
            `les informations des ${rows.length} code_postal ont été demandé !`
        );

        return rows.map((clientCodePostal) => new ClientCodePostal(clientCodePostal));
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à une code_postal passé en paramétre
     * @param id - un id d'un code_postal
     * @returns - les informations d'une code_postal demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOne(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.code_postal WHERE code_postal.id = $1;',
            [id]
        );

        if (!rows[0]) {
            throw new Error("Aucun code_postal avec cet id");
        }

        consol.model(
            `le ClientCodePostal id : ${id} a été demandé en BDD !`
        );

        return new ClientCodePostal(rows[0]);
    }

    

    /**
     * Méthode chargé d'aller insérer les informations relatives à un code_postal d'une adresse de client 
     * @param codePostal - nom d'un code_postal
     * @returns - les informations du ClientCodePostal demandées
     * @async - une méthode asynchrone
     */
    async save() {

        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.code_postal (code_postal) VALUES ($1) RETURNING *;`,
            [this.codePostal]
        );

        this.id = rows[0].id;
        consol.model(
            `le code_postal id ${this.id} avec comme valeur ${this.codePostal} a été inséré avec succés !`
        );
    }

    /**
     * Méthode chargé d'aller mettre à jour les informations relatives à un code_postal passé en paramétre
     * @param nom - nom d'un code_postal
     * @param id - l'identifiant d'une code_postal à modifié
     * @returns - les informations du Pays mis à jour
     * @async - une méthode asynchrone
     */
    async update() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.code_postal SET code_postal = $1 WHERE id = $2 RETURNING *;`,
            [this.codePostal, this.id]
        );

        console.log(
            `le code_postal id : ${this.id} avec le nom ${this.codePostal} a été mise à jour  !`
        );
    }


    /**
     * Méthode chargé d'aller supprimer une code_postal via l'id passé en paramétre
     * @param id - l'id d'une adresse
     * @returns - les informations du ClientCodePostal qui viennent d'être supprimés.
     * @async - une méthode asynchrone
     */
    async delete() {
        const {
            rows
        } = await db.query('DELETE FROM mada.code_postal WHERE code_postal.id = $1 RETURNING *;', [
            this.id,
        ]);
        consol.model(`le code_postal id ${this.id} a été supprimé !`);

        return new ClientCodePostal(rows[0]);
    }



}

module.exports = ClientCodePostal;