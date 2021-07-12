------------------------------------------------------------
--        Script Postgres BDD MADA V2
------------------------------------------------------------

BEGIN;

-- suppression du schéma public

DROP SCHEMA IF EXISTS public;
DROP SCHEMA IF EXISTS mada;

-- création d'un schéma perso ou je vais ranger mes tables : 

CREATE SCHEMA mada;

-- je définit mon schéma par défaut pour la création de table et le requêtage

SET search_path TO mada;



-- Création de domaines =

CREATE DOMAIN posint AS INT CHECK (VALUE >= 0); -- un domaine permettant de créer un type de donnée nombre entier ne pouvant être négatif
CREATE DOMAIN posintsup AS INT check (VALUE > 0); -- un domaine permettant de créer un type de donnée nombre entier strictement positif
CREATE DOMAIN posreal AS NUMERIC(2) CHECK (VALUE >= 00.00); -- un domaine permettant de créer un type de donnée nombre réel, 2 chiffre aprés la virgule (précision de 4 et une échelle de 2 selon la nomanclature postgres), positif ou égal a zéro
CREATE DOMAIN posrealsup AS NUMERIC(2) CHECK (VALUE > 00.00);
CREATE DOMAIN email AS text -- un domaine (type de donnée) permettant de vérifier la validité d'une adresse email via une regex
	CHECK (

		VALUE ~* '^[A-Za-z0-9._%\-+!#$&/=?^|~]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'
	);

CREATE DOMAIN postale_code_fr AS text -- un domaine (type de donnée) permettant de vérifier la validité d'un code postale via une regex
	CHECK (

		--VALUE ~* '^(([0-9][0-9])|(9[0-8]))[0-9]{3}$'
		VALUE ~* '^[0-9]{5}$'
	);
-- Depuis 2009, la Poste s'est attribué la boîte postale Entreprise 999 : « Service consommateurs, 99999 LA POSTE​ ».Une entreprise organisant un seul concours peut donc se faire adresser son courrier à sa boîte 99123.
-- les armées peuvent commencer par 00

CREATE DOMAIN phonenumber AS text -- un domaine (type de donnée) permettant de vérifier la validité d'un numéro de téléphone via une regex
	CHECK (

		VALUE ~* '^(0|\\+33|0033)[1-9][0-9]{8}$'
	);

CREATE DOMAIN password as text  -- un domaine (type de donnée) permettant de vérifier la validité d'un mot de passe en hash via une regex (fonctionne uniquement avec bcrypt qui commence ces hash de la même maniére)
CHECK (

		VALUE ~* '^\$2[ayb]\$.{50,61}$'
	);

	-- https://stackoverflow.com/questions/31417387/regular-expression-to-find-bcrypt-hash
	-- https://stackoverflow.com/questions/5393803/can-someone-explain-how-bcrypt-verifies-a-hash

CREATE DOMAIN text_length AS text -- un domaine pour les descriptions = mini 15 caractéres sans espace autour
    CHECK (
        char_length(trim(both from VALUE)) >= 9
    );

CREATE DOMAIN text_valid AS text -- un domaine pour les textes valides = mini 2 caractéres sans espaces autour
    CHECK (
        char_length(trim(both from VALUE)) >= 1
    );









------------------------------------------------------------
-- Table: fournisseur
------------------------------------------------------------
CREATE TABLE fournisseur(
	idFournisseur     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	nom               text_valid NOT NULL,
	logo              text_valid
	
);


------------------------------------------------------------
-- Table: categorie
------------------------------------------------------------
CREATE TABLE categorie(
	idCategorie   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	nom           text_valid NOT NULL,
	description   text_length NOT NULL,
	ordre         posint  NOT NULL,
	createdDate   timestamptz NOT NULL DEFAULT now(),
	updatedDate   timestamptz,
	CHECK (createdDate < updatedDate)
);

------------------------------------------------------------
-- Table: TVA
------------------------------------------------------------
CREATE TABLE TVA(
	idTVA         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	taux          posrealsup  NOT NULL,
	nom           text_valid NOT NULL,
	periode_TVA   DATERANGE NOT NULL DEFAULT '[2021-01-01, 2099-12-24]' -- [] => on inclut les deux bornes // () => on exclut les deux bornes // (] => on exclut la 1iere borne .... etc.)
);



------------------------------------------------------------
-- Table: code_postal
------------------------------------------------------------
CREATE TABLE code_postal(
	idCodePostale    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code_postal     postale_code_fr NOT NULL 
);


------------------------------------------------------------
-- Table: pays
------------------------------------------------------------
CREATE TABLE pays(
	idPays   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	nom      text_valid NOT NULL
);


------------------------------------------------------------
-- Table: ville
------------------------------------------------------------
CREATE TABLE ville(
	idVille     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	nom         text_valid NOT NULL,
	id_pays     INT NOT NULL REFERENCES pays(idPays)
);


------------------------------------------------------------
-- Table: privilege
------------------------------------------------------------
CREATE TABLE privilege(
	idPrivilege   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	nom   text_valid NOT NULL
);


------------------------------------------------------------
-- Table: client
------------------------------------------------------------
CREATE TABLE client(
	idClient       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	prenom         text_valid NOT NULL,
	nom_famille    text_valid NOT NULL,
	email          email NOT NULL UNIQUE,
	password       password NOT NULL,
	createdDate    timestamptz NOT NULL DEFAULT now(),
	updatedDate    timestamptz,
	CHECK (createdDate < updatedDate),
	id_privilege   INT NOT NULL REFERENCES privilege(idPrivilege)
);


------------------------------------------------------------
-- Table: panier
------------------------------------------------------------
CREATE TABLE panier(
	idPanier      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	montant       posreal  NOT NULL DEFAULT 00.00,
	createdDate   timestamptz NOT NULL DEFAULT now(),
	updatedDate   timestamptz,
	CHECK (createdDate < updatedDate),
	id_client     INT NOT NULL REFERENCES client(idClient)
);



------------------------------------------------------------
-- Table: produit
------------------------------------------------------------
CREATE TABLE produit(
	idProduit       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	nom            text_valid NOT NULL,
	description    text_length NOT NULL,
	prix_HT        posreal  NOT NULL,
	id_categorie   INT NOT NULL REFERENCES categorie(idCategorie),
	id_TVA         INT NOT NULL REFERENCES TVA(idTVA)
);


------------------------------------------------------------
-- Table: produit_image
------------------------------------------------------------
CREATE TABLE produit_image(
	idProduitImage           INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	nom                      text_valid NOT NULL,
	ordre                    posint NOT NULL,
	URL                      text_valid NOT NULL,
	id_produit               INT NOT NULL REFERENCES produit(idProduit)
);


------------------------------------------------------------
-- Table: avis
------------------------------------------------------------
CREATE TABLE avis(
	idAvis            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	notation          posintsup  NOT NULL,
	avis              text_valid NOT NULL,
	titre             text_valid NOT NULL,
	createdDate       timestamptz NOT NULL DEFAULT now(),
	updatedDate       timestamptz,
	CHECK (createdDate < updatedDate),
	id_client         INT NOT NULL REFERENCES client(idClient),
	id_produit        INT NOT NULL REFERENCES produit(idProduit)
);

------------------------------------------------------------
-- Table: sous_categorie
------------------------------------------------------------
CREATE TABLE sous_categorie(
	idSousCategorie             INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	nom                         text_valid NOT NULL,
	description                 text_length NOT NULL,
	createdDate                 timestamptz NOT NULL DEFAULT now(),
	updatedDate                 timestamptz,
	CHECK (createdDate < updatedDate),
	id_categorie                INT NOT NULL REFERENCES categorie(idCategorie)
);


--! ici premir test avec : idCommande    INT  GENERATED ALWAYS AS IDENTITY,
--! ici idClient est a la fois clé étrangére et clé primaire...
------------------------------------------------------------
-- Table: commande
------------------------------------------------------------
CREATE TABLE commande(
	idClient      INT  NOT NULL,
	idCommande    INT  GENERATED ALWAYS AS IDENTITY UNIQUE,
	reference     text_valid NOT NULL,
	date_achat    timestamptz NOT NULL DEFAULT now(),
	statut        text_valid NOT NULL,
	commentaire   text_valid NOT NULL,
	updatedDate   timestamptz,
	CHECK (date_achat < updatedDate),
	CONSTRAINT commande_PK PRIMARY KEY (idClient,idCommande),

    CONSTRAINT commande_client_FK FOREIGN KEY (idClient) REFERENCES client(idClient)
);


------------------------------------------------------------
-- Table: commande_paiement
------------------------------------------------------------
CREATE TABLE commande_paiement(
	idCommandedPaiement   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	reference             text_valid NOT NULL,
	methode               text_valid NOT NULL,
	date_paiement         timestamptz NOT NULL DEFAULT now(),
	montant               posrealsup  NOT NULL,
	updatedDate           timestamptz,
	CHECK (date_paiement < updatedDate),	
	idClient             INT  NOT NULL REFERENCES client(idClient),
	idCommande           INT  NOT NULL REFERENCES commande(idCommande)
);


------------------------------------------------------------
-- Table: livraison
------------------------------------------------------------
CREATE TABLE livraison(
	idClient           INT  NOT NULL,
	idLivraison        INT GENERATED ALWAYS AS IDENTITY,
	frais_expedition   posreal  NOT NULL,
	nom_transporteur   text_valid NOT NULL,
	date_envoi         timestamptz NOT NULL DEFAULT now(),
	numero_suivi       text_valid NOT NULL,
	URL_suivi          text_valid NOT NULL,
	poid               posrealsup  NOT NULL,
	createdDate        timestamptz NOT NULL DEFAULT now(),
	updatedDate        timestamptz,
	estime_arrive      timestamptz,
	CHECK (createdDate < updatedDate),
	CONSTRAINT livraison_PK PRIMARY KEY (idClient,idLivraison),

	CONSTRAINT livraison_client_FK FOREIGN KEY (idClient) REFERENCES client(idClient)
);



------------------------------------------------------------
-- Table: client_adresse
------------------------------------------------------------
CREATE TABLE client_adresse(
	idClientAdresse   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	prenom            text_valid NOT NULL,
	nom_famille       text_valid NOT NULL,
	ligne1            text_valid NOT NULL,
	ligne2            text_valid NOT NULL,
	ligne3            text_valid NOT NULL,
	numero            posint  NOT NULL, -- peut être égale a zéro...
	titre             text_valid NOT NULL,
	createdDate       timestamptz NOT NULL DEFAULT now(),
	updatedDate       timestamptz,
	id_client         INT  NOT NULL REFERENCES client(idClient),
	id_ville          INT  NOT NULL REFERENCES ville(idVille),
	CHECK (createdDate < updatedDate)	
	
	
);


------------------------------------------------------------
-- Table: facture
------------------------------------------------------------
CREATE TABLE facture(
	idClient           INT  NOT NULL,
	idFacture          INT GENERATED ALWAYS AS IDENTITY,
	reference          text_valid NOT NULL,
	date_facturation   timestamptz NOT NULL DEFAULT now(),
	montant_HT         posrealsup  NOT NULL,
	montant_TTC        posrealsup  NOT NULL,
	montant_TVA        posrealsup  NOT NULL,
	taux_TVA           posrealsup  NOT NULL,
	updatedDate        timestamptz ,
	CHECK (date_facturation < updatedDate),
	CONSTRAINT facture_PK PRIMARY KEY (idClient,idFacture),

	CONSTRAINT facture_client_FK FOREIGN KEY (idClient) REFERENCES client(idClient)
);


------------------------------------------------------------
-- Table: stock
------------------------------------------------------------
CREATE TABLE stock(
	idStock       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	quantite      posint  NOT NULL,
	createdDate   timestamptz NOT NULL DEFAULT now(),
	updatedDate   timestamptz,
	CHECK (createdDate < updatedDate),
	id_produit    INT  NOT NULL REFERENCES produit(idProduit)
);


------------------------------------------------------------
-- Table: reduction
------------------------------------------------------------
CREATE TABLE reduction(
	idReduction             INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	nom                     text_valid NOT NULL,
	pourcentage_reduction   posreal  NOT NULL DEFAULT 00.00,
	actif                   BOOL  NOT NULL,
	periode_reduction       DATERANGE 
);


------------------------------------------------------------
-- Table: caracteristique
------------------------------------------------------------
CREATE TABLE caracteristique(
	idCaracteristique   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	couleur             text_valid NOT NULL,
	taille              text_valid NOT NULL,
	id_produit           INT  NOT NULL REFERENCES produit(idProduit)
);


------------------------------------------------------------
-- Table: category_image
------------------------------------------------------------
CREATE TABLE category_image(
	idCategorieImage   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	nom                text_valid NOT NULL,
	URL                text_valid NOT NULL,
	id_categorie       INT  NOT NULL REFERENCES categorie(idCategorie)
);


------------------------------------------------------------
-- Table: sous_category_image
------------------------------------------------------------
CREATE TABLE sous_category_image(
	idSousCategorieImage   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	nom                    text_valid NOT NULL ,
	URL                    text_valid NOT NULL ,
	id_sousCategorie        INT  NOT NULL REFERENCES sous_categorie(idSousCategorie)
);


------------------------------------------------------------
-- Table: ligne
------------------------------------------------------------
CREATE TABLE ligne(
	idProduit       INT  NOT NULL,
	idLigne         INT GENERATED ALWAYS AS IDENTITY,
	nom_produit     text_valid NOT NULL,
	prix_unitaire   posrealsup  NOT NULL,
	quantite        posintsup  NOT NULL,
	CONSTRAINT ligne_PK PRIMARY KEY (idProduit,idLigne),

	CONSTRAINT ligne_produit_FK FOREIGN KEY (idProduit) REFERENCES produit(idProduit)
);


------------------------------------------------------------
-- Table: ligne_commande
------------------------------------------------------------
CREATE TABLE ligne_commande(
	idProduit       INT  NOT NULL,
	idLigne         INT  NOT NULL,
	idClient        INT  NOT NULL,
	idCommande      INT  NOT NULL,
	nom_produit     text_valid NOT NULL,
	prix_unitaire   posrealsup  NOT NULL,
	quantite        posintsup  NOT NULL,
	CONSTRAINT ligne_commande_PK PRIMARY KEY (idProduit,idLigne,idClient,idCommande),

	CONSTRAINT ligne_commande_ligne_FK FOREIGN KEY (idProduit,idLigne) REFERENCES ligne(idProduit,idLigne),
	CONSTRAINT ligne_commande_commande0_FK FOREIGN KEY (idClient,idCommande) REFERENCES commande(idClient,idCommande)
);


------------------------------------------------------------
-- Table: ligne_facture
------------------------------------------------------------
CREATE TABLE ligne_facture(
	idProduit                   INT  NOT NULL ,
	idLigne                     INT  NOT NULL ,
	idClient                    INT  NOT NULL ,
	idFacture                   INT  NOT NULL ,
	nom_produit                 text_valid NOT NULL,
	prix_unitaire               posrealsup  NOT NULL,
	quantite                    posintsup  NOT NULL,
	idProduit_ligne_commande    INT  NOT NULL ,
	idLigne_ligne_commande      INT  NOT NULL ,
	idClient_ligne_commande     INT  NOT NULL ,
	idCommande_ligne_commande   INT  NOT NULL  ,
	CONSTRAINT ligne_facture_PK PRIMARY KEY (idProduit,idLigne,idClient,idFacture)

	,CONSTRAINT ligne_facture_ligne_FK FOREIGN KEY (idProduit,idLigne) REFERENCES ligne(idProduit,idLigne)
	,CONSTRAINT ligne_facture_facture0_FK FOREIGN KEY (idClient,idFacture) REFERENCES facture(idClient,idFacture)
	,CONSTRAINT ligne_facture_ligne_commande1_FK FOREIGN KEY (idProduit_ligne_commande,idLigne_ligne_commande,idClient_ligne_commande,idCommande_ligne_commande) REFERENCES ligne_commande(idProduit,idLigne,idClient,idCommande)
	,CONSTRAINT ligne_facture_ligne_commande_AK UNIQUE (idProduit_ligne_commande,idLigne_ligne_commande,idClient_ligne_commande,idCommande_ligne_commande)
);


------------------------------------------------------------
-- Table: ligne_livraison
------------------------------------------------------------
CREATE TABLE ligne_livraison(
	idProduit                   INT  NOT NULL ,
	idLigne                     INT  NOT NULL ,
	idClient                    INT  NOT NULL ,
	idLivraison                 INT  NOT NULL ,
	nom_produit                 text_valid NOT NULL,
	prix_unitaire               posrealsup  NOT NULL,
	quantite                    posintsup  NOT NULL,
	idProduit_ligne_commande    INT  NOT NULL ,
	idLigne_ligne_commande      INT  NOT NULL ,
	idClient_ligne_commande     INT  NOT NULL ,
	idCommande_ligne_commande   INT  NOT NULL  ,
	CONSTRAINT ligne_livraison_PK PRIMARY KEY (idProduit,idLigne,idClient,idLivraison)

	,CONSTRAINT ligne_livraison_ligne_FK FOREIGN KEY (idProduit,idLigne) REFERENCES ligne(idProduit,idLigne)
	,CONSTRAINT ligne_livraison_livraison0_FK FOREIGN KEY (idClient,idLivraison) REFERENCES livraison(idClient,idLivraison)
	,CONSTRAINT ligne_livraison_ligne_commande1_FK FOREIGN KEY (idProduit_ligne_commande,idLigne_ligne_commande,idClient_ligne_commande,idCommande_ligne_commande) REFERENCES ligne_commande(idProduit,idLigne,idClient,idCommande)
	,CONSTRAINT ligne_livraison_ligne_commande_AK UNIQUE (idProduit_ligne_commande,idLigne_ligne_commande,idClient_ligne_commande,idCommande_ligne_commande)
);


------------------------------------------------------------
-- Table: ligne_panier
------------------------------------------------------------
CREATE TABLE ligne_panier(
	idPanier        INT  NOT NULL,
	idLignePanier   INT GENERATED ALWAYS AS IDENTITY,
	nom_produit     text_valid NOT NULL,
	quantite        posintsup  NOT NULL,
	prix_HT         posrealsup  NOT NULL,
	id_produit       INT  NOT NULL REFERENCES produit(idProduit),
	CONSTRAINT ligne_panier_PK PRIMARY KEY (idPanier,idLignePanier),

	CONSTRAINT ligne_panier_panier_FK FOREIGN KEY (idPanier) REFERENCES panier(idPanier)
	
);

------------------------------------------------------------
-- Table: ville_a_codePostale
------------------------------------------------------------
CREATE TABLE ville_a_codePostale (
	idVille_a_codePostale              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	id_ville                           INT NOT NULL REFERENCES ville(idVille),
	id_codePostale                     INT NOT NULL REFERENCES code_postal(idCodePostale)
);



------------------------------------------------------------
-- Table: deduit
------------------------------------------------------------
CREATE TABLE deduit(
	idDeduit      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	idReduction   INT  NOT NULL REFERENCES reduction(idReduction),
	idProduit     INT  NOT NULL REFERENCES produit(idProduit)

);


------------------------------------------------------------
-- Table: fournie
------------------------------------------------------------
CREATE TABLE fournie(
	idFournie       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	idFournisseur   INT  NOT NULL REFERENCES fournisseur(idFournisseur),
	idProduit       INT  NOT NULL REFERENCES produit(idProduit)
);



COMMIT;