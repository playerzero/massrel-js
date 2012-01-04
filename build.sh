#!/bin/sh

cd src
node ../build/r.js -o baseUrl=. name=almond.js include=massrel out=../massrel.js wrap=true optimize=none
node ../build/r.js -o baseUrl=. name=almond.js include=massrel out=../massrel.min.js wrap=true