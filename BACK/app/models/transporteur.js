const db = require('../database');
const consol = require('../services/colorConsole');

class Transporteur {

  id;
  nom;
  description;
  fraisExpedition;
  estimeArrive;
  logo;
  createdDate;
  updatedDate;
  

  set frais_expedition(val) {
    this.fraisExpedition = val;
  }
  set estime_arrive(val) {
    this.estimeArrive = val;
  }
  set created_date(val) {
    this.createdDate = val;
  }
  set updated_date(val) {
    this.updatedDate = val;
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
   * Méthode chargé d'aller chercher toutes les informations relatives à tous les transporteurs
   * @returns - tous les transporteurs présent en BDD
   * @static - une méthode static
   * @async - une méthode asynchrone
   */
  static async findAll() {
    const {
      rows
    } = await db.query('SELECT * FROM mada.transporteur ORDER BY transporteur.id ASC');

    if (!rows[0]) {
      return null;
    }
    consol.model(
      `les informations des ${rows.length} transporteurs ont été demandé !`
    );

    return rows.map((transporteur) => new Transporteur(transporteur));
  }


  /**
   * Méthode chargé d'aller chercher les informations relatives à un transporteur passé en paramétre
   * @param id - un id d'un transporteur
   * @returns - les informations du transporteur demandées
   * @static - une méthode static
   * @async - une méthode asynchrone
   */
  static async findOne(id) {


    const {
      rows,
    } = await db.query(
      'SELECT * FROM mada.transporteur WHERE transporteur.id = $1;',
      [id]
    );

    if (!rows[0]) {
      throw new Error("Aucun transporteur avec cet id");
    }

    consol.model(
      `le transporteur id : ${id} a été demandé en BDD !`
    );

    return new Transporteur(rows[0]);
  }

  

  /**
   * Méthode chargé d'aller insérer les informations relatives à un transporteur passé en paramétre
   * @param nom  - le nom d'un transporteur
   * @param description - la description lié a un transporteur
   * @param fraisExpedition - Les frais d'expédition lié a un transporteur
   * @param estimeArrive - L'estimation du temps de transport d'un colis.
   * @param logo - Le logo d'un transporteur
   * @returns - les informations du transporteur demandées
   * @async - une méthode asynchrone
   */
  async save() {
    const {
      rows,
    } = await db.query(
      `INSERT INTO mada.transporteur (nom, description, frais_expedition, estime_arrive, logo, created_date) VALUES ($1,$2, $3, $4, $5, now()) RETURNING *;`,
      [this.nom, this.description, this.fraisExpedition, this.estimeArrive, this.logo]
    );

    this.id = rows[0].id;
    this.createdDate = rows[0].created_date;
    consol.model(
      `le transporteur id ${this.id} a été inséré à la date du ${this.createdDate} !`
    );
  }



  /**
   * Méthode chargé d'aller mettre à jour les informations relatives à un transporteur passé en paramétre
   * @param nom  - le nom d'un transporteur
   * @param description - la description lié a un transporteur
   * @param fraisExpedition - Les frais d'expédition lié a un transporteur
   * @param estimeArrive - L'estimation du temps de transport d'un colis.
   * @param logo - Le logo d'un transporteur
   * @returns - les informations du transporteur mis à jour
   * @async - une méthode asynchrone
   */
  async update() {
    const {
      rows,
    } = await db.query(
      `UPDATE mada.transporteur SET nom = $1, description = $2, frais_expedition = $3, estime_arrive = $4, logo = $5,  updated_date = now() WHERE id = $6 RETURNING *;`,
      [this.nom, this.description, this.fraisExpedition, this.estimeArrive, this.logo, this.id]
    );
    this.updatedDate = rows[0].updated_date;
    console.log(
      `le transporteur id : ${this.id} avec comme nom ${this.nom} a été mise à jour le ${this.updatedDate} !`
    );
  }
  /**
   * Méthode chargé d'aller supprimer un transporteur passé en paramétre
   * @param id - l'id d'un transporteur
   * @async - une méthode asynchrone
   */
  async delete() {
    const {
      rows
    } = await db.query('DELETE FROM mada.transporteur WHERE transporteur.id = $1 RETURNING *;', [
      this.id,
    ]);
    consol.model(`le transporteur id ${this.id} a été supprimé !`);

    return new Transporteur(rows[0]);
  }



}

module.exports = Transporteur;