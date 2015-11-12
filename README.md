# Work In Progress

---

# Docker networking and DNS resolution with HAProxy

This little demo shows how to:

- create a private Docker network for a reverse proxy and a backend application
- leverage the new HAProxy name resolution to reflect a changed backend ip address


## Docker networking

With the shiny [Docker 1.9](http://blog.docker.com/2015/11/docker-1-9-production-ready-swarm-multi-host-networking/)
release, we can now define dedicated networks on top of the standard `docker0` bridge.
Docker already allows to choose between another bridged network
on your host and a virtual/overlay network across host boundaries.

This demo focuses on the locally bridged network, switching to an overlay network
with its need for a central key/value store (e.g. Consul) would make it too complex.
The concept as such wouldn't change, though.

A deep introduction has been posted in the 
[official announcement](https://blog.docker.com/2015/11/docker-multi-host-networking-ga/) on Docker networking.


## HAProxy DNS resolution at runtime

[HAProxy 1.6](http://www.haproxy.org/) brings a nice feature especially for using it in a Docker environment.
Before, HAProxy would resolve backend ip addresses only at startup, so that ip
address changes wouldn't be recognized at runtime. If you were using HAProxy
as reverse proxy in front of Docker containers, you had to reload the proxy configuration
on every container restart: normally, you wouldn't have the same ip address after
stopping and starting a container. Obviously, this applies not only to Docker containers,
but to every environment where servers are dynamically changed.

The new HAProxy release allows you to configure a dns nameserver,
which effectively will be asked for an ip address when an old ip address
can't be connected to anymore. The [HAProxy 1.6 announcement](http://blog.haproxy.com/2015/10/14/whats-new-in-haproxy-1-6/)
shows a nice example, which we're going to use in this demo.


## Try this at home

You'll need [Docker](http://docs.docker.com/) :whale:

Ah, well, you got it already. Great!

Now clone this repo and `cd` into the project root:

    git clone https://github.com/gesellix/docker-haproxy-network.git
    cd docker-haproxy-network

### Preparing the environment

Now create the example application image:

    docker build -t app-image -f http-server/Dockerfile http-server
    
... then the HAProxy image:

    docker build -t proxy-image -f haproxy/Dockerfile haproxy
    
... and finally a simple dns server:

    docker build -t dns-image -f dns-server/Dockerfile dns-server


Then we prepare a private Docker network, so that our containers can connect to it:

    docker network create mynetwork
    
Now we only need to run the proxy with a dns server and the application, and connect them to `mynetwork`.
We might first run them and connect them afterwards, or we can already connect them
along with the `docker run` command. Let's go with the second option:

    #docker run -dit --name dns --net mynetwork quay.io/jpillora/dnsmasq-gui:latest
    docker run -dit --name dns --net mynetwork dns-image
    DNS_IP=$(docker inspect --format '{{ .NetworkSettings.Networks.mynetwork.IPAddress }}' dns)
    docker run -dit --name app --net mynetwork app-image
    docker run -dit --name proxy --net mynetwork --dns $DNS_IP -p 80:80 --dns-search mynetwork proxy-image

Note that we don't expose any port on the `app` container. This is because we don't need
to when we only want the containers to communicate with each other.
We want the proxy HTTP port to be exposed on our public interface, though.
The proxy is being configured with a special dns server, so that name resolution at runtime
will query a specific server which is aware of the existing ip addresses in `mynetwork`.

### Hello World

Both containers should be running in the background now and you can check if the setup
is working by navigating your browser to the Docker daemon host. When using native Linux
this is most probably at [http://localhost:80](http://localhost:80/), for Windows and Mac OS
users with Docker Machine it should be [http://192.168.99.100:80](http://192.168.99.100:80/).

If everything works fine, you should see the classic _hello world_.

You can check the current container ip addresses with

    docker inspect --format '{{ .NetworkSettings.Networks.mynetwork.IPAddress }}{{ .Name }}' app proxy

So far so good - standard stuff. Let's try to break it!

### Handling changed ip addresses

We now want the HAProxy to get into trouble by restarting our app, and making it available at a changed ip address.
That's why we're going to stop it and start another container on the `mynetwork`, so that
the old ip address will be taken:

    docker stop app
    docker wait app
    docker rm app
    docker run -dit --name placeholder-app --net mynetwork busybox:latest sh -c "ping 127.0.0.1 > /dev/null"
    
Then we're going to restart the app again:

    docker run -dit --name app --net mynetwork app-image

Our app container should now have a changed ip address, we can check that with:

    docker inspect --format '{{ .NetworkSettings.Networks.mynetwork.IPAddress }}{{ .Name }}' app proxy placeholder-app 

A HAProxy before version 1.6 would now need to be restarted, because it wouldn't be able
to connect to the old ip address anymore. Since we already configured our `proxy` to dynamically
resolve changed ip addresses, everything should still work.

You can verify that by refreshing your browser. Do it. And smile :smile:

## Questions, Suggestions, Anything?

Does it work for you? Do you need more details or did I tell something wrong?
You can contact me here at the issue tracker or via Twitter [@gesellix](https://twitter.com/gesellix)!
