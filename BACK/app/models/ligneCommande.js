const db = require('../database');
const consol = require('../services/colorConsole');

class LigneCommande {

    id;
    quantiteCommande;
    createdDate;
    updatedDate;
    idProduit;
    idCommande;
    idLivraison;


    set quantite_commande(val) {
        this.quantiteCommande = val;
    }
    set created_date(val) {
        this.createdDate = val;
    }

    set updated_date(val) {
        this.updatedDate = val;
    }

    set id_produit(val) {
        this.idProduit = val;
    }

    set id_commande(val) {
        this.idCommande = val;
    }
    set id_livraison(val) {
        this.idLivraison = val;
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
     * Méthode chargé d'aller chercher les informations relatives à tous les ligne_commandes
     * @returns - tous les ligne_commandes présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAll() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.ligne_commande ORDER BY ligne_commande.id ASC');

        if (!rows[0]) {
            throw new Error("Aucun ligne_commandes dans la BDD");
        }
        consol.model(
            `les informations des ${rows.length} ligne_commandes ont été demandées !`
        );

        return rows.map((ligne_commande) => new LigneCommande(ligne_commande));
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à une ligne_commande via son id passée en paramétre
     * @param - un id d'une ligne_commande
     * @returns - les informations d'une ligne_commande demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOne(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.ligne_commande WHERE ligne_commande.id = $1;',
            [id]
        );

        if (!rows[0]) {
            throw new Error("Aucun ligne_commande avec cet id");
        }

        consol.model(
            `la ligne_commande id : ${id} a été demandé en BDD !`
        );

        return new LigneCommande(rows[0]);
    }



    /**
     * Méthode chargé d'aller chercher les informations relatives à un idLigneCommande passé en paramétre
     * @param idCommande - un idLigneCommande d'une ligne_commande
     * @returns - les informations d'une ligne_commande demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findByIdCommande(idCommande) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.ligne_commande WHERE ligne_commande.id_commande = $1;',
            [idCommande]
        );

        if (!rows[0]) {
            throw new Error("Aucune ligne_commande avec cet idCommande");
        }

        consol.model(
            `la ligne_commande avec l'idCommande : ${idCommande} a été demandé en BDD !`
        );

        return rows.map((id) => new LigneCommande(id));
    }

    /**
     * Méthode chargé d'aller insérer les informations relatives à une ligne_commande passé en paramétre
     * @param quantiteCommande - la quantité d'un produit dans la ligne de commande
     * @param idProduit - l'identifiant d'un produit
     * @param idCommande - l'identifiant d'une commande
     * @param idLigneCommande - l'identifiant d'une ligne de commande
     * @returns - les informations du ligne_commande demandées
     * @async - une méthode asynchrone
     */
    async save() {

        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.ligne_commande (quantite_commande, created_date, id_produit, id_commande) VALUES ($1, now(), $2, $3) RETURNING *;`,
            [this.quantiteCommande, this.idProduit, this.idCommande]
        );

        this.id = rows[0].id;
        this.createdDate = rows[0].created_date;
        consol.model(
            `la ligne_commande id ${this.id} avec comme quantité ${this.quantiteCommande} lié a l'id ${this.idProduit} à bien été inséré le ${this.createdDate} !`
        );

        return new LigneCommande(rows[0]);

    }

    /**
     * Méthode chargé d'aller mettre à jour les informations relatives à une ligne_commande passé en paramétre
     * @param quantiteCommande - la quantité d'un produit dans la ligne de commande
     * @param idProduit - l'identifiant d'un produit
     * @param IdCommande - l'identifiant d'une commande
     * @param id - l'identifiant du champs a mettre a jour
     * @returns - les informations du ligne_commande mis à jour
     * @async - une méthode asynchrone
     */
    async update() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.ligne_commande SET quantite_commande = $1, updated_date = now(), id_produit = $2, id_commande = $3, id_livraison = $4  WHERE id = $5 RETURNING *;`,
            [this.quantiteCommande, this.idProduit, this.idCommande, this.idLivraison, this.id]
        );
        this.updatedDate = rows[0].updated_date;
        console.log(
            `la ligne_commande id ${this.id} avec le statut ${this.idLigneCommandeStatut} et la référence ${this.reference} a été mise à jour le ${this.updatedDate} !`
        );

        return new LigneCommande(rows[0]);

    }



    /**
     * Méthode chargé d'aller supprimer un ligne_commande passé en paramétre
     * @param id - l'id d'un ligne_commande
     * @async - une méthode asynchrone
     */
    async delete() {
        const {
            rows
        } = await db.query('DELETE FROM mada.ligne_commande WHERE ligne_commande.id = $1 RETURNING *;', [
            this.id,
        ]);
        consol.model(`la ligne_commande id ${this.id} a été supprimé !`);

        return new LigneCommande(rows[0]);
    }

    /**
     * Méthode chargé d'aller supprimer toutes les ligne_commande lié a un id d'une commande passé en paramétre
     * @param idCommande - l'id d'une ligne_commande
     * @returns - les informations des ligne_commande qui viennent d'être supprimés.
     * @async - une méthode asynchrone
     */
    async deleteByIdCommande() {
        const {
            rows
        } = await db.query('DELETE FROM mada.ligne_commande WHERE ligne_commande.id_commande = $1 RETURNING *;', [
            this.idCommande
        ]);

       
        consol.model(`la ou les ligne_commandes avec l'idClient ${this.idCommande} a / ont été supprimé !`);

        return rows.map((deletedLigneCommande) => new LigneCommande(deletedLigneCommande));
    }



}

module.exports = LigneCommande;