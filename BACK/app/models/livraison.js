const db = require('../database');
const consol = require('../services/colorConsole');

class Livraison {

    id;
    fraisExpedition;
    nomTransporteur;
    description;
    numeroSuivi;
    URLSuivi;
    poid;
    createdDate;
    updatedDate;
    estimeArrive;
    idClient;
    idCommande;

    set frais_expedition(val) {
        this.fraisExpedition = val;
    }

    set nom_transporteur(val) {
        this.nomTransporteur = val;
    }

    set numero_suivi(val) {
        this.numeroSuivi = val;
    }
    set url_suivi(val) {
        this.URLSuivi = val;
    }
    set created_date(val) {
        this.createdDate = val;
    }

    set updated_date(val) {
        this.updatedDate = val;
    }
    set estime_arrive(val) {
        this.estimeArrive = val;
    }
    set id_client(val) {
        this.idClient = val;
    }
    set id_commande(val) {
        this.idCommande = val;
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
     * Méthode chargé d'aller chercher les informations relatives à tous les livraisons
     * @returns - tous les livraisons présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAll() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.livraison ORDER BY livraison.id ASC');

        if (!rows[0]) {
            throw new Error("Aucun livraisons dans la BDD");
        }
        consol.model(
            `les informations des ${rows.length} livraisons ont été demandées !`
        );

        return rows.map((livraison) => new Livraison(livraison));
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à une livraison via son id passée en paramétre
     * @param - un id d'une livraison
     * @returns - les informations d'une livraison demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOne(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.livraison WHERE livraison.id = $1;',
            [id]
        );

        if (!rows[0]) {
            throw new Error("Aucun livraison avec cet id");
        }

        consol.model(
            `la livraison id : ${id} a été demandé en BDD !`
        );

        return new Livraison(rows[0]);
    }



    /**
     * Méthode chargé d'aller chercher les informations relatives à un idLivraison passé en paramétre
     * @param idClient - un idLivraison d'une livraison
     * @returns - les informations d'une livraison demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findByIdClient(idClient) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.livraison WHERE livraison.id_client = $1;',
            [idClient]
        );

        if (!rows[0]) {
            throw new Error("Aucune livraison avec cet idClient");
        }

        consol.model(
            `la ou les livraisons avec l'idClient : ${idClient} ont été demandé en BDD !`
        );

        return rows.map((id) => new Livraison(id));
    }

    /**
     * Méthode chargé d'aller chercher les informations relatives à un idLivraison passé en paramétre
     * @param idCommande - un identifiant d'une commande lié a une livraison
     * @returns - les informations d'une livraison demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
     static async findByIdCommande(idCommande) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.livraison WHERE livraison.id_commande = $1;',
            [idCommande]
        );

        if (!rows[0]) {
            throw new Error("Aucune livraison avec cet idCommande");
        }

        consol.model(
            `la ou les livraisons avec l'idCommande : ${idCommande} ont été demandé en BDD !`
        );

        return rows.map((id) => new Livraison(id));
    }

    /**
     * Méthode chargé d'aller insérer les informations relatives à une livraison passé en paramétre
     * @param fraisExpedition - les frais d'expédition d'une livraison
     * @param nomTransporteur - le nom du transporteur de la livraison
     * @param description
     * @param numeroSuivi
     * @param URLSuivi
     * @param poid
     * @param createdDate
     * @param estimeArrive
     * @param idClient
     * @param idCommande
     * @returns - les informations d'une livraison qui viennent d'être inséreés
     * @async - une méthode asynchrone
     */
    async save() {

        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.livraison (frais_expedition, nom_transporteur, description, numero_suivi, URL_suivi, poid, estime_arrive, id_client, id_commande) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *;`,
            [this.fraisExpedition, this.nomTransporteur, this.description, this.numeroSuivi, this.URLSuivi, this.poid, this.estimeArrive, this.idClient, this.idCommande]
        );

        this.id = rows[0].id;
        this.createdDate = rows[0].created_date;
        consol.model(
            `la livraison id ${this.id} a été inséré à la date du ${this.createdDate} avec comme nom de transporteur ${this.nomTransporteur} !`
        );
    }

    /**
     * Méthode chargé d'aller mettre à jour les informations relatives à une livraison passé en paramétre
     * @param fraisExpedition - les frais d'expédition d'une livraison
     * @param nomTransporteur - le nom du transporteur de la livraison
     * @param description
     * @param numeroSuivi
     * @param URLSuivi
     * @param poid
     * @param createdDate
     * @param estimeArrive
     * @param idClient
     * @param idCommande
     * @param id - l'identifiant du champs a mettre a jour
     * @returns - les informations du livraison mis à jour
     * @async - une méthode asynchrone
     */
    async update() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.livraison SET frais_expedition = $1, nom_transporteur = $2, description = $3, numero_suivi = $4, URL_suivi = $5, poid = $6, updated_date = now(), estime_arrive = $7, id_client = $8, id_commande = $9  WHERE id = $10 RETURNING *;`,
            [this.fraisExpedition, this.nomTransporteur, this.description, this.numeroSuivi, this.URLSuivi, this.poid, this.estimeArrive, this.idClient, this.idCommande, this.id]
        );
        this.updatedDate = rows[0].updated_date;
        console.log(
            `la livraison id ${this.id} avec le nom du transporteur ${this.nomTransporteur} pour le client id ${this.idClient} et la commande ${this.idCommande} a été mise à jour le ${this.updatedDate} !`
        );
    }




    /**
     * Méthode chargé d'aller supprimer une livraison passé en paramétre
     * @param id - l'id d'une livraison
     * @async - une méthode asynchrone
     */
    async delete() {
        const {
            rows
        } = await db.query('DELETE FROM mada.livraison WHERE livraison.id = $1 RETURNING *;', [
            this.id,
        ]);
        consol.model(`la livraison id ${this.id} a été supprimé !`);

        return new Livraison(rows[0]);
    }

    /**
     * Méthode chargé d'aller supprimer une livraison  via l'idClientpassé en paramétre
     * @param idClient - l'id d'une livraison
     * @returns - les informations du livraison qui viennent d'être supprimés.
     * @async - une méthode asynchrone
     */
    async deleteByIdClient() {
        const {
            rows
        } = await db.query('DELETE FROM mada.livraison WHERE livraison.id_client = $1 RETURNING *;', [
            this.idClient
        ]);

        //this.id = rows[0].id;
        consol.model(`la ou les livraisons avec l'idClient ${this.idClient} a / ont été supprimé ! `);

        return rows.map((deletedLivraison) => new Livraison(deletedLivraison));
    }

    /**
     * Méthode chargé d'aller supprimer une livraison  via l'idCommande passé en paramétre
     * @param idCommande - l'id d'une livraison
     * @returns - les informations du livraison qui viennent d'être supprimés.
     * @async - une méthode asynchrone
     */
     async deleteByIdCommande() {
        const {
            rows
        } = await db.query('DELETE FROM mada.livraison WHERE livraison.id_commande = $1 RETURNING *;', [
            this.idCommande
        ]);

        //this.id = rows[0].id;
        consol.model(`la ou les livraisons avec l'idClient ${this.idCommande} a / ont été supprimé ! `);

        return rows.map((deletedLivraison) => new Livraison(deletedLivraison));
    }



}

module.exports = Livraison;