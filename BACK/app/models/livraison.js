const db = require('../database');
const consol = require('../services/colorConsole');

class Livraison {

    id;
    reference;
    numeroSuivi;
    URLSuivi;
    poid;
    idClient;
    idCommande;
    idTransporteur;
    createdDate;
    updatedDate;

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
    set id_transporteur(val) {
        this.idTransporteur = val;
    }









    // pour la vue mada.view_livraisons

    set id_livraison(val) {
        this.idlivraison = val;
    }
    set ref_livraison(val) {
        this.refLivraison = val;
    }
    set id_client(val) {
        this.idClient = val;
    }
    set client_prenom(val) {
        this.clientPrenom = val;
    }
    set client_nomfamille(val) {
        this.clientNomFamille = val;
    }
    set adresse_prenom(val) {
        this.adressePrenom = val;
    }
    set adresse_nomfamille(val) {
        this.adresseNomFamille = val;
    }
    set codepostal(val) {
        this.codePostal = val;
    }
    set ref_commande(val) {
        this.refCommande = val;
    }
    set ref_paiement(val) {
        this.refpaiement = val;
    }
    set montant_paiement(val) {
        this.montantPaiement = val;
    }
    set date_paiement(val) {
        this.datePaiement = val;
    }
    set date_livraison(val) {
        this.dateLivraison = val;
    }
    set quantite_commande(val) {
        this.quantiteCommande = val;
    }
    set prix_ht(val) {
        this.prixHT = val;
    }
    set image_mini(val) {
        this.imageMini = val;
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
    static async findAllPlus() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.view_livraisons;');

        if (!rows[0]) {
            return null;
        }
        consol.model(
            `les informations des ${rows.length} livraisons ont été demandées !`
        );

        return rows.map((livraison) => new Livraison(livraison));
    }

    /**
     * Méthode chargé d'aller chercher les informations relatives à tous les produits commandé /livré
     * @returns - tous les livraisons présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAllProduitLivrer() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.view_produit_livrer;');

        if (!rows[0]) {
            return null;
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
            return null;
        }

        consol.model(
            `la livraison id : ${id} a été demandé en BDD !`
        );

        return new Livraison(rows[0]);
    }

    /**
     * Méthode chargé d'aller chercher les informations relatives à une livraison via son id passée en paramétre
     * @param - un id d'une livraison
     * @returns - les informations d'une livraison demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOnePlus(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.view_produit_livrer WHERE id_client = $1;',
            [id]
        );

        if (!rows[0]) {
            return null;
        }

        consol.model(
            `la livraison id : ${id} a été demandé en BDD !`
        );

        return rows.map((livraison) => new Livraison(livraison));
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
            return null;
        }

        consol.model(
            `la ou les livraisons avec l'idClient : ${idClient} ont été demandé en BDD !`
        );

        return rows.map((id) => new Livraison(id));
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à un idLivraison passé en paramétre
     * @param idClient - un idLivraison d'une livraison
     * @returns - les informations d'une livraison demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findByIdTransporteur(idTransporteur) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.livraison WHERE livraison.id_transporteur = $1;',
            [idTransporteur]
        );

        if (!rows[0]) {
            return null;
        }

        consol.model(
            `la ou les livraisons avec l'idTransporteur : ${idTransporteur} ont été demandé en BDD !`
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
            'SELECT * FROM mada.view_produit_livrer WHERE id_livraison = $1;',
            [idCommande]
        );

        if (!rows[0]) {
            return null;
        }

        consol.model(
            `la ou les livraisons avec l'idCommande : ${idCommande} ont été demandé en BDD !`
        );

        return rows.map((id) => new Livraison(id));
    }

    /**
     * Méthode chargé d'aller insérer les informations relatives à une livraison passé en paramétre
     * @param numeroSuivi
     * @param URLSuivi
     * @param poid
     * @param createdDate
     * @param idClient
     * @param idCommande
     * @param idTransporteur
     * @returns - les informations d'une livraison qui viennent d'être inséreés
     * @async - une méthode asynchrone
     */
    async save() {

        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.livraison (reference, numero_suivi, URL_suivi, poid, created_date, id_client, id_commande, id_transporteur) VALUES ($1, $2, $3, $4, now(), $5, $6, $7) RETURNING *;`,
            [this.reference, this.numeroSuivi, this.URLSuivi, this.poid, this.idClient, this.idCommande, this.idTransporteur]
        );

        this.id = rows[0].id;
        this.createdDate = rows[0].created_date;
        consol.model(
            `la livraison id ${this.id} a été inséré à la date du ${this.createdDate} avec comme reference ${this.reference} !`
        );
    }

    /**
     * Méthode chargé d'aller mettre à jour les informations relatives à une livraison passé en paramétre
     * @param numeroSuivi
     * @param URLSuivi
     * @param poid
     * @param createdDate
     * @param idClient
     * @param idCommande
     * @param idTransporteur
     * @param id - l'identifiant du champs a mettre a jour
     * @returns - les informations du livraison mis à jour
     * @async - une méthode asynchrone
     */
    async update() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.livraison SET reference = $1, numero_suivi = $2, URL_suivi = $3, poid = $4, updated_date = now(), id_client = $5, id_commande = $6, id_transporteur = $7  WHERE id = $8 RETURNING *;`,
            [this.reference, this.numeroSuivi, this.URLSuivi, this.poid, this.idClient, this.idCommande, this.idTransporteur, this.id]
        );
        this.updatedDate = rows[0].updated_date;
        console.log(
            `la livraison id ${this.id} avec comme reference${this.reference} pour le client id ${this.idClient} et la commande ${this.idCommande} via le transporteur ${this.idTransporteur} a été mise à jour le ${this.updatedDate} !`
        );
    }




    /**
     * Méthode chargé d'aller supprimer un transporteur passé en paramétre
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