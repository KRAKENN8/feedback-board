# Ideelaud — Feedback Board

## 1. Projekti kirjeldus

Ideelaud on tagasisideportaal, kus kasutajad saavad pakkuda uusi
ideid/funktsioone ja hääletada teiste ideede poolt — samal põhimõttel
nagu Canny.io. Iga registreeritud kasutaja saab:

- lisada uue idee (pealkiri + kirjeldus),
- hääletada ideede poolt (üks hääl kasutaja kohta idee kohta,
  häält saab ka tagasi võtta),
- näha ideid pingereas hääletuste arvu järgi,
- vaadata oma antud hääli ("Minu hääled"),
- soovi korral osta Stripe kaudu PRO konto (Test Mode).

Sihtgrupp on väike meeskond või kogukond, kes soovib koguda ja
prioritiseerida arendusideid läbipaistva hääletuse abil.

## 2. Arhitektuuri põhjendus

| Kiht | Valik | Miks |
|---|---|---|
| Andmebaas + API + Auth | **PocketBase** | Üks teenus annab SQLite andmebaasi, REST/realtime API ja sisseehitatud kasutajahalduse (sh OAuth) — ei pea eraldi backendi kirjutama. |
| Hostimine | **Coolify** | Isehostitav PaaS: juurutab PocketBase'i ja frontendi eraldi teenustena, haldab HTTPS-i automaatselt, ENV muutujad seadistatavad liideses. |
| Frontend | **Vue.js 3 (Vite)** | Kevad õppekõver, hea reaktiivsus hääletuse UI jaoks (Composition API), väike ja kiire build. |
| Maksed | **Stripe (Test Mode)** | PRO konto ostmine käib Stripe Payment Linki kaudu; makse kinnitatakse serveripoolselt PocketBase'i webhook-endpointiga (`pb_hooks/stripe_webhook.pb.js`), mitte lihtsalt brauseri suunamise põhjal. |

Frontend ja PocketBase on kaks **eraldi teenust** Coolify's ja
suhtlevad ainult REST API kaudu — frontend ei tea kunagi
andmebaasi asukohta otse, vaid loeb selle keskkonnamuutujast
`VITE_POCKETBASE_URL`.

## 3. Lingid töötavatele teenustele

> Täida pärast juurutamist Coolify's.

- Frontend (töötav rakendus): `<lisa link>`
- PocketBase Admin UI: `<lisa link>`

## 4. PocketBase Collections — käsitsi seadistus

Ava PocketBase Admin UI → **Collections** ja loo järgmised
Collections (kasutajate collection `users` on juba olemas vaikimisi):

### `feedback_items`
| Väli | Tüüp | Nõuded |
|---|---|---|
| `title` | Text | required, max 120 |
| `description` | Text | max 2000 |
| `author` | Relation → `users` | required, single |
| `votes_count` | Number | default 0, min 0 |

**API Rules:**
- List/View: tühi (avalik lugemine)
- Create: `@request.auth.id != ""`
- Update: `@request.auth.id != "" && @request.body.title:changed = false && @request.body.description:changed = false && @request.body.author:changed = false && @request.body.votes_count:changed = true`
- Delete: `@request.auth.id = author.id`

### `votes`
| Väli | Tüüp | Nõuded |
|---|---|---|
| `item` | Relation → `feedback_items` | required, single |
| `user` | Relation → `users` | required, single |

Lisa **unikaalne indeks** väljadele `item` + `user`, et sama
kasutaja ei saaks ühe idee poolt kaks korda hääletada
(Collection → Options → Indexes → `CREATE UNIQUE INDEX idx_vote_once ON votes (item, user)`).

**API Rules:**
- List/View: `@request.auth.id != "" && user = @request.auth.id`
- Create: `@request.auth.id != "" && @request.auth.id = @request.data.user`
- Delete: `@request.auth.id = user.id`

### `users` collection — lisaväli
Lisa olemasolevale `users` collectionile boolean väli `is_pro`
(default `false`) — seda uuendab Stripe webhook pärast makset.

### Autentimine
Collection `users` → Options → OAuth2 providers: luba **Google** ja
**GitHub** ning kopeeri kummagi teenuse Client ID ja Client Secret
PocketBase'i. Registreeri Google Cloud Console'is ja GitHub Developer
Settings'is PocketBase'i täpne callback URL:

- kohalikult: `http://127.0.0.1:8090/api/oauth2-redirect`
- tootmises: `https://<pocketbase-domeen>/api/oauth2-redirect`

`VITE_POCKETBASE_URL` peab olema sama PocketBase'i avalik URL, mille
callback URL-iga OAuth teenustes registreerisid. OAuth ei tööta ainult
frontendis nuppude lisamisega: providerid peavad olema PocketBase Admin
UI-s aktiveeritud ja nende võtmed sisestatud.

### Hääletuse loendur Coolify's
Kui PocketBase'i `pb_hooks` kausta ei saa faile lisada, uuendab frontend
pärast hääle lisamist või eemaldamist `feedback_items.votes_count` välja
PocketBase API kaudu. Selle jaoks peab `feedback_items` Update rule olema
ülaltoodud reegel. `vote_counter.pb.js` ei tohi samal ajal töötada, muidu
loendur suureneb kaks korda.

`stripe_webhook.pb.js` vajab serveripoolset PocketBase hooki ja saab töötada
ainult siis, kui Coolify lubab paigaldada faili PocketBase'i `pb_hooks`
kausta.

## 5. Paigaldusjuhend (kohalik käivitamine)

Eeldab, et PocketBase juba jookseb (kohalikult või Coolify's) ja
Collections on eelmise sammu järgi loodud.

```bash
git clone <sinu-repo-url>
cd feedback-board
cp .env.example .env
# ava .env ja pane VITE_POCKETBASE_URL oma PocketBase aadressiks

npm install
npm run dev
```

Rakendus jookseb vaikimisi aadressil `http://localhost:5173`.

Kohaliku PocketBase käivitamiseks (kui testid ilma Coolify'ta):

```bash
./pocketbase serve
```

(lae PocketBase binaarfail pocketbase.io lehelt, pane
`pb_hooks` kaust samasse kausta enne käivitamist).

## 6. Keskkonnamuutujate nimekiri

Frontendi teenus (Coolify → Environment Variables):

| Muutuja | Kirjeldus |
|---|---|
| `VITE_POCKETBASE_URL` | PocketBase teenuse avalik URL |

PocketBase teenus (kui kasutad Stripe webhooki):

| Muutuja | Kirjeldus |
|---|---|
| `STRIPE_WEBHOOK_SECRET` | Stripe webhooki allkirja saladus (Test Mode) |

*(Väärtusi siia ei panda — need seadistatakse otse Coolify liideses.)*

## 7. Meeskonnaliikmed ja töö jaotus

> Täida enne esitamist.

| Nimi | Vastutusala |
|---|---|
| `<nimi>` | `<nt: PocketBase Collections, API reeglid>` |
| `<nimi>` | `<nt: Vue frontend, hääletuse UI>` |
| `<nimi>` | `<nt: Stripe integratsioon, juurutus Coolify's>` |

## Esitamise kontrollnimekiri

- [ ] Töötav frontend URL (Coolify kaudu)
- [ ] PocketBase Admin on ligipääsetav
- [ ] Persistent Volume on seadistatud PocketBase'i `/pb/pb_data` kaustale
- [ ] Autentimine töötab (registreerimine + sisselogimine + Google/GitHub)
- [ ] Hääletus töötab (üks hääl kasutaja kohta, saab tagasi võtta)
- [ ] Stripe Test Mode PRO-ostu voog töötab (webhook uuendab `is_pro`)
- [ ] README.md on täidetud (lingid, keskkonnamuutujad, meeskond)
- [ ] GitHub hoidla on avalik või hindajatega jagatud, `.env` pole commititud
