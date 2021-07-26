const db = require('../database');
const consol = require('../services/colorConsole');

class CategorieImage {

    id;
    nom;
    URL;
    idCategorie;


    set id_categorie(val) {
        this.idCategorie = val;
    }

    set url(val) {
        this.URL = val;
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
     * Méthode chargé d'aller chercher les informations relatives à toutes les categorie_images
     * @returns - tous les categorie_image présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAll() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.categorie_image ORDER BY categorie_image.id ASC');

        if (!rows[0]) {
            throw new Error("Aucune categorie_image dans la BDD");
        }
        consol.model(
            `les informations des ${rows.length} categorie_images ont été demandées !`
        );

        return rows.map((categorie_image) => new CategorieImage(categorie_image));
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à une categorie_image via son id passée en paramétre
     * @param - un id d'une categorie_image
     * @returns - les informations du categorie_image demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOne(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.categorie_image WHERE categorie_image.id = $1;',
            [id]
        );

        if (!rows[0]) {
            throw new Error("Aucun categorie_image avec cet id");
        }

        consol.model(
            `le categorie_image id : ${id} a été demandé en BDD !`
        );

        return new CategorieImage(rows[0]);
    }



    /**
     * Méthode chargé d'aller chercher les categorie_image relatif à un idProduit passé en paramétre
     * @param idSousCategorie - un id d'une sous_categorie
     * @returns - les informations d'une categorie_image demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findByIdCategorie(idCategorie) {

        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.categorie_image WHERE categorie_image.id_categorie = $1;',
            [idCategorie]
        );

        if (!rows[0]) {
            throw new Error("Aucun categorie_image avec cette sous categorie");
        }

        consol.model(
            `la categorie_image pour la sous categorie : ${idCategorie} a été demandé en BDD !`
        );

        return rows.map((id) => new CategorieImage(id));
    }

    /**
     * Méthode chargé d'aller insérer les informations relatives à une categorie_images passé en paramétre
     * @param nom - 
     * @param URL -  
     * @param idCategorie - 
     * @returns - les informations du categorie_image demandées
     * @async - une méthode asynchrone
     */
    async save() {

        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.categorie_image (nom, URL, id_categorie) VALUES ($1, $2, $3) RETURNING *;`,
            [this.nom, this.URL, this.idCategorie]
        );

        this.id = rows[0].id;
        consol.model(
            `la categorie_image id ${this.id} avec comme nom ${this.nom} a été inséré pour la categorie ${this.idCategorie} !`
        );
    }

    /**
     * Méthode chargé d'aller mettre à jour les informations relatives à un categorie_image passé en paramétre
     * @param nom - 
     * @param URL -  
     * @param idCategorie - 
     * @param id - l'identifiant du champs a supprimer
     * @returns - les informations du categorie_image mis à jour
     * @async - une méthode asynchrone
     */
    async update() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.categorie_image SET nom = $1, URL = $2, id_categorie = $3 WHERE id = $4 RETURNING *;`,
            [this.nom, this.URL, this.idCategorie, this.id]
        );
        console.log(
            `la categorie_image id ${this.id} a été mis a jour pour la sous categorie ${this.idSousCategorie} !`
        );
    }




    /**
     * Méthode chargé d'aller supprimer un categorie_image passé en paramétre
     * @param id - l'id d'un categorie_image
     * @async - une méthode asynchrone
     */
    async delete() {
        const {
            rows
        } = await db.query('DELETE FROM mada.categorie_image WHERE categorie_image.id = $1 RETURNING *;', [
            this.id,
        ]);
        consol.model(`la categorie_image id ${this.id} a été supprimé !`);

        return new CategorieImage(rows[0]);
    }

    /**
     * Méthode chargé d'aller supprimer une categorie_image via l'idProduit passé en paramétre
     * @param idCategorie - l'id d'une sous categorie
     * @returns - les informations du categorie_image qui viennent d'être supprimés.
     * @async - une méthode asynchrone
     */
    async deleteByIdCategorie() {
        const {
            rows
        } = await db.query('DELETE FROM mada.categorie_image WHERE categorie_image.id_categorie = $1 RETURNING *;', [
            this.idCategorie
        ]);
        consol.model(`le ou les categorie_image du produit id ${this.idCategorie} ont été supprimé !`);

        return rows.map((deletedClient) => new CategorieImage(deletedClient));
    }



}

module.exports = CategorieImage;