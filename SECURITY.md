# Security policy

Questo repository viene pubblicato integralmente tramite GitHub Pages e deve essere considerato **pubblico**.

## Dati che non devono mai essere committati

- password, PIN o OTP;
- file `.env`;
- private key / PEM Enable Banking;
- `session.json`, session ID o account UID bancari;
- `google_token.json`, refresh token o OAuth secrets;
- credenziali GitHub usate dalla VPS;
- IBAN, saldi, transazioni o report finanziari personali;
- configurazioni private contenenti identificativi non destinati alla pubblicazione.

## Dati ammessi nella dashboard

La directory `status/data/` può contenere esclusivamente metadati operativi non sensibili: stato verde/arancione/rosso, timestamp, giorni alla scadenza, esito ultimo export, codici errore generici e messaggi di servizio.

## In caso di esposizione accidentale

Se una credenziale viene committata, non è sufficiente eliminarla dal repository: deve essere immediatamente revocata/rigenerata presso il relativo provider.
