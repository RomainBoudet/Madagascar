const db = require('../database');
const consol = require('../services/colorConsole');

class LiaisonVilleCodePostal {


    id;
    idVille;
    idCodePostal;

    set id_ville(val) {
        this.idVille = val;
    }

    set id_codePostal(val) {
        this.idCodePostal = val;
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
     * Méthode chargé d'aller chercher toutes les informations relatives à la table de liaison ville_a_codePostal
     * @returns - tous les LiaisonVilleCodePostals présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAll() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.ville_a_codePostal ORDER BY ville_a_codePostal.id ASC');

        if (!rows[0]) {
            throw new Error("Aucune ville_a_codePostal dans la BDD");
        }
        consol.model(
            `les informations des ${rows.length} ville_a_codePostal ont été demandé !`
        );

        return rows.map((lliaisonVilleCodePostal) => new LiaisonVilleCodePostal(lliaisonVilleCodePostal));
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à une ville_a_codePostal passé en paramétre
     * @param id - un id d'un ville_a_codePostal
     * @returns - les informations d'une ville_a_codePostal demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOne(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.ville_a_codePostal WHERE ville_a_codePostal.id = $1;',
            [id]
        );

        if (!rows[0]) {
            throw new Error("Aucun ville_a_codePostal avec cet id");
        }

        consol.model(
            `la Liaison Ville_a_CodePostale id : ${id} a été demandé en BDD !`
        );

        return new LiaisonVilleCodePostal(rows[0]);
    }

    

    /**
     * Méthode chargé d'aller insérer les informations relatives à un ville_a_codePostal d'une adresse de client 
     * @param idVille - identifiant d'une ville
     * @param idCodePostal - l'identifiant d'un code postale
     * @returns - les informations du LiaisonVilleCodePostal demandées
     * @async - une méthode asynchrone
     */
    async save() {

        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.ville_a_codePostal (id_ville, id_codePostal) VALUES ($1, $2) RETURNING *;`,
            [this.idVille, this.idCodePostal]
        );

        this.id = rows[0].id;
        consol.model(
            `la ville_a_codePostal id ${this.id} avec comme idVille ${this.idVille} a été inséré avec succés !`
        );
    }

    /**
     * Méthode chargé d'aller mettre à jour les informations relatives à un ville_a_codePostal passé en paramétre
    * @param idVille - identifiant d'une ville
     * @param idCodePostal - l'identifiant d'un code postale
     * @param id - l'identifiant d'une ville_a_codePostal à modifié
     * @returns - les informations du Pays mis à jour
     * @async - une méthode asynchrone
     */
    async update() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.ville_a_codePostal SET id_ville = $1, id_codePostal = $2 WHERE id = $3 RETURNING *;`,
            [this.idVille, this.idCodePostal, this.id]
        );

        console.log(
            `la ville_a_codePostal id : ${this.id} avec l'idVille ${this.idVille} a été mise à jour  !`
        );
    }


    /**
     * Méthode chargé d'aller supprimer une ville_a_codePostal via l'id passé en paramétre
     * @param id - l'id d'une adresse
     * @returns - les informations du LiaisonVilleCodePostal qui viennent d'être supprimés.
     * @async - une méthode asynchrone
     */
    async delete() {
        const {
            rows
        } = await db.query('DELETE FROM mada.ville_a_codePostal WHERE ville_a_codePostal.id = $1 RETURNING *;', [
            this.id,
        ]);
        consol.model(`la ville_a_codePostal id ${this.id} a été supprimé !`);

        return new LiaisonVilleCodePostal(rows[0]);
    }



}

module.exports = LiaisonVilleCodePostal;