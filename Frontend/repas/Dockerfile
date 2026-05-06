FROM node:24

# Définissez les variables de proxy
ARG http_proxy
ARG https_proxy
ARG no_proxy

ENV HTTP_PROXY=$http_proxy
ENV HTTPS_PROXY=$https_proxy
ENV NO_PROXY=$no_proxy

# Définissez un répertoire de travail
WORKDIR /app

# Copiez le fichier requirements.txt et installez les dépendances
COPY package*.json ./
RUN npm install

# Installer nano
RUN apt-get update && apt-get install -y nano

# Copiez le code de votre projet dans le conteneur
COPY . .

RUN npm run build

# Installer serve et définir la commande par défaut pour servir les fichiers de build
RUN npm install -g serve
CMD ["serve", "-s", "dist", "-l", "8000"]