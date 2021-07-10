#------------------------------------------------------------
#        Script MySQL.
#------------------------------------------------------------


#------------------------------------------------------------
# Table: TVA
#------------------------------------------------------------

CREATE TABLE TVA(
        id          Int  Auto_increment  NOT NULL ,
        taux        Decimal (50) NOT NULL ,
        nom         Varchar (50) NOT NULL ,
        periode_TVA Varchar (50) NOT NULL
	,CONSTRAINT TVA_PK PRIMARY KEY (id)
)ENGINE=InnoDB;


#------------------------------------------------------------
# Table: privilege
#------------------------------------------------------------

CREATE TABLE privilege(
        id  Int  Auto_increment  NOT NULL ,
        nom Varchar (50) NOT NULL
	,CONSTRAINT privilege_PK PRIMARY KEY (id)
)ENGINE=InnoDB;


#------------------------------------------------------------
# Table: client
#------------------------------------------------------------

CREATE TABLE client(
        id           Int  Auto_increment  NOT NULL ,
        prenom       Varchar (50) NOT NULL ,
        nom_famille  Varchar (50) NOT NULL ,
        email        Varchar (50) NOT NULL ,
        password     Varchar (50) NOT NULL ,
        createdDate  Date NOT NULL ,
        updatedDate  Date NOT NULL ,
        id_privilege Int NOT NULL
	,CONSTRAINT client_PK PRIMARY KEY (id)

	,CONSTRAINT client_privilege_FK FOREIGN KEY (id_privilege) REFERENCES privilege(id)
)ENGINE=InnoDB;


#------------------------------------------------------------
# Table: panier
#------------------------------------------------------------

CREATE TABLE panier(
        id          Int  Auto_increment  NOT NULL ,
        montant     Decimal (50) NOT NULL ,
        createdDate Varchar (50) NOT NULL ,
        updatedDate Varchar (50) NOT NULL ,
        id_client   Int NOT NULL
	,CONSTRAINT panier_PK PRIMARY KEY (id)

	,CONSTRAINT panier_client_FK FOREIGN KEY (id_client) REFERENCES client(id)
)ENGINE=InnoDB;


#------------------------------------------------------------
# Table: fournisseur
#------------------------------------------------------------

CREATE TABLE fournisseur(
        id   Int  Auto_increment  NOT NULL ,
        nom  Varchar (50) NOT NULL ,
        logo Varchar (50) NOT NULL
	,CONSTRAINT fournisseur_PK PRIMARY KEY (id)
)ENGINE=InnoDB;


#------------------------------------------------------------
# Table: categorie
#------------------------------------------------------------

CREATE TABLE categorie(
        id          Int  Auto_increment  NOT NULL ,
        nom         Varchar (50) NOT NULL ,
        description Longtext NOT NULL ,
        order       Int NOT NULL ,
        createdDate Date NOT NULL ,
        updatedDate Date NOT NULL
	,CONSTRAINT categorie_PK PRIMARY KEY (id)
)ENGINE=InnoDB;


#------------------------------------------------------------
# Table: produit
#------------------------------------------------------------

CREATE TABLE produit(
        id           Int  Auto_increment  NOT NULL ,
        nom          Varchar (50) NOT NULL ,
        description  Varchar (50) NOT NULL ,
        prix_HT      Decimal NOT NULL ,
        id_categorie Int NOT NULL ,
        id_TVA       Int NOT NULL
	,CONSTRAINT produit_PK PRIMARY KEY (id)

	,CONSTRAINT produit_categorie_FK FOREIGN KEY (id_categorie) REFERENCES categorie(id)
	,CONSTRAINT produit_TVA0_FK FOREIGN KEY (id_TVA) REFERENCES TVA(id)
)ENGINE=InnoDB;


#------------------------------------------------------------
# Table: produit_image
#------------------------------------------------------------

CREATE TABLE produit_image(
        id         Int  Auto_increment  NOT NULL ,
        nom        Varchar (50) NOT NULL ,
        ordre      Varchar (50) NOT NULL ,
        URL        Varchar (50) NOT NULL ,
        id_produit Int NOT NULL
	,CONSTRAINT produit_image_PK PRIMARY KEY (id)

	,CONSTRAINT produit_image_produit_FK FOREIGN KEY (id_produit) REFERENCES produit(id)
)ENGINE=InnoDB;


#------------------------------------------------------------
# Table: avis
#------------------------------------------------------------

CREATE TABLE avis(
        id          Int  Auto_increment  NOT NULL ,
        notation    Int NOT NULL ,
        avis        Varchar (50) NOT NULL ,
        titre       Varchar (50) NOT NULL ,
        createdDate Date NOT NULL ,
        updatedDate Date NOT NULL ,
        id_client   Int NOT NULL ,
        id_produit  Int NOT NULL
	,CONSTRAINT avis_PK PRIMARY KEY (id)

	,CONSTRAINT avis_client_FK FOREIGN KEY (id_client) REFERENCES client(id)
	,CONSTRAINT avis_produit0_FK FOREIGN KEY (id_produit) REFERENCES produit(id)
)ENGINE=InnoDB;


#------------------------------------------------------------
# Table: sous_categorie
#------------------------------------------------------------

CREATE TABLE sous_categorie(
        id           Int  Auto_increment  NOT NULL ,
        nom          Varchar (50) NOT NULL ,
        description  Varchar (50) NOT NULL ,
        createdDate  Date NOT NULL ,
        updatedDate  Date NOT NULL ,
        id_categorie Int NOT NULL
	,CONSTRAINT sous_categorie_PK PRIMARY KEY (id)

	,CONSTRAINT sous_categorie_categorie_FK FOREIGN KEY (id_categorie) REFERENCES categorie(id)
)ENGINE=InnoDB;


#------------------------------------------------------------
# Table: commande
#------------------------------------------------------------

CREATE TABLE commande(
        id          Int NOT NULL ,
        id_commande Int NOT NULL ,
        reference   Varchar (50) NOT NULL ,
        date_achat  Date NOT NULL ,
        statut      Varchar (50) NOT NULL ,
        commentaire Varchar (50) NOT NULL ,
        createdDate Date NOT NULL ,
        updatedDate Date NOT NULL
	,CONSTRAINT commande_PK PRIMARY KEY (id,id_commande)

	,CONSTRAINT commande_client_FK FOREIGN KEY (id) REFERENCES client(id)
)ENGINE=InnoDB;


#------------------------------------------------------------
# Table: commande_paiement
#------------------------------------------------------------

CREATE TABLE commande_paiement(
        id                   Int  Auto_increment  NOT NULL ,
        reference            Varchar (50) NOT NULL ,
        methode              Varchar (50) NOT NULL ,
        date_paiement        Date NOT NULL ,
        montant              Decimal NOT NULL ,
        updatedDate          Date NOT NULL ,
        id_commande          Int NOT NULL ,
        id_commande_comprend Int NOT NULL
	,CONSTRAINT commande_paiement_PK PRIMARY KEY (id)

	,CONSTRAINT commande_paiement_commande_FK FOREIGN KEY (id_commande,id_commande_comprend) REFERENCES commande(id,id_commande)
)ENGINE=InnoDB;


#------------------------------------------------------------
# Table: livraison
#------------------------------------------------------------

CREATE TABLE livraison(
        id_client        Int NOT NULL ,
        id               Int NOT NULL ,
        frais_expedition Decimal NOT NULL ,
        nom_transporteur Varchar (50) NOT NULL ,
        date_envoi       Date NOT NULL ,
        numero_suivi     Int NOT NULL ,
        URL_suivi        Varchar (50) NOT NULL ,
        poid             Decimal (50) NOT NULL ,
        createdDate      Date NOT NULL ,
        updatedDate      Date NOT NULL ,
        estime_arrive    Varchar (50) NOT NULL
	,CONSTRAINT livraison_PK PRIMARY KEY (id_client,id)

	,CONSTRAINT livraison_client_FK FOREIGN KEY (id_client) REFERENCES client(id)
)ENGINE=InnoDB;


#------------------------------------------------------------
# Table: code_postal
#------------------------------------------------------------

CREATE TABLE code_postal(
        id          Int  Auto_increment  NOT NULL ,
        code_postal Int NOT NULL
	,CONSTRAINT code_postal_PK PRIMARY KEY (id)
)ENGINE=InnoDB;


#------------------------------------------------------------
# Table: pays
#------------------------------------------------------------

CREATE TABLE pays(
        id  Int  Auto_increment  NOT NULL ,
        nom Varchar (50) NOT NULL
	,CONSTRAINT pays_PK PRIMARY KEY (id)
)ENGINE=InnoDB;


#------------------------------------------------------------
# Table: ville
#------------------------------------------------------------

CREATE TABLE ville(
        id      Int  Auto_increment  NOT NULL ,
        nom     Varchar (50) NOT NULL ,
        id_pays Int NOT NULL
	,CONSTRAINT ville_PK PRIMARY KEY (id)

	,CONSTRAINT ville_pays_FK FOREIGN KEY (id_pays) REFERENCES pays(id)
)ENGINE=InnoDB;


#------------------------------------------------------------
# Table: client_adresse
#------------------------------------------------------------

CREATE TABLE client_adresse(
        id          Int  Auto_increment  NOT NULL ,
        prenom      Varchar (50) NOT NULL ,
        nom_famille Varchar (50) NOT NULL ,
        ligne1      Varchar (50) NOT NULL ,
        ligne2      Varchar (50) NOT NULL ,
        ligne3      Varchar (50) NOT NULL ,
        numero      Int NOT NULL ,
        titre       Varchar (50) NOT NULL ,
        createdDate Date NOT NULL ,
        updatedDate Date NOT NULL ,
        id_client   Int NOT NULL ,
        id_ville    Int NOT NULL
	,CONSTRAINT client_adresse_PK PRIMARY KEY (id)

	,CONSTRAINT client_adresse_client_FK FOREIGN KEY (id_client) REFERENCES client(id)
	,CONSTRAINT client_adresse_ville0_FK FOREIGN KEY (id_ville) REFERENCES ville(id)
)ENGINE=InnoDB;


#------------------------------------------------------------
# Table: facture
#------------------------------------------------------------

CREATE TABLE facture(
        id_client        Int NOT NULL ,
        id               Int NOT NULL ,
        reference        Varchar (50) NOT NULL ,
        date_facturation Date NOT NULL ,
        montant_HT       Decimal NOT NULL ,
        montant_TTC      Decimal NOT NULL ,
        montant_TVA      Decimal NOT NULL ,
        taux_TVA         Decimal NOT NULL ,
        updatedDate      Date NOT NULL
	,CONSTRAINT facture_PK PRIMARY KEY (id_client,id)

	,CONSTRAINT facture_client_FK FOREIGN KEY (id_client) REFERENCES client(id)
)ENGINE=InnoDB;


#------------------------------------------------------------
# Table: stock
#------------------------------------------------------------

CREATE TABLE stock(
        id          Int  Auto_increment  NOT NULL ,
        quantite    Int NOT NULL ,
        createdDate Date NOT NULL ,
        updatedDate Date NOT NULL ,
        id_produit  Int NOT NULL
	,CONSTRAINT stock_PK PRIMARY KEY (id)

	,CONSTRAINT stock_produit_FK FOREIGN KEY (id_produit) REFERENCES produit(id)
	,CONSTRAINT stock_produit_AK UNIQUE (id_produit)
)ENGINE=InnoDB;


#------------------------------------------------------------
# Table: reduction
#------------------------------------------------------------

CREATE TABLE reduction(
        id                    Int  Auto_increment  NOT NULL ,
        nom                   Varchar (50) NOT NULL ,
        pourcentage_reduction Decimal NOT NULL ,
        actif                 Bool NOT NULL ,
        periode_reduction     Date NOT NULL
	,CONSTRAINT reduction_PK PRIMARY KEY (id)
)ENGINE=InnoDB;


#------------------------------------------------------------
# Table: caracteristique
#------------------------------------------------------------

CREATE TABLE caracteristique(
        id         Int  Auto_increment  NOT NULL ,
        couleur    Varchar (50) NOT NULL ,
        taille     Varchar (50) NOT NULL ,
        id_produit Int NOT NULL
	,CONSTRAINT caracteristique_PK PRIMARY KEY (id)

	,CONSTRAINT caracteristique_produit_FK FOREIGN KEY (id_produit) REFERENCES produit(id)
	,CONSTRAINT caracteristique_produit_AK UNIQUE (id_produit)
)ENGINE=InnoDB;


#------------------------------------------------------------
# Table: category_image
#------------------------------------------------------------

CREATE TABLE category_image(
        id           Int  Auto_increment  NOT NULL ,
        nom          Varchar (50) NOT NULL ,
        URL          Varchar (50) NOT NULL ,
        id_categorie Int NOT NULL
	,CONSTRAINT category_image_PK PRIMARY KEY (id)

	,CONSTRAINT category_image_categorie_FK FOREIGN KEY (id_categorie) REFERENCES categorie(id)
)ENGINE=InnoDB;


#------------------------------------------------------------
# Table: sous_category_image
#------------------------------------------------------------

CREATE TABLE sous_category_image(
        id                Int  Auto_increment  NOT NULL ,
        nom               Varchar (50) NOT NULL ,
        URL               Varchar (50) NOT NULL ,
        id_sous_categorie Int NOT NULL
	,CONSTRAINT sous_category_image_PK PRIMARY KEY (id)

	,CONSTRAINT sous_category_image_sous_categorie_FK FOREIGN KEY (id_sous_categorie) REFERENCES sous_categorie(id)
)ENGINE=InnoDB;


#------------------------------------------------------------
# Table: ligne
#------------------------------------------------------------

CREATE TABLE ligne(
        id            Int  Auto_increment  NOT NULL ,
        nom_produit   Varchar (50) NOT NULL ,
        prix_unitaire Decimal NOT NULL ,
        quantite      Int NOT NULL ,
        id_produit    Int NOT NULL
	,CONSTRAINT ligne_PK PRIMARY KEY (id)

	,CONSTRAINT ligne_produit_FK FOREIGN KEY (id_produit) REFERENCES produit(id)
)ENGINE=InnoDB;


#------------------------------------------------------------
# Table: ligne_commande
#------------------------------------------------------------

CREATE TABLE ligne_commande(
        id_ligne      Int NOT NULL ,
        id_client     Int NOT NULL ,
        id_commande   Int NOT NULL ,
        nom_produit   Varchar (50) NOT NULL ,
        prix_unitaire Decimal NOT NULL ,
        quantite      Int NOT NULL ,
        id_produit    Int NOT NULL
	,CONSTRAINT ligne_commande_PK PRIMARY KEY (id_ligne,id_client,id_commande)

	,CONSTRAINT ligne_commande_ligne_FK FOREIGN KEY (id_ligne) REFERENCES ligne(id)
	,CONSTRAINT ligne_commande_commande0_FK FOREIGN KEY (id_client,id_commande) REFERENCES commande(id,id_commande)
	,CONSTRAINT ligne_commande_produit1_FK FOREIGN KEY (id_produit) REFERENCES produit(id)
)ENGINE=InnoDB;


#------------------------------------------------------------
# Table: ligne_facture
#------------------------------------------------------------

CREATE TABLE ligne_facture(
        id_ligne                   Int NOT NULL ,
        id_client                  Int NOT NULL ,
        id_facture                 Int NOT NULL ,
        nom_produit                Varchar (50) NOT NULL ,
        prix_unitaire              Decimal NOT NULL ,
        quantite                   Int NOT NULL ,
        id_ligne_ligne_commande    Int NOT NULL ,
        id_client_ligne_commande   Int NOT NULL ,
        id_commande_ligne_commande Int NOT NULL ,
        id_produit                 Int NOT NULL
	,CONSTRAINT ligne_facture_PK PRIMARY KEY (id_ligne,id_client,id_facture)

	,CONSTRAINT ligne_facture_ligne_FK FOREIGN KEY (id_ligne) REFERENCES ligne(id)
	,CONSTRAINT ligne_facture_facture0_FK FOREIGN KEY (id_client,id_facture) REFERENCES facture(id_client,id)
	,CONSTRAINT ligne_facture_ligne_commande1_FK FOREIGN KEY (id_ligne_ligne_commande,id_client_ligne_commande,id_commande_ligne_commande) REFERENCES ligne_commande(id_ligne,id_client,id_commande)
	,CONSTRAINT ligne_facture_produit2_FK FOREIGN KEY (id_produit) REFERENCES produit(id)
	,CONSTRAINT ligne_facture_ligne_commande_AK UNIQUE (id_ligne_ligne_commande,id_client_ligne_commande,id_commande_ligne_commande)
)ENGINE=InnoDB;


#------------------------------------------------------------
# Table: ligne_livraison
#------------------------------------------------------------

CREATE TABLE ligne_livraison(
        id_ligne                   Int NOT NULL ,
        id_client                  Int NOT NULL ,
        id_livraison               Int NOT NULL ,
        nom_produit                Varchar (50) NOT NULL ,
        prix_unitaire              Decimal NOT NULL ,
        quantite                   Int NOT NULL ,
        id_ligne_ligne_commande    Int NOT NULL ,
        id_client_ligne_commande   Int NOT NULL ,
        id_commande_ligne_commande Int NOT NULL ,
        id_produit                 Int NOT NULL
	,CONSTRAINT ligne_livraison_PK PRIMARY KEY (id_ligne,id_client,id_livraison)

	,CONSTRAINT ligne_livraison_ligne_FK FOREIGN KEY (id_ligne) REFERENCES ligne(id)
	,CONSTRAINT ligne_livraison_livraison0_FK FOREIGN KEY (id_client,id_livraison) REFERENCES livraison(id_client,id)
	,CONSTRAINT ligne_livraison_ligne_commande1_FK FOREIGN KEY (id_ligne_ligne_commande,id_client_ligne_commande,id_commande_ligne_commande) REFERENCES ligne_commande(id_ligne,id_client,id_commande)
	,CONSTRAINT ligne_livraison_produit2_FK FOREIGN KEY (id_produit) REFERENCES produit(id)
	,CONSTRAINT ligne_livraison_ligne_commande_AK UNIQUE (id_ligne_ligne_commande,id_client_ligne_commande,id_commande_ligne_commande)
)ENGINE=InnoDB;


#------------------------------------------------------------
# Table: ligne_panier
#------------------------------------------------------------

CREATE TABLE ligne_panier(
        id          Int  Auto_increment  NOT NULL ,
        nom_produit Varchar (50) NOT NULL ,
        quantite    Varchar (50) NOT NULL ,
        prix_HT     Decimal NOT NULL ,
        id_produit  Int NOT NULL ,
        id_panier   Int NOT NULL
	,CONSTRAINT ligne_panier_PK PRIMARY KEY (id)

	,CONSTRAINT ligne_panier_produit_FK FOREIGN KEY (id_produit) REFERENCES produit(id)
	,CONSTRAINT ligne_panier_panier0_FK FOREIGN KEY (id_panier) REFERENCES panier(id)
)ENGINE=InnoDB;


#------------------------------------------------------------
# Table: a
#------------------------------------------------------------

CREATE TABLE a(
        id       Int NOT NULL ,
        id_ville Int NOT NULL
	,CONSTRAINT a_PK PRIMARY KEY (id,id_ville)

	,CONSTRAINT a_code_postal_FK FOREIGN KEY (id) REFERENCES code_postal(id)
	,CONSTRAINT a_ville0_FK FOREIGN KEY (id_ville) REFERENCES ville(id)
)ENGINE=InnoDB;


#------------------------------------------------------------
# Table: deduit
#------------------------------------------------------------

CREATE TABLE deduit(
        id         Int NOT NULL ,
        id_produit Int NOT NULL
	,CONSTRAINT deduit_PK PRIMARY KEY (id,id_produit)

	,CONSTRAINT deduit_reduction_FK FOREIGN KEY (id) REFERENCES reduction(id)
	,CONSTRAINT deduit_produit0_FK FOREIGN KEY (id_produit) REFERENCES produit(id)
)ENGINE=InnoDB;


#------------------------------------------------------------
# Table: fournie
#------------------------------------------------------------

CREATE TABLE fournie(
        id         Int NOT NULL ,
        id_produit Int NOT NULL
	,CONSTRAINT fournie_PK PRIMARY KEY (id,id_produit)

	,CONSTRAINT fournie_fournisseur_FK FOREIGN KEY (id) REFERENCES fournisseur(id)
	,CONSTRAINT fournie_produit0_FK FOREIGN KEY (id_produit) REFERENCES produit(id)
)ENGINE=InnoDB;

