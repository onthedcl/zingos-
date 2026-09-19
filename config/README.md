# Audit configs

One JSON file per client. `prompts` is optional — leave it out and the engine
generates the question set from `category`.

```json
{
  "brand": "Acme",
  "aliases": ["Acme.io", "Acme Inc"],
  "category": "B2B marketing attribution software",
  "runs": 5,
  "n_prompts": 20,
  "competitors": [{"name": "Rival", "aliases": ["Rival Corp"]}]
}
```

`aliases` matter more than they look — a brand missed because the model wrote
"Acme Inc" and you only matched "Acme" understates the headline number, which
is the one figure the client will check by hand.
