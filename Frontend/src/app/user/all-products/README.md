# All Products Component

## Descriere

Componenta `all-products` afișează toate produsele disponibile în format de card-uri (mat-card), cu paginare și filtrare după categorie. Componenta folosește Angular Material și suportă internaționalinalizare.

## Caracteristici

### 1. **Afișare Produse în Card-uri**

- Fiecare produs este afișat într-un `mat-card` cu:
  - Imagine produs (250px înălțime)
  - Nume produs
  - Categorie produs (cu icon)
  - Preț produs

### 2. **Sidebar cu Categorii**

- Sidebar fix pe partea stângă (280px lățime)
- Lista tuturor categoriilor disponibile
- Opțiune "Toate Categoriile" pentru a afișa toate produsele
- Categoria selectată este evidențiată cu gradient violet

### 3. **Paginare**

- Folosește `MatPaginator` pentru navigare
- Opțiuni de dimensiune pagină: 6, 12, 24, 48 produse
- Afișare informații despre produsele curente (ex: "1 - 12 din 50 produse")
- Butonare pentru prima/ultima pagină
- Traduceri complete pentru toate label-urile paginatorului

### 4. **Layout Responsiv**

- Pe desktop: sidebar stânga + grid produse dreapta
- Pe mobile (< 768px): sidebar deasupra, grid produse jos
- Grid adaptiv:
  - Desktop: 3-4 coloane (280px min per card)
  - Tablet: 2-3 coloane (250px min per card)
  - Mobile: 1-2 coloane (200px min per card)

### 5. **Internaționalinalizare**

- Suport complet pentru engleză și română
- Toate textele sunt traduse folosind ngx-translate
- Traduceri pentru: titluri, categorii, paginare, mesaje eroare

## Structura Fișierelor

```
all-products/
├── all-products.component.ts       # Logica componentei
├── all-products.component.html     # Template-ul componentei
├── all-products.component.scss     # Stiluri
├── all-products.component.spec.ts  # Teste unitare
└── README.md                       # Această documentație
```

## API Endpoints folosite

### Frontend (UserService)

1. **getProductsPaginated()**

   - Obține produsele paginate
   - Parametri: page, size, sortBy, sortDir, categoryId (opțional)
   - Returns: Observable cu răspuns paginat

2. **getCategories()**
   - Obține toate categoriile
   - Returns: Observable cu lista de categorii

### Backend (UserController)

1. **GET /api/user/get-products-paginated**

   - Parametri query:
     - `page`: numărul paginii (default: 0)
     - `size`: dimensiunea paginii (default: 12)
     - `sortBy`: câmp sortare (default: id)
     - `sortDir`: direcție sortare (default: asc)
     - `categoryId`: ID categorie pentru filtrare (opțional)
   - Returns: Page<ProductDto>

2. **GET /api/user/get-categories**
   - Returns: List<CategoryDto>

## Utilizare

### În Routes

```typescript
{
  path: 'all-products',
  component: AllProductsComponent,
  canActivate: [authGuard]
}
```

### Navigare

```typescript
// Din orice componentă
this.router.navigate(["/all-products"]);

// În template
<a routerLink="/all-products">Vezi Produse</a>;
```

## Comportament

1. **La inițializare:**

   - Se încarcă categoriile
   - Se încarcă prima pagină de produse (12 produse)
   - Nu este selectată nicio categorie (afișează toate)

2. **La selectare categorie:**

   - Se filtrează produsele după categoria selectată
   - Se resetează la prima pagină
   - Se reîncarcă produsele

3. **La schimbare pagină:**

   - Se actualizează indexul paginii
   - Se reîncarcă produsele pentru pagina nouă
   - Se păstrează categoria selectată

4. **Hover pe card:**
   - Card-ul se ridică cu 4px
   - Shadow-ul se intensifică
   - Cursor pointer pentru a indica interactivitate

## Stiluri și Design

### Gradient Principal

- Folosit pentru: header, categorie activă
- Gradient: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`

### Culori

- Primară: #667eea (violet)
- Text: #333 (gri închis)
- Background: #f5f5f5 (gri deschis)
- Preț: #667eea (violet)

### Animații

- Tranziții smooth pe hover (0.2s ease)
- Slide down pentru animații (0.2s ease-out)

## Dependențe Angular Material

- MatCard
- MatCardHeader
- MatCardTitle
- MatCardSubtitle
- MatCardContent
- MatProgressSpinner
- MatIcon
- MatPaginator
- MatList
- MatListItem

## Extinderi Viitoare Posibile

1. **Detalii Produs**

   - Click pe card pentru a vedea detalii complete
   - Modal sau pagină separată

2. **Sortare**

   - Dropdown pentru sortare după preț, nume, etc.
   - Similar cu view-products din admin

3. **Căutare**

   - Bară de căutare pentru filtrare după nume
   - Debounce pentru performanță optimă

4. **Coș de cumpărături**

   - Buton "Adaugă în coș" pe fiecare card
   - Gestiune coș de cumpărături

5. **Favorite**

   - Buton pentru a marca produse favorite
   - Filtrare după favorite

6. **Imagini Multiple**
   - Galerie imagini pentru fiecare produs
   - Slider de imagini pe hover

## Probleme Cunoscute

Nicio problemă cunoscută momentan.

## Suport

Pentru probleme sau întrebări, contactați echipa de dezvoltare.
