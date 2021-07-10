# Regles de gestion MCD (en partant de "client" vers "panier")


R001 Un client peut avoir 0 ou plusieurs paniers.

R002 Un panier appartient a un, et un seul client.

R003 Un panier peut contenir aucun produit (ligne_panier) ou plusieurs ligne_panier.

R004 Une ligne_panier appartient a un et un seul panier.

R005 Une ligne_panier concerne un et un seul produit.

R006 Un produit peut être dans aucune ou plusieurs ligne_panier.

R007 Un produit peut être dans 0 ou plusieurs lignes (d'une commande / facture / livraison).

R008 Une ligne contient un et un seul produit.

R009 / R010 / R011 => "ligne_livraison", "ligne_commande" et "ligne_facture" hérite de "ligne" et posséde tous les trois les même attributs hérité de "ligne". Les identifiants de ces trois entité sont dans l'entité ligne.

R012 Une ligne de livraison est toujours le fruit d'une ligne de commande.

R013 Une ligne de commande entraine aucune ou une seule livraison. Pas de livraison multiple ici et une ligne de commande peut ne pas se traduire par une livraison si le produit n'est plus en stock (érreur de stock) ou si le client vient le chercher directement en boutique. 

R014 Une ligne de comande peut n'engendrer aucune ligne de facture (si érreur de stock) ou une seule ligne de facture. 

R015 Une ligne de facture provient d'une et une seule ligne de commande.

R016 Une ligne de livraison appartient a une et une seule livraison.

R017 Une livraison peut contenir une ou plusieurs ligne de livraison.

R018 Une ligne de commande appartient a une et une seule commande.

R019 Une commande peut contenir une ou plusieur ligne de commande.

R020 Une ligne de facture est compris dans une et une seule facture.

R021 Une facture posséde de une a plusieurs ligne de facture.

R022 Une livraison délivre un et un seul client. Il s'agit d'une entité faible qui dépend de "client". Bonne pratique contre I/O Bound.

R023 Un client peut recevoir aucune a plusieurs livraisons.

R024 Une commande est passé par un et un seul client. Il s'agit d'une entité faible qui dépend de "client".

R025 Un client passe aucune ou plusieurs commandes.

R026 Une commande comprend un ou plusieur paiememnt. Les paiements multiples ne seront pas mis en place mais si une érreur survient suite a un premier paiement, le client pourra refaire un paiement lié a cette même commande. 

R027 Un paiement appartient a une et une seule commande.

R028 Une facture est destiné un et un seul client. Il s'agit d'une entité faible qui dépend de "client".

R029 Un client peut détenir aucune ou plusieurs factures.

R030 Un client posséde de une adresse minimum a plusieurs adresses.

R031 Une adresse appartient à un et un seul client.

R032 Une adresse doit avoir une seule ville.

R033 Une ville peut avoir aucune a plusieurs adresses.

R034 Une ville est présente dans un et un seul pays.

R035 Un pays contient aucune ou plusieurs villes.

R036 Un code postale peut être associé a une ou plusieurs villes (exemple 54490 => 7 communes).

R037 Une ville peut avoir un ou plusieurs codes postaux (exemple => Metz a 3 codes postaux).

R038 Un client détient un et un seul privilége (role).

R039 Un privilége peut être possédé par aucun ou plusieurs clients.

R040 Un client peux ne rédiger aucun avis ou plusieurs avis.

R041 Un avis est rédigé par un et un seul client.

R042 Un avis ne concerne qu'un et un seul produit.

R043 Un produit peut posséder aucun ou plusieur avis.

R044 Un produit est forcement dans une, et une seule catégorie.

R045 Une catégorie posséde aucun ou plusieurs produits.

R046 Une catégorie peut avoir aucune ou plusieurs sous-catégorie.

R047 Une sous-catégorie appartient a une et une seule catégorie.

R048 Une sous catégorie peut posséder aucune ou plusieurs images.

R049 Une "sous-catégorie image" fait référence à une et une seule sous catégorie.

R050 Une catégorie peut ne posséder aucune ou pluseurs images.

R051 Une "catégorie image" fait référence à une et une seule catégorie.

R052 Un produit posséde aucune ou plusieurs images.

R053 Une "image produit" fait référence à un et un seul produit.

R054 Un produit a une et une seule TVA.

R055 Une TVA ne peut s'appliquer à aucun ou plusieurs produits.

R056 Un produit peut avoir zéro a plusieurs réductions.

R057 Une réduction peut s'appliquer aucun à plusieurs produits.

R058 Un produit peut avoir aucun fournisseur (fait maison ou fournisseur inconnue, ou que l'on ne veut pas mettre en BDD) ou plusieurs.

R059 Un fournisseur fournit aucun produit (si le produit n'est plus en stock mais qu'il va bientôt le redevenir, on veut garder le fournisseur) ou plusieurs produits.

R060 Un produit peut avoir zéro stock ou un seul.

R061 Un stock concerne un produit et un seul.

R062 Un produit peut avoir aucune caractéristique ou une seule.

R063 Une "caractéristique" (qui peut en réalité en comprendre plusieurs : taille et couleur ici) appartient a un et un seul produit.
