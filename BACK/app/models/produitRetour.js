const db = require('../database');
const consol = require('../services/colorConsole');

class ProduitRetour {

    id;
    quantite;
    createdDate;
    updatedDate;
    idCommandeLigne;


    set created_date(val) {
        this.createdDate = val;
    }
    set updated_date(val) {
        this.updatedDate = val;
    }

    set id_commandeligne(val) {
        this.idCommandeLigne = val;
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
     * Méthode chargé d'aller chercher les informations relatives à tous les produit_retours
     * @returns - tous les produit_retours présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAll() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.produit_retour ORDER BY produit_retour.id ASC');

        if (!rows[0]) {
            throw new Error("Aucun produit_retours dans la BDD");
        }
        consol.model(
            `les informations des ${rows.length} produit_retours ont été demandées !`
        );

        return rows.map((produit_retour) => new ProduitRetour(produit_retour));
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à une produit_retour via son id passée en paramétre
     * @param - un id d'une produit_retour
     * @returns - les informations d'une produit_retour demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOne(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.produit_retour WHERE produit_retour.id = $1;',
            [id]
        );

        if (!rows[0]) {
            throw new Error("Aucune produit_retour avec cet id");
        }

        consol.model(
            `la produit_retour id : ${id} a été demandé en BDD !`
        );

        return new ProduitRetour(rows[0]);
    }





    /**
     * Méthode chargé d'aller insérer les informations relatives à une produit_retour passé en paramétre
     * @param quantite - la quantité d'un produit retourné 
     * @param commentaire
     * @param idCommandeLigne - l'identifiant d'une ligne de commande
     * @param IdLivraison - l'identifiant d'une livraison
     * @returns - les informations du produit_retour demandées
     * @async - une méthode asynchrone
     */
    async save() {

        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.produit_retour (quantite, created_date, commentaire, id_commandeLigne) VALUES ($1, now(), $2, $3) RETURNING *;`,
            [this.quantite, this.commentaire, this.idCommandeLigne]
        );

        this.id = rows[0].id;
        this.createdDate = rows[0].created_date;
        consol.model(
            `la produit_retour id ${this.id} avec comme quantité ${this.quantite} lié a la ligne de commande id ${this.idCommandeLigne} à bien été inséré le ${this.createdDate} !`
        );
    }

    /**
     * Méthode chargé d'aller mettre à jour les informations relatives à une produit_retour passé en paramétre
     * @param quantite - la quantité d'un produit dans la ligne de livraison
     * @param commentaire
     * @param idCommandeLigne - l'identifiant d'une ligne de commande
     * @param id - l'identifiant du champs a mettre a jour
     * @returns - les informations du produit_retour mis à jour
     * @async - une méthode asynchrone
     */
    async update() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.produit_retour SET quantite = $1, updated_date = now(), commentaire = $2, id_commandeLigne = $3  WHERE id = $4 RETURNING *;`,
            [this.quantite, this.commentaire, this.idCommandeLigne, this.id]
        );
        this.updatedDate = rows[0].updated_date;
        console.log(
            `la produit_retour id ${this.id}  avec comme quantité ${this.quantite} lié a la ligne de commande id ${this.idCommandeLigne} a été mise à jour le ${this.updatedDate} !`
        );
    }



    /**
     * Méthode chargé d'aller supprimer un produit_retour passé en paramétre
     * @param id - l'id d'un produit_retour
     * @async - une méthode asynchrone
     */
    async delete() {
        const {
            rows
        } = await db.query('DELETE FROM mada.produit_retour WHERE produit_retour.id = $1 RETURNING *;', [
            this.id,
        ]);
        consol.model(`la produit_retour id ${this.id} a été supprimé !`);

        return new ProduitRetour(rows[0]);
    }



}

module.exports = ProduitRetour;