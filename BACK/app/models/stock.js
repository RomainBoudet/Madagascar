const db = require('../database');
const consol = require('../services/colorConsole');

class Stock {

    id;
    quantite;
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
     * Méthode chargé d'aller chercher les informations relatives à toutes les stocks
     * @returns - tous les stock présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAll() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.stock ORDER BY stock.id ASC');

        if (!rows[0]) {
            throw new Error("Aucun stock dans la BDD");
        }
        consol.model(
            `les informations des ${rows.length} stocks ont été demandées !`
        );

        return rows.map((stock) => new Stock(stock));
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à une stock via son id passée en paramétre
     * @param - un id d'une stock
     * @returns - les informations du stock demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOne(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.stock WHERE stock.id = $1;',
            [id]
        );

        if (!rows[0]) {
            throw new Error("Aucun stock avec cet id");
        }

        consol.model(
            `le stock id : ${id} a été demandé en BDD !`
        );

        return new Stock(rows[0]);
    }



    /**
     * Méthode chargé d'aller chercher les stock relatif à un idProduit passé en paramétre
     * @param idProduit - un idProduit d'un stock
     * @returns - les informations d'une stock demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findByIdProduit(idProduit) {

        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.stock WHERE stock.id_produit = $1;',
            [idProduit]
        );

        if (!rows[0]) {
            throw new Error("Aucun stock avec cet idProduit");
        }

        consol.model(
            `la stock pour le idProduit : ${idProduit} a été demandé en BDD !`
        );

        return rows.map((id) => new Stock(id));
    }

    /**
     * Méthode chargé d'aller insérer les informations relatives à une stocks passé en paramétre
     * @param quantite - 
     * @param idProduit - 
     * @returns - les informations du stock demandées
     * @async - une méthode asynchrone
     */
    async save() {

        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.stock (quantite, created_date, id_produit) VALUES ($1, now(), $2) RETURNING *;`,
            [this.quantite, this.idProduit]
        );

        this.id = rows[0].id;
        this.createdDate = rows[0].created_date;
        consol.model(
            `la stock id ${this.id} a été inséré à la date du ${this.createdDate} pour le produit id ${this.idProduit} !`
        );
    }

    /**
     * Méthode chargé d'aller mettre à jour les informations relatives à un stock passé en paramétre
     * @param quantite - 
     * @param idProduit -  
     * @param id - l'identifiant du champs a supprimer
     * @returns - les informations du stock mis à jour
     * @async - une méthode asynchrone
     */
    async update() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.stock SET quantite = $1, updated_date = now(), id_produit = $2 WHERE id = $3 RETURNING *;`,
            [this.quantite, this.idProduit, this.id]
        );
        this.updatedDate = rows[0].updated_date;
        console.log(
            `la stock id ${this.id} a été mis a jour à la date du ${this.updatedDate} pour le produit id ${this.idProduit} !`
        );
    }




    /**
     * Méthode chargé d'aller supprimer un stock passé en paramétre
     * @param id - l'id d'un stock
     * @async - une méthode asynchrone
     */
    async delete() {
        const {
            rows
        } = await db.query('DELETE FROM mada.stock WHERE stock.id = $1 RETURNING *;', [
            this.id,
        ]);
        consol.model(`la stock id ${this.id} a été supprimé !`);

        return new Stock(rows[0]);
    }

    /**
     * Méthode chargé d'aller supprimer une stock via l'idProduit passé en paramétre
     * @param idProduit - l'id d'un produit
     * @returns - les informations du stock qui viennent d'être supprimés.
     * @async - une méthode asynchrone
     */
    async deleteByIdProduit() {
        const {
            rows
        } = await db.query('DELETE FROM mada.stock WHERE stock.id_produit = $1 RETURNING *;', [
            this.idProduit
        ]);
        consol.model(`le ou les stock du produit id ${this.idProduit} ont été supprimé !`);

        return rows.map((deletedClient) => new Stock(deletedClient));
    }



}

module.exports = Stock;