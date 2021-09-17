const db = require('../database');
const consol = require('../services/colorConsole');

class LignePanier {

    id;
    quantite;
    createdDate;
    updatedDate;
    idProduit;
    idPanier;


    set created_date(val) {
        this.createdDate = val;
    }
    set updated_date(val) {
        this.updatedDate = val;
    }
    set id_produit(val) {
        this.idProduit = val;
    }
    set id_panier(val) {
        this.idPanier = val;
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
     * Méthode chargé d'aller chercher les informations relatives à tous les ligne_paniers
     * @returns - tous les ligne_paniers présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAll() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.ligne_panier ORDER BY ligne_panier.id ASC');

        if (!rows[0]) {
            throw new Error("Aucun ligne_paniers dans la BDD");
        }
        consol.model(
            `les informations des ${rows.length} ligne_paniers ont été demandées !`
        );

        return rows.map((ligne_panier) => new LignePanier(ligne_panier));
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à une ligne_panier via son id passée en paramétre
     * @param - un id d'une ligne_panier
     * @returns - les informations d'une ligne_panier demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOne(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.ligne_panier WHERE ligne_panier.id = $1;',
            [id]
        );

        if (!rows[0]) {
            throw new Error("Aucune ligne_panier avec cet id");
        }

        consol.model(
            `la ligne_panier id : ${id} a été demandé en BDD !`
        );

        return new LignePanier(rows[0]);
    }



    /**
     * Méthode chargé d'aller chercher les informations relatives à un idPanier passé en paramétre
     * @param idPanier - un idPanier d'une ligne_panier
     * @returns - les informations d'une ligne_panier demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findByIdPanier(idPanier) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.ligne_panier WHERE ligne_panier.id_panier = $1;',
            [idPanier]
        );

        if (!rows[0]) {
            throw new Error("Aucune ligne_panier avec cet idPanier");
        }

        consol.model(
            `la ligne_panier avec l'idPanier : ${idPanier} a été demandé en BDD !`
        );

        return rows.map((id) => new LignePanier(id));
    }

    /**
     * Méthode chargé d'aller insérer les informations relatives à une ligne_panier passé en paramétre
     * @param quantite - la quantité d'un produit dans la ligne de panier
     * @param idProduit - l'identifiant d'une ligne de commande
     * @param IdPanier - l'identifiant d'une panier
     * @returns - les informations du ligne_panier demandées
     * @async - une méthode asynchrone
     */
    async save() {

        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.ligne_panier (quantite, created_date, id_produit, id_panier) VALUES ($1, now(), $2, $3) RETURNING *;`,
            [this.quantite, this.idProduit, this.idPanier]
        );

        this.id = rows[0].id;
        this.createdDate = rows[0].created_date;
        consol.model(
            `la ligne_panier id ${this.id} avec comme quantité ${this.quantitePanier} lié au panier id ${this.idPanier} à bien été inséré le ${this.createdDate} !`
        );
    }

    /**
     * Méthode chargé d'aller mettre à jour les informations relatives à une ligne_panier passé en paramétre
     * @param quantite - la quantité d'un produit dans la ligne de panier
     * @param idProduit - l'identifiant d'une ligne de commande
     * @param IdPanier - l'identifiant d'une panier
     * @param id - l'identifiant du champs a mettre a jour
     * @returns - les informations du ligne_panier mis à jour
     * @async - une méthode asynchrone
     */
    async update() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.ligne_panier SET quantite = $1, updated_date = now(), id_produit = $2, id_panier = $3  WHERE id = $4 RETURNING *;`,
            [this.quantite, this.idProduit, this.idPanier, this.id]
        );
        this.updatedDate = rows[0].updated_date;
        console.log(
            `la ligne_panier id ${this.id} avec comme quantité ${this.quantite} lié au panier id ${this.idPanier} à bien été mis a jour le ${this.updatedDate} !`
        );
    }



    /**
     * Méthode chargé d'aller supprimer un ligne_panier passé en paramétre
     * @param id - l'id d'un ligne_panier
     * @async - une méthode asynchrone
     */
    async delete() {
        const {
            rows
        } = await db.query('DELETE FROM mada.ligne_panier WHERE ligne_panier.id = $1 RETURNING *;', [
            this.id,
        ]);
        consol.model(`la ligne_panier id ${this.id} a été supprimé !`);

        return new LignePanier(rows[0]);
    }

    /**
     * Méthode chargé d'aller supprimer toutes les ligne_panier lié a un id d'une panier passé en paramétre
     * @param idPanier - l'id d'une ligne_panier
     * @returns - les informations des ligne_panier qui viennent d'être supprimés.
     * @async - une méthode asynchrone
     */
    async deleteByIdPanier() {
        const {
            rows
        } = await db.query('DELETE FROM mada.ligne_panier WHERE ligne_panier.id_panier = $1 RETURNING *;', [
            this.idPanier
        ]);


        consol.model(`la ou les ligne_paniers avec l'idPanier ${this.idPanier} ont été supprimé !`);

        return rows.map((deletedLignePanier) => new LignePanier(deletedLignePanier));
    }



}

module.exports = LignePanier;