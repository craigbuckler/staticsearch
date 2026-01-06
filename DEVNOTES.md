# Development notes

## Development build and test

Optionally, link `staticsearch` as a global module from its project folder (do once):

```bash
npm link
```

Build development files:

```bash
npm run build.dev
```

Index a local `build` directory:

```bash
staticsearch
```

(or use `npm start` if the `build` directory is inside `staticsearch` and you have not used `npm link`.)

Run server and test search functionality:

```bash
llh 8383 ./build/ -l
```

In one command:

```bash
npm run build.dev && staticsearch && llh 8383 ./build/ -l
```


## Production build

Build production files (auto-runs before `npm publish`):

```bash
npm run build
```

You can test production files in the same way.
