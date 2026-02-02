# CartConnect - Social Commerce PWA

Eine Instagram-ähnliche Social Commerce App mit Supabase Backend und E-Commerce Plugins.

## 🚀 Quick Start

### Lokale Entwicklung (Docker)

```bash
# Alles mit einem Befehl starten
docker-compose up -d

# Frontend: http://localhost:5173
# Supabase Studio: http://localhost:54323
# API: http://localhost:54321
```

### Ohne Docker

```bash
# Dependencies installieren
npm install

# Dev Server starten (benötigt Supabase Cloud oder lokale Instanz)
npm run dev
```

## 📁 Projektstruktur

```
shopfollow/
├── src/                    # Frontend React App
├── supabase/
│   ├── migrations/         # Database Schema (SQL)
│   ├── functions/          # Edge Functions (Webhooks)
│   └── seed.sql           # Demo-Daten
├── plugins/
│   ├── woocommerce/       # WordPress Plugin
│   └── browser-extension/ # Chrome Extension
├── docker-compose.yml     # Lokale Entwicklung
└── .gitlab-ci.yml         # CI/CD Pipeline
```

## 🔧 GitLab CI/CD

### Erforderliche Variablen

In GitLab → Settings → CI/CD → Variables:

| Variable | Beschreibung |
|----------|-------------|
| `SUPABASE_URL` | Projekt URL |
| `SUPABASE_ANON_KEY` | Anon Key |
| `SUPABASE_PROJECT_REF` | Projekt Reference |
| `SUPABASE_ACCESS_TOKEN` | Personal Access Token |
| `SUPABASE_DB_PASSWORD` | Database Password |

### Pipeline Stages

```
1. test       → Lint + TypeCheck
2. build      → Docker Image
3. deploy-db  → Migrations
4. deploy-functions → Edge Functions
5. deploy-app → GitLab Pages / K8s
```

## 🛒 E-Commerce Plugins

### WooCommerce

```bash
# Plugin nach WordPress kopieren
cp -r plugins/woocommerce /wp-content/plugins/cartconnect-for-woocommerce

# In WordPress aktivieren
# WooCommerce → CartConnect → Webhook URL + Secret eingeben
```

### Browser Extension

```bash
# In Chrome laden
1. chrome://extensions
2. "Entwicklermodus" aktivieren
3. "Entpackte Erweiterung laden"
4. plugins/browser-extension/ auswählen
```

## 🗄️ Datenbank

### Migrations anwenden

```bash
# Mit Supabase CLI
supabase db push

# Oder manuell in Supabase Dashboard → SQL Editor
```

### Schema

- `profiles` - Benutzerprofile
- `products` - Geteilte Produkte
- `staging_orders` - Inbox (ausstehende Items)
- `shop_connections` - Verknüpfte Shops
- `followers` - Follower-Beziehungen
- `groups` - Gruppen für Sichtbarkeit

## 📱 Features

- ✅ Instagram-Style Feed
- ✅ Double-Tap Like Animation
- ✅ Product Detail Modal
- ✅ Profil mit 3x3 Grid
- ✅ Netzwerk (Follow/Unfollow)
- ✅ Inbox mit Accept/Reject
- ✅ Echtzeit-Updates (Supabase Realtime)
- ✅ PWA mit Offline-Support

## 📄 Lizenz

MIT
