const db = require('../database');
const consol = require('../services/colorConsole');

class Caracteristique {

    id;
    couleur;
    taille;
    createdDate;
    updatedDate;
    idProduit;




    set created_date(val) {
        this.createdDate = val;
    }

    set updated_date(val) {
        this.updatedDate = val;
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
     * Méthode chargé d'aller chercher les informations relatives à toutes les caracteristiques
     * @returns - tous les caracteristique présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAll() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.caracteristique ORDER BY caracteristique.id ASC');

        if (!rows[0]) {
            throw new Error("Aucun caracteristique dans la BDD");
        }
        consol.model(
            `les informations des ${rows.length} caracteristiques ont été demandées !`
        );

        return rows.map((caracteristique) => new Caracteristique(caracteristique));
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à une caracteristique via son id passée en paramétre
     * @param - un id d'une caracteristique
     * @returns - les informations du caracteristique demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOne(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.caracteristique WHERE caracteristique.id = $1;',
            [id]
        );

        if (!rows[0]) {
            throw new Error("Aucun caracteristique avec cet id");
        }

        consol.model(
            `le caracteristique id : ${id} a été demandé en BDD !`
        );

        return new Caracteristique(rows[0]);
    }



    /**
     * Méthode chargé d'aller chercher les caracteristique relatif à un idProduit passé en paramétre
     * @param idProduit - un idProduit d'un caracteristique
     * @returns - les informations d'une caracteristique demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findByIdProduit(idProduit) {

        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.caracteristique WHERE caracteristique.id_produit = $1;',
            [idProduit]
        );

        if (!rows[0]) {
            throw new Error("Aucun caracteristique avec cet idProduit");
        }

        consol.model(
            `la caracteristique pour le idProduit : ${idProduit} a été demandé en BDD !`
        );

        return rows.map((id) => new Caracteristique(id));
    }

    /**
     * Méthode chargé d'aller insérer les informations relatives à une caracteristiques passé en paramétre
     * @param couleur -
     * @param taille -  
     * @param idProduit - 
     * @returns - les informations du caracteristique demandées
     * @async - une méthode asynchrone
     */
    async save() {

        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.caracteristique (couleur, taille, created_date, id_produit) VALUES ($1, $2, now(), $3) RETURNING *;`,
            [this.couleur, this.taille, this.idProduit]
        );

        this.id = rows[0].id;
        this.createdDate = rows[0].created_date;
        consol.model(
            `la caracteristique id ${this.id} a été inséré à la date du ${this.createdDate} pour le produit id ${this.idProduit} !`
        );
    }

    /**
     * Méthode chargé d'aller mettre à jour les informations relatives à un caracteristique passé en paramétre
     * @param couleur -
     * @param taille -  
     * @param idProduit -  
     * @param id - l'identifiant du champs a supprimer
     * @returns - les informations du caracteristique mis à jour
     * @async - une méthode asynchrone
     */
    async update() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.caracteristique SET couleur = $1, taille = $2, updated_date = now(), id_produit = $3 WHERE id = $4 RETURNING *;`,
            [this.couleur, this.taille, this.idProduit, this.id]
        );
        this.updatedDate = rows[0].updated_date;
        console.log(
            `la caracteristique id ${this.id} a été mis a jour à la date du ${this.updatedDate} pour le produit id ${this.idProduit} !`
        );
    }




    /**
     * Méthode chargé d'aller supprimer un caracteristique passé en paramétre
     * @param id - l'id d'un caracteristique
     * @async - une méthode asynchrone
     */
    async delete() {
        const {
            rows
        } = await db.query('DELETE FROM mada.caracteristique WHERE caracteristique.id = $1 RETURNING *;', [
            this.id,
        ]);
        consol.model(`la caracteristique id ${this.id} a été supprimé !`);

        return new Caracteristique(rows[0]);
    }

    /**
     * Méthode chargé d'aller supprimer une caracteristique via l'idProduit passé en paramétre
     * @param idProduit - l'id d'un produit
     * @returns - les informations du caracteristique qui viennent d'être supprimés.
     * @async - une méthode asynchrone
     */
    async deleteByIdProduit() {
        const {
            rows
        } = await db.query('DELETE FROM mada.caracteristique WHERE caracteristique.id_produit = $1 RETURNING *;', [
            this.idProduit
        ]);
        consol.model(`le ou les caracteristique du produit id ${this.idProduit} ont été supprimé !`);

        return rows.map((deletedClient) => new Caracteristique(deletedClient));
    }



}

module.exports = Caracteristique;