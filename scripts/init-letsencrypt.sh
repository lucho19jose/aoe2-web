#!/bin/bash

# Initialize Let's Encrypt SSL certificates
# This script should be run once to obtain SSL certificates

set -e

# Load environment variables
if [ ! -f .env.production ]; then
    echo "Error: .env.production file not found!"
    exit 1
fi

source .env.production

# Configuration
domains=($DOMAIN "www.$DOMAIN")
rsa_key_size=4096
data_path="./certbot"
email="$LETSENCRYPT_EMAIL"
staging=0 # Set to 1 for testing

# Check if domain is set
if [ -z "$DOMAIN" ]; then
    echo "Error: DOMAIN not set in .env.production"
    exit 1
fi

# Check if email is set
if [ -z "$email" ]; then
    echo "Error: LETSENCRYPT_EMAIL not set in .env.production"
    exit 1
fi

# Create directories
mkdir -p "$data_path/conf"
mkdir -p "$data_path/www"

# Download recommended TLS parameters if they don't exist
if [ ! -e "$data_path/conf/options-ssl-nginx.conf" ] || [ ! -e "$data_path/conf/ssl-dhparams.pem" ]; then
    echo "### Downloading recommended TLS parameters ..."
    curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
    curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"
    echo
fi

# Check if certificates already exist
if [ -d "$data_path/conf/live/$DOMAIN" ]; then
    read -p "Existing certificates found for $DOMAIN. Remove and continue? (y/N) " decision
    if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
        exit 0
    fi
    rm -rf "$data_path/conf/live/$DOMAIN"
    rm -rf "$data_path/conf/archive/$DOMAIN"
    rm -rf "$data_path/conf/renewal/$DOMAIN.conf"
fi

# Create dummy certificates
echo "### Creating dummy certificate for $DOMAIN ..."
path="/etc/letsencrypt/live/$DOMAIN"
mkdir -p "$data_path/conf/live/$DOMAIN"
docker-compose -f docker-compose.prod.yml run --rm --entrypoint "\
    openssl req -x509 -nodes -newkey rsa:$rsa_key_size -days 1\
    -keyout '$path/privkey.pem' \
    -out '$path/fullchain.pem' \
    -subj '/CN=localhost'" certbot
echo

# Start nginx
echo "### Starting nginx ..."
docker-compose -f docker-compose.prod.yml up --force-recreate -d nginx
echo

# Delete dummy certificates
echo "### Deleting dummy certificate for $DOMAIN ..."
docker-compose -f docker-compose.prod.yml run --rm --entrypoint "\
    rm -rf /etc/letsencrypt/live/$DOMAIN && \
    rm -rf /etc/letsencrypt/archive/$DOMAIN && \
    rm -rf /etc/letsencrypt/renewal/$DOMAIN.conf" certbot
echo

# Request Let's Encrypt certificate
echo "### Requesting Let's Encrypt certificate for $DOMAIN ..."
domain_args=""
for domain in "${domains[@]}"; do
    domain_args="$domain_args -d $domain"
done

# Select appropriate email arg
case "$email" in
    "") email_arg="--register-unsafely-without-email" ;;
    *) email_arg="--email $email" ;;
esac

# Enable staging mode if needed
if [ $staging != "0" ]; then
    staging_arg="--staging"
else
    staging_arg=""
fi

docker-compose -f docker-compose.prod.yml run --rm --entrypoint "\
    certbot certonly --webroot -w /var/www/certbot \
    $staging_arg \
    $email_arg \
    $domain_args \
    --rsa-key-size $rsa_key_size \
    --agree-tos \
    --force-renewal" certbot
echo

# Reload nginx
echo "### Reloading nginx ..."
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload

echo "### SSL certificates obtained successfully!"
echo "### You can now start all services with: docker-compose -f docker-compose.prod.yml up -d"
