#!/bin/bash

# Atualize os repositórios de pacotes
sudo apt update

# Atualize os pacotes instalados
sudo apt upgrade -y

# Instale o Redis Server
sudo apt install -y redis-server

# Instale o Node.js
sudo apt install -y nodejs

# Instale as dependências do projeto com npm
npm install whatsapp-web.js qrcode-terminal axios node-cron redis

echo "Instalação completa! siga-me @paulostation | github.com/pstationbr"
