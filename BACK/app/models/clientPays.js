const db = require('../database');
const consol = require('../services/colorConsole');

class ClientPays {


    id;
    nom;
    


    /**
     * @constructor
     */
    constructor(data = {}) {
        for (const prop in data) {
            this[prop] = data[prop];
        }
    }

    /**
     * Méthode chargé d'aller chercher toutes les informations relatives à tous les pays des adresses
     * @returns - tous les ClientPayss présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAll() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.pays ORDER BY pays.id ASC');

        if (!rows[0]) {
            throw new Error("Aucune pays dans la BDD");
        }
        consol.model(
            `les informations des ${rows.length} pays ont été demandé !`
        );

        return rows.map((clientPays) => new ClientPays(clientPays));
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à une pays passé en paramétre
     * @param id - un id d'un pays
     * @returns - les informations d'une pays demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOne(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.pays WHERE pays.id = $1;',
            [id]
        );

        if (!rows[0]) {
            throw new Error("Aucun pays avec cet id");
        }

        consol.model(
            `le ClientPays id : ${id} a été demandé en BDD !`
        );

        return new ClientPays(rows[0]);
    }

    

    /**
     * Méthode chargé d'aller insérer les informations relatives à un pays d'une adresse de client 
     * @param nom - nom d'un pays
     * @returns - les informations du ClientPays demandées
     * @async - une méthode asynchrone
     */
    async save() {

        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.pays (nom) VALUES ($1) RETURNING *;`,
            [this.pays]
        );

        this.id = rows[0].id;
        consol.model(
            `la pays id ${this.id} avec comme nom ${this.pays} a été inséré avec succés !`
        );

        return new ClientPays(rows[0]);

    }

    /**
     * Méthode chargé d'aller mettre à jour les informations relatives à un pays passé en paramétre
     * @param nom - nom d'un pays
     * @param id - l'identifiant d'une pays à modifié
     * @returns - les informations du Pays mis à jour
     * @async - une méthode asynchrone
     */
    async update() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.pays SET nom = $1 WHERE id = $2 RETURNING *;`,
            [this.nom, this.id]
        );

        console.log(
            `la pays id : ${this.id} avec le nom ${this.nom} a été mise à jour  !`
        );
    }


    /**
     * Méthode chargé d'aller supprimer une pays via l'id passé en paramétre
     * @param id - l'id d'une adresse
     * @returns - les informations du ClientPays qui viennent d'être supprimés.
     * @async - une méthode asynchrone
     */
    async delete() {
        const {
            rows
        } = await db.query('DELETE FROM mada.pays WHERE pays.id = $1 RETURNING *;', [
            this.id,
        ]);
        consol.model(`la pays id ${this.id} a été supprimé !`);

        return new ClientPays(rows[0]);
    }



}

module.exports = ClientPays;