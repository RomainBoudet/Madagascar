const db = require('../database');
const consol = require('../services/colorConsole');

class Fournie {


    id;
    idFournisseur;
    idProduit;

    set id_fournisseur(val) {
        this.idFournisseur = val;
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
     * Méthode chargé d'aller chercher toutes les informations relatives à la table de liaison fournie
     * @returns - tous les Fournies présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAll() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.fournie ORDER BY fournie.id ASC');

        if (!rows[0]) {
            throw new Error("Aucune fournie dans la BDD");
        }
        consol.model(
            `les informations des ${rows.length} fournie ont été demandé !`
        );

        return rows.map((lfournie) => new Fournie(lfournie));
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à un fournie passé en paramétre
     * @param id - un id d'un fournie
     * @returns - les informations d'une fournie demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOne(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.fournie WHERE fournie.id = $1;',
            [id]
        );

        if (!rows[0]) {
            throw new Error("Aucun fournie avec cet id");
        }

        consol.model(
            `le champs de liaison fournie id : ${id} a été demandé en BDD !`
        );

        return new Fournie(rows[0]);
    }

    

    /**
     * Méthode chargé d'aller insérer les informations relatives à un fournie qui va lié fournisseur a produit
     * @param idFournisseur - 
     * @param idProduit -
     * @returns - les informations du Fournie demandées
     * @async - une méthode asynchrone
     */
    async save() {

        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.fournie (id_fournisseur, id_produit) VALUES ($1, $2) RETURNING *;`,
            [this.idFournisseur, this.idProduit]
        );

        this.id = rows[0].id;
        consol.model(
            `le champs de liaison fournie id ${this.id} avec comme idFournisseur ${this.idFournisseur} a été inséré avec succés !`
        );
    }

    /**
     * Méthode chargé d'aller mettre à jour les informations relatives à un fournie passé en paramétre
    * @param idFournisseur - 
     * @param idProduit -
     * @param id - l'identifiant d'une fournie à modifié
     * @returns - les informations du Pays mis à jour
     * @async - une méthode asynchrone
     */
    async update() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.fournie SET id_fournisseur = $1, id_produit = $2 WHERE id = $3 RETURNING *;`,
            [this.idFournisseur, this.idProduit, this.id]
        );

        console.log(
            `le champs de liaison fournie id : ${this.id} avec l'idFournisseur ${this.idFournisseur} a été mise à jour  !`
        );
    }


    /**
     * Méthode chargé d'aller supprimer une fournie via l'id passé en paramétre
     * @param id - l'id d'une adresse
     * @returns - les informations du Fournie qui viennent d'être supprimés.
     * @async - une méthode asynchrone
     */
    async delete() {
        const {
            rows
        } = await db.query('DELETE FROM mada.fournie WHERE fournie.id = $1 RETURNING *;', [
            this.id,
        ]);
        consol.model(`le champs de liaison fournie id ${this.id} a été supprimé !`);

        return new Fournie(rows[0]);
    }



}

module.exports = Fournie;