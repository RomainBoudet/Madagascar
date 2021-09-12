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


-- ~	Matches regular expression, case sensitive
-- ~*	Matches regular expression, case insensitive	
-- !~	Does not match regular expression, case sensitive	
-- !~*	Does not match regular expression, case insensitive
-- !~*	Does not match regular expression, case insensitive

 
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

-- on stock en format E.164 => ^\+[1-9]\d{1,14}$  ==>> ^\+[1-9]\d{10}$ pour la france, réduit a 10  https://www.twilio.com/docs/glossary/what-e164 
CREATE DOMAIN phonenumber AS text -- un domaine (type de donnée) permettant de vérifier la validité d'un numéro de téléphone via une regex
	CHECK (

		VALUE ~* '^\+[1-9]\d{10,14}$'
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


-- a retravailler pour que la regex fonctionne sous postgres
CREATE DOMAIN urlhttp as text  -- un domaine (type de donnée) permettant de vérifier la validité d'un mot de passe en hash via une regex (fonctionne uniquement avec bcrypt qui commence ces hash de la même maniére)
CHECK (

		VALUE ~* '^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$'
				--'^[A-Za-z0-9._%\-+!#$&/=?^|~]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'
	);
-- https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)

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
	taux          posrealpourc  NOT NULL,
	nom           text_valid NOT NULL,
	periode_TVA   DATERANGE NOT NULL DEFAULT '[2021-01-01, 2999-12-24]' -- [] => on inclut les deux bornes // () => on exclut les deux bornes // (] => on exclut la 1iere borne .... etc.)
);




------------------------------------------------------------
-- Table: code_postal
------------------------------------------------------------
 /* CREATE TABLE code_postal(
	id    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code_postal     postale_code_fr NOT NULL 
);  */


------------------------------------------------------------
-- Table: pays
------------------------------------------------------------
 /* CREATE TABLE pays(
	id   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	nom      text_valid NOT NULL
);
  */

------------------------------------------------------------
-- Table: ville
------------------------------------------------------------
 /* CREATE TABLE ville(
	id     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	nom         text_valid NOT NULL,
	id_pays     INT NOT NULL REFERENCES pays(id) ON DELETE RESTRICT
);  */


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
	id                        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	verif_email               BOOLEAN  NOT NULL DEFAULT FALSE,
	email_new_commande_choice BOOLEAN NOT NULL DEFAULT FALSE,
	date_verif_email          timestamptz,
	id_client                 INT UNIQUE NOT NULL REFERENCES client(id) ON DELETE CASCADE
);


------------------------------------------------------------
-- Table: admin_phone -- insertion uniquement si vérifié...
------------------------------------------------------------
CREATE TABLE admin_phone(
	id                INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	admin_telephone   phonenumber  NOT NULL,
	sms_new_commande  BOOLEAN NOT NULL DEFAULT FALSE,
	created_date      timestamptz NOT NULL DEFAULT now(),
	updated_date      timestamptz,
	id_client         INT UNIQUE NOT NULL REFERENCES client(id) ON DELETE CASCADE,
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
	nom                     text_valid UNIQUE NOT NULL,
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
	image_mini	   text_valid NOT NULL,
	created_date   timestamptz NOT NULL DEFAULT now(),
	updated_date   timestamptz,
	CHECK (created_date < updated_date),
	id_categorie   INT REFERENCES categorie(id) ON DELETE CASCADE,
	id_TVA         INT NOT NULL REFERENCES TVA(id),
	id_reduction   INT REFERENCES reduction(id)
);

CREATE INDEX idx_produit_id ON produit(id);
CREATE INDEX idx_produit_nom ON produit(nom);
------------------------------------------------------------
-- Table: image
------------------------------------------------------------
CREATE TABLE image (
	id                       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	nom                      text_valid NOT NULL,
	ordre                    posint NOT NULL,
	URL                      text_valid NOT NULL,
	created_date             timestamptz NOT NULL DEFAULT now(),
	updated_date             timestamptz,
	CHECK (created_date < updated_date),
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
	id_client         INT NOT NULL REFERENCES client(id) ON DELETE CASCADE,
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
	id_categorie                INT NOT NULL REFERENCES categorie(id) ON DELETE CASCADE
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
	reference          text_valid UNIQUE NOT NULL,
	date_achat         timestamptz NOT NULL DEFAULT now(),
	commentaire        text_valid,
	send_sms_shipping	boolean NOT NULL DEFAULT FALSE,
	updated_date        timestamptz,
	CHECK (date_achat < updated_date),

	id_commandeStatut   INT  NOT NULL REFERENCES statut_commande(id) ON DELETE CASCADE,
	id_client   	    INT  NOT NULL REFERENCES client(id) ON DELETE CASCADE


);

-- CREATE INDEX idx_commmande_id ON commande(idClient,idCommande); UNIQUE créé également un index, a tester...

------------------------------------------------------------
-- Table: paiement
------------------------------------------------------------
CREATE TABLE paiement(
	id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	reference             text_valid UNIQUE NOT NULL,
	methode               text_valid NOT NULL,
	payment_intent		  text_valid UNIQUE NOT NULL,
	moyen_paiement		  text_valid NOT NULL,
	moyen_paiement_detail text_valid NOT NULL,
	origine				  text_valid NOT NULL,
	derniers_chiffres	  text_valid,
	date_paiement         timestamptz NOT NULL DEFAULT now(),
	montant               posrealsup  NOT NULL,
	updated_date           timestamptz,
	CHECK (date_paiement < updated_date),	
	id_commande           INT  NOT NULL REFERENCES commande(id) ON DELETE CASCADE
);


------------------------------------------------------------
-- Table: transporteur
------------------------------------------------------------

CREATE TABLE transporteur(
	id                  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	nom				    text_valid UNIQUE NOT NULL,
	description			text_valid NOT NULL,
	frais_expedition    posreal  NOT NULL,
	estime_arrive       text_valid,
	estime_arrive_number text_valid, -- en jour, aprés la date de la commande... ne peut être un integer car si choix du marché => string : "Prochain marché"
	logo				text_valid NOT NULL,
	created_date        timestamptz NOT NULL DEFAULT now(),
	updated_date        timestamptz,
	
	CHECK (created_date < updated_date)


);



-- CREATE INDEX idx_livraison_id ON livraison(idClient,idLivraison);

------------------------------------------------------------
-- Table: client_adresse
------------------------------------------------------------
/*  CREATE TABLE client_adresse(
	id   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	titre             text_valid NOT NULL,
	prenom            text_valid NOT NULL,
	nom_famille       text_valid NOT NULL,
	ligne1            text_valid NOT NULL,
	ligne2            text_valid,
	ligne3            text_valid,
	telephone         phonenumber  NOT NULL, 
	envoie			  BOOLEAN,
	created_date       timestamptz NOT NULL DEFAULT now(),
	updated_date       timestamptz,
	CHECK (created_date < updated_date),

	id_client         INT  NOT NULL REFERENCES client(id),
	id_ville          INT  NOT NULL REFERENCES ville(id) 
	
); 

*/

------------------------------------------------------------
-- Table: adresse (test sans 3NF)
------------------------------------------------------------
CREATE TABLE adresse (
	id   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	titre             text_valid NOT NULL,
	prenom            text_valid NOT NULL,
	nom_famille       text_valid NOT NULL,
	ligne1            text_valid NOT NULL,
	ligne2            text_valid,
	ligne3            text_valid,
	code_postal		  postale_code_fr NOT NULL,
	ville			  text_valid NOT NULL,
	pays			  text_valid NOT NULL,
	telephone         phonenumber  NOT NULL, 
	envoie		      BOOLEAN,
	facturation		  BOOLEAN DEFAULT TRUE,

	
	created_date       timestamptz NOT NULL DEFAULT now(),
	updated_date       timestamptz,
	CHECK (created_date < updated_date),

	id_client         INT  NOT NULL REFERENCES client(id) ON DELETE CASCADE
);
 
CREATE UNIQUE INDEX only_one_row_with_column_true_envoie 
    ON adresse (id_client) WHERE envoie; 
--la colonne envoie pourra contenir un seul null par id_client !

CREATE UNIQUE INDEX only_one_row_with_column_true_facturation 
    ON adresse (id_client) WHERE facturation; 

------------------------------------------------------------
-- Table: facture
------------------------------------------------------------
CREATE TABLE facture(
	id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	reference          text_valid UNIQUE NOT NULL,
	date_facturation   timestamptz NOT NULL DEFAULT now(),
	montant_HT         posrealsup  NOT NULL,
	montant_TTC        posrealsup  NOT NULL,
	montant_TVA        posrealsup  NOT NULL,
	updated_date        timestamptz ,
	CHECK (date_facturation < updated_date),

	id_paiement         INT NOT NULL REFERENCES paiement(id) ON DELETE CASCADE,
	id_client			INT NOT NULL REFERENCES client(id) ON DELETE CASCADE
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
	id_categorie       INT  NOT NULL REFERENCES categorie(id) ON DELETE CASCADE
);


------------------------------------------------------------
-- Table: sous_categorie_image
------------------------------------------------------------
CREATE TABLE sous_categorie_image(
	id   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	nom                    text_valid NOT NULL ,
	URL                    text_valid NOT NULL ,
	id_sousCategorie       INT  NOT NULL REFERENCES sous_categorie(id) ON DELETE CASCADE
);



------------------------------------------------------------
-- Table: livraison
------------------------------------------------------------
CREATE TABLE livraison(
	id                 INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	reference			text_valid UNIQUE NOT NULL,
	numero_suivi       text_valid,
	URL_suivi          text_valid,
	poid               posrealsup  NOT NULL DEFAULT 2, -- en KG
	created_date        timestamptz NOT NULL DEFAULT now(),
	updated_date        timestamptz,
	
	CHECK (created_date < updated_date),

	id_client            INT  NOT NULL REFERENCES client(id) ON DELETE CASCADE,
	id_commande          INT  NOT NULL REFERENCES commande(id) ON DELETE CASCADE,
	id_transporteur		 INT NOT NULL REFERENCES transporteur(id) ON DELETE CASCADE
	
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
	id_commande			INT  NOT NULL REFERENCES commande(id) ON DELETE CASCADE,
	id_livraison        INT  REFERENCES livraison(id)  ON DELETE CASCADE
	
);

-- CREATE INDEX idx_ligne_commande_id ON ligne_commande(idClient,idCommande,idCommandeLigne);

------------------------------------------------------------
-- Table: ligne_livraison
------------------------------------------------------------
/* CREATE TABLE ligne_livraison(
	id                 INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	quantite_livraison  posintsup  NOT NULL,
	created_date        timestamptz NOT NULL DEFAULT now(),
	updated_date        timestamptz,

	id_livraison        INT  NOT NULL REFERENCES livraison(id) ON DELETE CASCADE,
	id_commandeLigne    INT  NOT NULL REFERENCES ligne_commande(id) ON DELETE CASCADE
	
); */


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
	id_client                     INT  NOT NULL REFERENCES client(id) ON DELETE CASCADE
);


------------------------------------------------------------
-- Table: client_historique_connexion
------------------------------------------------------------
CREATE TABLE client_historique_connexion(
	id   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	connexion_succes              BOOLEAN  NOT NULL,
	connexion_date                timestamptz NOT NULL DEFAULT now(),
	id_client                     INT  NOT NULL REFERENCES client(id) ON DELETE CASCADE
);


------------------------------------------------------------
-- Table: ville_a_codePostale
------------------------------------------------------------
 /* CREATE TABLE ville_a_codePostal (
	id              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	id_ville                          INT NOT NULL REFERENCES ville(id) ON DELETE CASCADE,
	id_codePostal                    INT NOT NULL REFERENCES code_postal(id)
); */
 

------------------------------------------------------------
-- Table: fournie
------------------------------------------------------------
CREATE TABLE fournie(
	id       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	id_fournisseur   INT  NOT NULL REFERENCES fournisseur(id) ON DELETE CASCADE,
	id_produit       INT  NOT NULL REFERENCES produit(id) ON DELETE CASCADE
);




CREATE TABLE twillio(

id                   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
twillio_number       phonenumber NOT NULL UNIQUE,
dev_number           phonenumber NOT NULL UNIQUE,
client_number        phonenumber UNIQUE,
account_sid          text UNIQUE NOT NULL,
auth_token           text UNIQUE NOT NULL,
sid_verify           text UNIQUE NOT NULL,
created_date         timestamptz NOT NULL DEFAULT now(),
updated_date         timestamptz,
CHECK (created_date < updated_date)

);



--------------------------------
-- Création des principales vues 
--------------------------------

-- Une vue pour les principales infos concernant les clients et leur adresse : 

CREATE VIEW mada.view_adresse AS
SELECT 
client.id as id_client,
adresse.id as id_adresse,
client.prenom,
client.nom_famille,
client.email as email,
adresse.titre as titre,
adresse.prenom as adresse_prenom,
adresse.nom_famille as adresse_nomFamille,
adresse.ligne1 as ligne1,
adresse.ligne2 as ligne2,
adresse.ligne3 as ligne3,
adresse.telephone as telephone,
adresse.envoie as envoie,
adresse.facturation as facturation,
adresse.pays as pays,
CAST (adresse.code_postal as INTEGER) as code_postal,
adresse.ville as ville,
adresse.created_date,
adresse.updated_date,
privilege.nom as privilege
FROM mada.client
JOIN mada.adresse ON adresse.id_client = client.id
JOIN mada.privilege ON client.id_privilege = privilege.id
ORDER BY client.id ASC;


-- Une vue simplifié pour les produits sans leurs avis et photos aggrégés, utilisé notamment pour les paniers

CREATE VIEW mada.view_produit AS 
SELECT
produit.nom as produit,
CAST (produit.prix_HT as FLOAT) as prix,
produit.image_mini as image,
caracteristique.couleur as couleur,
caracteristique.taille as taille,
CAST (stock.quantite as INTEGER) as stock,
CAST (reduction.pourcentage_reduction as FLOAT) as reduction,
produit.id,
CAST (tva.taux as FLOAT) as tva
FROM mada.produit 
LEFT JOIN mada.tva ON produit.id_tva = tva.id
LEFT JOIN mada.reduction ON produit.id_reduction = reduction.id AND reduction.actif = TRUE
LEFT JOIN mada.caracteristique ON caracteristique.id_produit = produit.id
LEFT JOIN mada.stock ON stock.id_produit = produit.id;

-- Une vue compléte des produits avec avis et photos aggrégés ordonné par id des produits, utilisé pour afficher le détail d'un produit

CREATE VIEW mada.view_produit_plus AS 
SELECT
produit.nom as produit,
produit.description as description,
CAST (produit.prix_HT as FLOAT) as prixHT,
produit.image_mini,
caracteristique.couleur as couleur,
caracteristique.taille as taille,
CAST (stock.quantite as INTEGER) as stock,
CAST (reduction.pourcentage_reduction as FLOAT) as reduction,
CAST (tva.taux as FLOAT) as tva,
categorie.nom as categorie,
array_to_json(array_remove(array_agg(DISTINCT image.URL), NULL)) image,
array_to_json(array_remove(array_agg(DISTINCT avis.avis), NULL)) avis,
produit.id
FROM mada.produit 
LEFT JOIN mada.categorie ON produit.id_categorie = categorie.id
LEFT JOIN mada.tva ON produit.id_tva = tva.id
LEFT JOIN mada.reduction ON produit.id_reduction = reduction.id AND reduction.actif = TRUE
LEFT JOIN mada.caracteristique ON caracteristique.id_produit = produit.id
LEFT JOIN mada.stock ON stock.id_produit = produit.id
LEFT JOIN mada.image ON image.id_produit = produit.id
LEFT JOIN mada.avis ON avis.id_produit = produit.id
GROUP BY produit, produit.description, prixHT, couleur, taille, stock, reduction, tva, categorie, produit.id
ORDER BY produit.id;

-- Une vue compléte des catégories et de leur produits, utilisé pour afficher tous les produits d'une catégorie, trié selon le nom des produits, tous ces produits appartenant a une même catégorie...

CREATE VIEW mada.view_categorie AS 
SELECT
produit.nom as produit,
produit.description as description_produit,
CAST (produit.prix_HT as FLOAT) as prix,
produit.image_mini,
caracteristique.couleur as couleur,
caracteristique.taille as taille,
CAST (stock.quantite as INTEGER) as stock,
CAST (reduction.pourcentage_reduction as FLOAT) as reduction,
CAST (tva.taux as FLOAT) as tva,
categorie.nom as categorie,
categorie.id as categorie_id,
categorie.description as description_categorie,
array_to_json(array_remove(array_agg(DISTINCT categorie_image.URL), NULL)) as image_categorie,
array_to_json(array_remove(array_agg(DISTINCT image.URL), NULL)) as image_produit,
array_to_json(array_remove(array_agg(DISTINCT avis.avis), NULL)) as avis
FROM mada.produit 
LEFT JOIN mada.categorie ON produit.id_categorie = categorie.id
LEFT JOIN mada.tva ON produit.id_tva = tva.id
LEFT JOIN mada.reduction ON produit.id_reduction = reduction.id
LEFT JOIN mada.caracteristique ON caracteristique.id_produit = produit.id
LEFT JOIN mada.stock ON stock.id_produit = produit.id
LEFT JOIN mada.image ON image.id_produit = produit.id
LEFT JOIN mada.avis ON avis.id_produit = produit.id
LEFT JOIN mada.categorie_image ON categorie_image.id_categorie = categorie.id
GROUP BY produit, categorie.id, produit.description, prix, couleur, taille, stock, reduction, tva, categorie, produit.id
ORDER BY produit.nom ASC;

--! EXPLICATION array_to_json(array_remove(array_agg(DISTINCT ma_colonne), NULL)) as le_beau_nom_de_ma_colonne
-- Un client peut avoir plusieurs adresses. Je veux pour chaque client, toutes les adresses en une ligne, comprises dans un tableau. 
--Je veux un tableau et pas un objet comme rendu par array_agg. Donc => DISTINCT pour ne pas avoir de double dans ma colonne, array_agg pour que ça me rassemble les valeurs en un objet, remove_array pour enlever les NULL (ne fonctionne pas directement sus json_agg qui rend un objet, ce qui explique l'étape intémédiaire du array_agg au lieu du json_agg direct), puis je convertit mon objet sans NULL en véritable tableau avec array_to_json. 
--LEFT JOIN car quioiqu'il y ai dans mes autres colonnes, je veux dans tous les cas tous les clients 

CREATE VIEW mada.view_paiement AS
SELECT 
client.id,
client.prenom,
client.nom_famille,
client.email,
paiement.reference as paiement_ref,
paiement.methode as paiement_methode,
CAST (paiement.montant as FLOAT) as paiement_montant,
to_char(paiement.date_paiement, 'TMDay DD TMMonth YYYY à  HH24:MI:SS') as paiement_date
FROM mada.paiement
JOIN mada.commande ON commande.id = paiement.id_commande
JOIN mada.client ON client.id = commande.id_client
ORDER BY client.id ASC;






--Une vue compléte pour les livraisons

CREATE VIEW mada.view_livraisons AS
SELECT 
livraison.id as id_livraison,
livraison.reference as ref_livraison,
to_char(livraison.created_date,'TMDay DD TMMonth YYYY à  HH24:MI:SS' ) as date_livraison,
livraison.numero_suivi,
livraison.URL_suivi,
CAST (livraison.poid AS FLOAT),
client.id as id_client, 
client.prenom as client_prenom, 
client.nom_famille as client_nomFamille,
adresse.prenom as adresse_prenom,
adresse.nom_famille as adresse_nomFamille,
adresse.ligne1 as adresse1,
adresse.ligne2 as adresse2,
adresse.ligne3 as adresse3,
CAST (adresse.code_postal as INTEGER) as codePostal,
adresse.ville,
adresse.pays,
adresse.telephone,
transporteur.nom as transporteur,
CAST (transporteur.frais_expedition as FLOAT),
commande.reference as ref_commande,
paiement.reference as ref_paiement,
CAST(paiement.montant as FLOAT) as montant_paiement,
to_char(paiement.date_paiement,'TMDay DD TMMonth YYYY à  HH24:MI:SS' ) as date_paiement
FROM
mada.livraison
JOIN mada.client ON client.id = livraison.id_client
JOIN mada.adresse ON client.id = adresse.id_client AND adresse.envoie = TRUE
JOIN mada.transporteur ON livraison.id_transporteur = transporteur.id
JOIN mada.commande ON commande.id = livraison.id_commande
JOIN mada.paiement ON paiement.id_commande = commande.id
ORDER BY livraison.id;


--Une vue compléte pour les produits livrés / commandés

CREATE VIEW mada.view_produit_livrer AS
SELECT 
produit.nom,
CAST(ligne_commande.quantite_commande as INTEGER),
CAST (produit.prix_HT as FLOAT),
CAST (tva.taux as FLOAT),
CAST (transporteur.frais_expedition as FLOAT),
produit.image_mini,
livraison.id as id_livraison,
livraison.reference as ref_livraison,
to_char(livraison.created_date,'TMDay DD TMMonth YYYY à  HH24:MI:SS' ) as date_livraison,
livraison.numero_suivi,
livraison.URL_suivi,
CAST(livraison.poid as FLOAT),
client.id as id_client,
client.prenom as client_prenom, 
client.nom_famille as client_nomFamille,
adresse.prenom as adresse_prenom,
adresse.nom_famille as adresse_nomFamille,
adresse.ligne1 as adresse1,
adresse.ligne2 as adresse2,
adresse.ligne3 as adresse3,
CAST (adresse.code_postal as INTEGER) as codePostal,
adresse.ville,
adresse.pays,
adresse.telephone,
transporteur.nom as transporteur
FROM
mada.ligne_commande
JOIN mada.produit ON produit.id = ligne_commande.id_produit
JOIN mada.tva ON tva.id = produit.id_tva
JOIN mada.livraison ON ligne_commande.id_livraison = livraison.id
JOIN mada.client ON client.id = livraison.id_client 
JOIN mada.adresse ON client.id = adresse.id_client AND adresse.envoie = TRUE
JOIN mada.transporteur ON livraison.id_transporteur = transporteur.id
ORDER BY livraison.reference;


COMMIT;



