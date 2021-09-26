const db = require('../database');
const consol = require('../services/colorConsole');

class StatutCommande {

    id;
    statut;
    description;
  
    
    /**
     * @constructor
     */
    constructor(data = {}) {
        for (const prop in data) {
            this[prop] = data[prop];
        }
    }

    /**
     * Méthode chargé d'aller chercher les informations relatives à tous les statut_commandes
     * @returns - tous les statut_commandes présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAll() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.statut_commande ORDER BY statut_commande.id ASC');

        if (!rows[0]) {
            throw new Error("Aucun statut_commandes dans la BDD");
        }
        consol.model(
            `les informations des ${rows.length} statut_commandes ont été demandées !`
        );

        return rows.map((statutCommande) => new StatutCommande(statutCommande));
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à un statut_commande via son id passée en paramétre
     * @param - un id d'un statut_commande
     * @returns - les informations d'un statut_commande demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOne(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.statut_commande WHERE statut_commande.id = $1;',
            [id]
        );

        if (!rows[0]) {
            throw new Error("Aucun statut_commande avec cet id");
        }

        consol.model(
            `la statut_commande id : ${id} a été demandé en BDD !`
        );

        return new StatutCommande(rows[0]);
    }

    /**
     * Méthode chargé d'aller chercher les informations relatives à un statut_commande via son nom passée en paramétre
     * @param - un nom d'un statut_commande
     * @returns - les informations d'un statut_commande demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
     static async findByName(statut) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.statut_commande WHERE statut_commande.statut = $1;',
            [statut]
        );

        if (!rows[0]) {
            throw new Error("Aucun statut_commande avec ce statut");
        }

        consol.model(
            `la statut_commande statut : ${statut} a été demandé en BDD !`
        );

        return new StatutCommande(rows[0]);
    }


    /**
     * Méthode chargé d'aller insérer les informations relatives à une statut_commande passé en paramétre
     * @param statut - le statut d'une commande
     * @param description - la description du statut de la commande
     * @returns - les informations du statut_commande demandées
     * @async - une méthode asynchrone
     */
    async save() {

        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.statut_commande (statut, description) VALUES ($1, $2) RETURNING *;`,
            [this.statut, this.description]
        );

        this.id = rows[0].id;
        consol.model(
            `la statut_commande id ${this.id} a été inséré avec comme statut  ${this.statut} !`
        );
    }

    /**
     * Méthode chargé d'aller mettre à jour les informations relatives à une statut_commande passé en paramétre
     * @param statut - le statut d'une commande
     * @param description - la description du statut de la commande
     * @param id - in dientifiant de statut
     * @returns - les informations du statut_commande mis à jour
     * @async - une méthode asynchrone
     */
    async update() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.statut_commande SET statut = $1, description = $2  WHERE id = $3 RETURNING *;`,
            [this.statut, this.description, this.id]
        );
        console.log(
            `la statut_commande id ${this.id} avec le statut ${this.statut} !`
        );
    }




    /**
     * Méthode chargé d'aller supprimer un statut_commande passé en paramétre
     * @param id - l'id d'un statut_commande
     * @async - une méthode asynchrone
     */
    async delete() {
        const {
            rows
        } = await db.query('DELETE FROM mada.statut_commande WHERE statut_commande.id = $1 RETURNING *;', [
            this.id,
        ]);
        consol.model(`la statut_commande id ${this.id} a été supprimé !`);

        return new StatutCommande(rows[0]);
    }

    

}

module.exports = StatutCommande;