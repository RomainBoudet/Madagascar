------------------------------------------------------------
--        Script Postgres BDD MADA V2
------------------------------------------------------------

BEGIN;

-- suppression de messages en NOTICES (pour les remettre => SET client_min_messages TO default;)

  SET client_min_messages TO warning;

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
CREATE DOMAIN posreal AS DECIMAL(6,2) CHECK (VALUE >= 00.00); -- un domaine permettant de créer un type de donnée nombre réel, 2 chiffre aprés la virgule (précision de 6 et une échelle de 2 selon la nomanclature postgres), positif ou égal a zéro
CREATE DOMAIN posrealsup AS DECIMAL(6,2) CHECK (VALUE > 00.00);
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
-- Table: shop
------------------------------------------------------------

CREATE TABLE shop(
	idShop  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	nom               text_valid NOT NULL DEFAULT 'Madagascar Artisanat',
	logo              text_valid,
	texte_intro       text_valid NOT NULL DEFAULT 'Bienvenue sur le site XXX',
	email_contact     email NOT NULL DEFAULT 'contact@monsite.fr',
	telephone         phonenumber

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
	taux          posreal  NOT NULL,
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
	nom           text_valid NOT NULL
);

CREATE INDEX idx_privilege ON privilege(idPrivilege) INCLUDE (nom); -- index couvrant => https://public.dalibo.com/exports/formation/manuels/formations/perf2/perf2.handout.html



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

CREATE INDEX idx_client_id ON client(idClient);

-----------------------------------------------------------
-- Table: admin_verif_email
------------------------------------------------------------
CREATE TABLE admin_verif_email(
	idAdminVerifEmail     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	verif_email           BOOL  NOT NULL DEFAULT 'false',
	date_verif_email      timestamptz NOT NULL DEFAULT now(),
	id_client             INT UNIQUE NOT NULL REFERENCES client(idClient)
);

-----------------------------------------------------------
-- Table: admin_verif_telephone
------------------------------------------------------------
CREATE TABLE admin_verif_telephone(
	idAdminVerifTelephone   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	verif_phone             BOOL NOT NULL DEFAULT 'false',
	date_verif_phone        timestamptz NOT NULL DEFAULT now(),
	id_client               INT UNIQUE NOT NULL REFERENCES client(idClient)
);

------------------------------------------------------------
-- Table: admin_phone
------------------------------------------------------------
CREATE TABLE admin_phone(
	idAdminPhone      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	admin_telephone   phonenumber  NOT NULL,
	id_client         INT UNIQUE NOT NULL REFERENCES client(idClient) 
);

------------------------------------------------------------
-- Table: panier
------------------------------------------------------------
CREATE TABLE panier(
	idPanier      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	total         posreal  NOT NULL DEFAULT 00.00,
	createdDate   timestamptz NOT NULL DEFAULT now(),
	updatedDate   timestamptz,
	CHECK (createdDate < updatedDate),
	id_client     INT NOT NULL REFERENCES client(idClient)
);


CREATE INDEX idx_panier_id ON panier(idPanier);


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

CREATE INDEX idx_produit_id ON produit(idProduit);
CREATE INDEX idx_produit_nom ON produit(nom);
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

------------------------------------------------------------
-- Table: statut_commande
------------------------------------------------------------
CREATE TABLE statut_commande(
	idCommandeStatut   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	statut             text_valid NOT NULL,
	description        text_length NOT NULL
);

------------------------------------------------------------
-- Table: commande
------------------------------------------------------------
CREATE TABLE commande(
	idClient           INT  NOT NULL UNIQUE,
	idCommande         INT  GENERATED ALWAYS AS IDENTITY UNIQUE,
	reference          text_valid NOT NULL,
	date_achat         timestamptz NOT NULL DEFAULT now(),
	commentaire        text_valid NOT NULL,
	updatedDate        timestamptz,
	CHECK (date_achat < updatedDate),
	id_commandeStatut   INT  NOT NULL REFERENCES statut_commande(idCommandeStatut),
	CONSTRAINT commande_PK PRIMARY KEY (idClient,idCommande),

	CONSTRAINT commande_client_FK FOREIGN KEY (idClient) REFERENCES client(idClient)
);

-- CREATE INDEX idx_commmande_id ON commande(idClient,idCommande); UNIQUE créé également un index, a tester...

------------------------------------------------------------
-- Table: paiement
------------------------------------------------------------
CREATE TABLE paiement(
	idPaiement            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	reference             text_valid NOT NULL,
	methode               text_valid NOT NULL,
	date_paiement         timestamptz NOT NULL DEFAULT now(),
	montant               posrealsup  NOT NULL,
	updatedDate           timestamptz,
	CHECK (date_paiement < updatedDate),	
	id_client             INT  NOT NULL REFERENCES client(idClient),
	id_commande           INT  NOT NULL REFERENCES commande(idCommande)
);


------------------------------------------------------------
-- Table: livraison
------------------------------------------------------------
CREATE TABLE livraison(
	idClient           INT  NOT NULL,
	idLivraison        INT GENERATED ALWAYS AS IDENTITY UNIQUE,
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

	id_client            INT  NOT NULL REFERENCES commande(idClient),
	id_commande          INT  NOT NULL REFERENCES commande(idCommande),
	CONSTRAINT livraison_PK PRIMARY KEY (idClient,idLivraison),

	CONSTRAINT livraison_client_FK FOREIGN KEY (idClient) REFERENCES client(idClient),
	CONSTRAINT livraison_commande_AK UNIQUE (id_client,id_commande)
);


-- CREATE INDEX idx_livraison_id ON livraison(idClient,idLivraison);

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
	idFacture          INT GENERATED ALWAYS AS IDENTITY UNIQUE,
	reference          text_valid NOT NULL,
	date_facturation   timestamptz NOT NULL DEFAULT now(),
	montant_HT         posrealsup  NOT NULL,
	montant_TTC        posrealsup  NOT NULL,
	montant_TVA        posrealsup  NOT NULL,
	updatedDate        timestamptz ,
	CHECK (date_facturation < updatedDate),

	id_paiement         INT NOT NULL REFERENCES paiement(idPaiement),
	CONSTRAINT facture_PK PRIMARY KEY (idClient,idFacture),

	CONSTRAINT facture_client_FK FOREIGN KEY (idClient) REFERENCES client(idClient)
);


-- CREATE INDEX idx_facture_id ON facture(idClient,idFacture);

------------------------------------------------------------
-- Table: stock
------------------------------------------------------------
CREATE TABLE stock(
	idStock       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	quantite      posint  NOT NULL,
	createdDate   timestamptz NOT NULL DEFAULT now(),
	updatedDate   timestamptz,
	CHECK (createdDate < updatedDate),
	id_produit    INT UNIQUE NOT NULL REFERENCES produit(idProduit)
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
	id_produit          INT  NOT NULL REFERENCES produit(idProduit)
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
-- Table: ligne_commande
------------------------------------------------------------
CREATE TABLE ligne_commande(
	idClient            INT  NOT NULL UNIQUE,
	idCommande          INT  NOT NULL UNIQUE,
	idCommandeLigne     INT GENERATED ALWAYS AS IDENTITY UNIQUE,
	nom_produit         text_valid NOT NULL,
	prix_unitaire       posrealsup  NOT NULL,
	quantite_commande   posintsup  NOT NULL,
	id_produit           INT  NOT NULL REFERENCES produit(idProduit),
	--id_client_facture    INT  NOT NULL REFERENCES facture(idClient),
	id_facture           INT  NOT NULL  REFERENCES facture(idFacture),
	CONSTRAINT ligne_commande_PK PRIMARY KEY (idClient,idCommande,idCommandeLigne),

	CONSTRAINT ligne_commande_commande_FK FOREIGN KEY (idClient,idCommande) REFERENCES commande(idClient,idCommande)
	
);

-- CREATE INDEX idx_ligne_commande_id ON ligne_commande(idClient,idCommande,idCommandeLigne);

------------------------------------------------------------
-- Table: ligne_livraison
------------------------------------------------------------
CREATE TABLE ligne_livraison(
	idClient                         INT  NOT NULL UNIQUE,
	idLivraison                      INT  NOT NULL UNIQUE,
	idLivraisonLigne                 INT GENERATED ALWAYS AS IDENTITY UNIQUE,
	quantite_livraison               posintsup  NOT NULL,
	id_client                        INT  NOT NULL REFERENCES ligne_commande(idClient),
	id_commande                      INT  NOT NULL REFERENCES ligne_commande(idCommande),
	id_commandeLigne                 INT  NOT NULL REFERENCES ligne_commande(idCommandeLigne),
	CONSTRAINT ligne_livraison_PK PRIMARY KEY (idClient,idLivraison,idLivraisonLigne),

	CONSTRAINT ligne_livraison_livraison_FK FOREIGN KEY (idClient,idLivraison) REFERENCES livraison(idClient,idLivraison),
	CONSTRAINT ligne_livraison_ligne_commande_AK UNIQUE (id_client,id_commande,id_commandeLigne)
);


-- CREATE INDEX idx_ligne_livraison_id ON ligne_livraison(idClient,idLivraison,idLivraisonLigne);

------------------------------------------------------------
-- Table: ligne_panier
------------------------------------------------------------
CREATE TABLE ligne_panier(
	idLignePanier   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	nom_produit     text_valid NOT NULL,
	quantite        posintsup  NOT NULL,
	prix_HT         posrealsup  NOT NULL,
	id_produit      INT  NOT NULL REFERENCES produit(idProduit),
	id_panier       INT  NOT NULL REFERENCES panier(idPanier)
);

------------------------------------------------------------
-- Table: produit_commande_retourne
------------------------------------------------------------
CREATE TABLE produit_commande_retourne(
	idProduitCommandeRetourne   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	quantite                    posint  NOT NULL DEFAULT 0,
	createdDate                 DATE  NOT NULL,
	commentaire                 text_valid NOT NULL,
	id_client                   INT  NOT NULL REFERENCES ligne_livraison(idClient),
	id_livraison                INT  NOT NULL REFERENCES ligne_livraison(idLivraison),
	id_livraisonLigne           INT  NOT NULL REFERENCES ligne_livraison(idLivraisonLigne),

    CONSTRAINT produit_commande_retourne_ligne_livraison_AK UNIQUE (id_client,id_livraison,id_livraisonLigne)
);


------------------------------------------------------------
-- Table: client_historique_password
------------------------------------------------------------
CREATE TABLE client_historique_password(
	idClientHistoriqueConnexion   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	password_hash                 password NOT NULL,
	date_creation                 timestamptz NOT NULL DEFAULT now(),
	id_client                     INT  NOT NULL REFERENCES client(idClient)
);


------------------------------------------------------------
-- Table: client_historique_connexion
------------------------------------------------------------
CREATE TABLE client_historique_connexion(
	idClientHistoriqueConnexion   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	connexion_succes              BOOL  NOT NULL,
	connexion_date                timestamptz NOT NULL DEFAULT now(),
	id_client                     INT  NOT NULL REFERENCES client(idClient)
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
	id_reduction   INT  NOT NULL REFERENCES reduction(idReduction),
	id_produit     INT  NOT NULL REFERENCES produit(idProduit)

);

------------------------------------------------------------
-- Table: fournie
------------------------------------------------------------
CREATE TABLE fournie(
	idFournie       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	id_fournisseur   INT  NOT NULL REFERENCES fournisseur(idFournisseur),
	id_produit       INT  NOT NULL REFERENCES produit(idProduit)
);

COMMIT;



