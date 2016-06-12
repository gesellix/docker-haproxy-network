FROM haproxy:1.6
MAINTAINER Tobias Gesellchen <tobias@gesellix.de> @gesellix
# defaults for the variables used in haproxy.cfg
ENV DNS_TCP_ADDR 127.0.0.11
ENV DNS_TCP_PORT 53
COPY ./haproxy.cfg /usr/local/etc/haproxy/haproxy.cfg
