Local dev backend (json-server)

This repo includes a minimal `server/db.json` you can run with `json-server` for local API development.

Install once globally or as dev-dep:

```bash
npm install -g json-server
```

Run:

```bash
json-server --watch server/db.json --port 5000
```

This will expose REST endpoints at `http://localhost:5000/topics`.

Note: the frontend currently uses localStorage by default. To switch to the API, implement a storage adapter that performs fetch calls to the above endpoints and wire it into `src/App.js`.
