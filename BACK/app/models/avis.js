const db = require('../database');
const consol = require('../services/colorConsole');

class Avis {

    id;
    notation;
    avis;
    titre;
    createdDate;
    updatedDate;
    idClient;
    idProduit;




    set created_date(val) {
        this.createdDate = val;
    }

    set updated_date(val) {
        this.updatedDate = val;
    }

    set id_client(val) {
        this.idClient = val;
    }

    set id_produit(val) {
        this.idProduit = val;
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
     * Méthode chargé d'aller chercher les informations relatives à toutes les aviss
     * @returns - tous les avis présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAll() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.avis ORDER BY avis.id ASC');

        if (!rows[0]) {
            throw new Error("Aucun avis dans la BDD");
        }
        consol.model(
            `les informations des ${rows.length} aviss ont été demandées !`
        );

        return rows.map((avis) => new Avis(avis));
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à une avis via son id passée en paramétre
     * @param - un id d'une avis
     * @returns - les informations du avis demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOne(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.avis WHERE avis.id = $1;',
            [id]
        );

        if (!rows[0]) {
            throw new Error("Aucun avis avec cet id");
        }

        consol.model(
            `le avis id : ${id} a été demandé en BDD !`
        );

        return new Avis(rows[0]);
    }



    /**
     * Méthode chargé d'aller chercher les avis relatif à un idClient passé en paramétre
     * @param idClient - un idClient d'un avis
     * @returns - les informations d'une avis demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findByIdClient(idClient) {

        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.avis WHERE avis.id_client = $1;',
            [idClient]
        );

        if (!rows[0]) {
            throw new Error("Aucun avis avec cet idClient");
        }

        consol.model(
            `la avis pour le idClient : ${idClient} a été demandé en BDD !`
        );

        return rows.map((id) => new Avis(id));
    }

    /**
     * Méthode chargé d'aller insérer les informations relatives à une aviss passé en paramétre
     * @param notation -
     * @param avis -  
     * @param titre - 
     * @param idClient - 
     * @param idProduit - 
     * @returns - les informations du avis demandées
     * @async - une méthode asynchrone
     */
    async save() {

        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.avis (notation, avis, titre, created_date, id_client, id_produit) VALUES ($1, $2, $3, now(), $4, $5) RETURNING *;`,
            [this.notation, this.avis, this.titre, this.idClient, this.idProduit]
        );

        this.id = rows[0].id;
        this.createdDate = rows[0].created_date;
        consol.model(
            `l'avis id ${this.id} a été inséré à la date du ${this.createdDate} pour le client id ${this.idClient} et le produit ${this.idProduit} !`
        );
    }

    /**
     * Méthode chargé d'aller mettre à jour les informations relatives à un avis passé en paramétre
     * @param notation -
     * @param avis -  
     * @param titre - 
     * @param idClient - 
     * @param idProduit - 
     * @param id - l'identifiant du champs a supprimer
     * @returns - les informations du avis mis à jour
     * @async - une méthode asynchrone
     */
    async update() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.avis SET notation = $1, avis = $2, titre = $3, updated_date = now(), id_client = $4, id_produit = $5  WHERE id = $6 RETURNING *;`,
            [this.notation, this.avis, this.titre, this.idClient, this.idProduit, this.id]
        );
        this.updatedDate = rows[0].updated_date;
        console.log(
            `l'avis id ${this.id} a été mis a jour à la date du ${this.updatedDate} pour le client id ${this.idClient} et le produit ${this.idProduit} !`
        );
    }




    /**
     * Méthode chargé d'aller supprimer un avis passé en paramétre
     * @param id - l'id d'un avis
     * @async - une méthode asynchrone
     */
    async delete() {
        const {
            rows
        } = await db.query('DELETE FROM mada.avis WHERE avis.id = $1 RETURNING *;', [
            this.id,
        ]);
        consol.model(`le avis id ${this.id} a été supprimé !`);

        return new Avis(rows[0]);
    }

    /**
     * Méthode chargé d'aller supprimer une avis via l'idClient passé en paramétre
     * @param idClient - l'id d'un client
     * @returns - les informations du avis qui viennent d'être supprimés.
     * @async - une méthode asynchrone
     */
    async deleteByIdClient() {
        const {
            rows
        } = await db.query('DELETE FROM mada.avis WHERE avis.id_client = $1 RETURNING *;', [
            this.idClient
        ]);
        consol.model(`le ou les avis du client id ${this.idClient} ont été supprimé !`);

        return rows.map((deletedClient) => new Avis(deletedClient));
    }



}

module.exports = Avis;