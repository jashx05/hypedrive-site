# HypeDrive public site

Repository pubblico usato da GitHub Pages per:

- homepage/branding OAuth di HypeDrive;
- Privacy Policy e Terms of Service;
- dashboard pubblica di stato dell'infrastruttura.

## Pagine

```text
/
├── index.html
├── privacy.html
├── terms.html
└── status/
    └── index.html
```

La dashboard è progettata per essere multiutente e legge i file pubblici presenti in `status/data/`.

## Regola di sicurezza principale

Questo repository è **pubblico**. Non devono essere committati segreti o dati finanziari.

Sono vietati in particolare:

- `.env`;
- chiavi PEM/private key;
- `session.json`;
- `google_token.json` e refresh token;
- credenziali OAuth client private;
- password/PIN/OTP;
- account UID/session ID bancari;
- IBAN, saldi o movimenti bancari completi.

La VPS deve pubblicare qui esclusivamente metadati di salute non sensibili, attraverso i JSON in `status/data/`.

Per il contratto completo della dashboard vedere [`status/README.md`](status/README.md).
