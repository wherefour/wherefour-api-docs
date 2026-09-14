# wherefour-api-docs

OpenAPI spec (`spec/`) for the Wherefour API, rendered to a static Redoc bundle.

## Local

To generate: `yarn run redocly build-docs spec/openapi.json --output=public/index.html`
To view: `yarn run http-server`

## Production

Served at **https://api-docs.wherefour.com** by an nginx pod on the production EKS
cluster. `.buildkite/pipeline.yml` builds the `Dockerfile` (which re-runs
`redocly build-docs` from `spec/`, so the committed `public/index.html` is not what
ships) and pushes it to the vpn account's ECR as `<7-char sha>`, plus `latest` on the
default branch (`master`).

### Shipping a docs change

1. Edit `spec/` and open a PR. (Don't hand-edit `public/index.html` — the image
   regenerates it from `spec/`, so manual edits there never reach production.)
2. Merge to `master`. This repo's pipeline builds and pushes the image — **it does not
   deploy.**
3. Deploy it: start a build on the **`infrastructure`** Buildkite pipeline with

   | Variable | |
   |---|---|
   | `deploy_component=api-docs` | **required** |
   | `deploy_env` | **leave unset** — that field triggers *application* deploys |
   | `api_docs_tag=<7-char sha>` | optional — pin or roll back |
   | `api_docs_branch=<branch>` | optional — ship a branch other than `master` |

   With no tag it deploys the newest **green** commit of `master`, so step 2's build must
   have passed first.

Rolling back is the same trigger with `api_docs_tag=<older 7-char sha>`. Image tags are
the 7-char commit sha and are kept indefinitely, so you can go back to any previous build.

The deploy itself lives in the `infrastructure` repo — chart `k8s/system/helm-charts/api-docs`,
script `.buildkite/scripts/deploy-api-docs.sh`. If you need to bypass CI, **scope the
apply**; a bare `k8s/system apply` also rolls Metabase and upgrades it:

```bash
bin/run -w production -d k8s/system apply \
  -target=kubernetes_namespace.api_docs -target=helm_release.api_docs \
  -var api_docs_tag=<7-char sha>
```

See that repo's `NOTES.md` → *API docs pod* for the full operational detail.

## Heroku (legacy)

`Procfile` and `config/nginx.conf.erb` are the old Heroku deploy and are **still live and
unchanged**. Both it and the pod serve until someone retires the dyno — do that once
`api-docs.wherefour.com` is confirmed good, then delete those two files.
