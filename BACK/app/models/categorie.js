const db = require('../database');
const consol = require('../services/colorConsole');

class Categorie {

    id;
    nom;
    description;
    ordre;
    createdDate;
    updatedDate;


    set created_date(val) {
        this.createdDate = val;
    }

    set updated_date(val) {
        this.updatedDate = val;
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
     * Méthode chargé d'aller chercher les informations relatives à toutes les categories
     * @returns - tous les categorie présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAll() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.categorie ORDER BY categorie.id ASC');

        if (!rows[0]) {
            throw new Error("Aucun categorie dans la BDD");
        }
        consol.model(
            `les informations des ${rows.length} categories ont été demandées !`
        );

        return rows.map((categorie) => new Categorie(categorie));
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à une categorie via son id passée en paramétre
     * @param - un id d'une categorie
     * @returns - les informations du categorie demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOne(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.categorie WHERE categorie.id = $1;',
            [id]
        );

        if (!rows[0]) {
            throw new Error("Aucune categorie avec cet id");
        }

        consol.model(
            `la categorie id : ${id} a été demandé en BDD !`
        );

        return new Categorie(rows[0]);
    }



    
    /**
     * Méthode chargé d'aller insérer les informations relatives à une categories passé en paramétre
     * @param nom -
     * @param description -  
     * @param ordre -
     * @returns - les informations du categorie demandées
     * @async - une méthode asynchrone
     */
    async save() {

        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.categorie (nom, description, ordre, created_date) VALUES ($1, $2, $3, now()) RETURNING *;`,
            [this.nom, this.description, this.ordre]
        );

        this.id = rows[0].id;
        this.createdDate = rows[0].created_date;
        consol.model(
            `la categorie id ${this.id} a été inséré à la date du ${this.createdDate} avec le nom ${this.nom}  !`
        );
    }

    /**
     * Méthode chargé d'aller mettre à jour les informations relatives à un categorie passé en paramétre
     * @param nom -
     * @param description -  
     * @param ordre -
     * @param id - l'identifiant du champs a supprimer
     * @returns - les informations du categorie mis à jour
     * @async - une méthode asynchrone
     */
    async update() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.categorie SET nom = $1, description = $2, ordre = $3, updated_date = now()  WHERE id = $4 RETURNING *;`,
            [this.nom, this.description, this.ordre, this.id]
        );
        this.updatedDate = rows[0].updated_date;
        console.log(
            `la categorie id ${this.id} a été mis a jour à la date du ${this.createdDate} avec le nom ${this.nom} !`
        );
    }




    /**
     * Méthode chargé d'aller supprimer un categorie passé en paramétre
     * @param id - l'id d'un categorie
     * @async - une méthode asynchrone
     */
    async delete() {
        const {
            rows
        } = await db.query('DELETE FROM mada.categorie WHERE categorie.id = $1 RETURNING *;', [
            this.id,
        ]);
        consol.model(`le categorie id ${this.id} a été supprimé !`);

        return new Categorie(rows[0]);
    }

   


}

module.exports = Categorie;