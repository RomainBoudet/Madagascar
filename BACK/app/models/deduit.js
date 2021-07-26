const db = require('../database');
const consol = require('../services/colorConsole');

class Deduit {


    id;
    idReduction;
    idProduit;

    set id_reduction(val) {
        this.idReduction = val;
    }

    set id_produit(val) {
        this.idProduit = val;
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
     * Méthode chargé d'aller chercher toutes les informations relatives à la table de liaison deduit
     * @returns - tous les Deduits présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAll() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.deduit ORDER BY deduit.id ASC');

        if (!rows[0]) {
            throw new Error("Aucune deduit dans la BDD");
        }
        consol.model(
            `les informations des ${rows.length} deduit ont été demandé !`
        );

        return rows.map((ldeduit) => new Deduit(ldeduit));
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à une deduit passé en paramétre
     * @param id - un id d'un deduit
     * @returns - les informations d'une deduit demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOne(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.deduit WHERE deduit.id = $1;',
            [id]
        );

        if (!rows[0]) {
            throw new Error("Aucun deduit avec cet id");
        }

        consol.model(
            `le champs de liaison deduit id : ${id} a été demandé en BDD !`
        );

        return new Deduit(rows[0]);
    }

    

    /**
     * Méthode chargé d'aller insérer les informations relatives à une déduction  
     * @param idReduction - 
     * @param idProduit - 
     * @returns - les informations du Deduit demandées
     * @async - une méthode asynchrone
     */
    async save() {

        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.deduit (id_reduction, id_produit) VALUES ($1, $2) RETURNING *;`,
            [this.idReduction, this.idProduit]
        );

        this.id = rows[0].id;
        consol.model(
            `le champs de liaison deduit id ${this.id} avec comme idReduction ${this.idReduction} a été inséré avec succés !`
        );
    }

    /**
     * Méthode chargé d'aller mettre à jour les informations relatives à une deduction
    * @param idReduction -
     * @param idProduit -
     * @param id - l'identifiant d'une deduit à modifié
     * @returns - les informations du Pays mis à jour
     * @async - une méthode asynchrone
     */
    async update() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.deduit SET id_reduction = $1, id_produit = $2 WHERE id = $3 RETURNING *;`,
            [this.idReduction, this.idProduit, this.id]
        );

        console.log(
            `le champs de liaison deduit id : ${this.id} avec l'idReduction ${this.idReduction} a été mise à jour  !`
        );
    }


    /**
     * Méthode chargé d'aller supprimer une deduit via l'id passé en paramétre
     * @param id - l'id d'une adresse
     * @returns - les informations du Deduit qui viennent d'être supprimés.
     * @async - une méthode asynchrone
     */
    async delete() {
        const {
            rows
        } = await db.query('DELETE FROM mada.deduit WHERE deduit.id = $1 RETURNING *;', [
            this.id,
        ]);
        consol.model(`le champs de liaison deduit id ${this.id} a été supprimé !`);

        return new Deduit(rows[0]);
    }



}

module.exports = Deduit;