#!/bin/bash

IMAGE_NAME=divide-and-conquer

if [[ "$(docker images -q $IMAGE_NAME 2> /dev/null)" == "" ]]; then
	docker build -t $IMAGE_NAME .
fi

BASE=`pwd`

docker run --rm --user "$(id -u):$(id -g)" -v $BASE/config/httpd.conf:/etc/apache2/httpd.conf -v $BASE/src:/var/www/localhost/htdocs -p 5080:5080 $IMAGE_NAME
