

------------------------------------------------------------
--        Script Postgres BDD MADA
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
CREATE DOMAIN posreal AS REAL CHECK (VALUE >= 0); -- un domaine permettant de créer un type de donnée nombre réelle positif ou égal a zéro
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
-- Table: Manufacturer
------------------------------------------------------------
CREATE TABLE manufacturer(
	id               INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	manufacturer_name text_valid NOT NULL,
	manufacturer_logo text_valid 
);


------------------------------------------------------------
-- Table: Category
------------------------------------------------------------
CREATE TABLE category(
	id                    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	category_name          text_valid NOT NULL,
	category_description   text_length NOT NULL,
	category_order         INT  NOT NULL ,
	category_imageURL      text_valid NOT NULL
);


------------------------------------------------------------
-- Table: TaxRate
------------------------------------------------------------
CREATE TABLE taxRate(
	id                    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	taxRate_value          posreal  NOT NULL,
	taxRate_name          text_valid NOT NULL,
	taxRate_description   text_valid NOT NULL
);


------------------------------------------------------------
-- Table: ZipCode
------------------------------------------------------------
CREATE TABLE zipCode(
	id            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	zipCode_city   postale_code_fr NOT NULL 
);


------------------------------------------------------------
-- Table: Country
------------------------------------------------------------
CREATE TABLE country(
	id  		 INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	country_name  text_valid NOT NULL
);


------------------------------------------------------------
-- Table: City
------------------------------------------------------------
CREATE TABLE city(
	id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	city_name   text_valid NOT NULL
);


------------------------------------------------------------
-- Table: OrderedProduct  
------------------------------------------------------------
CREATE TABLE orderedProduct(
	id                       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	orderedProduct_name       text_valid NOT NULL,
	orderedProduct_quantity   posintsup  NOT NULL,
	orderedProduct_price      posreal  NOT NULL
);


------------------------------------------------------------
-- Table: Pivilege
------------------------------------------------------------
CREATE TABLE privilege(
	id              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	privilege_name   text_valid NOT NULL
);


------------------------------------------------------------
-- Table: Custumer
------------------------------------------------------------
CREATE TABLE custumer(
	id                          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	custumer_gender             text_valid NOT NULL,
	custumer_firstName          text_valid NOT NULL,
	custumer_lastName           text_valid NOT NULL,
	custumer_email              email NOT NULL UNIQUE,
	custumer_phoneForAdminOnly  phonenumber,
	custumer_password           password NOT NULL,
	custumer_createdDate        timestamptz NOT NULL DEFAULT now(),
	custumer_updatedDate        timestamptz,
	id_privilege                INT NOT NULL REFERENCES privilege(id),
	CHECK (custumer_createdDate < custumer_updatedDate)	
);


------------------------------------------------------------
-- Table: BasquetProduct  (??)
------------------------------------------------------------
CREATE TABLE basquetProduct(
	id                         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	basquetProduct_quantity    posint NOT NULL,
	basquetProduct_dateAdded   DATE  DEFAULT now(),
	basquetProduct_dateRemoved DATE, -- (pas sur de la pertinence de ce champs..)
	basquetProduct_status      text_valid NOT NULL,
	basquetProduct_imageMini   text_valid NOT NULL,
	id_custumer                INT  NOT NULL  REFERENCES custumer(id)
);


------------------------------------------------------------
-- Table: AddressCustumer
------------------------------------------------------------
CREATE TABLE addressCustumer(
	id                            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	addressCustumer_title         text_valid NOT NULL DEFAULT 'Mon adresse',
	addressCustumer_firstName     text_valid NOT NULL,
	addressCustumer_lastName      text_valid NOT NULL,
	addressCustumer_company       text_valid ,
	addressCustumer_line1         text_valid NOT NULL,
	addressCustumer_line2         text_valid ,
	addressCustumer_phone         phonenumber NOT NULL,
	addressCustumer_createdDate   timestamptz NOT NULL DEFAULT now(),
	addressCustumer_updatedDate   timestamptz,
	id_custumer                   INT  NOT NULL REFERENCES custumer(id),
	id_country                    INT  NOT NULL REFERENCES country(id),
	id_zipCode                    INT  NOT NULL REFERENCES zipCode (id),
	CHECK (addressCustumer_createdDate < addressCustumer_updatedDate)
);


------------------------------------------------------------
-- Table: CustumerVerification
------------------------------------------------------------
CREATE TABLE adminVerification(
	id                            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	adminVerification_email       BOOLEAN  NOT NULL DEFAULT 'false',
	adminVerification_phone       BOOLEAN  NOT NULL DEFAULT 'false',
	adminVerification_emailDate   timestamptz NOT NULL DEFAULT now(),
	adminVerification_phoneDate   timestamptz NOT NULL DEFAULT now(),
	id_custumer                   INT  NOT NULL REFERENCES custumer(id)
);


------------------------------------------------------------
-- Table: CustumerInteret
------------------------------------------------------------
CREATE TABLE custumerInteret(
	id                              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	custumerInteret_orderedAmount   posreal  NOT NULL DEFAULT 0,
	custumerInteret_orderNumber     posint  NOT NULL DEFAULT 0,
	id_custumer                     INT  NOT NULL REFERENCES custumer(id)
);


------------------------------------------------------------
-- Table: Product
------------------------------------------------------------
CREATE TABLE product(
	id                    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	product_name          text_valid NOT NULL,
	product_description   text_valid NOT NULL,
	product_price         posreal  NOT NULL,
	product_color         text_valid NOT NULL,
	product_size          text_valid NOT NULL,
	product_createdDate	  timestamptz NOT NULL DEFAULT now(),
	product_updatedDate	  timestamptz,
	product_stockQuantity posint NOT NULL,
	id_manufacturer       INT  NOT NULL REFERENCES manufacturer(id),
	id_category           INT  NOT NULL REFERENCES category(id),
	id_taxRate            INT  NOT NULL REFERENCES taxRate(id),
	CHECK (product_createdDate < product_updatedDate)
);


------------------------------------------------------------
-- Table: ImageProduct
------------------------------------------------------------
CREATE TABLE imageProduct(
	id                         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	imageProduct_description   text_length  NOT NULL,
	imageProduct_order         text_valid NOT NULL,
	imageProduct_URL           text_valid NOT NULL,
	id_product                 INT  NOT NULL REFERENCES product(id)
	
);


------------------------------------------------------------
-- Table: SpecialPriceProduct
------------------------------------------------------------
CREATE TABLE specialPriceProduct(
	id                                     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	specialPriceProduct_newProductPrice    posreal,
	specialPriceProduct_startDate          DATE,
	specialPriceProduct_expiryDate         DATE,
	id_product                             INT  NOT NULL REFERENCES product(id),
	CHECK (specialPriceProduct_startDate < specialPriceProduct_expiryDate)
);


------------------------------------------------------------
-- Table: Review
------------------------------------------------------------
CREATE TABLE review(
	id              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	review_rating   INT  NOT NULL,
	review_text     text_length NOT NULL,
	review_title    text_valid NOT NULL,
	id_product      INT  NOT NULL REFERENCES product(id),
	id_custumer     INT  NOT NULL REFERENCES custumer(id)
);

------------------------------------------------------------
-- Table: OderPayement
------------------------------------------------------------
CREATE TABLE orderPayement(
	id                      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	orderPayement_reference text_valid NOT NULL UNIQUE,
	orderPayement_amount    posreal  NOT NULL,
	orderPayement_way       text_valid NOT NULL,
	orderPayement_date      timestamptz NOT NULL DEFAULT now()
);

-- clé étrangére rajoutée a la fin...

------------------------------------------------------------
-- Table: Invoice
------------------------------------------------------------
CREATE TABLE invoice(
	id                  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	invoice_reference   text_valid NOT NULL UNIQUE,
	invoice_date        DATE  NOT NULL DEFAULT now(),
	id_custumer         INT  NOT NULL REFERENCES custumer(id)
);

-- clé étrangére rajoutée a la fin...

------------------------------------------------------------
-- Table: Order
------------------------------------------------------------
CREATE TABLE "order"(
	id                     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	order_reference        posint  NOT NULL,
	order_purchaseDate     timestamptz NOT NULL DEFAULT now(),
	order_status           text_valid NOT NULL,
	order_comments         text_valid NOT NULL,
	order_trackingNumber    text_valid,
	order_linkForTracking   text_valid,
	order_weight            text_valid,
	id_custumer            INT  NOT NULL REFERENCES custumer(id)
); 


------------------------------------------------------------
-- Table: transporter // OrderShipping
------------------------------------------------------------
CREATE TABLE transporter(
	id                              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	transporter_cost                posreal  NOT NULL,
	transporter_logo				text_valid,
	transporter_name                text_valid NOT NULL,
	transporter_estimatedDelivery	text_valid NOT NULL,
	transporter_description         text_valid NOT NULL,
	id_order                        INT  NOT NULL REFERENCES "order"(id)
);

-- tables pour les cardinalitée NN :

------------------------------------------------------------
-- Table: basquetProduct_has_product
------------------------------------------------------------
CREATE TABLE basquetProduct_has_product(
	id 					INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	id_basquetProduct   INT  NOT NULL REFERENCES basquetProduct(id),
	id_product          INT  NOT NULL REFERENCES product(id)
);


------------------------------------------------------------
-- Table: orderedProduct_has_product
------------------------------------------------------------
CREATE TABLE orderedProduct_has_product(
	id 					INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	id_orderedProduct   INT  NOT NULL REFERENCES orderedProduct(id),
	Id_product          INT  NOT NULL REFERENCES product(id)
);


------------------------------------------------------------
-- Table: orderedProduct_has_order
------------------------------------------------------------
CREATE TABLE order_has_orderedProduct(
	id 					INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	id_order            INT  NOT NULL REFERENCES "order"(id),
	id_orderedProduct   INT  NOT NULL REFERENCES orderedProduct(id)	
);


------------------------------------------------------------
-- Table: order_has_addressCustumer
------------------------------------------------------------
CREATE TABLE order_has_addressCustumer(
	id 					 INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	id_order             INT  NOT NULL REFERENCES "order"(id),
	id_addressCustumer   INT  NOT NULL REFERENCES addressCustumer(id)	
);

------------------------------------------------------------
-- Table de liaison entre les tables city et zipcode 
------------------------------------------------------------
CREATE TABLE zipCode_has_city(
	id           INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	id_city      INT  NOT NULL REFERENCES city (id),
	id_zipCode   INT  NOT NULL REFERENCES zipCode (id)
);
------------------------------------------------------------------------------------------------------------
-- Pour que les references au clé primaire se fasse bien dans le bon ordre... après déclaration de la table
------------------------------------------------------------------------------------------------------------

ALTER TABLE orderPayement ADD COLUMN id_order INT NOT NULL REFERENCES "order"(id);

ALTER TABLE invoice ADD COLUMN id_order INT NOT NULL REFERENCES "order"(id);


--------------------------------
-- Création des principales vues 
--------------------------------

-- Une vue pour les principales infos concernant les clients : 

CREATE VIEW all_custumer AS
SELECT 
	custumer_gender,
	custumer_firstName,
	custumer_lastName,
	custumer_email,
	custumer_password,
	custumer_createdDate,
	custumer_updatedDate,
	custumerInteret.custumerInteret_orderedAmount,
	custumerInteret.custumerInteret_orderNumber,
	privilege.privilege_name,
	addressCustumer.addressCustumer_title,
	addressCustumer.addressCustumer_firstName, --! a completer et aggréger...
	addressCustumer.addressCustumer_lastName,
	addressCustumer.addressCustumer_phone,
	addressCustumer.addressCustumer_line1,
	addressCustumer.addressCustumer_line2,
	addressCustumer.addressCustumer_createdDate,
	addressCustumer.addressCustumer_updatedDate,
	zipCode.zipCode_city,
	country.country_name,
	city.city_name
FROM custumer
JOIN custumerInteret ON custumerInteret.id_custumer  = custumer.id
JOIN privilege ON custumer.id_privilege = custumer.id
JOIN addressCustumer ON custumer.id = addressCustumer.id_custumer
JOIN country ON country.id = addressCustumer.id_country
JOIN zipCode ON zipCode.id = addressCustumer.id_zipCode
JOIN zipCode_has_city ON zipCode_has_city.id_zipCode = zipCode.id
JOIN city ON zipCode_has_city.id_city = city.id
ORDER BY custumer.custumer_firstName ASC;


-- Une vue pour les principales infos concernant les produits : 


CREATE VIEW all_product AS
SELECT 	
	product_name,     
	product_description,
	product_price,
	product_color,        
	product_size,        
	product_createdDate,
	product_updatedDate,
	product_stockQuantity,
	category.category_name,          
	category.category_description,
	category.category_order,
	category.category_imageURL,     
	taxRate.taxRate_value,  
	taxRate.taxRate_name,         
	taxRate.taxRate_description,  
	manufacturer.manufacturer_name, 
	manufacturer.manufacturer_logo,
	imageProduct.imageProduct_description,
	imageProduct.imageProduct_order,  
	imageProduct.imageProduct_URL,        
	specialPriceProduct.specialPriceProduct_newProductPrice,
	specialPriceProduct.specialPriceProduct_startDate,
	specialPriceProduct.specialPriceProduct_expiryDate
FROM product
JOIN category ON product.id_category = category.id
JOIN taxRate ON product.id_taxRate = taxRate.id
JOIN manufacturer ON product.id_manufacturer = manufacturer.id
JOIN imageProduct ON imageProduct.id_product = product.id
JOIN specialPriceProduct ON specialPriceProduct.id_product = product.id
ORDER BY product.product_name ASC;


-- Une vue pour les principales infos concernant une commande (order) : 

CREATE VIEW all_order AS
SELECT
	order_reference,
	order_purchaseDate,
	order_status,
	order_comments,
	transporter.transporter_cost,
	transporter.transporter_name,
	transporter.transporter_estimatedDelivery,
	transporter.transporter_logo,
	transporter.transporter_description,
	orderPayement.orderPayement_reference,
	orderPayement.orderPayement_amount,
	orderPayement.orderPayement_way,
	orderPayement.orderPayement_date,
	invoice.invoice_reference,
	invoice.invoice_date,
	orderedProduct.orderedProduct_name,
	orderedProduct.orderedProduct_quantity,
	orderedProduct.orderedProduct_price,
	addressCustumer.addressCustumer_firstName,
	addressCustumer.addressCustumer_lastName,
	addressCustumer.addressCustumer_line1,
	addressCustumer.addressCustumer_line2,
	zipCode.zipCode_city,
	city.city_name,
	country.country_name
FROM "order"
JOIN transporter ON transporter.id_order = "order".id
JOIN orderPayement ON orderPayement.id_order = "order".id
JOIN invoice ON invoice.id_order = "order".id
JOIN order_has_orderedProduct ON order_has_orderedProduct.id_order = "order".id
JOIN orderedProduct ON order_has_orderedProduct.id_orderedProduct = orderedProduct.id
JOIN order_has_addressCustumer ON order_has_addressCustumer.id_order = "order".id
JOIN addressCustumer ON order_has_addressCustumer.id_addressCustumer = addressCustumer.id
JOIN country ON country.id = addressCustumer.id_country
JOIN zipCode ON zipCode.id = addressCustumer.id_zipCode
JOIN zipCode_has_city ON zipCode_has_city.id_zipCode = zipCode.id
JOIN city ON zipCode_has_city.id_city = city.id
ORDER BY orderedProduct.orderedProduct_name ASC;

COMMIT;