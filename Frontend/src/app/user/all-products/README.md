# All Products (catalog)

Pagina de catalog: grid de produse, filtrare pe categorii, sortare, căutare și paginare.

## Starea trăiește în URL

Toate filtrele sunt query params, deci orice vizualizare a catalogului este un link
partajabil și supraviețuiește reload-ului sau butonului „înapoi" al browserului:

| Param | Valori | Default (absent din URL) |
|---|---|---|
| `q` | text liber | fără căutare |
| `category` | id de categorie | toate categoriile |
| `sort` | `newest`, `name-asc`, `name-desc`, `price-asc`, `price-desc` | `newest` |
| `page` | index 0-based | `0` |
| `size` | `12`, `24`, `48` | `12` |

Valorile default nu sunt scrise în URL, ca să rămână curat.

## Căutare — de ce e pe client

Backendul **nu are endpoint de căutare**: `getProductsPaginated` acceptă doar
`page`, `size`, `sortBy`, `sortDir` și `categoryId`.

Așadar pagina funcționează în două moduri:

- **Navigare** (fără `q`) — paginare pe server, prin `getProductsPaginated`.
- **Căutare** (cu `q`) — citește catalogul complet o dată prin `getAllProducts()`,
  apoi filtrează, sortează și paginează în memorie.

Căutarea compară numele, descrierea și numele categoriei, și cere ca **fiecare
cuvânt** din termen să apară — deci „scaun albastru" nu returnează un scaun roșu.

Dacă numărul de produse crește semnificativ, mutarea căutării pe backend
(un parametru `search` în `getProductsPaginated`) elimină complet modul al doilea.

## Stări afișate

Pagina distinge patru stări, nu doar „se încarcă / nu se încarcă":

- `loading` — skeletons în formă de grid, care păstrează înălțimea paginii
- `ready` — grid de produse + paginator
- `empty` — mesaj diferit pentru „categorie goală" vs „căutare fără rezultate"
- `error` — mesaj + buton **Reîncearcă**

Înainte, o eroare de rețea arăta identic cu un catalog gol.

## Componente refolosite

- [`app-product-card`](../../shared/ui/product-card) — cardul de produs (și în wishlist)
- [`app-page-header`](../../shared/ui/page-header), `app-loading-state`,
  `app-empty-state`, `app-error-state`
- [`TranslatedPaginatorIntl`](../../shared/paginator/translated-paginator-intl.ts) —
  label-urile traduse ale paginatorului

## Responsive

- `< 1024px` — filtrele sunt ascunse în spatele butonului **Filtre** din header
- `≥ 1024px` — sidebar sticky de 248px lângă grid
- Grid-ul se auto-adaptează: `repeat(auto-fill, minmax(240px, 1fr))`

## Accesibilitate

Filtrele de categorie sunt `<button>`, nu `<mat-list-item (click)>`, deci sunt
accesibile de la tastatură. Categoria activă are `aria-current`. Numărul de
rezultate e într-o regiune `aria-live="polite"`. Imaginile au `width`/`height`
și `loading="lazy"`, mai puțin primele patru, care sunt `eager` ca să nu
sacadeze primul ecran.
