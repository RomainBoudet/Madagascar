const db = require('../database');
const consol = require('../services/colorConsole');

class Adresse {


    id;
    titre;
    prenom;
    nomFamille;
    ligne1;
    ligne2;
    ligne3;
    codePostal;
    ville;
    pays;
    telephone;
    envoie;
    facturation;
    createdDate;
    updatedDate;
    idClient;





    set nom_famille(val) {
        this.nomFamille = val;
    }
    set code_postal(val) {
        this.codePostal = val;
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

    /*   set adresse_titre(val) {
         this.adresseTitre = val;
     } */

    set adresse_prenom(val) {
        this.adressePrenom = val;
    }

    set adresse_nomfamille(val) {
        this.adresseNomFamille = val;
    }

    set id_adresse(val) {
        this.idAdresse = val;
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
     * @returns - tous les Adresses présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAllPlus() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.view_adresse');

        if (!rows[0]) {
            throw new Error("Aucun Adresse dans la BDD");
        }
        consol.model(
            `les informations des ${rows.length} Adresses ont été demandé !`
        );

        return rows.map((clientAdresse) => new Adresse(clientAdresse));
    }

    /**
     * Méthode chargé d'aller chercher les informations relatives à un Adresse passé en paramétre
     * @param id - un id d'un Adresse
     * @returns - les informations du Adresse demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOnePlus(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.view_adresse WHERE id_adresse = $1;',
            [id]
        );

        if (!rows[0]) {
            return null;
        }

        consol.model(
            `le Adresse id : ${id} a été demandé en BDD !`
        );

        return new Adresse(rows[0]);
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à un Adresse passé en paramétre
     * @param id - un id d'un Adresse
     * @returns - les informations du Adresse demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOneForUpdate(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.adresse WHERE id = $1;',
            [id]
        );

        if (!rows[0]) {
            return null;
        }

        consol.model(
            `le Adresse id : ${id} a été demandé en BDD !`
        );

        return new Adresse(rows[0]);
    }

    /**
     * Méthode chargé d'aller chercher toutes les adresses d'un client passé en paramétre
     * @param id - un id d'un client
     * @returns - les informations du client demandé
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findByIdClient(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.view_adresse WHERE id_client = $1;',
            [id]
        );
        if (!rows[0]) {
            return null
        }

        consol.model(
            `les adresses pour le client id : ${id} ont été demandé en BDD !`
        );

        return rows.map((adresse) => new Adresse(adresse));
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à un Adresse passé en paramétre
     * @param id - un id d'un Adresse
     * @returns - les informations du Adresse demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findByIdClientsansJointure(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.adresse WHERE id_client = $1;',
            [id]
        );

        if (!rows[0]) {
            return null
        }

        consol.model(
            `les adresses pour le client id : ${id} ont été demandé en BDD !`
        );

        return rows.map((adresse) => new Adresse(adresse));
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à la derniére adresse saisie d'un client
     * @param id - un id d'un client
     * @returns - les informations de l'Adresse demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findLastAdresseByIdClient(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.adresse WHERE id_client = $1 ORDER BY adresse.id DESC LIMIT 1;',
            [id]
        );

        if (!rows[0]) {
            return null
        }

        consol.model(
            `La derniére adresse du client id : ${id} a été demandé en BDD !`
        );

        return new Adresse(rows[0]);
    }


    /**
     * Méthode chargé d'aller chercher les informations relatives à un titre d'adresse passé en paramétre
     * @param titre - un titre d'une adresse d'un Adresse
     * @returns - les informations du Adresse demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findByTitre(titre, idClient) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.adresse WHERE adresse.titre  = $1 and id_client = $2;',
            [titre, idClient]
        );

        if (!rows[0]) {
            console.log("Aucune adresse avec ce titre n'éxiste déja pour cette utilisateur.")
            return null;
        }

        consol.model(
            `l'adresse avec pour titre : ${titre} a été demandée en BDD !`
        );

        return new Adresse(rows[0]);
    }

    /**
     * Méthode chargé d'aller chercher les informations relatives à une adresse avec TRUE dans la colonne Envoi pour un utilisateur donné
     * @param id - un id d'une adresse
     * @returns - les informations du Adresse demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findByEnvoiTrue(idClient) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.adresse WHERE adresse.id_client = $1 and adresse.envoie = TRUE;',
            [idClient]
        );

        if (!rows[0]) {
            console.log("Aucune adresse avec envoi TRUE n'éxiste déja pour cette utilisateur.")
            return null;
        }

        /* consol.model(
            `l'adresse avec pour envoi TRUE pour le client id : ${idClient} a été demandée en BDD !`
        ); */

        return new Adresse(rows[0]);
    }

    /**
     * Méthode chargé d'aller chercher les informations relatives à une adresse avec TRUE dans la colonne Facturation pour un utilisateur donné
     * @param id - un id d'une adresse
     * @returns - les informations du Adresse demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findByFacturationTrue(idClient) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.adresse WHERE adresse.id_client = $1 and adresse.facturation = TRUE;',
            [idClient]
        );

        if (!rows[0]) {
            console.log("Aucune adresse avec facturation TRUE n'éxiste déja pour cette utilisateur.")
            return null;
        }

        /* consol.model(
            `l'adresse avec pour facturation TRUE pour le client id : ${idClient} a été demandée en BDD !`
        ); */

        return new Adresse(rows[0]);
    }



    /**
     * Méthode chargé d'aller chercher les informations relatives à une adresse avec TRUE dans la colonne Envoi pour un utilisateur donné
     * @param id - un id d'une adresse
     * @returns - les informations du Adresse demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    async updateEnvoieNull() {


        const {
            rows,
        } = await db.query(
            'UPDATE mada.adresse SET envoie = NULL WHERE id  = $1 RETURNING * ;',
            [this.id]
        );

        if (!rows[0]) {
            console.log(`Aucune adresse avec envoi TRUE n'as été passé a null pour l'adresse  ${this.id}.`)
            return null;
        }

        consol.model(
            `l'adresse avec pour envoi TRUE pour l'adresse  ${this.id} a été passé a NULL en BDD !`
        );

        return new Adresse(rows[0]);
    }

    /**
     * Méthode chargé d'aller chercher les informations relatives à une adresse avec TRUE dans la colonne Facturation pour un utilisateur donné
     * @param id - un id d'une adresse
     * @returns - les informations du Adresse demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    async updateFacturationNull() {


        const {
            rows,
        } = await db.query(
            'UPDATE mada.adresse SET facturation = NULL WHERE id  = $1 RETURNING *;',
            [this.id]
        );

        if (!rows[0]) {
            console.log(`Aucune adresse avec facturation TRUE n'as été passé a null pour l'adresse ${this.id}.`)
            return null;
        }

        consol.model(
            `l'adresse avec pour facturation TRUE pour l'adresse ${this.id} a été passé a NULL en BDD !`
        );

        return new Adresse(rows[0]);
    }

    /**
     * Méthode chargé d'aller chercher les informations relatives à une adresse avec TRUE dans la colonne Envoi pour un utilisateur donné
     * @param id - un id d'une adresse
     * @returns - les informations du Adresse demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    async updateEnvoieTrue() {


        const {
            rows,
        } = await db.query(
            'UPDATE mada.adresse SET envoie = TRUE WHERE id  = $1 RETURNING * ;',
            [this.id]
        );
        if (!rows[0]) {
            console.log(`Aucune adresse avec envoi TRUE n'as été passé a null pour l'adresse ${this.id}.`)
            return null;
        }


        consol.model(
            `l'adresse avec pour envoi TRUE pour l'adresse ${this.id} a été passé a NULL en BDD !`
        );

        return new Adresse(rows[0]);
    }

    /**
     * Méthode chargé d'aller chercher les informations relatives à une adresse avec TRUE dans la colonne Facturation pour un utilisateur donné
     * @param id - un id d'une adresse
     * @returns - les informations du Adresse demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    async updateFacturationTrue() {


        const {
            rows,
        } = await db.query(
            'UPDATE mada.adresse SET facturation = TRUE WHERE id  = $1 RETURNING * ;',
            [this.id]
        );

        if (!rows[0]) {
            console.log(`Aucune adresse avec facturation TRUE n'as été passé a null pour l'adresse ${this.id}.`)
            return null;
        }

        consol.model(
            `l'adresse avec pour facturation TRUE pour l'adresse ${this.id} a été passé a NULL en BDD !`
        );

        return new Adresse(rows[0]);
    }



    /**
     * Méthode chargé d'aller chercher les informations relatives à un Adresse passé en paramétre
     * @param id - un id d'un Adresse
     * @returns - les informations du Adresse demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findOne(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.adresse WHERE adresse.id = $1;',
            [id]
        );

        if (!rows[0]) {
            return null;
        }

        consol.model(
            `le Adresse id : ${id} a été demandé en BDD !`
        );

        return new Adresse(rows[0]);
    }



    /**
     * Méthode chargé d'aller chercher toutes les informations relatives à tous les adresses de clients
     * @returns - tous les Adresses présent en BDD
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findAll() {
        const {
            rows
        } = await db.query('SELECT * FROM mada.adresse ORDER BY adresse.id ASC');

        if (!rows[0]) {
            throw new Error("Aucun Adresse dans la BDD");
        }
        consol.model(
            `les informations des ${rows.length} Adresses ont été demandé !`
        );

        return rows.map((clientAdresse) => new Adresse(clientAdresse));
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
     * @param ville -
     * @param pays -
     * @param codePostal -
     * @param idClient - l'identifiant d'un client
     * @returns - les informations du Adresse demandées
     * @async - une méthode asynchrone
     */
    async save() {

        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.adresse (titre, prenom, nom_famille, ligne1, ligne2, ligne3, code_postal, ville, pays, telephone, created_date, id_client) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), $11) RETURNING *;`,
            [this.titre, this.prenom, this.nomFamille, this.ligne1, this.ligne2, this.ligne3, this.codePostal, this.ville, this.pays, this.telephone, this.idClient]
        );
        this.id = rows[0].id;
        this.createdDate = rows[0].created_date;
        consol.model(
            `l'Adresse id ${this.id} avec comme adresse ${this.ligne1} ${this.ligne2} ${this.ligne3} a été inséré à la date du ${this.createdDate} !`
        );

        return new Adresse(rows[0]);
    }


    /**
     * Méthode chargé d'aller insérer les informations relatives à une adresse de client 
     * @param prenom - prenom pour la livraison
     * @param nomFamille - nom de famille pour la livraison
     * @param ligne1 - ligne de l'dresse
     * @param ligne2 - ligne de l'adresse
     * @param ligne3 - ligne de l'adresse
     * @param telephone - le téléphone d'un client pour le transporteur
     * @param envoie - si l'adresse de facturation peut également être utilisé pour l'envoie.
     * @param titre - le titre d'une adresse d'un client
     * @param ville -
     * @param pays -
     * @param codePostal -
     * @param idClient - l'identifiant d'un client
     * @returns - les informations du Adresse demandées
     * @async - une méthode asynchrone
     */
    async saveWithEnvoie() {

        const {
            rows,
        } = await db.query(
            `INSERT INTO mada.adresse (titre, prenom, nom_famille, ligne1, ligne2, ligne3, code_postal, ville, pays, telephone, envoie, created_date, id_client) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, now(), $11) RETURNING *;`,
            [this.titre, this.prenom, this.nomFamille, this.ligne1, this.ligne2, this.ligne3, this.codePostal, this.ville, this.pays, this.telephone, this.idClient]
        );
        this.id = rows[0].id;
        this.createdDate = rows[0].created_date;
        consol.model(
            `le Adresse id ${this.id} avec comme adresse ${this.ligne1} ${this.ligne2} ${this.ligne3} a été inséré à la date du ${this.createdDate} !`
        );

        return new Adresse(rows[0]);
    }




    /**
     * Méthode chargé d'aller mettre à jour les informations relatives à un Adresse passé en paramétre
     * @param prenom - prenom pour la livraison
     * @param nomFamille - nom de famille pour la livraison
     * @param ligne1 - ligne de l'dresse
     * @param ligne2 - ligne de l'adresse
     * @param ligne3 - ligne de l'adresse
     * @param telephone - le téléphone d'un client pour le transporteur
     * @param titre - le titre d'une adresse d'un client
     * @param ville -
     * @param pays -
     * @param codePostal -
     * @param idClient - l'identifiant d'un client
     * @param id - l'identifiant d'une adresse a modifié
     * @returns - les informations du Adresse mis à jour
     * @async - une méthode asynchrone
     */
    async update() {

        const {
            rows,
        } = await db.query(
            `UPDATE mada.adresse SET titre = $1, prenom = $2, nom_famille = $3, ligne1 = $4, ligne2 = $5, ligne3 = $6, code_postal = $7, ville = $8, pays =$9, telephone = $10, envoie = $11, updated_date = now(), id_client = $12 WHERE id = $13 RETURNING *;`,
            [this.titre, this.prenom, this.nomFamille, this.ligne1, this.ligne2, this.ligne3, this.codePostal, this.ville, this.pays, this.telephone, this.envoie, this.idClient, this.id]
        );

        this.updatedDate = rows[0].updated_date;
        console.log(
            `l'adresse id : ${this.id} du client id ${this.idClient}, avec le nom ${this.prenom} ${this.nomFamille} a été mise à jour le ${this.updatedDate}  !`
        );
        return new Adresse(rows[0]);


    }


    /**
     * Méthode chargé d'aller mettre à jour la valeur de la colonne envoie pour l'envoie d'un colis a l'utilisateur
     * @param id - l'identifiant d'une adresse a modifié
     * @returns - les informations du Adresse mis à jour
     * @async - une méthode asynchrone
     */
    async envoieTrue() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.adresse SET envoie = TRUE WHERE id = $1 RETURNING *;`,
            [this.id]
        );
        this.envoie = rows[0].envoie;
        console.log(
            `La valeur envoie de l'Adresse id : ${this.id} a été passé a ${this.envoie} avec succés !`
        );

        return new Adresse(rows[0]);

    }

    /**
     * Méthode chargé d'aller mettre à jour la valeur de la colonne envoie pour l'envoie d'un colis a l'utilisateur
     * @param id - l'identifiant d'une adresse a modifié
     * @returns - les informations du Adresse mis à jour
     * @async - une méthode asynchrone
     */
    async envoieNull() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.adresse SET envoie = NULL WHERE id = $1 RETURNING *;`,
            [this.id]
        );
        this.envoie = rows[0].envoie;
        console.log(
            `La valeur envoie de l'Adresse id : ${this.id} a été passé a ${this.envoie} avec succés !`
        );

        return new Adresse(rows[0]);

    }



    /**
     * Méthode chargé d'aller mettre à jour la valeur de la colonne facturation pour l'envoie d'un colis a l'utilisateur
     * @param id - l'identifiant d'une adresse a modifié
     * @returns - les informations du Adresse mis à jour
     * @async - une méthode asynchrone
     */
    async facturationTrue() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.adresse SET facturation = TRUE WHERE id = $1 RETURNING *;`,
            [this.id]
        );
        this.facturation = rows[0].facturation;
        console.log(
            `La valeur facturation de l'adresse id : ${this.id} a été passé a ${this.facturation} avec succés !`
        );

        return new Adresse(rows[0]);

    }

    /**
     * Méthode chargé d'aller mettre à jour la valeur de la colonne facturation pour l'envoie d'un colis a l'utilisateur
     * @param id - l'identifiant d'une adresse a modifié
     * @returns - les informations du Adresse mis à jour
     * @async - une méthode asynchrone
     */
    async facturationNull() {
        const {
            rows,
        } = await db.query(
            `UPDATE mada.adresse SET facturation = NULL WHERE id = $1 RETURNING *;`,
            [this.id]
        );
        this.facturation = rows[0].facturation;
        console.log(
            `La valeur facturation de l'adresse id : ${this.id} a été passé a ${this.facturation} avec succés !`
        );

        return new Adresse(rows[0]);

    }

    /**
     * Méthode chargé d'aller chercher les informations relatives à un id client passé en paramétre
     * @param id - un id d'un client
     * @returns - les informations du Adresse demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findByEnvoie(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.adresse WHERE id_client = $1  AND envoie = TRUE ;',
            [id]
        );

        if (!rows[0]) {
            console.log("Aucune adresse avec cet id et la valeur TRUE de l'envoie n'éxiste.")
            return null;
        }

        consol.model(
            `l'adresse avec pour client id : ${id} et la valeur true de l'envoie a été demandée en BDD !`
        );

        return new Adresse(rows[0]);
    }

    /**
     * Méthode chargé d'aller chercher les informations relatives à un id client passé en paramétre
     * @param id - un id d'un client
     * @returns - les informations du Adresse demandées
     * @static - une méthode static
     * @async - une méthode asynchrone
     */
    static async findByFacturation(id) {


        const {
            rows,
        } = await db.query(
            'SELECT * FROM mada.adresse WHERE id_client = $1  AND facturation = TRUE ;',
            [id]
        );

        if (!rows[0]) {
            console.log("Aucune adresse avec cet id et la valeur TRUE de la facturation n'éxiste.")
            return null;
        }

        consol.model(
            `l'adresse avec pour client id : ${id} et la valeur true de la facturation a été demandée en BDD !`
        );

        return new Adresse(rows[0]);
    }




    /**
     * Méthode chargé d'aller supprimer l'adresse d'un client via l'id passé en paramétre
     * @param id - l'id d'une adresse
     * @returns - les informations du Adresse qui viennent d'être supprimés.
     * @async - une méthode asynchrone
     */
    async delete() {
        const {
            rows
        } = await db.query('DELETE FROM mada.adresse WHERE adresse.id = $1 RETURNING *;', [
            this.id,
        ]);
        consol.model(`l'adresse id ${this.id} a été supprimé !`);

        return new Adresse(rows[0]);
    }

    /**
     * Méthode chargé d'aller supprimer l'adresse d'un client via l'idClient passé en paramétre
     * @param idClient - l'id d'un client
     * @returns - les informations du Adresse qui viennent d'être supprimés.
     * @async - une méthode asynchrone
     */
    async deleteByIdClient() {


        const {
            rows
        } = await db.query('DELETE FROM mada.adresse WHERE adresse.id_client = $1 RETURNING *;', [
            this.idClient
        ]);
        consol.model(`Toutes les adresses du client id ${this.idClient} ont été supprimé !`);

        return rows.map((deletedAdresse) => new Adresse(deletedAdresse));
    }

}

module.exports = Adresse;