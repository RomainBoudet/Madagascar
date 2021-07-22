const db = require('../database');
const bcrypt = require('bcrypt');
const consol = require('../services/colorConsole');

class Client {

  id;
  prenom ;
  nomFamille;
  email;
  password;
  createdDate;
  updatedDate;
  idPrivilege;

  set created_date(val) {
    this.createdDate = val;
  }

  set updated_date(val) {
    this.updatedDate = val;
  }

  set nom_famille(val) {
    this.nomFamille = val;
  }

  set id_privilege(val) {
    this.idPrivilege = val;
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
   * Méthode chargé d'aller chercher toutes les informations relatives à tous les clients
   * @returns - tous les clients présent en BDD
   * @static - une méthode static
   * @async - une méthode asynchrone
   */
  static async findAll() {
    const {
      rows
    } = await db.query('SELECT * FROM mada.client ORDER BY client.id ASC');

    if (!rows[0]) {
      throw new Error("Aucun client dans la BDD");
    }
    consol.model(
      `les informations des ${rows.length} clients ont été demandé !`
    );

    return rows.map((client) => new Client(client));
  }


  /**
   * Méthode chargé d'aller chercher les informations relatives à un client passé en paramétre
   * @param id - un id d'un client
   * @returns - les informations du client demandées
   * @static - une méthode static
   * @async - une méthode asynchrone
   */
  static async findOne(id) {


    const {
      rows,
    } = await db.query(
      'SELECT * FROM mada.client WHERE client.id = $1;',
      [id]
    );

    if (!rows[0]) {
      throw new Error("Aucun client avec cet id");
    }

    consol.model(
      `le client id : ${id} a été demandé en BDD !`
    );

    return new Client(rows[0]);
  }

  /**
   * Méthode chargé d'aller chercher les informations relatives à un client passé en paramétre
   * @param - un email d'un client
   * @returns - les informations du client demandées
   * @static - une méthode static
   * @async - une méthode asynchrone
   */
  static async findByEmail(email) {

    const {
      rows,
    } = await db.query(
      `SELECT * FROM mada.client WHERE client.email = $1;;`,
      [email]
    );

    if (!rows[0]) {
      consol.model("Aucun client avec cet email");
    } else {
      consol.model(
        `le client avec l'email : ${email} a été demandé !`
      );
    }
    return new Client(rows[0]);
  }

/**
   * Méthode chargé d'aller authentifier un client passé en paramétre
   * @param - un email d'un client
   * @param - un password d'un client
   * @returns - les informations du client si il a put s'authentifier
   * @static - une méthode static
   * @async - une méthode asynchrone
   */
  static async authenticate(email, password) {

    const {
      rows,
    } = await db.query(
      `SELECT client.*, privilege.nom FROM mada.client JOIN mada.privilege ON privilege.id = client.id_privilege WHERE client.email = $1;`,
      [email]
    );
    if (!rows[0]) {
      consol.model("Aucun client avec cet email en BDD");
      return null
    } else {
      consol.model(
        `Une authentification à été demandé pour le client : ${email} !`
      );
      consol.model(`Le password de ${email} en BDD est ${rows[0].password} et celui proposé est ${password}.`);

      if (await bcrypt.compare(password, rows[0].password)) {
        consol.model(`l'utilisateur avec l'email ${email} a été authentifié avec succés !`);
        return new Client(rows[0])
      } else {
        consol.model(`Echec. L'utilisateur avec l'email ${email} n'a pas été authentifié !`);
        return null;
      }
    }
  }




  /**
   * Méthode chargé d'aller insérer les informations relatives à un utilisateur passé en paramétre
   * @param prenom - le prénom d'un client
   * @param nomFamille - le nom de famille d'un client
   * @param email  - l'email' d'un client
   * @param password - le password d'un client
   * @returns - les informations du client demandées
   * @async - une méthode asynchrone
   */
  async save() {
    const {
      rows,
    } = await db.query(
      `INSERT INTO mada.client (prenom, nom_famille, email, password) VALUES ($1,$2,$3,$4) RETURNING*;`,
      [this.prenom, this.nomFamille, this.email, this.password]
    );

    this.id = rows[0].id;
    this.createdDate = rows[0].created_date;
    consol.model(
      `le client id ${this.id} avec comme nom ${this.prenom} ${this.nomFamille} a été inséré à la date du ${this.createdDate} !`
    );
  }



  /**
  * Méthode chargé d'aller mettre à jour les informations relatives à un client passé en paramétre
  * @param prenom - le prénom d'un client
  * @param nomFamille - le nom de famille d'un client
  * @param email  - l'email' d'un client
  * @param password - le password d'un client
  * @returns - les informations du client mis à jour
  * @async - une méthode asynchrone
  */
  async update() {
    const {
      rows,
    } = await db.query(
      `UPDATE mada.client SET prenom = $1, nom_famille = $2, email = $3, password = $4, updated_date = now() WHERE id = $5 RETURNING *;`,
      [this.prenom, this.nomFamille, this.email, this.password, this.id]
    );

    console.log(
      `le client id : ${this.id} avec comme nom ${this.prenom} ${this.nomFamille} a été mise à jour !`
    );
  }
/**
  * Méthode chargé d'aller supprimer un client passé en paramétre
  * @param id - l'id d'un article
  * @async - une méthode asynchrone
  */
  async delete() {
    const {
      rows
    } = await db.query('DELETE FROM mada.client WHERE client.id = $1 RETURNING *;', [
      this.id,
    ]);
    consol.model(`le client id ${this.id} a été supprimé !`);

    return new Client(rows[0]);
  }


}

module.exports = Client;