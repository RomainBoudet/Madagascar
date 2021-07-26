const db = require('../database');
const consol = require('../services/colorConsole');

class SsCatImage {

    id;
    nom;
    URL;
    idSousCategorie;


    set id_souscategorie(val) {
        this.idSousCategorie = val;
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
     * Méthode chargé d'aller chercher les informations relatives à toutes les sous_categorie_images
     * @returns - tous les sous_categorie_image présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAll() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.sous_categorie_image ORDER BY sous_categorie_image.id ASC');

        if (!rows[0]) {
            throw new Error("Aucune sous_categorie_image dans la BDD");
        }
        consol.model(
            `les informations des ${rows.length} sous_categorie_images ont été demandées !`
        );

        return rows.map((sous_categorie_image) => new SsCatImage(sous_categorie_image));
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à une sous_categorie_image via son id passée en paramétre
     * @param - un id d'une sous_categorie_image
     * @returns - les informations du sous_categorie_image demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOne(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.sous_categorie_image WHERE sous_categorie_image.id = $1;',
            [id]
        );

        if (!rows[0]) {
            throw new Error("Aucun sous_categorie_image avec cet id");
        }

        consol.model(
            `le sous_categorie_image id : ${id} a été demandé en BDD !`
        );

        return new SsCatImage(rows[0]);
    }



    /**
     * Méthode chargé d'aller chercher les sous_categorie_image relatif à un idProduit passé en paramétre
     * @param idSousCategorie - un id d'une sous_categorie
     * @returns - les informations d'une sous_categorie_image demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findByIdSsCat(idSousCategorie) {

        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.sous_categorie_image WHERE sous_categorie_image.id_sousCategorie = $1;',
            [idSousCategorie]
        );

        if (!rows[0]) {
            throw new Error("Aucun sous_categorie_image avec cette sous categorie");
        }

        consol.model(
            `la sous_categorie_image pour la sous categorie : ${idSousCategorie} a été demandé en BDD !`
        );

        return rows.map((id) => new SsCatImage(id));
    }

    /**
     * Méthode chargé d'aller insérer les informations relatives à une sous_categorie_images passé en paramétre
     * @param nom - 
     * @param URL -  
     * @param idSousCategorie - 
     * @returns - les informations du sous_categorie_image demandées
     * @async - une méthode asynchrone
     */
    async save() {

        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.sous_categorie_image (nom, URL, id_sousCategorie) VALUES ($1, $2, $3) RETURNING *;`,
            [this.nom, this.URL, this.idSousCategorie]
        );

        this.id = rows[0].id;
        consol.model(
            `la sous_categorie_image id ${this.id} avec comme nom ${this.nom} a été inséré pour la sous categorie ${this.idSousCategorie} !`
        );
    }

    /**
     * Méthode chargé d'aller mettre à jour les informations relatives à un sous_categorie_image passé en paramétre
     * @param nom - 
     * @param URL -  
     * @param id - l'identifiant du champs a supprimer
     * @returns - les informations du sous_categorie_image mis à jour
     * @async - une méthode asynchrone
     */
    async update() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.sous_categorie_image SET nom = $1, URL = $2, id_sousCategorie = $3 WHERE id = $4 RETURNING *;`,
            [this.nom, this.URL, this.idSousCategorie, this.id]
        );
        console.log(
            `la sous_categorie_image id ${this.id} a été mis a jour pour la sous categorie ${this.idSousCategorie} !`
        );
    }




    /**
     * Méthode chargé d'aller supprimer un sous_categorie_image passé en paramétre
     * @param id - l'id d'un sous_categorie_image
     * @async - une méthode asynchrone
     */
    async delete() {
        const {
            rows
        } = await db.query('DELETE FROM mada.sous_categorie_image WHERE sous_categorie_image.id = $1 RETURNING *;', [
            this.id,
        ]);
        consol.model(`la sous_categorie_image id ${this.id} a été supprimé !`);

        return new SsCatImage(rows[0]);
    }

    /**
     * Méthode chargé d'aller supprimer une sous_categorie_image via l'idProduit passé en paramétre
     * @param idSousCategorie - l'id d'une sous categorie
     * @returns - les informations du sous_categorie_image qui viennent d'être supprimés.
     * @async - une méthode asynchrone
     */
    async deleteByIdSsCat() {
        const {
            rows
        } = await db.query('DELETE FROM mada.sous_categorie_image WHERE sous_categorie_image.id_sousCategorie = $1 RETURNING *;', [
            this.idSousCategorie
        ]);
        consol.model(`le ou les sous_categorie_image du produit id ${this.idSousCategorie} ont été supprimé !`);

        return rows.map((deletedClient) => new SsCatImage(deletedClient));
    }



}

module.exports = SsCatImage;