const db = require('../database');
const consol = require('../services/colorConsole');

class ClientVille {


    id;
    nom;
    idPays;


    set id_pays(val) {
        this.idPays = val;
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
     * Méthode chargé d'aller chercher toutes les informations relatives à tous les villes des adresses
     * @returns - tous les ClientVilles présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAll() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.ville ORDER BY ville.id ASC');

        if (!rows[0]) {
            throw new Error("Aucune ville dans la BDD");
        }
        consol.model(
            `les informations des ${rows.length} villes ont été demandé !`
        );

        return rows.map((clientVille) => new ClientVille(clientVille));
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à une Ville passé en paramétre
     * @param id - un id d'un Ville
     * @returns - les informations d'une Ville demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOne(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.ville WHERE ville.id = $1;',
            [id]
        );
        console.log("rows[0] =>", rows[0]);
        
        if (!rows[0]) {
            throw new Error("Aucun ville avec cet id");
        }

        consol.model(
            `le ClientVille id : ${id} a été demandé en BDD !`
        );

        return new ClientVille(rows[0]);
    }



    /**
     * Méthode chargé d'aller insérer les informations relatives à une adresse de client 
     * @param nom - nom d'une ville
     * @param idPays - l'identifiant d'un pays lié a la ville
     * @returns - les informations du ClientVille demandées
     * @async - une méthode asynchrone
     */
    async save() {

        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.ville (nom, id_pays) VALUES ($1, $2) RETURNING *;`,
            [this.ville, this.idPays]
        );

        this.id = rows[0].id;
        consol.model(
            `la ville id ${this.id} avec comme nom ${this.ville} a été inséré avec succés !`
        );

        return new ClientVille(rows[0]);

    }

    /**
     * Méthode chargé d'aller mettre à jour les informations relatives à un ville passé en paramétre
     * @param nom - nom d'une ville
     * @param idPays - l'identifiant d'un pays lié a la ville
     * @param id - l'identifiant d'une ville à modifié
     * @returns - les informations du ClientVille mis à jour
     * @async - une méthode asynchrone
     */
    async update() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.ville SET nom = $1, id_pays = $2 WHERE id = $3 RETURNING *;`,
            [this.nom, this.idPays, this.id]
        );

        console.log(
            `la Ville id : ${this.id} avec le nom ${this.nom} a été mise à jour  !`
        );
    }


    /**
     * Méthode chargé d'aller supprimer une ville via l'id passé en paramétre
     * @param id - l'id d'une adresse
     * @returns - les informations du ClientVille qui viennent d'être supprimés.
     * @async - une méthode asynchrone
     */
    async delete() {
        const {
            rows
        } = await db.query('DELETE FROM mada.ville WHERE ville.id = $1 RETURNING *;', [
            this.id,
        ]);
        console.log("this ==<", this);
        consol.model(`la Ville id ${this.id} a été supprimé !`);

        return new ClientVille(rows[0]);
    }



}

module.exports = ClientVille;