FROM alpine:3.13

RUN echo https://dl-cdn.alpinelinux.org/alpine/edge/community >> /etc/apk/repositories
RUN apk update
RUN apk add tini
RUN apk add bash nginx yq

RUN mkdir /run/nginx

ADD ./docker_entrypoint.sh /usr/local/bin/docker_entrypoint.sh
ADD www /var/www
RUN chmod a+x /usr/local/bin/docker_entrypoint.sh

WORKDIR /root

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/docker_entrypoint.sh"]
