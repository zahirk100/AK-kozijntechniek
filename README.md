# AK Kozijntechniek

Website van AK Kozijntechniek: kunststof kozijnen, ramen en deuren. Plaatsen, reparatie en onderhoud vanuit Lelystad, tot 80 km in de omtrek.

## Opbouw

- `index.html` – de hele pagina (opmaak staat in de pagina zelf)
- `privacy.html`, `voorwaarden.html` – privacyverklaring en algemene voorwaarden
- `assets/fonts/` – lettertypen (Inter en Space Grotesk), vanaf de eigen site geladen
- `assets/site.js` – mobiel menu, contactformulier en het laden van de samensteller
- `assets/configurator.js` – de 3D-kozijnsamensteller (gebundeld, niet met de hand aanpassen)
- `src/configurator.js` – de leesbare bron van de samensteller
- `assets/img/` – foto's (voorbeeldfoto's van Unsplash, te vervangen door eigen werk)
- `assets/logo/` – logo als SVG en PNG (liggend, embleem, beeldmerk, profielfoto), `assets/favicon.svg`

De site heeft geen bouwstap: open `index.html` in een browser, of zet GitHub Pages aan op de `main`-branch.

## Nog te vervangen voor livegang

De volgende gegevens zijn voorbeeldwaarden:

- 1.250+ kozijnen en 10 jaar garantie
- doorlooptijden (binnen 1 week, 2 werkdagen, 6 tot 8 weken, 1 tot 3 dagen) en onderhoudsplan vanaf € 89
- de algemene voorwaarden zijn een concept: de waarden tussen haken (aanbetaling, betalingstermijn, garantie) moeten nog worden ingevuld en de tekst moet juridisch worden nagekeken
- e-mailadres, bezoekadres en keurmerken staan nog niet op de site
- de projectomschrijvingen bij "Recent opgeleverd"

Het contactformulier heeft geen server: het opent WhatsApp met de ingevulde aanvraag.

Klantreviews staan nog niet op de site. Dat blok komt erbij zodra er echte reviews zijn.

De WhatsApp-beeldmerken in `assets/whatsapp/` komen ongewijzigd uit het officiële merkpakket van Meta (WhatsApp Brand Resource Center) en vallen onder de richtlijnen daarvan.

## Samensteller aanpassen

De samensteller gebruikt three.js voor het 3D-voorbeeld. Pas `src/configurator.js` aan en bundel daarna opnieuw:

```
npm install three esbuild
npx esbuild src/configurator.js --bundle --minify --format=esm --target=es2019 --outfile=assets/configurator.js
```

De website zelf heeft geen bouwstap nodig; alleen dit ene bestand wordt gebundeld.
