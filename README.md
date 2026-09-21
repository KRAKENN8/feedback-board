# Ideelaud — Feedback Board

Kogukonna tagasiside ja funktsionaalsuste ettepanekute portaal, kus kasutajad saavad pakkuda ideid, hääletada olemasolevate poolt, vaadata oma hääletusajalugu ning uuendada oma kontot PRO-ks läbi Stripe'i.

---

## Sisukord

- [Tehnoloogiad](#tehnoloogiad)
- [Projekti struktuur](#projekti-struktuur)
- [Eeltingimused](#eeltingimused)
- [Paigaldamine ja käivitamine](#paigaldamine-ja-käivitamine)
- [Keskkonnamuutujad](#keskkonnamuutujad)
- [PocketBase andmebaasi seadistamine](#pocketbase-andmebaasi-seadistamine)
- [Andmemudelid ja kogud](#andmemudelid-ja-kogud)
- [Marsruutimine](#marsruutimine)
- [Autentimine](#autentimine)
- [Hääletamise loogika](#hääletamise-loogika)
- [Stripe integratsioon ja PRO konto](#stripe-integratsioon-ja-pro-konto)
- [PocketBase konksud (Hooks)](#pocketbase-konksud-hooks)
- [Kasutajaliidese komponentide ülevaade](#kasutajaliidese-komponentide-ülevaade)
- [Olekuhaldus](#olekuhaldus)
- [Stiilid ja disain](#stiilid-ja-disain)
- [Juurutamine (Deploy)](#juurutamine-deploy)
- [NPM skriptid](#npm-skriptid)
- [Litsents](#litsents)

---

## Tehnoloogiad

| Kiht | Tehnoloogia | Versioon |
|---|---|---|
| **Frontend raamistik** | Vue 3 (Composition API, `<script setup>`) | ^3.4.0 |
| **Ehitustööriist** | Vite | ^5.2.0 |
| **Marsruutimine** | Vue Router 4 (HTML5 history mode) | ^4.3.0 |
| **Taustarakendus ja andmebaas** | PocketBase (sisseehitatud SQLite, REST API, reaalajas API) | ^0.22.0 (kliendi SDK) |
| **Taustarakenduse laiendamine** | PocketBase JavaScript konksud (`pb_hooks/`) | — |
| **Maksed** | Stripe (testimise režiim) – Payment Links + webhook | — |
| **Stiilid** | Kohandatud CSS koos CSS muutujatega | — |
| **Juurutamine** | Coolify (isehostitav PaaS) | — |

> [!NOTE]
> Projekti ei kasuta väliseid CSS-raamistikke (nt Tailwind, Bootstrap) ega olekuhalduse teeke (nt Pinia, Vuex). Olek hallatakse Vue 3 Composition API reaktiivsete `ref()` muutujate ja kohandatud `composable`'i abil.

---

## Projekti struktuur

```
feedback-board/
├── .env.example              # Keskkonnamuutujate näidisfail
├── .gitignore                # Git ignoreeritavad failid
├── index.html                # Üheleheküljelise rakenduse HTML sisenemispunkt
├── package.json              # Projekti sõltuvused ja skriptid
├── package-lock.json         # Sõltuvuste lukustusfail
├── vite.config.js            # Vite ehituskonfiguratsioon
├── pb_hooks/                 # PocketBase serveri konksud
│   ├── stripe_webhook.pb.js  # Stripe webhook'i lõpp-punkt
│   └── vote_counter.pb.js    # Häälte loenduri sünkroniseerimine
└── src/                      # Lähtekoodi kaust
    ├── main.js               # Vue rakenduse käivitusfail
    ├── App.vue               # Juurkomponent (ülariba + router-view)
    ├── style.css             # Globaalsed stiilid ja disainisüsteem
    ├── composables/
    │   └── useAuth.js        # Autentimise composable (reaktiivne kasutajaolek)
    ├── lib/
    │   └── pocketbase.js     # PocketBase kliendi initsialiseerimine
    ├── router/
    │   └── index.js          # Marsruutide konfiguratsioon ja kaitsepiirangud
    └── views/
        ├── Board.vue         # Peamine ideede tahvel (avalik)
        ├── Login.vue         # Sisselogimise vorm
        ├── Register.vue      # Registreerimise vorm
        ├── MyIdeas.vue       # Kasutaja hääletatud ideed
        └── Pro.vue           # PRO konto uuendamise leht
```

---

## Eeltingimused

- **Node.js** — versioon 18 või uuem
- **npm** — kaasas Node.js-ga
- **PocketBase** — laadi alla aadressilt [pocketbase.io](https://pocketbase.io/docs/) ja käivita eraldi teenusena

---

## Paigaldamine ja käivitamine

### 1. Klooni repositoorium

```bash
git clone <repositooriumi-url>
cd feedback-board
```

### 2. Paigalda sõltuvused

```bash
npm install
```

### 3. Seadista keskkonnamuutujad

Kopeeri näidisfail ja täida oma andmetega:

```bash
cp .env.example .env
```

Muuda `.env` failis:

```env
VITE_POCKETBASE_URL=http://127.0.0.1:8090
VITE_STRIPE_PAYMENT_LINK=https://buy.stripe.com/sinu_link_siia
```

### 4. Käivita PocketBase

```bash
./pocketbase serve
```

PocketBase käivitub vaikimisi pordil `8090`. Administraatori paneel on kättesaadav aadressil `http://127.0.0.1:8090/_/`.

> [!IMPORTANT]
> Enne frontend'i käivitamist loo PocketBase administraatori paneelil vajalikud kogud (collections). Vaata jaotist [PocketBase andmebaasi seadistamine](#pocketbase-andmebaasi-seadistamine).

### 5. Kopeeri PocketBase konksud

Kopeeri `pb_hooks/` kausta sisu PocketBase'i töökausta (seal, kus asub `pb_data/`):

```bash
cp -r pb_hooks/ /sinu-pocketbase-kaust/pb_hooks/
```

Taaskäivita PocketBase, et konksud aktiveeruksid.

### 6. Käivita arendusserver

```bash
npm run dev
```

Rakendus avaneb vaikimisi aadressil `http://localhost:5173`.

---

## Keskkonnamuutujad

| Muutuja | Kirjeldus | Näide |
|---|---|---|
| `VITE_POCKETBASE_URL` | PocketBase serveri URL | `http://127.0.0.1:8090` |
| `VITE_STRIPE_PAYMENT_LINK` | Stripe Payment Link URL (Stripe'i juhtpaneelilt) | `https://buy.stripe.com/test_abc123` |

> [!WARNING]
> `.env` fail **ei tohi** olla versioonihalduses. See on juba `.gitignore` failis välistatud. Coolify keskkonnas seadista samad muutujad teenuse keskkonna seadete vahekaardil.

---

## PocketBase andmebaasi seadistamine

Ava PocketBase administraatori paneel (`http://127.0.0.1:8090/_/`) ja loo järgmised kogud:

### 1. Kogu `users` (süsteemikogu laiendamine)

Lisa olemasolevatesse `users` kogusse väli:

| Väli | Tüüp | Vaikeväärtus | Kirjeldus |
|---|---|---|---|
| `is_pro` | Bool | `false` | Kas kasutajal on PRO konto |

Lülita OAuth2 pakkujad sisse (Google, GitHub) kogu seadete alt.

### 2. Kogu `feedback_items`

| Väli | Tüüp | Kohustuslik | Kirjeldus |
|---|---|---|---|
| `title` | Text (max 120) | Jah | Idee pealkiri |
| `description` | Text (max 2000) | Ei | Idee kirjeldus |
| `author` | Relation → `users` | Jah | Idee autor |
| `votes_count` | Number (min: 0) | Ei (vaikeväärtus: 0) | Häälte arv (denormaliseeritud loendur) |

**API reeglid:**

| Reegel | Väärtus |
|---|---|
| **Loetelu/Vaatamine** | `""` (avalik — kõik saavad lugeda) |
| **Loomine** | `@request.auth.id != ""` (ainult autenditud kasutajad) |
| **Uuendamine** | `@request.auth.id != "" && @request.body.title:changed = false && @request.body.description:changed = false && @request.body.author:changed = false && @request.body.votes_count:changed = true` |
| **Kustutamine** | `@request.auth.id = author.id` (ainult autor) |

> [!TIP]
> Uuendamise reegel lubab autenditud kasutajatel muuta ainult `votes_count` välja. See takistab võõraste ideede pealkirja, kirjelduse või autori muutmist.

### 3. Kogu `votes`

| Väli | Tüüp | Kohustuslik | Kirjeldus |
|---|---|---|---|
| `item` | Relation → `feedback_items` | Jah | Idee, mille poolt hääletati |
| `user` | Relation → `users` | Jah | Hääletanud kasutaja |

**Andmebaasi indeks:**

```sql
CREATE UNIQUE INDEX idx_vote_once ON votes (item, user)
```

See tagab, et iga kasutaja saab hääletada iga idee poolt ainult ühe korra.

**API reeglid:**

| Reegel | Väärtus |
|---|---|
| **Loetelu/Vaatamine** | `@request.auth.id != "" && user = @request.auth.id` (kasutaja näeb ainult oma hääli) |
| **Loomine** | `@request.auth.id != "" && @request.body.user = @request.auth.id` (hääl enda nimel) |
| **Kustutamine** | `@request.auth.id = user.id` (ainult oma hääle tühistamine) |

---

## Marsruutimine

Rakendus kasutab Vue Router 4 HTML5 ajaloo režiimi (`createWebHistory`).

| Tee | Nimi | Komponent | Nõuab autentimist |
|---|---|---|---|
| `/` | `board` | `Board.vue` | Ei (avalik) |
| `/login` | `login` | `Login.vue` | Ei |
| `/register` | `register` | `Register.vue` | Ei |
| `/minu` | `my-ideas` | `MyIdeas.vue` | **Jah** |
| `/pro` | `pro` | `Pro.vue` | **Jah** |

### Navigatsioonikaitsja

```javascript
router.beforeEach((to) => {
  if (to.meta.requiresAuth && !pb.authStore.isValid) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
})
```

Autentimata kasutaja suunatakse sisselogimislehele, kusjuures algne sihtkoht säilitatakse `redirect` päringuparameetrina. Pärast edukat sisselogimist suunatakse kasutaja tagasi soovitud lehele.

---

## Autentimine

### Parooli-põhine autentimine

#### Registreerimine (`Register.vue`)

1. Kasutaja sisestab nime, e-posti ja parooli (vähemalt 8 märki).
2. `useAuth().registerWithPassword()` loob kasutaja PocketBase'is: `pb.collection('users').create(...)`.
3. Kohe pärast autendib kasutaja: `pb.collection('users').authWithPassword(...)`.
4. Token salvestatakse `localStorage`'sse ja kasutaja suunatakse ideede tahvlile.

#### Sisselogimine (`Login.vue`)

1. Kasutaja sisestab e-posti ja parooli.
2. `useAuth().loginWithPassword()` kutsub `pb.collection('users').authWithPassword(...)`.
3. Edukal sisselogimisel suunatakse `redirect` parameetri järgi või ideede tahvlile.

### OAuth2 autentimine (Google ja GitHub)

1. `useAuth().loginWithOAuth(provider)` kontrollib esmalt saadaolevaid autentimismeetodeid: `pb.collection('users').listAuthMethods()`.
2. Kinnitab, et soovitud pakkuja (Google/GitHub) on PocketBase'is lubatud.
3. Kutsub `pb.collection('users').authWithOAuth2({ provider })`.
4. PocketBase avab hüpikakna/suunamise OAuth pakkuja vastu.
5. Tagasikutsungi URL:
   - **Lokaalselt:** `http://127.0.0.1:8090/api/oauth2-redirect`
   - **Toodangus:** `https://<pocketbase-domeen>/api/oauth2-redirect`

### Väljalogimine

`useAuth().logout()` kutsub `pb.authStore.clear()`, mis kustutab tokeni ja nullib kasutaja reaktiivse oleku. Kasutaja suunatakse ideede tahvlile.

---

## Hääletamise loogika

Hääletamise mehhanism töötab kahel tasandil:

### Frontend (Board.vue)

Funktsioon `toggleVote(item)`:

1. **Hääle tühistamine:** kui kasutaja on juba hääletanud (`myVoteIds[item.id]` eksisteerib), kustutatakse hääl: `pb.collection('votes').delete(existingVoteId)`.
2. **Hääle andmine:** vastasel juhul luuakse uus hääl: `pb.collection('votes').create({ item: item.id, user: user.value.id })`.
3. Uuendab `votes_count` välja `feedback_items` kirjel.
4. Laadib kogu tahvli uuesti.

### Taustarakendus (pb_hooks/vote_counter.pb.js)

PocketBase konksud reageerivad automaatselt hääle loomisele ja kustutamisele:

- **`onRecordAfterCreateSuccess("votes")`** — `votes_count += 1`
- **`onRecordAfterDeleteSuccess("votes")`** — `votes_count -= 1` (minimaalselt 0)

> [!CAUTION]
> Kui `pb_hooks/vote_counter.pb.js` on aktiivne, tuleb frontend'i poolne loenduri uuendamine välja lülitada, vastasel juhul loendur suureneb topelt (+2 iga hääle kohta). Frontend'i poolne uuendus on mõeldud juhtudeks, kus PocketBase konksudele pole ligipääsu (nt teatud Coolify konfiguratsioonid).

---

## Stripe integratsioon ja PRO konto

### Ülevaade

PRO konto süsteem võimaldab kasutajatel uuendada oma kontot läbi Stripe'i makse. Makse kinnitamine toimub serveripoolselt webhook'i kaudu — rakendus ei usalda brauseri suunamist.

### Maksevoog

```
Kasutaja ──► Stripe Payment Link ──► Stripe Checkout ──► Makse kinnitamine
                  │                                              │
                  │  ?client_reference_id=<user.id>              │
                  │                                              ▼
                  │                                    Stripe saadab webhook
                  │                                              │
                  ▼                                              ▼
          Kasutaja naaseb                            PocketBase: POST /webhooks/stripe
          lehele /pro                                    │
                  │                                      ▼
                  ▼                                users.is_pro = true
          refreshUser() laadib                           │
          värske kasutajakirje                            ▼
                  │                                 HTTP 200 { received: true }
                  ▼
          UI näitab "PRO ✓"
```

### Stripe'i seadistamine

1. **Loo Payment Link** Stripe'i juhtpaneelil (testimise režiim).
2. **Lisa keskkonnamuutuja** `VITE_STRIPE_PAYMENT_LINK` väärtuseks vastloodud link.
3. **Seadista webhook** Stripe'i juhtpaneelil:
   - Lõpp-punkt: `https://<pocketbase-domeen>/webhooks/stripe`
   - Sündmus: `checkout.session.completed`
4. **Testkaart:** `4242 4242 4242 4242`, suvaline tulevane kuupäev ja CVC.

### Pro.vue käitumine

- Lehe laadimisel kutsutakse `refreshUser()`, mis laadib kasutajakirje värskelt PocketBase'ist.
- Kui `user.is_pro === true`, kuvatakse teade: „Sul on juba PRO konto."
- Vastasel juhul kuvatakse nupp „Osta PRO (Stripe Test Mode)".
- Stripe'i link sisaldab automaatselt parameetrit `client_reference_id=<user.id>`.

> [!WARNING]
> Toodangu jaoks tuleb webhook'is rakendada `Stripe-Signature` päise verifitseerimine, kasutades `STRIPE_WEBHOOK_SECRET` muutujat. Praegune kood on mõeldud testimise režiimi jaoks.

---

## PocketBase konksud (Hooks)

### stripe_webhook.pb.js

Registreerib kohandatud POST-marsruudi `/webhooks/stripe`:

- Loeb päringu kehast (`e.requestInfo().body`) Stripe'i sündmuse objekti.
- Kontrollib tüüpi `checkout.session.completed`.
- Otsib kasutaja `client_reference_id` järgi.
- Seadistab `is_pro = true` ja salvestab kirje.
- Tagastab alati HTTP 200 `{ received: true }`.

### vote_counter.pb.js

Hoiab `feedback_items.votes_count` sünkroonis `votes` koguga:

- **Pärast hääle loomist:** `votes_count += 1`
- **Pärast hääle kustutamist:** `votes_count = max(0, votes_count - 1)`

---

## Kasutajaliidese komponentide ülevaade

### App.vue — juurkomponent

- Kuvab ülariba (`topbar`) brändi nimega „Ideelaud".
- Navigatsioonilingid muutuvad vastavalt autentimise olekule:
  - **Alati:** „Ideed" (`/`)
  - **Autenditud:** „Minu hääled" (`/minu`), „PRO" / „PRO ✓" (`/pro`), „Logi välja"
  - **Autentimata:** „Logi sisse" (`/login`)
- Sisaldab `<router-view />` aktiivse vaate renderdamiseks.

### Board.vue — ideede tahvel

- **Avalik osa:** kõik kasutajad näevad ideede nimekirja, sorteeritud häälte arvu järgi (kahanevalt).
- **Autenditud osa:** ideede lisamine (pealkiri + valikuline kirjeldus) ning hääletamine.
- Hääletetahvel (`.ballot`) kuvab iga idee häälte arvu, hääletamisnuppu, pealkirja, kirjeldust ja autori nime.

### Login.vue — sisselogimine

- E-posti ja parooli sisestus.
- Google ja GitHub OAuth2 nupud.
- Link registreerimislehele.

### Register.vue — registreerimine

- Nime, e-posti ja parooli sisestus (min 8 märki).
- Google ja GitHub OAuth2 nupud.
- Link sisselogimislehele.

### MyIdeas.vue — minu hääled

- Kuvab kõik ideed, mille poolt kasutaja on hääletanud.
- Pärib `votes` kogu, laiendades (`expand`) seotud `feedback_items` kirjeid.

### Pro.vue — PRO konto

- Kuvab PRO olekut või Stripe'i makselinki.
- Lehe laadimisel värskendab kasutajakirje PocketBase'ist.
- Valideerib Stripe'i lingi vormingut enne kuvamist.

---

## Olekuhaldus

Projekt kasutab Vue 3 Composition API mustrit eraldi olekuhalduse teegi asemel:

```
src/composables/useAuth.js
```

- **`user`** — reaktiivne `ref()` mooduli tasemel (singleton). Kõik komponendid, mis impordivad `useAuth()`, jagavad sama reaktiivset viidet.
- **`pb.authStore.onChange()`** — callback uuendab `user.value` alati, kui PocketBase'i autentimisseisund muutub.
- **Eksporditavad funktsioonid:** `registerWithPassword`, `loginWithPassword`, `loginWithOAuth`, `logout`.
- **`error`** — reaktiivne veateade, mida kuvatakse vormidel.

---

## Stiilid ja disain

Projekt kasutab kohandatud CSS disainisüsteemi failis `src/style.css`:

### Värvid (CSS muutujad)

| Muutuja | Väärtus | Kasutus |
|---|---|---|
| `--ink` | `#1c231f` | Teksti põhivärv |
| `--paper` | `#f1efe6` | Tausta värv (soe beež) |
| `--paper-raised` | `#ffffff` | Tõstetud elementide taust (kaardid, vormid) |
| `--line` | `#d8d2bf` | Äärise ja eraldusjoone värv |
| `--pine` | `#2f5233` | Rõhutusvärv (metsa-roheline) |
| `--pine-dim` | `#4a6b4d` | Hämardatud rõhutusvärv |
| `--gold` | `#b8860b` | Kullavärv (hääletatud olek) |
| `--danger` | `#8c3b2e` | Veateadete värv |

### Fondid

- **Pealkirjad:** `Georgia, 'Iowan Old Style', 'Palatino Linotype', serif` (`--font-display`)
- **Kehatekst:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif` (`--font-body`)

### Disainiesteetika

Soe toimetuslik (editorial) visuaalne stiil: paber-toonides taustad, Georgia serif-pealkirjad, metsa-roheline rõhutus ja kuldne häälte esiletõst.

---

## Juurutamine (Deploy)

Projekt on mõeldud juurutamiseks **Coolify** isehostitaval PaaS-platvormil, kus frontend ja PocketBase töötavad eraldi teenustena.

### Frontend'i juurutamine

1. Seadista Coolify teenusele ehituskäsk: `npm run build`.
2. Ehituse väljundkaust: `dist/`.
3. Seadista keskkonnamuutujad Coolify teenuse seadetes:
   - `VITE_POCKETBASE_URL` — viitab PocketBase teenuse URL-ile
   - `VITE_STRIPE_PAYMENT_LINK` — Stripe'i makselink

### PocketBase'i juurutamine

1. Juuruta PocketBase eraldi Coolify teenusena.
2. Kopeeri `pb_hooks/` kaust PocketBase'i töökataloogi.
3. Seadista Stripe webhook URL viitama PocketBase teenusele: `https://<pocketbase-domeen>/webhooks/stripe`.
4. Seadista OAuth2 tagasikutsungi URL-id: `https://<pocketbase-domeen>/api/oauth2-redirect`.

---

## NPM skriptid

| Käsk | Kirjeldus |
|---|---|
| `npm run dev` | Käivitab Vite arendusserveri (kuumlaadimisega) |
| `npm run build` | Ehitab toodanguversiooni (`dist/` kausta) |
| `npm run preview` | Käivitab ehitatud toodanguversiooni eelvaate |

---

## Litsents

Privaatne projekt.