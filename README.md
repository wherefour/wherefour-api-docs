# wherefour-api-docs

OpenAPI spec (`spec/`) for the Wherefour API, rendered to a static Redoc bundle.

## Local

To generate: `yarn run redocly build-docs spec/openapi.json --output=public/index.html`
To view: `yarn run http-server`

## Production

Served at **https://api-docs.wherefour.com** by an nginx pod on the production EKS
cluster. `.buildkite/pipeline.yml` builds the `Dockerfile` (which re-runs
`redocly build-docs` from `spec/`, so the committed `public/index.html` is not what
ships) and pushes it to the vpn account's ECR as `<7-char sha>`, plus `latest` on
`main`.

The deploy lives in the `infrastructure` repo (`k8s/system`, chart
`helm-charts/api-docs`):

```bash
# roll onto the newest `latest` build
bin/run -w production -d k8s/system apply

# pin/roll back to a specific build
bin/run -w production -d k8s/system apply -var api_docs_tag=<7-char sha>
```

The legacy Heroku path (`Procfile`, `config/nginx.conf.erb`) is still in place and
unchanged; retire it once the pod has taken over.
