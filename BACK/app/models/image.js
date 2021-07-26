const db = require('../database');
const consol = require('../services/colorConsole');

class Image {

    id;
    nom;
    ordre;
    URL;
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
     * Méthode chargé d'aller chercher les informations relatives à toutes les images
     * @returns - tous les image présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAll() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.image ORDER BY image.id ASC');

        if (!rows[0]) {
            throw new Error("Aucun image dans la BDD");
        }
        consol.model(
            `les informations des ${rows.length} images ont été demandées !`
        );

        return rows.map((image) => new Image(image));
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à une image via son id passée en paramétre
     * @param - un id d'une image
     * @returns - les informations du image demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOne(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.image WHERE image.id = $1;',
            [id]
        );

        if (!rows[0]) {
            throw new Error("Aucun image avec cet id");
        }

        consol.model(
            `le image id : ${id} a été demandé en BDD !`
        );

        return new Image(rows[0]);
    }



    /**
     * Méthode chargé d'aller chercher les image relatif à un idProduit passé en paramétre
     * @param idProduit - un idProduit d'un image
     * @returns - les informations d'une image demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findByIdProduit(idProduit) {

        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.image WHERE image.id_produit = $1;',
            [idProduit]
        );

        if (!rows[0]) {
            throw new Error("Aucun image avec cet idProduit");
        }

        consol.model(
            `la image pour le idProduit : ${idProduit} a été demandé en BDD !`
        );

        return rows.map((id) => new Image(id));
    }

    /**
     * Méthode chargé d'aller insérer les informations relatives à une images passé en paramétre
     * @param nom -
     * @param ordre - 
     * @param URL -  
     * @param idProduit - 
     * @returns - les informations du image demandées
     * @async - une méthode asynchrone
     */
    async save() {

        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.image (nom, ordre, URL, created_date, id_produit) VALUES ($1, $2, $3, now(), $4) RETURNING *;`,
            [this.nom, this.ordre, this.URL, this.idProduit]
        );

        this.id = rows[0].id;
        this.createdDate = rows[0].created_date;
        consol.model(
            `la image id ${this.id} a été inséré à la date du ${this.createdDate} pour le produit id ${this.idProduit} !`
        );
    }

    /**
     * Méthode chargé d'aller mettre à jour les informations relatives à un image passé en paramétre
     * @param nom -
     * @param ordre -  
     * @param idProduit -  
     * @param id - l'identifiant du champs a supprimer
     * @returns - les informations du image mis à jour
     * @async - une méthode asynchrone
     */
    async update() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.image SET nom = $1, ordre = $2, URL = $3, updated_date = now(), id_produit = $4 WHERE id = $5 RETURNING *;`,
            [this.nom, this.ordre, this.URL, this.idProduit, this.id]
        );
        this.updatedDate = rows[0].updated_date;
        console.log(
            `la image id ${this.id} a été mis a jour à la date du ${this.updatedDate} pour le produit id ${this.idProduit} !`
        );
    }




    /**
     * Méthode chargé d'aller supprimer un image passé en paramétre
     * @param id - l'id d'un image
     * @async - une méthode asynchrone
     */
    async delete() {
        const {
            rows
        } = await db.query('DELETE FROM mada.image WHERE image.id = $1 RETURNING *;', [
            this.id,
        ]);
        consol.model(`la image id ${this.id} a été supprimé !`);

        return new Image(rows[0]);
    }

    /**
     * Méthode chargé d'aller supprimer une image via l'idProduit passé en paramétre
     * @param idProduit - l'id d'un produit
     * @returns - les informations du image qui viennent d'être supprimés.
     * @async - une méthode asynchrone
     */
    async deleteByIdProduit() {
        const {
            rows
        } = await db.query('DELETE FROM mada.image WHERE image.id_produit = $1 RETURNING *;', [
            this.idProduit
        ]);
        consol.model(`le ou les image du produit id ${this.idProduit} ont été supprimé !`);

        return rows.map((deletedClient) => new Image(deletedClient));
    }



}

module.exports = Image;