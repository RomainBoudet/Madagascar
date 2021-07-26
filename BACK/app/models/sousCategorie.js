const db = require('../database');
const consol = require('../services/colorConsole');

class SousCategorie {

    id;
    nom;
    description;
    titre;
    createdDate;
    updatedDate;
    idCategorie;



    set created_date(val) {
        this.createdDate = val;
    }

    set updated_date(val) {
        this.updatedDate = val;
    }

    set id_categorie(val) {
        this.idCategorie = val;
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
     * Méthode chargé d'aller chercher les informations relatives à toutes les sous_categories
     * @returns - tous les sous_categorie présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAll() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.sous_categorie ORDER BY sous_categorie.id ASC');

        if (!rows[0]) {
            throw new Error("Aucun sous_categorie dans la BDD");
        }
        consol.model(
            `les informations des ${rows.length} sous_categories ont été demandées !`
        );

        return rows.map((sous_categorie) => new SousCategorie(sous_categorie));
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à une sous_categorie via son id passée en paramétre
     * @param - un id d'une sous_categorie
     * @returns - les informations du sous_categorie demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOne(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.sous_categorie WHERE sous_categorie.id = $1;',
            [id]
        );

        if (!rows[0]) {
            throw new Error("Aucun sous_categorie avec cet id");
        }

        consol.model(
            `le sous_categorie id : ${id} a été demandé en BDD !`
        );

        return new SousCategorie(rows[0]);
    }



    /**
     * Méthode chargé d'aller chercher les sous_categorie relatif à un idProduit passé en paramétre
     * @param idCategorie - un idProduit d'un sous_categorie
     * @returns - les informations d'une sous_categorie demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findByIdCategorie(idCategorie) {

        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.sous_categorie WHERE sous_categorie.id_categorie = $1;',
            [idCategorie]
        );

        if (!rows[0]) {
            throw new Error("Aucun sous_categorie avec cet idCategorie");
        }

        consol.model(
            `la sous_categorie pour le idCategorie : ${idCategorie} a été demandé en BDD !`
        );

        return rows.map((id) => new SousCategorie(id));
    }

    /**
     * Méthode chargé d'aller insérer les informations relatives à une sous_categories passé en paramétre
     * @param nom -
     * @param description
     * @param idCategorie - 
     * @returns - les informations du sous_categorie demandées
     * @async - une méthode asynchrone
     */
    async save() {

        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.sous_categorie (nom, description, created_date, id_categorie) VALUES ($1, $2, now(), $3) RETURNING *;`,
            [this.nom, this.description, this.idCategorie]
        );

        this.id = rows[0].id;
        this.createdDate = rows[0].created_date;
        consol.model(
            `la sous_categorie id ${this.id} a été inséré à la date du ${this.createdDate} pour la categorie id ${this.idCategorie} avec le nom ${this.nom} !`
        );
    }

    /**
     * Méthode chargé d'aller mettre à jour les informations relatives à un sous_categorie passé en paramétre
     * @param nom -
     * @param description  
     * @param idCategorie -  
     * @param id - l'identifiant du champs a supprimer
     * @returns - les informations du sous_categorie mis à jour
     * @async - une méthode asynchrone
     */
    async update() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.sous_categorie SET nom = $1, description = $2, updated_date = now(), id_categorie = $3  WHERE id = $4 RETURNING *;`,
            [this.nom, this.description, this.idCategorie, this.id]
        );
        this.updatedDate = rows[0].updated_date;
        console.log(
            `la sous_categorie id ${this.id} a été mis a jour à la date du ${this.createdDate} pour la categorie id ${this.idCategorie} avec le nom ${this.nom} !`
        );
    }




    /**
     * Méthode chargé d'aller supprimer un sous_categorie passé en paramétre
     * @param id - l'id d'un sous_categorie
     * @async - une méthode asynchrone
     */
    async delete() {
        const {
            rows
        } = await db.query('DELETE FROM mada.sous_categorie WHERE sous_categorie.id = $1 RETURNING *;', [
            this.id,
        ]);
        consol.model(`le sous_categorie id ${this.id} a été supprimé !`);

        return new SousCategorie(rows[0]);
    }

    /**
     * Méthode chargé d'aller supprimer une sous_categorie via l'idCategorie passé en paramétre
     * @param idCategorie - l'id d'un client
     * @returns - les informations d'une sous_categorie qui viennent d'être supprimés.
     * @async - une méthode asynchrone
     */
    async deleteByIdCategorie() {
        const {
            rows
        } = await db.query('DELETE FROM mada.sous_categorie WHERE sous_categorie.id_categorie = $1 RETURNING *;', [
            this.idCategorie
        ]);
        consol.model(`le ou les sous_categorie du client id ${this.idCategorie} ont été supprimé !`);

        return rows.map((deletedProduit) => new SousCategorie(deletedProduit));
    }



}

module.exports = SousCategorie;