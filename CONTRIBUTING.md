# Contributing

## Organization

Since the browsers for exome results studies share the same [data format](./docs/DataFormat.md),
they can also share most of their code. This project builds the base browser code
in `./src` with browser specific configuration and components in `./browsers/*`.

Any module located in `./browsers/${BROWSER}/src` can be imported in either the client
or server using the `@browser` webpack alias. This allows some components to have
browser-specific implementations.

At minimum, each browser must contain in its `src` directory two files:
* config.js - Exports an object. Configuration schema explained below.
* help.js - Exports an object.
* HomePageContent.js - Exports a React component.

## Getting started

For each of the scripts below, the `$BROWSER` argument must be the name of one of the
subdirectories of `./browsers`.

### Browser configuration

TODO

### Development
```
./start.sh $BROWSER
```

Runs the server with nodemon and client with webpack-dev-server, so that each is
rebuilt/reloaded on changes to source files.

### Deployment
```
./build.sh $BROWSER
```

Bundles the server and client into the `dist/${BROWSER}` folder. The resulting bundle can be
run with `node dist/${BROWSER}/server.js`.

```
./build-docker-image.sh $BROWSER
```

Bundles the server and client and builds a Docker image containing them. The image
is named `${BROWSER}-browser` tagged with the current git revision.
