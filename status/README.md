# HypeDrive Status Dashboard

Questa cartella contiene il frontend statico del monitor HypeDrive pubblicato tramite GitHub Pages.

## Obiettivo

La dashboard mostra soltanto lo **stato di salute** degli ambienti HypeDrive. Non deve contenere dati finanziari o credenziali.

Stati previsti:

- `green`: operativo;
- `orange`: attenzione, scadenza vicina, controllo non aggiornato o errore non critico;
- `red`: intervento richiesto, ad esempio autenticazione HYPE scaduta.

## Struttura

```text
status/
├── index.html
├── README.md
├── assets/
│   ├── status.css
│   └── status.js
├── data/
│   ├── users.json
│   └── giuseppe.json
└── schema/
    └── status.schema.json
```

`data/users.json` è il registro degli ambienti da visualizzare. Ogni ambiente ha un file JSON indipendente. In futuro sarà sufficiente aggiungere, per esempio, `marco.json` e una voce corrispondente in `users.json`.

## Contratto di pubblicazione dalla VPS

Il futuro `health_check.py` sulla VPS dovrà aggiornare esclusivamente il file relativo al proprio ambiente, per esempio:

```text
status/data/giuseppe.json
```

Il JSON deve rispettare `schema/status.schema.json`.

Il frontend effettua un refresh ogni 60 secondi. Se `checked_at` è più vecchio di 36 ore, un ambiente dichiarato verde viene comunque mostrato in arancione: questo permette di rilevare anche il caso in cui il monitor VPS smetta completamente di pubblicare aggiornamenti.

## Servizi consigliati

Ogni ambiente dovrebbe pubblicare almeno questi controlli:

- `hype`: stato sessione/consenso Enable Banking;
- `google_drive`: validità token e accesso alla cartella autorizzata;
- `monthly_export`: esito dell'ultimo export mensile;
- `automation`: stato cron/ultima esecuzione prevista;
- `server`: salute minima della VPS.

## Sicurezza

### Consentito nel repository pubblico

- nome visualizzato dell'ambiente;
- stato verde/arancione/rosso;
- data/ora ultimo controllo;
- giorni mancanti alla scadenza del consenso;
- data dell'ultimo export riuscito;
- periodo esportato e numero di movimenti;
- codici errore generici e messaggi operativi non sensibili.

### Vietato nel repository pubblico

Non pubblicare mai:

- password, PIN o OTP;
- private key Enable Banking;
- token, refresh token o file `google_token.json`;
- `session_id` o `account_uid` Enable Banking;
- IBAN, saldi o dettagli delle transazioni;
- contenuto di `.env`, `config.json` privati o cartelle `credentials`;
- URL firmati o segreti GitHub usati dalla VPS per aggiornare il repository.

## Multiutente

Ogni utente deve mantenere credenziali, sessioni, log ed export separati sulla VPS. GitHub riceve solo il corrispondente file JSON pubblico di salute.

Esempio:

```text
data/users.json
status/data/giuseppe.json
status/data/marco.json
status/data/luca.json
```

Il frontend non richiede modifiche per aggiungere nuovi utenti: legge dinamicamente il registro `users.json`.

## Passo successivo

Implementare sulla VPS un `health_check.py` che:

1. controlli HYPE/Enable Banking;
2. controlli Google Drive;
3. verifichi ultimo export e cron;
4. controlli salute minima del server;
5. costruisca il JSON pubblico;
6. aggiorni il solo file `status/data/<utente>.json` su GitHub;
7. invii notifiche solo quando lo stato cambia.
