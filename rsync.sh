#!/bin/bash
rsync -avz \
  --delete \
  --exclude config.json \
  --exclude design \
  --exclude .gitignore \
  --exclude .git \
  --exclude node_modules \
  --exclude TODO.txt \
  --exclude rsync.sh \
  --exclude nodemon.sh \
  --exclude build.js \
  -e ssh /Projects/undefined/ robin@$POLITY:/var/www/sites/undefined.berjon.com/public/
