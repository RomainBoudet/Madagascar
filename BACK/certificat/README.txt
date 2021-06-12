De la doc :
Youtube : générer un certificat SSL avec node.js => https://www.youtube.com/watch?v=USrMdBF0zcg
deux sources utilisé pour créer la clé SSL et générer de CA et créer un certificat pour un hote : 
https://www.linuxtricks.fr/wiki/openssl-creation-de-certificats-et-ca-autosignes  
http://www.linux-france.org/prj/edu/archinet/systeme/ch24s03.html
Désolé pour ceux qui ne bosse pas sous linux...

Le logiciel pour créer tout ça :
et on a besoin d'openssl => https://www.openssl.org/    ==> sudo apt-get install openssl

Ce certifiact est auto-signé pour un environnement de dev, le certificat est 100% valide et toutes les données sont chiffré durant l'envoie. 
Chrome nous met un warning comme quoi c'est pas safe parce qu'on l'a auto signé et qu'il ne nous reconnait pas comme autorité compétente pour ça. 

C'est pour ça qu'en prod il faut que la signature du certificat serveur soit émise par une CA (Certificate Autority) => https://letsencrypt.org/   ici c'est gartuit ;) 

Si vous avez des souci pour voir la page : dans chrome  => chrome://flags   => taper allow invalid dans la barre de recherche, valider et passer a enable "Allow invalid certificates for resources loaded from localhost."

Ne pas oublier dans le FRONT src / api de passer HTTP a HTTPS pour aller chercher l'API.

EDIT : 
j'ai trouvé un moyen d'etre en localhost avec un cerrtificat reconnu : 
ETAPE 1 => installer mkcert : 
j'ai suivi ce tutoriel sous linux (remplacer la version <export VER="v1.3.0"> par : <export VER="v1.4.3">)
https://computingforgeeks.com/how-to-create-locally-trusted-ssl-certificates-on-linux-and-macos-with-mkcert/

Ce mettre dans le dossier ou on veut installer la clé et le certificat, en ligne de commande :
mkcert -install
mkcert -cert-file cert.pem -key-file key.pem localhost
sous la variable SSL_CRT_FILE mettre le chemin depuis le fichier .env jusqu'au fichier cert.pem
sous la variable SSL_KEY_FILE mettre le chemin depuis le fichier .env jusqu'au fichier key.pem

FINI !

https://www.youtube.com/watch?v=neT7fmZ6sDE 