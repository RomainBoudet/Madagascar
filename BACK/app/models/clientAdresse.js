const db = require('../database');
const consol = require('../services/colorConsole');

class ClientAdresse {


    id;
    prenom;
    nomFamille;
    ligne1;
    ligne2;
    ligne3;
    telephone;
    titre;
    createdDate;
    updatedDate;
    idClient;
    idVille;




    set nom_famille(val) {
        this.nomFamille = val;
    }

    set created_date(val) {
        this.createdDate = val;
    }

    set updated_date(val) {
        this.updatedDate = val;
    }

    set id_client(val) {
        this.idClient = val;
    }

    set id_ville(val) {
        this.idVille = val;
    }

    set id_adresse(val) {
        this.idAdresse = val;
    }

    set code_postal(val) {
        this.codePostal = val;
    }

    set id_pays(val) {
        this.idPays = val;
    }
    set id_codepostal(val) {
        this.idCodePostal = val;
    }

    set id_liaisonvillecodepostal(val) {
        this.idLiaisonVilleCodePostal = val;
    }

    set adresse_titre(val) {
        this.adresseTitre = val;
    }

    set adresse_prenom(val) {
        this.adressePrenom = val;
    }

    set adresse_nomfamille(val) {
        this.adresseNomFamille = val;
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
     * Méthode chargé d'aller chercher toutes les informations relatives à tous les adresses de clients
     * @returns - tous les ClientAdresses présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAllPlus() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.view_client_adresse');

        if (!rows[0]) {
            throw new Error("Aucun ClientAdresse dans la BDD");
        }
        consol.model(
            `les informations des ${rows.length} ClientAdresses ont été demandé !`
        );

        return rows.map((clientAdresse) => new ClientAdresse(clientAdresse));
    }

    /**
     * Méthode chargé d'aller chercher les informations relatives à un ClientAdresse passé en paramétre
     * @param id - un id d'un ClientAdresse
     * @returns - les informations du ClientAdresse demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOnePlus(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.view_client_adresse WHERE id_adresse = $1;',
            [id]
        );

        if (!rows[0]) {
            throw new Error("Aucun client_adresse avec cet id");
        }

        consol.model(
            `le ClientAdresse id : ${id} a été demandé en BDD !`
        );

        return new ClientAdresse(rows[0]);
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à un ClientAdresse passé en paramétre
     * @param id - un id d'un ClientAdresse
     * @returns - les informations du ClientAdresse demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOneForUpdate(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.view_adresse_update WHERE id_adresse = $1;',
            [id]
        );

        if (!rows[0]) {
            throw new Error("Aucun client_adresse avec cet id");
        }

        consol.model(
            `le ClientAdresse id : ${id} a été demandé en BDD !`
        );

        return new ClientAdresse(rows[0]);
    }

    /**
     * Méthode chargé d'aller chercher les informations relatives à un ClientAdresse passé en paramétre
     * @param id - un id d'un ClientAdresse
     * @returns - les informations du ClientAdresse demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findByIdClient(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.view_client_adresse WHERE id_client = $1;',
            [id]
        );

        if (!rows[0]) {
            throw new Error("Aucun idClient avec cet id");
        }

        consol.model(
            `le ClientAdresse id : ${id} a été demandé en BDD !`
        );

        return rows.map((adresse) => new ClientAdresse(adresse));
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à un titre d'adresse passé en paramétre
     * @param titre - un titre d'une adresse d'un ClientAdresse
     * @returns - les informations du ClientAdresse demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findByTitre(titre) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.client_adresse WHERE client_adresse.titre  = $1;',
            [titre]
        );

        if (!rows[0]) {
            console.log("Aiucune adresse avec ce titre n'éxiste déja.")
           return null;
        }

        consol.model(
            `l'adresse avec pour titre : ${titre} a été demandée en BDD !`
        );

        return new ClientAdresse(rows[0]);
    }




    /**
     * Méthode chargé d'aller chercher les informations relatives à un ClientAdresse passé en paramétre
     * @param id - un id d'un ClientAdresse
     * @returns - les informations du ClientAdresse demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOne(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.client_adresse WHERE client_adresse.id = $1;',
            [id]
        );

        if (!rows[0]) {
            throw new Error("Aucun client_adresse avec cet id");
        }

        consol.model(
            `le ClientAdresse id : ${id} a été demandé en BDD !`
        );

        return new ClientAdresse(rows[0]);
    }



    /**
     * Méthode chargé d'aller chercher toutes les informations relatives à tous les adresses de clients
     * @returns - tous les ClientAdresses présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAll() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.client_adresse ORDER BY client_adresse.id ASC');

        if (!rows[0]) {
            throw new Error("Aucun ClientAdresse dans la BDD");
        }
        consol.model(
            `les informations des ${rows.length} ClientAdresses ont été demandé !`
        );

        return rows.map((clientAdresse) => new ClientAdresse(clientAdresse));
    }


    /**
     * Méthode chargé d'aller insérer les informations relatives à une adresse de client 
     * @param prenom - prenom pour la livraison
     * @param nomFamille - nom de famille pour la livraison
     * @param ligne1 - ligne de l'dresse
     * @param ligne2 - ligne de l'adresse
     * @param ligne3 - ligne de l'adresse
     * @param telephone - le téléphone d'un client pour le transporteur
     * @param titre - le titre d'une adresse d'un client
     * @param idClient - l'identifiant d'un client
     * @param idVille - l'identifiant d'une ville 
     * @returns - les informations du ClientAdresse demandées
     * @async - une méthode asynchrone
     */
    async save() {

        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.client_adresse (prenom, nom_famille, ligne1, ligne2, ligne3, telephone, titre, created_date, id_client, id_ville) VALUES ($1, $2, $3, $4, $5, $6, $7, now(), $8, $9) RETURNING *;`,
            [this.prenom, this.nomFamille, this.ligne1, this.ligne2, this.ligne3, this.telephone, this.titre, this.idClient, this.idVille]
        );
        this.id = rows[0].id;
        this.createdDate = rows[0].created_date;
        consol.model(
            `le ClientAdresse id ${this.id} avec comme adresse ${this.ligne1} ${this.ligne2} ${this.ligne3} a été inséré à la date du ${this.createdDate} !`
        );

        return new ClientAdresse(rows[0]);
    }




    /**
     * Méthode chargé d'aller mettre à jour les informations relatives à un ClientAdresse passé en paramétre
     * @param prenom - prenom pour la livraison
     * @param nomFamille - nom de famille pour la livraison
     * @param ligne1 - ligne de l'dresse
     * @param ligne2 - ligne de l'adresse
     * @param ligne3 - ligne de l'adresse
     * @param telephone - le téléphone d'un client pour le transporteur
     * @param titre - le titre d'une adresse d'un client
     * @param idClient - l'identifiant d'un client
     * @param idVille - l'identifiant d'une ville 
     * @param id - l'identifiant d'une adresse a modifié
     * @returns - les informations du ClientAdresse mis à jour
     * @async - une méthode asynchrone
     */
    async update() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.client_adresse SET prenom = $1, nom_famille = $2, ligne1 = $3, ligne2 = $4, ligne3 = $5, telephone = $6, titre = $7, updated_date = now(), id_client = $8, id_ville = $9 WHERE id = $10 RETURNING *;`,
            [this.prenom, this.nomFamille, this.ligne1, this.ligne2, this.ligne3, this.telephone, this.titre, this.idClient, this.idVille, this.id]
        );
        console.log("this dans le model ==>", this);
        console.log("rows[0] dans le model ==>", rows[0]);

        this.updatedDate = rows[0].updated_date;
        console.log(
            `le ClientAdresse id : ${this.id} du client id ${this.idClient}, avec le nom ${this.prenom} ${this.nomFamille} a été mise à jour le ${this.updatedDate}  !`
        );
        return new ClientAdresse(rows[0]);


    }


    /**
     * Méthode chargé d'aller supprimer l'adresse d'un client via l'id passé en paramétre
     * @param id - l'id d'une adresse
     * @returns - les informations du ClientAdresse qui viennent d'être supprimés.
     * @async - une méthode asynchrone
     */
    async delete() {
        const {
            rows
        } = await db.query('DELETE FROM mada.client_adresse WHERE client_adresse.id = $1 RETURNING *;', [
            this.id,
        ]);
        consol.model(`le ClientAdresse id ${this.id} a été supprimé !`);

        return new ClientAdresse(rows[0]);
    }

    /**
     * Méthode chargé d'aller supprimer l'adresse d'un client via l'idClient passé en paramétre
     * @param idClient - l'id d'un client
     * @returns - les informations du ClientAdresse qui viennent d'être supprimés.
     * @async - une méthode asynchrone
     */
    async deleteByIdClient() {


        const {
            rows
        } = await db.query('DELETE FROM mada.client_adresse WHERE client_adresse.id_client = $1 RETURNING *;', [
            this.idClient
        ]);
        consol.model(`l'adresse du client id ${this.idClient} a été supprimé !`);

        return rows.map((deletedAdresse) => new ClientAdresse(deletedAdresse));
    }

}

module.exports = ClientAdresse;