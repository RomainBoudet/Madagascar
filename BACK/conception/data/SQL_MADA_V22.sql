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
CREATE DOMAIN posrealpourc AS DECIMAL(3,2) CHECK (VALUE > 0.00) CHECK (VALUE < 1.00); -- un domaine permettant de créer un type de donnée nombre réel, 2 chiffre aprés la virgule (précision de 6 et une échelle de 2 selon la nomanclature postgres), positif ou égal a zéro

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

CREATE DOMAIN pass as text  -- un domaine (type de donnée) permettant de vérifier la validité d'un mot de passe en hash via une regex (fonctionne uniquement avec bcrypt qui commence ces hash de la même maniére)
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
	id  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
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
	id     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	nom               text_valid NOT NULL,
	logo              text_valid,
	created_date   timestamptz NOT NULL DEFAULT now(),
	updated_date   timestamptz,
	CHECK (created_date < updated_date)
	
);

------------------------------------------------------------
-- Table: categorie
------------------------------------------------------------
CREATE TABLE categorie(
	id   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	nom           text_valid NOT NULL,
	description   text_length NOT NULL,
	ordre         posint  NOT NULL,
	created_date   timestamptz NOT NULL DEFAULT now(),
	updated_date   timestamptz,
	CHECK (created_date < updated_date)
);



------------------------------------------------------------
-- Table: TVA
------------------------------------------------------------
CREATE TABLE TVA(
	id         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	taux          posreal  NOT NULL,
	nom           text_valid NOT NULL,
	periode_TVA   DATERANGE NOT NULL DEFAULT '[2021-01-01, 2099-12-24]' -- [] => on inclut les deux bornes // () => on exclut les deux bornes // (] => on exclut la 1iere borne .... etc.)
);




------------------------------------------------------------
-- Table: code_postal
------------------------------------------------------------
CREATE TABLE code_postal(
	id    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code_postal     postale_code_fr NOT NULL 
);


------------------------------------------------------------
-- Table: pays
------------------------------------------------------------
CREATE TABLE pays(
	id   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	nom      text_valid NOT NULL UNIQUE
);


------------------------------------------------------------
-- Table: ville
------------------------------------------------------------
CREATE TABLE ville(
	id     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	nom         text_valid NOT NULL UNIQUE,
	id_pays     INT NOT NULL REFERENCES pays(id) ON DELETE CASCADE
);


------------------------------------------------------------
-- Table: privilege
------------------------------------------------------------
CREATE TABLE privilege(
	id              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	nom             text_valid NOT NULL,
	created_date    timestamptz NOT NULL DEFAULT now(),
	updated_date    timestamptz,
	CHECK (created_date < updated_date)
);

CREATE INDEX idx_privilege ON privilege(id) INCLUDE (nom); -- index couvrant => https://public.dalibo.com/exports/formation/manuels/formations/perf2/perf2.handout.html



------------------------------------------------------------
-- Table: client
------------------------------------------------------------
CREATE TABLE client(
	id       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	prenom         text_valid NOT NULL,
	nom_famille    text_valid NOT NULL,
	email          email NOT NULL UNIQUE,
	password       pass NOT NULL,
	created_date    timestamptz NOT NULL DEFAULT now(),
	updated_date    timestamptz,
	CHECK (created_date < updated_date),
	id_privilege   INT NOT NULL REFERENCES privilege(id) DEFAULT 1
);

CREATE INDEX idx_client_id ON client(id);

-----------------------------------------------------------
-- Table: admin_verif_email
------------------------------------------------------------
CREATE TABLE admin_verif_email(
	id    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	verif_email           BOOL  NOT NULL DEFAULT 'false',
	date_verif_email      timestamptz NOT NULL DEFAULT now(),
	id_client             INT UNIQUE NOT NULL REFERENCES client(id)
);

-----------------------------------------------------------
-- Table: admin_verif_telephone
------------------------------------------------------------
CREATE TABLE admin_verif_telephone(
	id   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	verif_phone             BOOL NOT NULL DEFAULT 'false',
	date_verif_phone        timestamptz NOT NULL DEFAULT now(),
	id_client               INT UNIQUE NOT NULL REFERENCES client(id)
);

------------------------------------------------------------
-- Table: admin_phone
------------------------------------------------------------
CREATE TABLE admin_phone(
	id                INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	admin_telephone   phonenumber  NOT NULL,
	created_date      timestamptz NOT NULL DEFAULT now(),
	updated_date      timestamptz,
	id_client         INT UNIQUE NOT NULL REFERENCES client(id),
	CHECK (created_date < updated_date)
);

------------------------------------------------------------
-- Table: panier
------------------------------------------------------------
CREATE TABLE panier(
	id     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	total         posreal  NOT NULL DEFAULT 00.00,
	created_date   timestamptz NOT NULL DEFAULT now(),
	updated_date   timestamptz,
	CHECK (created_date < updated_date),
	id_client     INT NOT NULL REFERENCES client(id) ON DELETE CASCADE
);


CREATE INDEX idx_panier_id ON panier(id);

------------------------------------------------------------
-- Table: reduction
------------------------------------------------------------
CREATE TABLE reduction(
	id                     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	nom                     text_valid NOT NULL,
	pourcentage_reduction   posrealpourc  NOT NULL,
	actif                   BOOLEAN  NOT NULL,
	created_date            timestamptz NOT NULL DEFAULT now(),
	updated_date            timestamptz,
	CHECK (created_date < updated_date),
	periode_reduction       DATERANGE 
);

------------------------------------------------------------
-- Table: produit
------------------------------------------------------------
CREATE TABLE produit(
	id             INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	nom            text_valid NOT NULL,
	description    text_length NOT NULL,
	prix_HT        posrealsup  NOT NULL,
	created_date       timestamptz NOT NULL DEFAULT now(),
	updated_date       timestamptz,
	CHECK (created_date < updated_date),
	id_categorie   INT REFERENCES categorie(id),
	id_TVA         INT NOT NULL REFERENCES TVA(id),
	id_reduction   INT REFERENCES reduction(id)
);

CREATE INDEX idx_produit_id ON produit(id);
CREATE INDEX idx_produit_nom ON produit(nom);
------------------------------------------------------------
-- Table: produit_image
------------------------------------------------------------
CREATE TABLE produit_image(
	id                       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	nom                      text_valid NOT NULL,
	ordre                    posint NOT NULL,
	URL                      text_valid NOT NULL,
	id_produit               INT NOT NULL REFERENCES produit(id) ON DELETE CASCADE
);

------------------------------------------------------------
-- Table: avis
------------------------------------------------------------
CREATE TABLE avis(
	id                INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	notation          posintsup  NOT NULL,
	avis              text_valid NOT NULL,
	titre             text_valid NOT NULL,
	created_date       timestamptz NOT NULL DEFAULT now(),
	updated_date       timestamptz,
	CHECK (created_date < updated_date),
	id_client         INT NOT NULL REFERENCES client(id),
	id_produit        INT NOT NULL REFERENCES produit(id) ON DELETE CASCADE
);

------------------------------------------------------------
-- Table: sous_categorie
------------------------------------------------------------
CREATE TABLE sous_categorie(
	id                          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	nom                         text_valid NOT NULL,
	description                 text_length NOT NULL,
	created_date                timestamptz NOT NULL DEFAULT now(),
	updated_date                timestamptz,
	CHECK (created_date < updated_date),
	id_categorie                INT NOT NULL REFERENCES categorie(id)
);

------------------------------------------------------------
-- Table: statut_commande
------------------------------------------------------------
CREATE TABLE statut_commande(
	id                 INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	statut             text_valid NOT NULL,
	description        text_length NOT NULL
);

------------------------------------------------------------
-- Table: commande
------------------------------------------------------------
CREATE TABLE commande(
	id                 INT  GENERATED ALWAYS AS IDENTITY UNIQUE,
	reference          text_valid NOT NULL,
	date_achat         timestamptz NOT NULL DEFAULT now(),
	commentaire        text_valid NOT NULL,
	updated_date        timestamptz,
	CHECK (date_achat < updated_date),

	id_commandeStatut   INT  NOT NULL REFERENCES statut_commande(id) ON DELETE CASCADE,
	id_client   	    INT  NOT NULL REFERENCES client(id)


);

-- CREATE INDEX idx_commmande_id ON commande(idClient,idCommande); UNIQUE créé également un index, a tester...

------------------------------------------------------------
-- Table: paiement
------------------------------------------------------------
CREATE TABLE paiement(
	id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	reference             text_valid NOT NULL,
	methode               text_valid NOT NULL,
	date_paiement         timestamptz NOT NULL DEFAULT now(),
	montant               posrealsup  NOT NULL,
	updated_date           timestamptz,
	CHECK (date_paiement < updated_date),	
	id_commande           INT  NOT NULL REFERENCES commande(id) ON DELETE CASCADE
);


------------------------------------------------------------
-- Table: livraison
------------------------------------------------------------
CREATE TABLE livraison(
	id                 INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	frais_expedition   posreal  NOT NULL,
	nom_transporteur   text_valid NOT NULL,
	description		   text_valid NOT NULL,
	numero_suivi       text_valid,
	URL_suivi          text_valid,
	poid               posrealsup  NOT NULL,
	created_date        timestamptz NOT NULL DEFAULT now(),
	updated_date        timestamptz,
	estime_arrive      text_valid,
	CHECK (created_date < updated_date),

	id_client            INT  NOT NULL REFERENCES client(id),
	id_commande          INT  NOT NULL REFERENCES commande(id) ON DELETE CASCADE
	

	
);


-- CREATE INDEX idx_livraison_id ON livraison(idClient,idLivraison);

------------------------------------------------------------
-- Table: client_adresse
------------------------------------------------------------
CREATE TABLE client_adresse(
	id   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	prenom            text_valid NOT NULL,
	nom_famille       text_valid NOT NULL,
	ligne1            text_valid NOT NULL,
	ligne2            text,
	ligne3            text,
	telephone         phonenumber  NOT NULL, 
	titre             text_valid NOT NULL,
	created_date       timestamptz NOT NULL DEFAULT now(),
	updated_date       timestamptz,
	CHECK (created_date < updated_date),

	id_client         INT  NOT NULL REFERENCES client(id),
	id_ville          INT  NOT NULL REFERENCES ville(id) ON DELETE CASCADE
	
);



------------------------------------------------------------
-- Table: facture
------------------------------------------------------------
CREATE TABLE facture(
	id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	reference          text_valid NOT NULL,
	date_facturation   timestamptz NOT NULL DEFAULT now(),
	montant_HT         posrealsup  NOT NULL,
	montant_TTC        posrealsup  NOT NULL,
	montant_TVA        posrealsup  NOT NULL,
	updated_date        timestamptz ,
	CHECK (date_facturation < updated_date),

	id_paiement         INT NOT NULL REFERENCES paiement(id) ON DELETE CASCADE,
	id_client			INT NOT NULL REFERENCES client(id)
);


-- CREATE INDEX idx_facture_id ON facture(idClient,idFacture);

------------------------------------------------------------
-- Table: stock
------------------------------------------------------------
CREATE TABLE stock(
	id       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	quantite      posint  NOT NULL,
	created_date   timestamptz NOT NULL DEFAULT now(),
	updated_date   timestamptz,
	CHECK (created_date < updated_date),
	id_produit    INT UNIQUE NOT NULL REFERENCES produit(id) ON DELETE CASCADE
);


------------------------------------------------------------
-- Table: caracteristique
------------------------------------------------------------
CREATE TABLE caracteristique(
	id   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	couleur             text_valid NOT NULL,
	taille              text_valid NOT NULL,
	created_date        timestamptz NOT NULL DEFAULT now(),
	updated_date        timestamptz,
	CHECK (created_date < updated_date),
	id_produit          INT  NOT NULL REFERENCES produit(id) ON DELETE CASCADE
);

------------------------------------------------------------
-- Table: categorie_image
------------------------------------------------------------
CREATE TABLE categorie_image(
	id   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	nom                text_valid NOT NULL,
	URL                text_valid NOT NULL,
	id_categorie       INT  NOT NULL REFERENCES categorie(id)
);


------------------------------------------------------------
-- Table: sous_categorie_image
------------------------------------------------------------
CREATE TABLE sous_categorie_image(
	id   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	nom                    text_valid NOT NULL ,
	URL                    text_valid NOT NULL ,
	id_sousCategorie       INT  NOT NULL REFERENCES sous_categorie(id)
);





------------------------------------------------------------
-- Table: ligne_commande
------------------------------------------------------------
CREATE TABLE ligne_commande(
	id                  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	quantite_commande   posintsup  NOT NULL,
	created_date        timestamptz NOT NULL DEFAULT now(),
	updated_date        timestamptz,

	id_produit          INT  NOT NULL REFERENCES produit(id) ON DELETE CASCADE,
	id_commande			INT  NOT NULL REFERENCES commande(id) ON DELETE CASCADE
	
);

-- CREATE INDEX idx_ligne_commande_id ON ligne_commande(idClient,idCommande,idCommandeLigne);

------------------------------------------------------------
-- Table: ligne_livraison
------------------------------------------------------------
CREATE TABLE ligne_livraison(
	id                 INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	quantite_livraison  posintsup  NOT NULL,
	created_date        timestamptz NOT NULL DEFAULT now(),
	updated_date        timestamptz,

	id_livraison        INT  NOT NULL REFERENCES livraison(id) ON DELETE CASCADE,
	id_commandeLigne    INT  NOT NULL REFERENCES ligne_commande(id) ON DELETE CASCADE
	
);


-- CREATE INDEX idx_ligne_livraison_id ON ligne_livraison(idClient,idLivraison,idLivraisonLigne);

------------------------------------------------------------
-- Table: ligne_panier
------------------------------------------------------------
CREATE TABLE ligne_panier(
	id                  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	quantite            posintsup  NOT NULL,
	created_date        timestamptz NOT NULL DEFAULT now(),
	updated_date        timestamptz,

	id_produit          INT  NOT NULL REFERENCES produit(id) ON DELETE CASCADE,
	id_panier           INT  NOT NULL REFERENCES panier(id) ON DELETE CASCADE
);

------------------------------------------------------------
-- Table: produit_commande_retourne
------------------------------------------------------------
CREATE TABLE produit_retour(
	id                           INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	quantite                     posint  NOT NULL DEFAULT 0,
	created_date                 timestamptz NOT NULL DEFAULT now(),
	updated_date                 timestamptz,
	commentaire                  text_valid NOT NULL,
	id_commandeLigne             INT NOT NULL REFERENCES ligne_commande(id) ON DELETE CASCADE

);


------------------------------------------------------------
-- Table: client_historique_password
------------------------------------------------------------
CREATE TABLE client_historique_password(
	id   						  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	password_hash                 pass NOT NULL,
	created_date    			  timestamptz NOT NULL DEFAULT now(),
	id_client                     INT  NOT NULL REFERENCES client(id)
);


------------------------------------------------------------
-- Table: client_historique_connexion
------------------------------------------------------------
CREATE TABLE client_historique_connexion(
	id   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	connexion_succes              BOOLEAN  NOT NULL,
	connexion_date                timestamptz NOT NULL DEFAULT now(),
	id_client                     INT  NOT NULL REFERENCES client(id)
);


------------------------------------------------------------
-- Table: ville_a_codePostale
------------------------------------------------------------
CREATE TABLE ville_a_codePostal (
	id              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	id_ville                          INT NOT NULL REFERENCES ville(id) ON DELETE CASCADE,
	id_codePostal                    INT NOT NULL REFERENCES code_postal(id)
);


------------------------------------------------------------
-- Table: fournie
------------------------------------------------------------
CREATE TABLE fournie(
	id       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	id_fournisseur   INT  NOT NULL REFERENCES fournisseur(id) ON DELETE CASCADE,
	id_produit       INT  NOT NULL REFERENCES produit(id) ON DELETE CASCADE
);

COMMIT;



