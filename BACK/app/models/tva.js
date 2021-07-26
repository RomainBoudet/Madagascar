const db = require('../database');
const consol = require('../services/colorConsole');

class Tva {

    id;
    taux;
    nom;
    periodeTVA;
    

    set periode_tva(val) {
        this.periodeTVA = val;
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
     * Méthode chargé d'aller chercher les informations relatives à toutes les tvas
     * @returns - tous les tva présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAll() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.tva ORDER BY tva.id ASC');

        if (!rows[0]) {
            throw new Error("Aucun tva dans la BDD");
        }
        consol.model(
            `les informations des ${rows.length} tvas ont été demandées !`
        );

        return rows.map((tva) => new Tva(tva));
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à une tva via son id passée en paramétre
     * @param - un id d'une tva
     * @returns - les informations du tva demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOne(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.tva WHERE tva.id = $1;',
            [id]
        );

        if (!rows[0]) {
            throw new Error("Aucun tva avec cet id");
        }

        consol.model(
            `la tva id : ${id} a été demandé en BDD !`
        );

        return new Tva(rows[0]);
    }



    
    /**
     * Méthode chargé d'aller insérer les informations relatives à une tva passé en paramétre
     * @param nom -
     * @param taux -  
     * @param periodeTVA - 
     * @returns - les informations du tva demandées
     * @async - une méthode asynchrone
     */
    async save() {

        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.tva (nom, taux, periode_tva) VALUES ($1, $2, $3) RETURNING *;`,
            [this.nom, this.taux, this.periodeTVA]
        );

        this.id = rows[0].id;
        consol.model(
            `la tva id ${this.id} a été inséré pour la periode ${this.periodeTVA}  !`
        );
    }

    /**
     * Méthode chargé d'aller mettre à jour les informations relatives à un tva passé en paramétre
     * @param nom -
     * @param taux -  
     * @param periodeTVA - 
     * @param id - l'identifiant du champs a supprimer
     * @returns - les informations du tva mis à jour
     * @async - une méthode asynchrone
     */
    async update() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.tva SET nom = $1, taux = $2, periode_tva = $3  WHERE id = $4 RETURNING *;`,
            [this.nom, this.taux, this.periodeTVA, this.id]
        );
        this.updatedDate = rows[0].updated_date;
        console.log(
            `la tva id ${this.id} a été mis a jour pour la periode ${this.periodeTVA} !`
        );
    }




    /**
     * Méthode chargé d'aller supprimer un tva passé en paramétre
     * @param id - l'id d'un tva
     * @async - une méthode asynchrone
     */
    async delete() {
        const {
            rows
        } = await db.query('DELETE FROM mada.tva WHERE tva.id = $1 RETURNING *;', [
            this.id,
        ]);
        consol.model(`le tva id ${this.id} a été supprimé !`);

        return new Tva(rows[0]);
    }

   


}

module.exports = Tva;