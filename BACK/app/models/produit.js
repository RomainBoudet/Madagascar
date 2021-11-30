const db = require('../database');
const consol = require('../services/colorConsole');

class Produit {

    id;
    nom;
    description;
    prixHT;
    imageMini;
    createdDate;
    updatedDate;
    idCategorie;
    idTVA;
    idReduction;



    set prix_ht(val) {
        this.prixHT = val;
    }

    set montant_ht(val) {
        this.montantHT = val;
    }

    set created_date(val) {
        this.createdDate = val;
    }

    set updated_date(val) {
        this.updatedDate = val;
    }

    set image_mini(val) {
        this.imageMini = val;
    }

    set id_categorie(val) {
        this.idCategorie = val;
    }

    set id_tva(val) {
        this.idTVA = val;
    }

    set id_reduction(val) {
        this.idReduction = val;
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
     * Méthode chargé d'aller chercher les informations relatives à toutes les produits
     * @returns - tous les produits présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAll() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.view_produit_plus');

        if (!rows[0]) {
          return  null;
        }
        consol.model(
            `les informations des ${rows.length} produits ont été demandées !`
        );

        return rows.map((produit) => new Produit(produit));
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à un produit via son id passée en paramétre
     * @param - un id d'un produit
     * @returns - les informations du produit demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOne(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.view_produit WHERE id = $1;',
            [id]
        );

        if (!rows[0] || rows[0] === undefined) {
            return null;
        }


        consol.model(
            `le produit id : ${id} a été demandé en BDD !`
        );

        return new Produit(rows[0]);
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à un produit via son id passée en paramétre
     * @param - un id d'un produit
     * @returns - les informations du produit demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
     static async findOnePlus(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.view_produit_plus WHERE id = $1;',
            [id]
        );


        if (!rows[0]) {
          return  null;
        }
        consol.model(
            `le produit id : ${id} a été demandé en BDD !`
        );

        return new Produit(rows[0]);
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à un produit via son id passée en paramétre
     * @param - un id d'un produit
     * @returns - les informations du produit demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
     static async findByCategorieId(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.view_categorie WHERE categorie_id = $1;',
            [id]
        );

        if (!rows[0]) {
            return null;
        }
        this.categorie = rows[0].categorie;
        consol.model(
            `les produits avec la catégorie id : ${id} et le nom ${this.categorie} ont été demandé en BDD !`
        );

        return rows.map((categorie) => new Produit(categorie));
    }





    /**
     * Méthode chargé d'aller chercher les informations relatives à un idCategorie passé en paramétre
     * @param idCategorie - un idCategorie d'une produit
     * @returns - les informations d'une produit demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findByIdCategorie(idCategorie) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.produit WHERE produit.id_categorie = $1;',
            [idCategorie]
        );

        if (!rows[0]) {
           return null;
        }
        consol.model(
            `la produit pour le idClient : ${idCategorie} a été demandé en BDD !`
        );

        return rows.map((id) => new Produit(id));
    }

    /**
     * Méthode chargé d'aller insérer les informations relatives à une produits passé en paramétre
     * @param nom - le nom d'une produit
     * @param description - la description d'un produit, 
     * @param prixHT - le prix HT d'un produit,
     * @param imageMini - une image destiné au panier en petit format
     * @param idCategorie - l'identifiant d'une catégorie lié à un produit
     * @param idTVA - l'identifiant d' une TVA lié a un produit
     * @param idReduction - l'identifiant d'une reduction
     * @returns - les informations du produit demandées
     * @async - une méthode asynchrone
     */
    async save() {

        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.produit (nom, description, prix_HT, image_mini, created_date, id_categorie, id_TVA, id_reduction) VALUES ($1, $2, $3, $4, now(), $5, $6, $7) RETURNING *;`,
            [this.nom, this.description, this.prixHT, this.imageMini, this.idCategorie, this.idTVA, this.idReduction]
        );

        this.id = rows[0].id;
        this.createdDate = rows[0].created_date;
        consol.model(
            `le produit id ${this.id} et nom ${this.nom} a été inséré à la date du ${this.createdDate} !`
        );
        return new Produit(rows[0]);

    }

    /**
     * Méthode chargé d'aller mettre à jour les informations relatives à un produit passé en paramétre
     * @param nom - le nom d'une produit
     * @param description - la description d'un produit, 
     * @param prixHT - le prix HT d'un produit,
     * @param imageMini - une image destiné au panier en petit format
     * @param idCategorie - l'identifiant d'une catégorie lié à un produit
     * @param idTVA - l'identifiant d' une TVA lié a un produit
     * @param id - l'identifiant du champs a supprimer
     * @param idReduction - l'identifiant d'une reduction
     * @returns - les informations du produit mis à jour
     * @async - une méthode asynchrone
     */
    async update() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.produit SET nom = $1, description = $2, updated_date = now(), prix_HT = $3, image_mini = $4, id_categorie = $5, id_TVA = $6, id_reduction = $7  WHERE id = $8 RETURNING *;`,
            [this.nom, this.description, this.prixHT, this.imageMini, this.idCategorie, this.idTVA, this.idReduction, this.id]
        );
        this.updatedDate = rows[0].updated_date;
        console.log(
            `le produit  id : ${this.id} avec le nom : ${this.nom} a été mise à jour le ${this.updatedDate} !`
        );
        return new Produit(rows[0]);

    }




    /**
     * Méthode chargé d'aller supprimer un produit passé en paramétre
     * @param id - l'id d'un produit
     * @async - une méthode asynchrone
     */
    async delete() {
        const {
            rows
        } = await db.query('DELETE FROM mada.produit WHERE produit.id = $1 RETURNING *;', [
            this.id,
        ]);
        consol.model(`le produit id ${this.id} a été supprimé (avec son produit image, ses avis, son stock, ses caractéristiques, ses lignes_panier, ses ligne_commandes, déduit et fournie) !`);

        return new Produit(rows[0]);
    }



}

module.exports = Produit;