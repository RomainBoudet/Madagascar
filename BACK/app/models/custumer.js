const db = require('../database');
const bcrypt = require('bcrypt');
const consol = require('../services/colorConsole');

class Custumer {

  id;
  customerGender ;
  custumerFirstName ;
  custumerLastName;
  custumerEmail;
  custumerPhoneForAdminOnly;
  custumerPassword;
  custumerCreatedDate;
  custumerUpdatedDate;



  set custumer_gender(val) {
    this.customerGender = val;
  }

  set custumer_firstName(val) {
    this.customerFirstName = val;
  }

  set custumer_lastName(val) {
    this.customerLastName = val;
  }

  set custumer_email(val) {
    this.custumerEmail = val;
  }

  set custumer_phoneForAdminOnly(val) {
    this.custumerPhoneForAdminOnly = val;
  }

  set custumer_password(val) {
    this.custumerPassword = val;
  }

  set custumer_createdDate(val) {
    this.custumerCreatedDate = val;
  }

  set custumer_custumer_updatedDate(val) {
    this.custumerUpdatedDate = val;
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
    } = await db.query('SELECT custumer.*, privilege.privilege_name FROM mada.custumer JOIN mada.privilege ON privilege.id = custumer.id_privilege ORDER BY custumer.custumer_firstName ASC;');

    if (!rows[0]) {
      throw new Error("Aucun client dans la BDD");
    }
    consol.model(
      `les informations des ${rows.length} clients a été demandé !`
    );

    return rows.map((user) => new User(user));
  }


  /**
   * Méthode chargé d'aller chercher les informations relatives à un client passé en paramétre
   * @param - un id d'un client
   * @returns - les informations du client demandées
   * @static - une méthode static
   * @async - une méthode asynchrone
   */
  static async findOne(id) {


    const {
      rows,
    } = await db.query(
      'SELECT custumer.*, privilege.privilege_name FROM mada.custumer JOIN mada.privilege ON privilege.id = custumer.id_privilege WHERE custumer.id = $1;',
      [id]
    );

    if (!rows[0]) {
      throw new Error("Aucun client avec cet id");
    }

    consol.model(
      `le client id : ${id} a été demandé en BDD !`
    );

    return new User(rows[0]);
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
      `select * from mada.all_custumer where custumer_email = $1;`,
      [email]
    );

    if (!rows[0]) {
      consol.model("Aucun client avec cet email");
    } else {
      consol.model(
        `le client avec l'email : ${email} a été demandé !`
      );
    }
    return new User(rows[0]);
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
      `SELECT custumer.*, privilege.privilege_name FROM mada.custumer JOIN mada.privilege ON privilege.id = custumer.id_privilege WHERE custumer.custumerEmail = $1;;`,
      [email]
    );
    if (!rows[0]) {
      consol.model("Aucun client avec cet email en BDD");
      return null
    } else {
      consol.model(
        `Une authentification à été demandé pour le client : ${email} !`
      );
      consol.model(`Le password de ${email} en BDD est ${rows[0].custumerPassword} et celui proposé est ${password}.`);

      if (await bcrypt.compare(password, rows[0].custumerPassword)) {
        consol.model(`l'utilisateur avec l'email ${email} a été authentifié avec succés !`);
        return new User(rows[0])
      } else {
        consol.model(`l'utilisateur avec l'email ${email} n'a pas été authentifié !`);
        return null;
      }
    }
  }




  /**
   * Méthode chargé d'aller insérer les informations relatives à un utilisateur passé en paramétre
   * @param custumerGender - le genre d'un client
   * @param custumerFirstName - le prénom d'un client
   * @param custumerLastName - le nom de famille d'un client
   * @param custumerEmail  - l'email' d'un client
   * @param custumerPassword - le password d'un client
   * @param custumerPhoneForAdminOnly - le téléphone d'un "client" qui s'identifit avec un role d'admin
   * @returns - les informations du client demandées
   * @async - une méthode asynchrone
   */
  async save() {
    const {
      rows,
    } = await db.query(
      `INSERT INTO "user" (custumer_gender, custumer_firstName, custumer_lastName, custumer_email, custumer_password) VALUES ($1,$2,$3,$4,$5) RETURNING *;`,
      [this.custumerGender, this.custumerFirstName, this.custumerLastName, this.custumerEmail, this.custumerPassword]
    );

    this.id = rows[0].id;
    this.custumerCreatedDate = rows[0].custumerCreatedDate;
    consol.model(
      `le client id ${this.id} avec comme nom ${this.custumerFirstName} ${this.custumerLastName} a été inséré à la date du ${this.custumerCreatedDate} !`
    );
  }



  /**
  * Méthode chargé d'aller mettre à jour les informations relatives à un client passé en paramétre
  * @param custumerGender - le genre d'un client
  * @param custumerFirstName - le prénom d'un client
  * @param custumerLastName - le nom de famille d'un client
  * @param custumerEmail  - l'email' d'un client
  * @param custumerPassword - le password d'un client
  * @param custumerPhoneForAdminOnly - le téléphone d'un "client" qui s'identifit avec un role d'admin
  * @returns - les informations du client mis à jour
  * @async - une méthode asynchrone
  */
  async update() {
    const {
      rows,
    } = await db.query(
      `UPDATE mada.custumer SET custumer_gender = $1, custumer_firstName = $2, custumer_lastName = $3, custumer_email = $4, custumer_password = $5 WHERE id = $6 RETURNING *;`,
      [this.custumerGender, this.custumerFirstName, this.custumerLastName, this.custumerEmail, this.custumerPassword, this.id]
    );

    consol.model(
      `l'user id : ${this.id} avec comme nom ${this.custumerFirstName} ${this.custumerLastName} a été mise à jour !`
    );
  }

  async delete(id) {
    const {
      rows
    } = await db.query('DELETE FROM mada.custumer WHERE id = $1 RETURNING *;', [
      id,
    ]);
    consol.model(`le client id ${id} a été supprimé !`);

    return new User(rows[0]);
  }



  static async adminEmailVerified(id) {

    const {
      rows
    } = await db.query('UPDATE mada.adminVerification SET adminVerification_email=TRUE WHERE id = $1 RETURNING adminVerification_email;', [
      id,
    ]);

    this.adminVerificationEmail = rows[0].adminVerificationEmail;
    consol.model(`l'email de l'admin id: ${id} a bien été vérifié et est passé en statut ${this.adminVerificationEmail} !`);

    return new User(rows[0]);


  }



  async updatePwd() {
    const {
      rows,
    } = await db.query(`UPDATE mada.custumer SET password= $1 WHERE id = $2;`, [this.password, this.id]);

    consol.model(`Le password du client id ${this.id} a été mise à jour !`);
  }




}

module.exports = Custumer;