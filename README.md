
## Features

* Streaming VCD parser in C
* Flow to compile WASM Web worker application
* Can be used in Browser and NodeJS

## Development / testing

```
npm i
npm test
```

### Testing in browser

#### Patch http-server

node_modules / http-server / bin / http-server : Line: 166

```js
  options.headers = {
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp'
  };
```

#### Run HTTP server


```bash
http-server app -b
```


### TODO

* try clang-19,20. -> missing wasm-ld 19,20

