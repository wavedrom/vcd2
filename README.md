
## Features

* Streaming VCD parser in C
* Flow to compile WASM Web worker application
* Can be used in Browser and NodeJS

## Development / testing

### Patch http-server

node_modules / http-server / bin / http-server : Line: 166

```js
  options.headers = {
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp'
  };
```

```bash
http-server app -b
```
