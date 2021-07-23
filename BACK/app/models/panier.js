const db = require('../database');
const consol = require('../services/colorConsole');

class Panier {

  id;
  total;
  createdDate;
  updatedDate;
  idClient;

  set created_date(val) {
    this.createdDate = val;
  }

  set updated_date(val) {
    this.updatedDate = val;
  }

  set id_client(val) {
    this.idClient = val;
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
   * Méthode chargé d'aller chercher toutes les informations relatives à tous les paniers
   * @returns - tous les paniers présent en BDD
   * @static - une méthode static
   * @async - une méthode asynchrone
   */
  static async findAll() {
    const {
      rows
    } = await db.query('SELECT * FROM mada.panier ORDER BY panier.id ASC');

    if (!rows[0]) {
      throw new Error("Aucun panier dans la BDD");
    }
    consol.model(
      `les informations des ${rows.length} paniers ont été demandé !`
    );

    return rows.map((panier) => new Panier(panier));
  }


  /**
   * Méthode chargé d'aller chercher les informations relatives à un panier passé en paramétre
   * @param id - un id d'un panier
   * @returns - les informations du panier demandées
   * @static - une méthode static
   * @async - une méthode asynchrone
   */
  static async findOne(id) {


    const {
      rows,
    } = await db.query(
      'SELECT * FROM mada.panier WHERE panier.id = $1;',
      [id]
    );

    if (!rows[0]) {
      throw new Error("Aucun panier avec cet id");
    }

    consol.model(
      `le panier id : ${id} a été demandé en BDD !`
    );

    return new Panier(rows[0]);
  }

  /**
   * Méthode chargé d'aller chercher les informations relatives à un panier passé en paramétre
   * @param idClient - un idClient d'un client_historique_connexion
   * @returns - les informations du panier demandées
   * @static - une méthode static
   * @async - une méthode asynchrone
   */
  static async findByIdClient(idClient) {


    const {
      rows,
    } = await db.query(
      'SELECT * FROM mada.panier WHERE panier.id_client = $1;',
      [idClient]
    );

    if (!rows[0]) {
      throw new Error("Aucun panier avec cet idClient");
    }

    consol.model(
      `l'historique de panier pour le idClient : ${idClient} a été demandé en BDD !`
    );

    return rows.map((clientHistoConn) => new Panier(clientHistoConn));
  }



  /**
   * Méthode chargé d'aller insérer les informations relatives à un panier passé en paramétre
   * @param total  - le montant total d'un panier
   * @param idClient - l'identifiant Client lié a un panier
   * @returns - les informations du panier demandées
   * @async - une méthode asynchrone
   */
  async save() {
    const {
      rows,
    } = await db.query(
      `INSERT INTO mada.panier (total, id_client) VALUES ($1,$2) RETURNING *;`,
      [this.total, this.idClient]
    );

    this.id = rows[0].id;
    this.createdDate = rows[0].created_date;
    consol.model(
      `le panier id ${this.id} a été inséré à la date du ${this.createdDate} !`
    );
  }



  /**
   * Méthode chargé d'aller mettre à jour les informations relatives à un panier passé en paramétre
   * @param total  - le montant total d'un panier
   * @param idClient - l'identifiant Client lié a un panier
   * @param id - l'identifiant d'un panier
   * @returns - les informations du panier mis à jour
   * @async - une méthode asynchrone
   */
  async update() {
    const {
      rows,
    } = await db.query(
      `UPDATE mada.panier SET total = $1, id_client = $2, updated_date = now() WHERE id = $3 RETURNING *;`,
      [this.total, this.idClient, this.id]
    );
    this.updatedDate = rows[0].updated_date;
    console.log(
      `le panier id : ${this.id} appartenant au client id ${this.idClient} a été mise à jour le ${this.updatedDate} !`
    );
  }
  /**
   * Méthode chargé d'aller supprimer un panier passé en paramétre
   * @param id - l'id d'un article
   * @async - une méthode asynchrone
   */
  async delete() {
    const {
      rows
    } = await db.query('DELETE FROM mada.panier WHERE panier.id = $1 RETURNING *;', [
      this.id,
    ]);
    consol.model(`le panier id ${this.id} a été supprimé !`);

    return new Panier(rows[0]);
  }

  /**
     * Méthode chargé d'aller supprimer un panier passé en paramétre
     * Afin de supprimer plus facilement toute trace d'un client si demande de suppression de compte. A voir si je la garde dans le temps...
     * @param idClient - l'id d'un client d'un historique de connexion
     * @async - une méthode asynchrone
     */
   async deleteByIdClient() {


    const {
        rows
    } = await db.query('DELETE FROM mada.panier WHERE panier.id_client = $1 RETURNING *;', [
        this.idClient
    ]);
    consol.model(`l'historique de panier du client id ${this.idClient}  a été supprimé !`);
    
    return rows.map((deletedClient) => new Panier(deletedClient));
}


}

module.exports = Panier;