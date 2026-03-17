# Vogt-Coaching

Paar-Vorbereitungstool für Coaching-Sitzungen. Hilft Paaren, Zeitverwendung und Prioritäten objektiv gegenüberzustellen.

## Live-App

Nach dem Deploy erreichbar unter:
```
https://IHR-GITHUB-NAME.github.io/vogt-coaching/
```

## Features

- **Schritt 1** – 24h-Wochenplan (Mal-Raster, 30-Min-Intervalle, 15 Kategorien)
- **Schritt 2** – Priorisierung (Werte-Check 1–10 mit Gap-Analyse)
- **Schritt 3** – Partner-Vergleich (Nebeneinander, Heatmap, Balkendiagramme)
- **Export/Import** – JSON-Datenaustausch zwischen zwei Personen
- **100% lokal** – keine Daten verlassen das Gerät

## Deployment auf GitHub Pages

### Einmalige Einrichtung

1. Dieses Repo auf GitHub erstellen (Name: `vogt-coaching`)
2. Unter **Settings → Pages → Source** die Option **GitHub Actions** wählen
3. Code pushen – der Rest läuft automatisch

### Lokale Entwicklung

```bash
npm install
npm run dev
```

## Repo-Name anpassen

Falls Ihr Repo anders heißt als `vogt-coaching`, passen Sie `vite.config.js` an:

```js
base: '/IHR-REPO-NAME/',
```
