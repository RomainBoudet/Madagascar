const db = require('../database');
const consol = require('../services/colorConsole');

class Reduction {

    id;
    nom;
    pourcentageReduction;
    actif;
    createdDate;
    updatedDate;
    periodeReduction;
    

    set pourcentage_reduction(val) {
        this.pourcentageReduction = val;
    }

    set created_date(val) {
        this.createdDate = val;
    }

    set updated_date(val) {
        this.updatedDate = val;
    }

    set periode_reduction(val) {
        this.periodeReduction = val;
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
     * Méthode chargé d'aller chercher les informations relatives à toutes les reductions
     * @returns - tous les reduction présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAll() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.reduction ORDER BY reduction.id ASC');

        if (!rows[0]) {
            throw new Error("Aucun reduction dans la BDD");
        }
        consol.model(
            `les informations des ${rows.length} reductions ont été demandées !`
        );

        return rows.map((reduction) => new Reduction(reduction));
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à une reduction via son id passée en paramétre
     * @param - un id d'une reduction
     * @returns - les informations du reduction demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOne(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.reduction WHERE reduction.id = $1;',
            [id]
        );

        if (!rows[0]) {
            throw new Error("Aucun reduction avec cet id");
        }

        consol.model(
            `la reduction id : ${id} a été demandé en BDD !`
        );

        return new Reduction(rows[0]);
    }



    
    /**
     * Méthode chargé d'aller insérer les informations relatives à une reductions passé en paramétre
     * @param nom -
     * @param pourcentageReduction -  
     * @param actif -
     * @param periodeReduction - 
     * @returns - les informations du reduction demandées
     * @async - une méthode asynchrone
     */
    async save() {

        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.reduction (nom, pourcentage_reduction, actif, created_date, periode_reduction) VALUES ($1, $2, $3, now(), $4) RETURNING *;`,
            [this.nom, this.pourcentageReduction, this.actif, this.periodeReduction]
        );

        this.id = rows[0].id;
        this.createdDate = rows[0].created_date;
        consol.model(
            `la reduction id ${this.id} a été inséré à la date du ${this.createdDate} pour la periode ${this.periodeReduction}  !`
        );
    }

    /**
     * Méthode chargé d'aller mettre à jour les informations relatives à un reduction passé en paramétre
     * @param nom -
     * @param pourcentageReduction -  
     * @param actif -
     * @param periodeReduction - 
     * @param id - l'identifiant du champs a supprimer
     * @returns - les informations du reduction mis à jour
     * @async - une méthode asynchrone
     */
    async update() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.reduction SET nom = $1, pourcentage_reduction = $2, actif = $3, updated_date = now(), periode_reduction = $4  WHERE id = $5 RETURNING *;`,
            [this.nom, this.pourcentageReduction, this.actif, this.periodeReduction, this.id]
        );
        this.updatedDate = rows[0].updated_date;
        console.log(
            `la reduction id ${this.id} a été mis a jour à la date du ${this.createdDate} pour la periode ${this.periodeReduction}  !!`
        );
    }




    /**
     * Méthode chargé d'aller supprimer un reduction passé en paramétre
     * @param id - l'id d'un reduction
     * @async - une méthode asynchrone
     */
    async delete() {
        const {
            rows
        } = await db.query('DELETE FROM mada.reduction WHERE reduction.id = $1 RETURNING *;', [
            this.id,
        ]);
        consol.model(`le reduction id ${this.id} a été supprimé !`);

        return new Reduction(rows[0]);
    }

   


}

module.exports = Reduction;