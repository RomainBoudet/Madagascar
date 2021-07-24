const db = require('../database');
const consol = require('../services/colorConsole');

class Shop {


    id;
    nom;
    logo;
    texteIntro;
    emailContact;
    telephone;

    set texte_intro(val) {
        this.texteIntro = val;
    }
    set email_contact(val) {
        this.emailContact = val;
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
     * Méthode chargé d'aller chercher toutes les informations relatives au shop 
     * @returns - tous les Shops présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAll() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.shop ORDER BY shop.id ASC');

        if (!rows[0]) {
            throw new Error("Aucune shop dans la BDD");
        }
        consol.model(
            `les informations des ${rows.length} shop ont été demandé !`
        );

        return rows.map((shop) => new Shop(shop));
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives au shop passé en paramétre
     * @param id - un id d'un shop
     * @returns - les informations d'une shop demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOne(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.shop WHERE shop.id = $1;',
            [id]
        );

        if (!rows[0]) {
            throw new Error("Aucun shop avec cet id");
        }

        consol.model(
            `le Shop id : ${id} a été demandé en BDD !`
        );

        return new Shop(rows[0]);
    }

    

    /**
     * Méthode chargé d'aller insérer les informations relatives à un shop 
     * @param nom - nom d'un shop
     * @param logo - le logo du shop
     * @param texteIntro - le texte d'intro du site
     * @param emailContact - l'mail de contact du site
     * @param telephone - le téléphone de contact du site
     * @returns - les informations du Shop demandées
     * @async - une méthode asynchrone
     */
    async save() {

        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.shop (nom, logo, texte_intro, email_contact, telephone) VALUES ($1, $2, $3, $4, $5) RETURNING *;`,
            [this.nom, this.logo, this.texteIntro, this.emailContact, this.telephone]
        );

        this.id = rows[0].id;
        consol.model(
            `le shop id ${this.id} avec comme nom ${this.nom} a été inséré avec succés !`
        );
    }

    /**
     * Méthode chargé d'aller mettre à jour les informations relatives à un shop passé en paramétre
     * @param nom - nom d'un shop
     * @param logo - le logo du shop
     * @param texteIntro - le texte d'intro du site
     * @param emailContact - l'mail de contact du site
     * @param telephone - le téléphone de contact du site
     * @param id - l'identifiant d'un shop à modifié
     * @returns - les informations du Pays mis à jour
     * @async - une méthode asynchrone
     */
    async update() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.shop SET nom = $1, logo = $2, texte_intro = $3, email_contact = $4, telephone = $5 WHERE id = $6 RETURNING *;`,
            [this.nom, this.logo, this.texteIntro, this.emailContact, this.telephone, this.id]
        );

        console.log(
            `le shop id : ${this.id} avec le nom ${this.nom} a été mise à jour  !`
        );
    }


    /**
     * Méthode chargé d'aller supprimer une shop via l'id passé en paramétre
     * @param id - l'id d'une adresse
     * @returns - les informations du Shop qui viennent d'être supprimés.
     * @async - une méthode asynchrone
     */
    async delete() {
        const {
            rows
        } = await db.query('DELETE FROM mada.shop WHERE shop.id = $1 RETURNING *;', [
            this.id,
        ]);
        consol.model(`le shop id ${this.id} a été supprimé !`);

        return new Shop(rows[0]);
    }



}

module.exports = Shop;
