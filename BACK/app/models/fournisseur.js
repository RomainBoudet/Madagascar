const db = require('../database');
const consol = require('../services/colorConsole');

class Fournisseur {

    id;
    nom;
    logo;
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
     * Méthode chargé d'aller chercher les informations relatives à toutes les fournisseurs
     * @returns - tous les fournisseur présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAll() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.fournisseur ORDER BY fournisseur.id ASC');

        if (!rows[0]) {
            throw new Error("Aucun fournisseur dans la BDD");
        }
        consol.model(
            `les informations des ${rows.length} fournisseurs ont été demandées !`
        );

        return rows.map((fournisseur) => new Fournisseur(fournisseur));
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à une fournisseur via son id passée en paramétre
     * @param - un id d'une fournisseur
     * @returns - les informations du fournisseur demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOne(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.fournisseur WHERE fournisseur.id = $1;',
            [id]
        );

        if (!rows[0]) {
            throw new Error("Aucun fournisseur avec cet id");
        }

        consol.model(
            `le fournisseur id : ${id} a été demandé en BDD !`
        );

        return new Fournisseur(rows[0]);
    }

    
    /**
     * Méthode chargé d'aller insérer les informations relatives à un fournisseur passé en paramétre
     * @param nom - 
     * @param logo - 
     * @returns - les informations du fournisseur demandées
     * @async - une méthode asynchrone
     */
    async save() {

        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.fournisseur (nom, created_date, logo) VALUES ($1, now(), $2) RETURNING *;`,
            [this.nom, this.logo]
        );

        this.id = rows[0].id;
        this.createdDate = rows[0].created_date;
        consol.model(
            `le fournisseur id ${this.id} a été inséré à la date du ${this.createdDate} avec le nom ${this.nom} !`
        );
    }

    /**
     * Méthode chargé d'aller mettre à jour les informations relatives à un fournisseur passé en paramétre
     * @param nom - 
     * @param logo -  
     * @param id - l'identifiant du champs a supprimer
     * @returns - les informations du fournisseur mis à jour
     * @async - une méthode asynchrone
     */
    async update() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.fournisseur SET nom = $1, updated_date = now(), logo = $2 WHERE id = $3 RETURNING *;`,
            [this.nom, this.logo, this.id]
        );
        this.updatedDate = rows[0].updated_date;
        console.log(
            `le fournisseur id ${this.id} avec le nom ${this.nom} a été mis a jour à la date du ${this.updatedDate} !`
        );
    }




    /**
     * Méthode chargé d'aller supprimer un fournisseur passé en paramétre
     * @param id - l'id d'un fournisseur
     * @async - une méthode asynchrone
     */
    async delete() {
        const {
            rows
        } = await db.query('DELETE FROM mada.fournisseur WHERE fournisseur.id = $1 RETURNING *;', [
            this.id,
        ]);
        consol.model(`le fournisseur id ${this.id} a été supprimé !`);

        return new Fournisseur(rows[0]);
    }

    


}

module.exports = Fournisseur;