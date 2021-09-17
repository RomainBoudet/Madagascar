const db = require('../database');
const consol = require('../services/colorConsole');

class LigneLivraison {

    id;
    quantiteLivraison;
    createdDate;
    updatedDate;
    idLivraison;
    idCommandeLigne;

    set quantite_livraison(val) {
        this.quantiteLivraison = val;
    }
    set created_date(val) {
        this.createdDate = val;
    }
    set updated_date(val) {
        this.updatedDate = val;
    }
    set id_livraison(val) {
        this.idLivraison = val;
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
     * Méthode chargé d'aller chercher les informations relatives à tous les ligne_livraisons
     * @returns - tous les ligne_livraisons présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAll() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.ligne_livraison ORDER BY ligne_livraison.id ASC');

        if (!rows[0]) {
            throw new Error("Aucun ligne_livraisons dans la BDD");
        }
        consol.model(
            `les informations des ${rows.length} ligne_livraisons ont été demandées !`
        );

        return rows.map((ligne_livraison) => new LigneLivraison(ligne_livraison));
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à une ligne_livraison via son id passée en paramétre
     * @param - un id d'une ligne_livraison
     * @returns - les informations d'une ligne_livraison demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOne(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.ligne_livraison WHERE ligne_livraison.id = $1;',
            [id]
        );

        if (!rows[0]) {
            throw new Error("Aucune ligne_livraison avec cet id");
        }

        consol.model(
            `la ligne_livraison id : ${id} a été demandé en BDD !`
        );

        return new LigneLivraison(rows[0]);
    }



    /**
     * Méthode chargé d'aller chercher les informations relatives à un idLivraison passé en paramétre
     * @param idLivraison - un idLivraison d'une ligne_livraison
     * @returns - les informations d'une ligne_livraison demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findByIdLivraison(idLivraison) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.ligne_livraison WHERE ligne_livraison.id_livraison = $1;',
            [idLivraison]
        );

        if (!rows[0]) {
            throw new Error("Aucune ligne_livraison avec cet idLivraison");
        }

        consol.model(
            `la ligne_livraison avec l'idLivraison : ${idLivraison} a été demandé en BDD !`
        );

        return rows.map((id) => new LigneLivraison(id));
    }

    /**
     * Méthode chargé d'aller insérer les informations relatives à une ligne_livraison passé en paramétre
     * @param quantiteLivraison - la quantité d'un produit dans la ligne de livraison
     * @param idCommandeLigne - l'identifiant d'une ligne de commande
     * @param IdLivraison - l'identifiant d'une livraison
     * @returns - les informations du ligne_livraison demandées
     * @async - une méthode asynchrone
     */
    async save() {

        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.ligne_livraison (quantite_livraison, created_date, id_livraison, id_commandeLigne) VALUES ($1, now(), $2, $3) RETURNING *;`,
            [this.quantiteLivraison, this.idLivraison, this.idCommandeLigne]
        );

        this.id = rows[0].id;
        this.createdDate = rows[0].created_date;
        consol.model(
            `la ligne_livraison id ${this.id} avec comme quantité ${this.quantiteLivraison} lié a la livraison id ${this.idLivraison} à bien été inséré le ${this.createdDate} !`
        );
    }

    /**
     * Méthode chargé d'aller mettre à jour les informations relatives à une ligne_livraison passé en paramétre
    * @param quantiteLivraison - la quantité d'un produit dans la ligne de livraison
     * @param idCommandeLigne - l'identifiant d'une ligne de commande
     * @param IdLivraison - l'identifiant d'une livraison
     * @param id - l'identifiant du champs a mettre a jour
     * @returns - les informations du ligne_livraison mis à jour
     * @async - une méthode asynchrone
     */
    async update() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.ligne_livraison SET quantite_livraison = $1, updated_date = now(), id_livraison = $2, id_commandeLigne = $3  WHERE id = $4 RETURNING *;`,
            [this.quantiteLivraison, this.idLivraison, this.idCommandeLigne, this.id]
        );
        this.updatedDate = rows[0].updated_date;
        console.log(
            `la ligne_livraison id ${this.id}  avec comme quantité ${this.quantiteLivraison} lié a la livraison id ${this.idLivraison} a été mise à jour le ${this.updatedDate} !`
        );
    }



    /**
     * Méthode chargé d'aller supprimer un ligne_livraison passé en paramétre
     * @param id - l'id d'un ligne_livraison
     * @async - une méthode asynchrone
     */
    async delete() {
        const {
            rows
        } = await db.query('DELETE FROM mada.ligne_livraison WHERE ligne_livraison.id = $1 RETURNING *;', [
            this.id,
        ]);
        consol.model(`la ligne_livraison id ${this.id} a été supprimé !`);

        return new LigneLivraison(rows[0]);
    }

    /**
     * Méthode chargé d'aller supprimer toutes les ligne_livraison lié a un id d'une livraison passé en paramétre
     * @param idLivraison - l'id d'une ligne_livraison
     * @returns - les informations des ligne_livraison qui viennent d'être supprimés.
     * @async - une méthode asynchrone
     */
    async deleteByIdLivraison() {
        const {
            rows
        } = await db.query('DELETE FROM mada.ligne_livraison WHERE ligne_livraison.id_livraison = $1 RETURNING *;', [
            this.idLivraison
        ]);


        consol.model(`la ou les ligne_livraisons avec l'idClient ${this.idLivraison} a / ont été supprimé !`);

        return rows.map((deletedLigneLivraison) => new LigneLivraison(deletedLigneLivraison));
    }



}

module.exports = LigneLivraison;