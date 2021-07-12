------------------------------------------------------------
--        Script Postgre 
------------------------------------------------------------



------------------------------------------------------------
-- Table: TVA
------------------------------------------------------------
CREATE TABLE public.TVA(
	idTVA         SERIAL NOT NULL ,
	taux          DECIMAL (50,-1)  NOT NULL ,
	nom           VARCHAR (50) NOT NULL ,
	periode_TVA   VARCHAR (50) NOT NULL  ,
	CONSTRAINT TVA_PK PRIMARY KEY (idTVA)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: privilege
------------------------------------------------------------
CREATE TABLE public.privilege(
	idPrivilege   SERIAL NOT NULL ,
	nom           VARCHAR (50) NOT NULL  ,
	CONSTRAINT privilege_PK PRIMARY KEY (idPrivilege)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: client
------------------------------------------------------------
CREATE TABLE public.client(
	idClient      SERIAL NOT NULL ,
	prenom        VARCHAR (50) NOT NULL ,
	nom_famille   VARCHAR (50) NOT NULL ,
	email         VARCHAR (50) NOT NULL ,
	password      VARCHAR (50) NOT NULL ,
	createdDate   DATE  NOT NULL ,
	updatedDate   DATE  NOT NULL ,
	idPrivilege   INT  NOT NULL  ,
	CONSTRAINT client_PK PRIMARY KEY (idClient)

	,CONSTRAINT client_privilege_FK FOREIGN KEY (idPrivilege) REFERENCES public.privilege(idPrivilege)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: panier
------------------------------------------------------------
CREATE TABLE public.panier(
	idPanier      SERIAL NOT NULL ,
	montant       DECIMAL (50,-1)  NOT NULL ,
	createdDate   VARCHAR (50) NOT NULL ,
	updatedDate   VARCHAR (50) NOT NULL ,
	idClient      INT  NOT NULL  ,
	CONSTRAINT panier_PK PRIMARY KEY (idPanier)

	,CONSTRAINT panier_client_FK FOREIGN KEY (idClient) REFERENCES public.client(idClient)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: fournisseur
------------------------------------------------------------
CREATE TABLE public.fournisseur(
	idFournisseur   SERIAL NOT NULL ,
	nom             VARCHAR (50) NOT NULL ,
	logo            VARCHAR (50) NOT NULL  ,
	CONSTRAINT fournisseur_PK PRIMARY KEY (idFournisseur)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: categorie
------------------------------------------------------------
CREATE TABLE public.categorie(
	idCategorie   SERIAL NOT NULL ,
	nom           VARCHAR (50) NOT NULL ,
	description   VARCHAR (2000)  NOT NULL ,
	ordre         INT  NOT NULL ,
	createdDate   DATE  NOT NULL ,
	updatedDate   DATE  NOT NULL  ,
	CONSTRAINT categorie_PK PRIMARY KEY (idCategorie)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: produit
------------------------------------------------------------
CREATE TABLE public.produit(
	idProduit     SERIAL NOT NULL ,
	nom           VARCHAR (50) NOT NULL ,
	description   VARCHAR (50) NOT NULL ,
	prix_HT       DECIMAL (-1,-1)  NOT NULL ,
	idCategorie   INT  NOT NULL ,
	idTVA         INT  NOT NULL  ,
	CONSTRAINT produit_PK PRIMARY KEY (idProduit)

	,CONSTRAINT produit_categorie_FK FOREIGN KEY (idCategorie) REFERENCES public.categorie(idCategorie)
	,CONSTRAINT produit_TVA0_FK FOREIGN KEY (idTVA) REFERENCES public.TVA(idTVA)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: produit_image
------------------------------------------------------------
CREATE TABLE public.produit_image(
	idProduitImage   SERIAL NOT NULL ,
	nom              VARCHAR (50) NOT NULL ,
	ordre            VARCHAR (50) NOT NULL ,
	URL              VARCHAR (50) NOT NULL ,
	idProduit        INT  NOT NULL  ,
	CONSTRAINT produit_image_PK PRIMARY KEY (idProduitImage)

	,CONSTRAINT produit_image_produit_FK FOREIGN KEY (idProduit) REFERENCES public.produit(idProduit)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: avis
------------------------------------------------------------
CREATE TABLE public.avis(
	idAvis        SERIAL NOT NULL ,
	notation      INT  NOT NULL ,
	avis          VARCHAR (50) NOT NULL ,
	titre         VARCHAR (50) NOT NULL ,
	createdDate   DATE  NOT NULL ,
	updatedDate   DATE  NOT NULL ,
	idClient      INT  NOT NULL ,
	idProduit     INT  NOT NULL  ,
	CONSTRAINT avis_PK PRIMARY KEY (idAvis)

	,CONSTRAINT avis_client_FK FOREIGN KEY (idClient) REFERENCES public.client(idClient)
	,CONSTRAINT avis_produit0_FK FOREIGN KEY (idProduit) REFERENCES public.produit(idProduit)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: sous_categorie
------------------------------------------------------------
CREATE TABLE public.sous_categorie(
	idSousCategorie   SERIAL NOT NULL ,
	nom               VARCHAR (50) NOT NULL ,
	description       VARCHAR (50) NOT NULL ,
	createdDate       DATE  NOT NULL ,
	updatedDate       DATE  NOT NULL ,
	idCategorie       INT  NOT NULL  ,
	CONSTRAINT sous_categorie_PK PRIMARY KEY (idSousCategorie)

	,CONSTRAINT sous_categorie_categorie_FK FOREIGN KEY (idCategorie) REFERENCES public.categorie(idCategorie)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: commande
------------------------------------------------------------
CREATE TABLE public.commande(
	idClient      INT  NOT NULL ,
	idCommande    INT  NOT NULL ,
	reference     VARCHAR (50) NOT NULL ,
	date_achat    DATE  NOT NULL ,
	statut        VARCHAR (50) NOT NULL ,
	commentaire   VARCHAR (50) NOT NULL ,
	updatedDate   DATE  NOT NULL  ,
	CONSTRAINT commande_PK PRIMARY KEY (idClient,idCommande)

	,CONSTRAINT commande_client_FK FOREIGN KEY (idClient) REFERENCES public.client(idClient)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: commande_paiement
------------------------------------------------------------
CREATE TABLE public.commande_paiement(
	idCommandedPaiement   SERIAL NOT NULL ,
	reference             VARCHAR (50) NOT NULL ,
	methode               VARCHAR (50) NOT NULL ,
	date_paiement         DATE  NOT NULL ,
	montant               DECIMAL (-1,-1)  NOT NULL ,
	updatedDate           DATE  NOT NULL ,
	idClient              INT  NOT NULL ,
	idCommande            INT  NOT NULL  ,
	CONSTRAINT commande_paiement_PK PRIMARY KEY (idCommandedPaiement)

	,CONSTRAINT commande_paiement_commande_FK FOREIGN KEY (idClient,idCommande) REFERENCES public.commande(idClient,idCommande)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: livraison
------------------------------------------------------------
CREATE TABLE public.livraison(
	idClient           INT  NOT NULL ,
	idLivraison        INT  NOT NULL ,
	frais_expedition   DECIMAL (-1,-1)  NOT NULL ,
	nom_transporteur   VARCHAR (50) NOT NULL ,
	date_envoi         DATE  NOT NULL ,
	numero_suivi       INT  NOT NULL ,
	URL_suivi          VARCHAR (50) NOT NULL ,
	poid               DECIMAL (50,-1)  NOT NULL ,
	createdDate        DATE  NOT NULL ,
	updatedDate        DATE  NOT NULL ,
	estime_arrive      VARCHAR (50) NOT NULL  ,
	CONSTRAINT livraison_PK PRIMARY KEY (idClient,idLivraison)

	,CONSTRAINT livraison_client_FK FOREIGN KEY (idClient) REFERENCES public.client(idClient)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: code_postal
------------------------------------------------------------
CREATE TABLE public.code_postal(
	idCodePostale   SERIAL NOT NULL ,
	code_postal     INT  NOT NULL  ,
	CONSTRAINT code_postal_PK PRIMARY KEY (idCodePostale)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: pays
------------------------------------------------------------
CREATE TABLE public.pays(
	idPays   SERIAL NOT NULL ,
	nom      VARCHAR (50) NOT NULL  ,
	CONSTRAINT pays_PK PRIMARY KEY (idPays)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: ville
------------------------------------------------------------
CREATE TABLE public.ville(
	idVille   SERIAL NOT NULL ,
	nom       VARCHAR (50) NOT NULL ,
	idPays    INT  NOT NULL  ,
	CONSTRAINT ville_PK PRIMARY KEY (idVille)

	,CONSTRAINT ville_pays_FK FOREIGN KEY (idPays) REFERENCES public.pays(idPays)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: client_adresse
------------------------------------------------------------
CREATE TABLE public.client_adresse(
	idClientAdresse   SERIAL NOT NULL ,
	prenom            VARCHAR (50) NOT NULL ,
	nom_famille       VARCHAR (50) NOT NULL ,
	ligne1            VARCHAR (50) NOT NULL ,
	ligne2            VARCHAR (50) NOT NULL ,
	ligne3            VARCHAR (50) NOT NULL ,
	numero            INT  NOT NULL ,
	titre             VARCHAR (50) NOT NULL ,
	createdDate       DATE  NOT NULL ,
	updatedDate       DATE  NOT NULL ,
	idClient          INT  NOT NULL ,
	idVille           INT  NOT NULL  ,
	CONSTRAINT client_adresse_PK PRIMARY KEY (idClientAdresse)

	,CONSTRAINT client_adresse_client_FK FOREIGN KEY (idClient) REFERENCES public.client(idClient)
	,CONSTRAINT client_adresse_ville0_FK FOREIGN KEY (idVille) REFERENCES public.ville(idVille)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: facture
------------------------------------------------------------
CREATE TABLE public.facture(
	idClient           INT  NOT NULL ,
	idFacture          INT  NOT NULL ,
	reference          VARCHAR (50) NOT NULL ,
	date_facturation   DATE  NOT NULL ,
	montant_HT         DECIMAL (-1,-1)  NOT NULL ,
	montant_TTC        DECIMAL (-1,-1)  NOT NULL ,
	montant_TVA        DECIMAL (-1,-1)  NOT NULL ,
	taux_TVA           DECIMAL (-1,-1)  NOT NULL ,
	updatedDate        DATE  NOT NULL  ,
	CONSTRAINT facture_PK PRIMARY KEY (idClient,idFacture)

	,CONSTRAINT facture_client_FK FOREIGN KEY (idClient) REFERENCES public.client(idClient)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: stock
------------------------------------------------------------
CREATE TABLE public.stock(
	idStock       SERIAL NOT NULL ,
	quantite      INT  NOT NULL ,
	createdDate   DATE  NOT NULL ,
	updatedDate   DATE  NOT NULL ,
	idProduit     INT  NOT NULL  ,
	CONSTRAINT stock_PK PRIMARY KEY (idStock)

	,CONSTRAINT stock_produit_FK FOREIGN KEY (idProduit) REFERENCES public.produit(idProduit)
	,CONSTRAINT stock_produit_AK UNIQUE (idProduit)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: reduction
------------------------------------------------------------
CREATE TABLE public.reduction(
	idReduction             SERIAL NOT NULL ,
	nom                     VARCHAR (50) NOT NULL ,
	pourcentage_reduction   DECIMAL (-1,-1)  NOT NULL ,
	actif                   BOOL  NOT NULL ,
	periode_reduction       DATE  NOT NULL  ,
	CONSTRAINT reduction_PK PRIMARY KEY (idReduction)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: caracteristique
------------------------------------------------------------
CREATE TABLE public.caracteristique(
	idCaracteristique   SERIAL NOT NULL ,
	couleur             VARCHAR (50) NOT NULL ,
	taille              VARCHAR (50) NOT NULL ,
	idProduit           INT  NOT NULL  ,
	CONSTRAINT caracteristique_PK PRIMARY KEY (idCaracteristique)

	,CONSTRAINT caracteristique_produit_FK FOREIGN KEY (idProduit) REFERENCES public.produit(idProduit)
	,CONSTRAINT caracteristique_produit_AK UNIQUE (idProduit)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: category_image
------------------------------------------------------------
CREATE TABLE public.category_image(
	idCategorieImage   SERIAL NOT NULL ,
	nom                VARCHAR (50) NOT NULL ,
	URL                VARCHAR (50) NOT NULL ,
	idCategorie        INT  NOT NULL  ,
	CONSTRAINT category_image_PK PRIMARY KEY (idCategorieImage)

	,CONSTRAINT category_image_categorie_FK FOREIGN KEY (idCategorie) REFERENCES public.categorie(idCategorie)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: sous_category_image
------------------------------------------------------------
CREATE TABLE public.sous_category_image(
	idSousCategorieImage   SERIAL NOT NULL ,
	nom                    VARCHAR (50) NOT NULL ,
	URL                    VARCHAR (50) NOT NULL ,
	idSousCategorie        INT  NOT NULL  ,
	CONSTRAINT sous_category_image_PK PRIMARY KEY (idSousCategorieImage)

	,CONSTRAINT sous_category_image_sous_categorie_FK FOREIGN KEY (idSousCategorie) REFERENCES public.sous_categorie(idSousCategorie)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: ligne
------------------------------------------------------------
CREATE TABLE public.ligne(
	idProduit       INT  NOT NULL ,
	idLigne         INT  NOT NULL ,
	nom_produit     VARCHAR (50) NOT NULL ,
	prix_unitaire   DECIMAL (-1,-1)  NOT NULL ,
	quantite        INT  NOT NULL  ,
	CONSTRAINT ligne_PK PRIMARY KEY (idProduit,idLigne)

	,CONSTRAINT ligne_produit_FK FOREIGN KEY (idProduit) REFERENCES public.produit(idProduit)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: ligne_commande
------------------------------------------------------------
CREATE TABLE public.ligne_commande(
	idProduit       INT  NOT NULL ,
	idLigne         INT  NOT NULL ,
	idClient        INT  NOT NULL ,
	idCommande      INT  NOT NULL ,
	nom_produit     VARCHAR (50) NOT NULL ,
	prix_unitaire   DECIMAL (-1,-1)  NOT NULL ,
	quantite        INT  NOT NULL  ,
	CONSTRAINT ligne_commande_PK PRIMARY KEY (idProduit,idLigne,idClient,idCommande)

	,CONSTRAINT ligne_commande_ligne_FK FOREIGN KEY (idProduit,idLigne) REFERENCES public.ligne(idProduit,idLigne)
	,CONSTRAINT ligne_commande_commande0_FK FOREIGN KEY (idClient,idCommande) REFERENCES public.commande(idClient,idCommande)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: ligne_facture
------------------------------------------------------------
CREATE TABLE public.ligne_facture(
	idProduit                   INT  NOT NULL ,
	idLigne                     INT  NOT NULL ,
	idClient                    INT  NOT NULL ,
	idFacture                   INT  NOT NULL ,
	nom_produit                 VARCHAR (50) NOT NULL ,
	prix_unitaire               DECIMAL (-1,-1)  NOT NULL ,
	quantite                    INT  NOT NULL ,
	idProduit_ligne_commande    INT  NOT NULL ,
	idLigne_ligne_commande      INT  NOT NULL ,
	idClient_ligne_commande     INT  NOT NULL ,
	idCommande_ligne_commande   INT  NOT NULL  ,
	CONSTRAINT ligne_facture_PK PRIMARY KEY (idProduit,idLigne,idClient,idFacture)

	,CONSTRAINT ligne_facture_ligne_FK FOREIGN KEY (idProduit,idLigne) REFERENCES public.ligne(idProduit,idLigne)
	,CONSTRAINT ligne_facture_facture0_FK FOREIGN KEY (idClient,idFacture) REFERENCES public.facture(idClient,idFacture)
	,CONSTRAINT ligne_facture_ligne_commande1_FK FOREIGN KEY (idProduit_ligne_commande,idLigne_ligne_commande,idClient_ligne_commande,idCommande_ligne_commande) REFERENCES public.ligne_commande(idProduit,idLigne,idClient,idCommande)
	,CONSTRAINT ligne_facture_ligne_commande_AK UNIQUE (idProduit_ligne_commande,idLigne_ligne_commande,idClient_ligne_commande,idCommande_ligne_commande)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: ligne_livraison
------------------------------------------------------------
CREATE TABLE public.ligne_livraison(
	idProduit                   INT  NOT NULL ,
	idLigne                     INT  NOT NULL ,
	idClient                    INT  NOT NULL ,
	idLivraison                 INT  NOT NULL ,
	nom_produit                 VARCHAR (50) NOT NULL ,
	prix_unitaire               DECIMAL (-1,-1)  NOT NULL ,
	quantite                    INT  NOT NULL ,
	idProduit_ligne_commande    INT  NOT NULL ,
	idLigne_ligne_commande      INT  NOT NULL ,
	idClient_ligne_commande     INT  NOT NULL ,
	idCommande_ligne_commande   INT  NOT NULL  ,
	CONSTRAINT ligne_livraison_PK PRIMARY KEY (idProduit,idLigne,idClient,idLivraison)

	,CONSTRAINT ligne_livraison_ligne_FK FOREIGN KEY (idProduit,idLigne) REFERENCES public.ligne(idProduit,idLigne)
	,CONSTRAINT ligne_livraison_livraison0_FK FOREIGN KEY (idClient,idLivraison) REFERENCES public.livraison(idClient,idLivraison)
	,CONSTRAINT ligne_livraison_ligne_commande1_FK FOREIGN KEY (idProduit_ligne_commande,idLigne_ligne_commande,idClient_ligne_commande,idCommande_ligne_commande) REFERENCES public.ligne_commande(idProduit,idLigne,idClient,idCommande)
	,CONSTRAINT ligne_livraison_ligne_commande_AK UNIQUE (idProduit_ligne_commande,idLigne_ligne_commande,idClient_ligne_commande,idCommande_ligne_commande)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: ligne_panier
------------------------------------------------------------
CREATE TABLE public.ligne_panier(
	idPanier        INT  NOT NULL ,
	idLignePanier   INT  NOT NULL ,
	nom_produit     VARCHAR (50) NOT NULL ,
	quantite        VARCHAR (50) NOT NULL ,
	prix_HT         DECIMAL (-1,-1)  NOT NULL ,
	idProduit       INT  NOT NULL  ,
	CONSTRAINT ligne_panier_PK PRIMARY KEY (idPanier,idLignePanier)

	,CONSTRAINT ligne_panier_panier_FK FOREIGN KEY (idPanier) REFERENCES public.panier(idPanier)
	,CONSTRAINT ligne_panier_produit0_FK FOREIGN KEY (idProduit) REFERENCES public.produit(idProduit)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: a
------------------------------------------------------------
CREATE TABLE public.a(
	idCodePostale   INT  NOT NULL ,
	idVille         INT  NOT NULL  ,
	CONSTRAINT a_PK PRIMARY KEY (idCodePostale,idVille)

	,CONSTRAINT a_code_postal_FK FOREIGN KEY (idCodePostale) REFERENCES public.code_postal(idCodePostale)
	,CONSTRAINT a_ville0_FK FOREIGN KEY (idVille) REFERENCES public.ville(idVille)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: deduit
------------------------------------------------------------
CREATE TABLE public.deduit(
	idReduction   INT  NOT NULL ,
	idProduit     INT  NOT NULL  ,
	CONSTRAINT deduit_PK PRIMARY KEY (idReduction,idProduit)

	,CONSTRAINT deduit_reduction_FK FOREIGN KEY (idReduction) REFERENCES public.reduction(idReduction)
	,CONSTRAINT deduit_produit0_FK FOREIGN KEY (idProduit) REFERENCES public.produit(idProduit)
)WITHOUT OIDS;


------------------------------------------------------------
-- Table: fournie
------------------------------------------------------------
CREATE TABLE public.fournie(
	idFournisseur   INT  NOT NULL ,
	idProduit       INT  NOT NULL  ,
	CONSTRAINT fournie_PK PRIMARY KEY (idFournisseur,idProduit)

	,CONSTRAINT fournie_fournisseur_FK FOREIGN KEY (idFournisseur) REFERENCES public.fournisseur(idFournisseur)
	,CONSTRAINT fournie_produit0_FK FOREIGN KEY (idProduit) REFERENCES public.produit(idProduit)
)WITHOUT OIDS;



