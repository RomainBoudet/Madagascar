const db = require('../database');
const consol = require('../services/colorConsole');

class Paiement {

    id;
    reference;
    methode;
    datePaiement;
    montant;
    updatedDate;
    idCommande;


    set date_paiement(val) {
        this.datePaiement = val;
    }

    set updated_date(val) {
        this.updatedDate = val;
    }

    set id_commande(val) {
        this.idCommande = val;
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
     * Méthode chargé d'aller chercher les informations relatives à tous les paiements
     * @returns - tous les paiements présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAll() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.paiement ORDER BY paiement.id ASC');

        if (!rows[0]) {
            throw new Error("Aucun paiements dans la BDD");
        }
        consol.model(
            `les informations des ${rows.length} paiements ont été demandées !`
        );

        return rows.map((paiement) => new Paiement(paiement));
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à un paiement via son id passée en paramétre
     * @param - un id d'une paiement
     * @returns - les informations du paiement demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOne(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.paiement WHERE paiement.id = $1;',
            [id]
        );

        if (!rows[0]) {
            throw new Error("Aucun paiement avec cet id");
        }

        consol.model(
            `le paiement id : ${id} a été demandé en BDD !`
        );

        return new Paiement(rows[0]);
    }



    /**
     * Méthode chargé d'aller chercher les informations relatives à un idCommande passé en paramétre
     * @param idCommande - un idCommande d'une paiement
     * @returns - les informations d'une paiement demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findByIdCommande(idCommande) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.paiement WHERE paiement.id_commande = $1;',
            [idCommande]
        );

        if (!rows[0]) {
            throw new Error("Aucun paiement avec cet idCommande");
        }

        consol.model(
            `la paiement avec l'idCommande : ${idCommande} a été demandé en BDD !`
        );

        return rows.map((id) => new Paiement(id));
    }

    /**
     * Méthode chargé d'aller insérer les informations relatives à un paiement passé en paramétre
     * @param reference - la reférence d'un paiement
     * @param methode - la méthode d'un paiement, 
     * @param montant - le montant d'un paiement
     * @param idCommande - l'identifiant d'une commande
     * @returns - les informations du paiement demandées
     * @async - une méthode asynchrone
     */
    async save() {

        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.paiement (reference, methode, montant, id_commande) VALUES ($1, $2, $3, $4) RETURNING *;`,
            [this.reference, this.methode, this.montant, this.idCommande]
        );

        this.id = rows[0].id;
        this.createdDate = rows[0].date_paiement;
        consol.model(
            `le paiement id ${this.id} a été inséré à la date du ${this.createdDate} pour la commande id ${this.idCommande} !`
        );
        return new Paiement(rows[0]);

    }

    /**
     * Méthode chargé d'aller mettre à jour les informations relatives à un paiement passé en paramétre
     * @param reference - la reférence d'un paiement
     * @param methode - la méthode d'un paiement, 
     * @param montant - le montant d'un paiement
     * @param idCommande - l'identifiant d'une commande
     * @param id - l'identifiant du champs a mettre a jour
     * @returns - les informations du paiement mis à jour
     * @async - une méthode asynchrone
     */
    async update() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.paiement SET reference = $1, methode = $2, montant = $3, updated_date=now(), id_commande = $4  WHERE id = $5 RETURNING *;`,
            [this.reference, this.methode, this.montant, this.idCommande, this.id]
        );
        this.updatedDate = rows[0].updated_date;
        console.log(
            `le paiement id ${this.id} de la idCommande ${this.idCommande} d'un montant de ${this.montant} a été mise à jour le ${this.updatedDate} !`
        );
    }




    /**
     * Méthode chargé d'aller supprimer un paiement passé en paramétre
     * @param id - l'id d'un paiement
     * @async - une méthode asynchrone
     */
    async delete() {
        const {
            rows
        } = await db.query('DELETE FROM mada.paiement WHERE paiement.id = $1 RETURNING *;', [
            this.id,
        ]);
        consol.model(`le paiement id ${this.id} a été supprimé !`);

        return new Paiement(rows[0]);
    }

    /**
     * Méthode chargé d'aller supprimer une paiement  via l'idCommande passé en paramétre
     * @param idCommande - l'id d'une commande
     * @returns - les informations du paiement qui viennent d'être supprimés.
     * @async - une méthode asynchrone
     */
    async deleteByIdCommande() {
        const {
            rows
        } = await db.query('DELETE FROM mada.paiement WHERE paiement.id_commande = $1 RETURNING *;', [
            this.idCommande
        ]);
        
        this.id = rows[0].id;
        consol.model(`la paiement id ${this.id} avec l'idCommande ${this.idCommande} a été supprimé !`);

        return rows.map((deletedPaiement) => new Paiement(deletedPaiement));
    }


    static async getLastPaiement(){


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.paiement ORDER BY paiement.date_paiement DESC LIMIT 1;');

        if (!rows[0]) {
            throw new Error("Aucun paiement en BDD ");
        }

        consol.model(
            `le dernier paiement a été demandé en BDD !`
        );

        return new Paiement(rows[0]);
    }

}

module.exports = Paiement;