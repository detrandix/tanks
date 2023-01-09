# Multiplayer tanks

## Installation

```
npm install
```

## Running server

```
npm start
```

will start server, client is running on `localhost:3000`.

### Another port

You may also specify arguments via env variables. E.x.

```
PORT=3000 npm start
```

## Expose server by localtunnel

Install `localtunnel` globally

```
npm install -g localtunnel
```

then you can start expose your local server by running

```
./bin/start-localtunnel
```

For additional informations see help `./bin/start-localtunnel -h`

## Game control

`up`, `left`, `right`, `down` / `w`, `a`, `s`, `d` for control tank movement

`left click` / `space` use weapon 1

`right click` use weapon 2

`mouse move` for controll turret rotation (it's relative to mouse position)

## License
Distributed under the MIT License. See `LICENSE` for more information.
