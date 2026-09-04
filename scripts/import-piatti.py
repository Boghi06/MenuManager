#!/usr/bin/env python3
"""Importa il catalogo piatti dal file Excel della cucina dentro public.piatti.

Sorgente: `File Excel/ElencoPiatti_03092026.xls`, foglio "Elenco" (14 colonne:
cod, 4 traduzioni, tipo, tipo descrizione, vegetariano, vegano, no-lattosio,
veneziano, ricetta). Il file NON ha colonne per gli allergeni né per la
categoria: entrambi si ricavano qui.

Cosa fa, in ordine:
  1. legge il file della cucina e la mappa dei codici (ElencoPiatti_nuovo.xlsx)
  2. normalizza i 15+ codici `tipo` su portata (antipasti|primi|secondi|contorni)
     e categoria (carne|pesce|vegetariano)
  3. legge gli allergeni UE dalle annotazioni "(All. 1,7,8)" in coda alla ricetta
  4. deduce la categoria mancante dal nome e dalla ricetta
  5. legge lo stato attuale del DB e calcola le differenze
  6. senza `--applica` stampa solo il piano; con `--applica` scrive via PostgREST

Regola di fondo (vale per tutto lo script): in Excel "vuoto" vuol dire "non
compilato", non "no". Quindi si COMPLETA, non si azzera: un campo che il file
non valorizza resta com'è a DB, e gli allergeni si aggiungono soltanto.

Uso:
    pip install xlrd                       # solo la prima volta (legge .xls)
    python3 scripts/import-piatti.py --offline --csv piano.csv
    python3 scripts/import-piatti.py --utente admin
    python3 scripts/import-piatti.py --utente admin --applica

La password si dà in `MENU_PASSWORD` o la chiede il prompt: non passarla come
argomento, resterebbe nella history della shell.
"""

import argparse
import csv
import getpass
import json
import os
import re
import ssl
import sys
import unicodedata
import urllib.error
import urllib.request
from pathlib import Path

RADICE = Path(__file__).resolve().parent.parent          # menu-app/
PROGETTO = RADICE.parent                                  # Dashboard Menu/
XLS_DEFAULT = PROGETTO / "File Excel" / "ElencoPiatti_03092026.xls"
MAPPA_DEFAULT = PROGETTO / "File Excel" / "ElencoPiatti_nuovo.xlsx"

# ─── Schema di public.piatti ─────────────────────────────────────────────────

TRADUZIONI = ["nome_en", "nome_fr", "nome_de"]
CARATTERISTICHE = ["vegetariano", "vegano", "no_lattosio", "locale"]
# indice UE (Reg. 1169/2011) → colonna: è l'ordine usato dalla cucina nelle
# annotazioni "(All. 1,7,8)" e dalle costanti ALLERGENI di constants/piatti.ts
ALLERGENI = {
    1: "all_glutine", 2: "all_crostacei", 3: "all_uova", 4: "all_pesce",
    5: "all_arachidi", 6: "all_soia", 7: "all_latte", 8: "all_frutta_guscio",
    9: "all_sedano", 10: "all_senape", 11: "all_sesamo", 12: "all_solfiti",
    13: "all_lupini", 14: "all_molluschi",
}
COLONNE_ALLERGENI = list(ALLERGENI.values())
COLONNE = ["nome_it"] + TRADUZIONI + ["tipo", "categoria", "ricetta"] + CARATTERISTICHE + COLONNE_ALLERGENI

# ─── Normalizzazione del tipo (portata + categoria) ──────────────────────────
#
# Il foglio "Tipo-piatto" documenta 15 codici, ma la cucina ne ha scritti a mano
# altri (cont, secondi, primi, se, pri, veget, primo, manzo…): si accettano
# tutti, perché rifiutarli vorrebbe dire perdere ~60 piatti recenti.

TIPO_PORTATA = {
    "ant": "antipasti", "antipasti": "antipasti", "antipasto": "antipasti",
    "pr": "primi", "pri": "primi", "primi": "primi", "primo": "primi", "primi piatti": "primi",
    "con": "contorni", "cont": "contorni", "contorni": "contorni", "contorno": "contorni",
    "se": "secondi", "secondi": "secondi", "secondo": "secondi",
    # secondi per costruzione: dicono di cosa è fatto il piatto, non quando si serve
    "vit": "secondi", "mz": "secondi", "manzo": "secondi", "vol": "secondi",
    "ma": "secondi", "ovini": "secondi", "frat": "secondi", "pesce": "secondi",
    "veg": "secondi", "veget": "secondi", "vega": "secondi", "vegano": "secondi",
    "vegetariano": "secondi",
}
# Codici che nominano la proteina: si prendono per buoni così come sono.
TIPO_CATEGORIA = {
    "vit": "carne", "mz": "carne", "manzo": "carne", "vol": "carne",
    "ma": "carne", "ovini": "carne", "frat": "carne",
    "pesce": "pesce",
}
# Codici generici: dicono "senza carne", ma la cucina li usa anche su piatti
# che nel nome citano gamberetti o acciughe. Valgono solo se il nome tace.
TIPI_VEGETARIANI = {"veg", "veget", "vegetariano", "vega", "vegano"}
# Righe da non importare: i dessert non esistono più come portata (migrazione
# 019), il resto sono testi di servizio del foglio Excel.
TIPI_ESCLUSI = {"des", "dessert"}

# ─── Lessico per dedurre la categoria ────────────────────────────────────────
#
# Precedenza (dall'alto in basso): una specie citata batte sempre il nome della
# preparazione — "ragù di pesce spada" è pesce, non carne.

DICHIARAZIONE_VEG = r"vegan|vegetarian|vegetal|di magro|magro di"

# Ogni voce è un prefisso di parola: _rx() antepone \b, così "cipollotto" non
# conta come pollo e "Castelluccio" non conta come luccio. Le voci con spazi
# restano frasi intere ("coda di rospo").
PESCE = """
 pesce|pesci|branzin|orata|sogliol|rombo|merluzz|baccal|stoccafiss|salmon|tonno|
 sgombr|sardin|acciugh|alici|spigol|cerni|dentice|ricciol|pescatric|coda di rospo|
 trota|storion|anguill|luccio|persico|halibut|ippogloss|platess|gallinell|scorfan|
 trigli|cefalo|muggin|spatola|palombo|razza|smerigli|pesce spada|
 seppi|calamar|totan|moscardin|polpo|polip|piovra|
 gamber|mazzancoll|scampi|astice|aragost|granchi|granseol|canocchi|cicale di mare|
 crostace|mollusch|lucerna|pesce azzurro|
 cozze|vongol|capesant|cappesant|canestrell|ostrich|fasolar|tartufi di mare|
 bottarga|caviale|uova di lompo|frutti di mare|insalata di mare|salsa rosa di mare|
 marinar|pescator|allo scoglio|mare e monti|mari e monti|profumo di mare|sapori di mare|di mare
"""
CARNE = """
 carne|carni|manzo|vitell|maial|suin|agnell|capretto|montone|pecora|cinghial|cervo|
 capriol|daino|lepre|conigli|pollo|pollastr|gallin|faraon|tacchin|anatr|anitr|oca|
 quagli|piccion|struzz|cavall|puledr|bue|bovin|selvaggin|cacciagion|
 filetto di manzo|filetto di vitello|filetto di maiale|entrecote|entrecôte|
 controfilett|costat|tagliata|scaloppin|cotolett|ossobuc|stinco|bollito misto|
 roast ?beef|roastbeef|hamburger|stracott|tortellin|ascolan|
 prosciutt|speck|bresaol|salame|salamin|salsicci|pancett|guancial|lardo|bacon|
 mortadell|culatell|wurstel|cotechin|zampon|porchett|lonza|luganeg|sopress|soppress|
 trippa|fegato|fegatin|rognon|animell|lingua salmistrata|
 ragù|ragu|bolognes|carbonar|amatrician|gricia|monzes|papalin|alla vaccinar
"""
VEGETALE = """
 verdur|ortolan|primaver|pomodor|melanzan|zucchin|zucca|funghi|porcin|chiodini|
 finferl|champignon|patate|patata|pisell|fagiol|ceci|lenticchi|legumi|cereali|farro|orzo|quinoa|cous ?cous|
 spinaci|radicchi|carciof|asparag|broccol|cavol|finocch|peperon|cipoll|porri|erbette|
 bieta|biete|coste|lattuga|crescione|rucola|olive|
 sedano|rape|barbabietol|carote|zafferano|tartufo|erbe aromatiche|erbe selvatiche|
 formagg|parmigian|grana|pecorin|gorgonzol|mozzarell|ricott|caprin|fontin|taleggi|
 burrat|stracchin|robiol|scamorza|provol|asiago|montasio|brie|feta|emmenthal|yogurt|
 uovo|uova|frittat|tofu|seitan|tempeh|edamame|hummus|
 margherit|napoletan|sorrentin|pizzaiol|arrabbiat|siciliana|ligure|pesto|genoves|norma|
 capres|insalat|macedoni|frutta|agrumi|limone|basilico|
 riso|risott|pasta|gnocch|polenta|crespell|passato di|minestron
"""

def _rx(voci: str) -> re.Pattern:
    """Blocco di alternative → regex ancorata a inizio parola."""
    alt = [v.strip() for v in voci.replace("\n", "|").split("|") if v.strip()]
    return re.compile(r"\b(?:" + "|".join(alt) + r")")

RX_VEG_DICHIARATO = re.compile(DICHIARAZIONE_VEG)
RX_PESCE = _rx(PESCE)
RX_CARNE = _rx(CARNE)
RX_VEGETALE = _rx(VEGETALE)
# Un brodo è di carne finché non si dichiara vegetale: la guarnizione di
# verdure non lo rende tale, ed è la lettura che la cucina ha già confermato.
RX_BRODO = re.compile(r"\b(?:consomm|brodo|brodino)")
RX_BRODO_VEGETALE = re.compile(r"brodo vegetal|brodo di verdur|consomm[eé] vegetal|vegan|vegetarian|di magro")

# ─── Lessico per dedurre gli allergeni dagli ingredienti (opzionale) ─────────
#
# Solo con --deduci: è un suggerimento, non una dichiarazione. L'annotazione
# della cucina resta l'unica fonte autorevole.

INGREDIENTI_ALLERGENE = {
    1:  r"pasta|spaghett|tagliatell|taglierin|tagliolin|pennett|penne|maccheron|"
        r"fusill|rigaton|paccher|conchigli|orecchiett|bucatin|linguin|trenett|"
        r"lasagn|cannellon|ravioli|tortell|agnolott|gnocchett|cappellett|"
        r"farina|pane|pangrattat|impanat|panat|crostin|bruschett|piadin|"
        r"sfoglia|brisé|brisee|besciamell|birra|seitan|cous ?cous|orzo|farro|semolino",
    2:  r"gamber|scampi|astice|aragost|granchi|granseol|mazzancoll|canocchi|cicale di mare",
    3:  r"\buovo\b|\buova\b|tuorl|albume|maiones|carbonar|frittat|zabaion|meringa|pasta all'uovo",
    4:  r"pesce|acciugh|alici|colatura|bottarga|salmon|tonno|branzin|orata|merluzz|"
        r"baccal|sardin|sgombr|trota|storion|sogliol|rombo|cernia|dentice|"
        r"pescatric|triglia|scorfan|spatola|worcester",
    5:  r"arachid",
    6:  r"\bsoia\b|tofu|tempeh|edamame|salsa di soia",
    7:  r"latte|panna|burro|formagg|parmigian|grana|pecorin|mozzarell|gorgonzol|"
        r"ricott|mascarpon|besciamell|yogurt|fontin|taleggi|provol|caciott|"
        r"stracchin|burrat|caprin|robiol|scamorza|asiago|montasio|brie|feta|"
        r"gelato|crema di latte|fonduta",
    8:  r"\bnoci\b|noce\b|nocciol|mandorl|pistacch|anacard|\bpecan\b|macadamia|marzapane",
    9:  r"sedano",
    10: r"senape|mostarda",
    11: r"sesamo|tahin",
    12: r"solfit|vino bianco|vino rosso|prosecco|marsala|brandy|cognac|aceto balsamico",
    13: r"lupini",
    14: r"cozze|vongol|seppi|calamar|totan|moscardin|polpo|piovra|capesant|cappesant|"
        r"canestrell|ostrich|fasolar|tartufi di mare|frutti di mare",
}
RX_INGREDIENTI = {n: re.compile(p) for n, p in INGREDIENTI_ALLERGENE.items()}

# Annotazione della cucina in coda alla ricetta: "(All. 1,7,8)", "(all. 5 6 8)",
# "(All.12)", "(All. 4 x pesce, 7,9 x tartara)". Si prendono solo i numeri 1–14.
RX_ANNOTAZIONE = re.compile(r"\(\s*all[.:\s]*([^)]*)\)", re.IGNORECASE)

# Righe che nel foglio non sono piatti: testi del footer del menù stampato,
# separatori, note di servizio, salse. Attenzione a non allargare troppo:
# "Buffet di antipasti", "Buffet di insalate" e "Ricca scelta di insalate" sono
# voci vere del catalogo, usate nei menù — le esclude solo il filtro dessert,
# e solo se sono righe nuove. Il footer ha già i suoi piatti a DB
# (id 4838–4846, creati dalle migrazioni di seed 011/012/014).
RX_NON_PIATTO = re.compile(
    r"^\*+$|^cena$|^pranzo$|€|vedi ultime righe|a richiesta|previo supplement|"
    r"^alternative sempre pronte|^à la carte|^a la carte|^volentieri con preavviso|"
    r"^salsa\b",
    re.IGNORECASE,
)

# Dolci riconosciuti dal nome. Serve solo sulle righe NUOVE: la cucina a volte
# digita 'pr' o 'ant' su un dessert, e senza questo controllo entrerebbe in
# catalogo come primo o antipasto (il dessert non è più una portata, 019).
# Sui piatti già a DB non si applica: lì l'id esiste e il piatto va aggiornato,
# non giudicato.
RX_DESSERT = re.compile(
    r"\b(?:dessert|dolce|dolci|mousse|semifreddo|chantilly|crostatina|sorbetto|"
    r"gelato|tiramis|panna cotta|cacao|cioccolat|torta|tortina|strudel|budino|"
    r"creme caramel|profiterol|meringa|bavarese|cheesecake|macedonia)",
    re.IGNORECASE,
)


def normalizza(testo: str) -> str:
    """minuscolo, senza accenti: base per i confronti di nome e per i lessici."""
    s = unicodedata.normalize("NFD", (testo or "").lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", s).strip()


def si_no(valore: str):
    """Colonna si/no del foglio: None quando è vuota (= non compilato)."""
    v = normalizza(valore)
    if v in ("si", "s", "x", "sì", "1", "true", "vero"):
        return True
    if v in ("no", "n", "0", "false", "falso"):
        return False
    return None


# ─── Deduzioni ───────────────────────────────────────────────────────────────

def allergeni_annotati(ricetta: str) -> set:
    """Numeri UE letti dalle annotazioni "(All. …)" lasciate dalla cucina."""
    numeri = set()
    for blocco in RX_ANNOTAZIONE.findall(ricetta or ""):
        for n in re.findall(r"\d+", blocco):
            if 1 <= int(n) <= 14:
                numeri.add(int(n))
    return numeri


def allergeni_dedotti(testo: str) -> set:
    """Numeri UE ipotizzati dagli ingredienti citati in nome e ricetta."""
    return {n for n, rx in RX_INGREDIENTI.items() if rx.search(testo)}


def deduci_categoria(nome: str, ricetta: str, portata: str, veg_flag) -> str | None:
    """carne | pesce | vegetariano dal testo, con le precedenze note.

    Una specie citata batte il nome della preparazione: le preparazioni stanno
    in fondo ai rispettivi lessici proprio per questo.
    """
    nome_n = normalizza(nome)
    testo = normalizza(f"{nome} {ricetta}")

    if RX_PESCE.search(nome_n):
        return "pesce"          # "Agnolotti di magro al salmone" è pesce, non magro
    if RX_VEG_DICHIARATO.search(nome_n):
        return "vegetariano"
    if RX_CARNE.search(nome_n):
        return "carne"
    if RX_BRODO.search(nome_n) and not RX_BRODO_VEGETALE.search(testo):
        return "carne"          # consommé e brodi non dichiarati vegetali
    if veg_flag:
        return "vegetariano"
    if RX_VEGETALE.search(nome_n):
        return "vegetariano"
    # sulla ricetta si guarda solo dopo il nome: è meno affidabile (cita spesso
    # ingredienti di guarnizione), ma su un contorno basta per decidere
    if RX_PESCE.search(testo):
        return "pesce"
    if RX_CARNE.search(testo):
        return "carne"
    if portata == "contorni":
        return "vegetariano"    # un contorno senza carne né pesce è vegetale
    if RX_VEGETALE.search(testo):
        return "vegetariano"
    return None


# ─── Lettura dei file Excel ──────────────────────────────────────────────────

def leggi_elenco(percorso: Path) -> list[dict]:
    try:
        import xlrd
    except ImportError:
        sys.exit("Manca xlrd (serve a leggere i .xls): pip install xlrd")

    foglio = xlrd.open_workbook(percorso).sheet_by_name("Elenco")
    righe = []
    for r in range(1, foglio.nrows):            # riga 0 = intestazione
        def cella(c):
            # xlrd rende numeri i codici e le celle con soli cifre: qui serve
            # sempre testo, e "12.0" non è un valore che vogliamo scrivere a DB
            v = foglio.cell_value(r, c)
            if isinstance(v, float):
                return str(int(v)) if v == int(v) else str(v)
            return str(v).strip()

        cod = foglio.cell_value(r, 0)
        righe.append({
            "riga_excel": r + 1,
            "cod": int(cod) if isinstance(cod, float) and cod else None,
            "nome_it": cella(1), "nome_en": cella(2), "nome_fr": cella(3), "nome_de": cella(4),
            "tipo_xls": normalizza(cella(5)), "tipo_desc": normalizza(cella(6)),
            "vegetariano": si_no(cella(7)), "vegano": si_no(cella(8)),
            "no_lattosio": si_no(cella(9)), "locale": si_no(cella(10)),
            "ricetta": cella(11),
        })
    return righe


def leggi_mappa_codici(percorso: Path) -> tuple[dict[int, int], set[int]]:
    """cod della cucina → id in public.piatti (rinumerazione del 29/08/2026).

    Senza questa mappa il `cod` del foglio non ha nessun rapporto con gli id a
    DB e ogni riga sembrerebbe un piatto nuovo.

    Ritorna anche TUTTI gli id del catalogo di riferimento, mappati o no: le
    ultime 9 righe (4838–4846) sono i piatti che esistono solo a DB — buffet di
    dessert e supplementi del footer — e i loro id non vanno riusati per altro.
    """
    try:
        import openpyxl
    except ImportError:
        sys.exit("Manca openpyxl (serve a leggere la mappa .xlsx): pip install openpyxl")

    wb = openpyxl.load_workbook(percorso, read_only=True)
    mappa, riservati = {}, set()
    for i, riga in enumerate(wb["Elenco"].iter_rows(values_only=True)):
        if i == 0 or riga[0] is None:
            continue
        riservati.add(int(riga[0]))
        if riga[1] is not None:
            mappa[int(riga[1])] = int(riga[0])
    return mappa, riservati


# ─── Normalizzazione di una riga del foglio ──────────────────────────────────

def prepara(riga: dict) -> dict | None:
    """Riga Excel → valori nel vocabolario del DB. None se non è un piatto."""
    nome = riga["nome_it"]
    if not nome or RX_NON_PIATTO.search(nome.strip()):
        return None
    if riga["tipo_xls"] in TIPI_ESCLUSI or riga["tipo_desc"] in TIPI_ESCLUSI:
        return None

    tipo = TIPO_PORTATA.get(riga["tipo_xls"]) or TIPO_PORTATA.get(riga["tipo_desc"])
    incerta = tipo is None
    if incerta:
        # 'varie', 'gala' e le celle vuote non dicono la portata: la si indovina
        # dal nome, e in mancanza d'altro è un secondo (il caso più frequente).
        nome_n = normalizza(nome)
        if re.search(r"^insalat|^contorn|^patate|^verdure|^spinaci|^piselli", nome_n):
            tipo = "contorni"
        elif re.search(r"^risott|^spaghett|^tagliatell|^pasta|^zupp|^vellutat|^crema di|^minestr", nome_n):
            tipo = "primi"
        else:
            tipo = "secondi"

    categoria = TIPO_CATEGORIA.get(riga["tipo_xls"]) or TIPO_CATEGORIA.get(riga["tipo_desc"])
    generico = riga["tipo_xls"] in TIPI_VEGETARIANI or riga["tipo_desc"] in TIPI_VEGETARIANI
    if categoria is None and generico:
        # "Uova in cocotte ai gamberetti" è codificato veg ma è pesce: la specie
        # citata nel nome vince sul codice, che qui dice solo "niente carne".
        nome_n = normalizza(nome)
        categoria = ("pesce" if RX_PESCE.search(nome_n)
                     else "carne" if RX_CARNE.search(nome_n)
                     else "vegetariano")
    dedotta = categoria is None
    if dedotta:
        categoria = deduci_categoria(nome, riga["ricetta"], tipo, riga["vegetariano"] or riga["vegano"])

    annotati = allergeni_annotati(riga["ricetta"])
    dedotti = allergeni_dedotti(normalizza(f"{nome} {riga['ricetta']}")) - annotati

    return {
        **riga,
        "tipo": tipo, "portata_incerta": incerta,
        "categoria": categoria, "categoria_dedotta": dedotta,
        "allergeni_annotati": annotati, "allergeni_dedotti": dedotti,
    }


# ─── PostgREST ───────────────────────────────────────────────────────────────

def contesto_ssl() -> ssl.SSLContext:
    """Trust store per HTTPS.

    Il Python di python.org su macOS non usa i certificati di sistema: senza
    questo, ogni chiamata muore con CERTIFICATE_VERIFY_FAILED. Se c'è certifi
    lo si usa, altrimenti si prova il default e lo si dice chiaramente.
    """
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        return ssl.create_default_context()


class Supabase:
    """Client minimo: login con un account dell'app e CRUD su /rest/v1.

    `piatti` non è leggibile né scrivibile con la sola anon key (grant revocati
    dalla 004): serve il JWT di un utente con ruolo cucina o admin.
    """

    def __init__(self, url: str, anon: str, token: str):
        self.url, self.anon, self.token = url.rstrip("/"), anon, token

    @classmethod
    def login(cls, url: str, anon: str, utente: str, password: str) -> "Supabase":
        email = utente if "@" in utente else f"{utente}@utenti.local"
        dati = cls._http(
            "POST", f"{url.rstrip('/')}/auth/v1/token?grant_type=password",
            {"apikey": anon, "content-type": "application/json"},
            {"email": email, "password": password},
        )
        return cls(url, anon, dati["access_token"])

    @staticmethod
    def _http(metodo: str, url: str, headers: dict, corpo=None):
        dati = json.dumps(corpo).encode() if corpo is not None else None
        req = urllib.request.Request(url, data=dati, headers=headers, method=metodo)
        try:
            with urllib.request.urlopen(req, context=contesto_ssl()) as res:
                testo = res.read().decode()
                return json.loads(testo) if testo.strip() else None
        except urllib.error.HTTPError as e:
            sys.exit(f"{metodo} {url.split('?')[0]} → {e.code}: {e.read().decode()[:500]}")
        except urllib.error.URLError as e:
            if "CERTIFICATE_VERIFY_FAILED" in str(e.reason):
                sys.exit("HTTPS senza certificati: esegui `pip install certifi` "
                         "(oppure /Applications/Python\\ 3.12/Install\\ Certificates.command)")
            sys.exit(f"Rete non raggiungibile: {e.reason}")

    def _headers(self, extra=None):
        h = {"apikey": self.anon, "Authorization": f"Bearer {self.token}",
             "content-type": "application/json"}
        h.update(extra or {})
        return h

    def piatti(self) -> list[dict]:
        """Tutto il catalogo, a pagine: PostgREST tronca in silenzio a 1000."""
        fuori, pagina = [], 1000
        while True:
            lotto = self._http(
                "GET",
                f"{self.url}/rest/v1/piatti?select=*&order=id&limit={pagina}&offset={len(fuori)}",
                self._headers(),
            )
            fuori.extend(lotto)
            if len(lotto) < pagina:
                return fuori

    def upsert(self, righe: list[dict]):
        self._http(
            "POST", f"{self.url}/rest/v1/piatti?on_conflict=id",
            self._headers({"Prefer": "resolution=merge-duplicates,return=minimal"}),
            righe,
        )


def leggi_env(percorso: Path) -> dict:
    if not percorso.exists():
        sys.exit(f"Manca {percorso}: servono VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY")
    env = {}
    for r in percorso.read_text().splitlines():
        if "=" in r and not r.lstrip().startswith("#"):
            k, _, v = r.partition("=")
            env[k.strip()] = v.strip()
    return env


# ─── Merge ───────────────────────────────────────────────────────────────────

def calcola_modifiche(p: dict, attuale: dict | None, sovrascrivi: bool, deduci: bool) -> dict:
    """Campi da scrivere per un piatto. Vuoto = niente da fare.

    `attuale` None = piatto nuovo. Le regole, in una riga: i testi del file
    vincono se non sono vuoti, i booleani si possono solo alzare, la categoria
    si scrive se manca.
    """
    mod = {}
    nuovo = attuale is None
    attuale = attuale or {}

    # testi: il file è la fonte di verità, ma solo dove ha scritto qualcosa
    for campo in ["nome_it"] + TRADUZIONI + ["ricetta"]:
        valore = (p.get(campo) or "").strip()
        if not valore:
            continue
        corrente = (attuale.get(campo) or "").strip()
        if corrente == valore:
            continue
        if corrente and not sovrascrivi:
            # nome, traduzione o ricetta già a DB: sostituirli è una decisione
            # (magari li ha scritti l'utente dall'app), non un effetto dell'import
            continue
        mod[campo] = valore

    # portata: valore secco, sempre allineato al file
    if p["tipo"] != attuale.get("tipo"):
        mod["tipo"] = p["tipo"]

    # categoria: si riempie il vuoto; sovrascrivere solo su richiesta
    if p["categoria"] and (not attuale.get("categoria") or
                           (sovrascrivi and attuale["categoria"] != p["categoria"])):
        mod["categoria"] = p["categoria"]

    # caratteristiche: si alzano soltanto — "no" in Excel spesso è "non lo so"
    for campo in CARATTERISTICHE:
        v = p.get(campo)
        if v is None:
            continue
        corrente = bool(attuale.get(campo, False))
        if v and not corrente:
            mod[campo] = True
        elif sovrascrivi and not v and corrente:
            mod[campo] = False

    # allergeni: mai tolti, solo aggiunti (l'assenza di annotazione non è "nessuno")
    numeri = set(p["allergeni_annotati"])
    if deduci:
        numeri |= p["allergeni_dedotti"]
    for n in numeri:
        col = ALLERGENI[n]
        if not attuale.get(col, False):
            mod[col] = True

    if nuovo:
        # una riga nuova va comunque scritta anche se "non cambia niente"
        mod.setdefault("nome_it", p["nome_it"])
        mod.setdefault("tipo", p["tipo"])
    return mod


def riga_completa(piatto_id: int, attuale: dict | None, mod: dict) -> dict:
    """Riga intera da mandare in upsert: stato attuale + modifiche.

    Si spedisce tutta, non solo i campi cambiati, perché in un upsert in blocco
    PostgREST unisce le chiavi di tutti gli oggetti del lotto: una riga che non
    cita una colonna che un'altra cita se la vedrebbe riscritta a NULL. Con la
    riga completa il risultato è esattamente il merge calcolato qui sopra.
    """
    riga = {c: (attuale.get(c) if attuale else None) for c in COLONNE}
    for c in CARATTERISTICHE + COLONNE_ALLERGENI:
        if riga[c] is None:
            riga[c] = False          # colonne booleane: a DB sono NOT NULL
    riga.update(mod)
    return {"id": piatto_id, **riga}


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser(description="Importa i piatti dal file Excel della cucina.")
    ap.add_argument("--file", type=Path, default=XLS_DEFAULT, help="foglio della cucina (.xls)")
    ap.add_argument("--mappa", type=Path, default=MAPPA_DEFAULT,
                    help="ElencoPiatti_nuovo.xlsx: cod della cucina → id a DB")
    ap.add_argument("--utente", help="utente dell'app con ruolo cucina o admin")
    ap.add_argument("--applica", action="store_true", help="scrive davvero (senza, mostra solo il piano)")
    ap.add_argument("--sovrascrivi", action="store_true",
                    help="lascia che il file sovrascriva i valori già presenti a DB")
    ap.add_argument("--deduci", action="store_true",
                    help="scrive anche gli allergeni ipotizzati dagli ingredienti (da far validare in cucina)")
    ap.add_argument("--id-da-foglio", action="store_true", dest="id_da_foglio",
                    help="usa il `cod` del foglio come id a DB invece della numerazione 1–4846")
    ap.add_argument("--offline", action="store_true", help="analizza il file senza collegarsi al DB")
    ap.add_argument("--csv", type=Path, help="scrive il piano riga per riga in un CSV")
    args = ap.parse_args()

    if not args.file.exists():
        sys.exit(f"File non trovato: {args.file}")

    # ── 1. lettura e normalizzazione ────────────────────────────────────────
    grezze = leggi_elenco(args.file)
    if args.id_da_foglio:
        # L'id È il codice della cucina: nessuna conversione, nessuno spazio da
        # riservare oltre ai codici stessi. È la numerazione che la cucina ha
        # sotto gli occhi sul suo foglio e che ritrova stampata dalle ricette.
        mappa = {r["cod"]: r["cod"] for r in grezze if r["cod"] is not None}
        id_riservati = set(mappa.values())
    else:
        mappa, id_riservati = leggi_mappa_codici(args.mappa) if args.mappa.exists() else ({}, set())
    if not mappa and not args.id_da_foglio:
        print(f"⚠️  mappa dei codici assente ({args.mappa}): i piatti si abbineranno solo per nome",
              file=sys.stderr)

    piatti, scartate, doppioni, dolci = [], [], [], []
    visti = set()
    for riga in grezze:
        p = prepara(riga)
        if p is None:
            scartate.append(riga)
            continue
        if riga["cod"] not in mappa and RX_DESSERT.search(riga["nome_it"]):
            dolci.append(riga)      # dessert nuovo col codice sbagliato
            continue
        if p["cod"] is not None and p["cod"] in visti:
            doppioni.append(p)
            continue
        visti.add(p["cod"])
        piatti.append(p)

    print(f"Foglio: {args.file.name}")
    print(f"  righe lette          {len(grezze)}")
    print(f"  piatti               {len(piatti)}")
    print(f"  righe scartate       {len(scartate)}  (dessert, testi del footer, righe vuote)")
    print(f"  dolci non codificati {len(dolci)}  (righe nuove dal nome di dessert, non importate)")
    print(f"  codici doppi         {len(doppioni)}")
    print(f"  portata dedotta      {sum(1 for p in piatti if p['portata_incerta'])}"
          f"  (tipo assente o 'varie'/'gala')")
    con_cat = sum(1 for p in piatti if p["categoria"])
    print(f"  categoria            {con_cat}/{len(piatti)}"
          f"  ({sum(1 for p in piatti if p['categoria'] == 'carne')} carne,"
          f" {sum(1 for p in piatti if p['categoria'] == 'pesce')} pesce,"
          f" {sum(1 for p in piatti if p['categoria'] == 'vegetariano')} vegetariano,"
          f" {len(piatti) - con_cat} da classificare a mano)")
    print(f"  allergeni annotati   {sum(1 for p in piatti if p['allergeni_annotati'])} piatti")
    print(f"  allergeni ipotizzati {sum(1 for p in piatti if p['allergeni_dedotti'])} piatti"
          f"  ({'inclusi' if args.deduci else 'esclusi, servirebbe --deduci'})")

    if args.offline:
        if args.csv:
            for p in piatti:
                p["id_assegnato"] = mappa.get(p["cod"], "")   # senza DB: solo la mappa
            scrivi_csv(args.csv, [(p, None, {}) for p in piatti])
            print(f"\nAnalisi scritta in {args.csv} (senza DB: nessuna colonna 'campi_da_scrivere')")
        return

    # ── 2. stato attuale del DB ─────────────────────────────────────────────
    if not args.utente:
        sys.exit("Serve --utente (o --offline per la sola analisi del file).")
    env = leggi_env(RADICE / ".env.local")
    url, anon = env.get("VITE_SUPABASE_URL"), env.get("VITE_SUPABASE_ANON_KEY")
    if not url or not anon:
        sys.exit(".env.local senza VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY")
    password = os.environ.get("MENU_PASSWORD") or getpass.getpass(f"Password di {args.utente}: ")

    db = Supabase.login(url, anon, args.utente, password)
    esistenti = db.piatti()
    print(f"\nDB: {len(esistenti)} piatti")
    per_id = {p["id"]: p for p in esistenti}
    per_nome = {}
    for p in esistenti:
        per_nome.setdefault(normalizza(p["nome_it"]), p)

    # ── 3. abbinamento e piano ──────────────────────────────────────────────
    #
    # Gli id nuovi partono DOPO lo spazio riservato dalla rinumerazione: gli id
    # 1–4846 appartengono a piatti precisi, e `menu_voci`/`footer_riga` (o un
    # loro ripristino) puntano lì. Riusarli per altri piatti sposterebbe in
    # silenzio i menù già composti.
    prossimo_id = max([*per_id, *id_riservati, 0]) + 1
    per_codice, per_titolo, inseriti, ripresi = 0, 0, 0, 0
    assegnati, nuovi_id, per_bersaglio = set(), [], {}
    for p in piatti:
        id_mappato = mappa.get(p["cod"]) if p["cod"] is not None else None
        attuale = per_id.get(id_mappato) if id_mappato else None
        if attuale:
            per_codice += 1
        else:
            attuale = per_nome.get(normalizza(p["nome_it"]))
            if attuale:
                per_titolo += 1

        mod = calcola_modifiche(p, attuale, args.sovrascrivi, args.deduci)
        if attuale is not None:
            p["id_assegnato"] = attuale["id"]
        elif id_mappato and id_mappato not in per_id and id_mappato not in assegnati:
            # il piatto ha già avuto un id e quell'id è libero: si riprende,
            # così i codici stampati in cucina restano quelli
            p["id_assegnato"] = id_mappato
            ripresi += 1
            inseriti += 1
        else:
            p["id_assegnato"] = prossimo_id
            nuovi_id.append(prossimo_id)
            prossimo_id += 1
            inseriti += 1
        assegnati.add(p["id_assegnato"])
        # Due righe del foglio possono finire sullo stesso piatto: la cucina a
        # volte ri-aggiunge un piatto che esiste già, con un codice nuovo. Vince
        # l'ultima, cioè la più recente. La riga entra qui anche quando non
        # cambia niente: è proprio il caso in cui la sorella va scartata, o le
        # due versioni continuerebbero a sovrascriversi a ogni esecuzione.
        if p["id_assegnato"] in per_bersaglio:
            doppioni.append(p)
        per_bersaglio[p["id_assegnato"]] = (p, attuale, mod)

    piano = [voce for voce in per_bersaglio.values() if voce[2]]

    da_aggiornare = [x for x in piano if x[1] is not None]
    da_inserire = [x for x in piano if x[1] is None]
    campi = {}
    for _, _, mod in da_aggiornare:
        for k in mod:
            campi[k] = campi.get(k, 0) + 1

    print(f"  abbinati per codice  {per_codice}")
    print(f"  abbinati per nome    {per_titolo}")
    print(f"  id ripresi dalla mappa {ripresi}  (piatti assenti a DB che avevano già un id)")
    print(f"\nPiano: {len(da_aggiornare)} piatti da aggiornare, {len(da_inserire)} da inserire"
          + (f" ({ripresi} con l'id di prima, {len(nuovi_id)} con id nuovi"
             f" {min(nuovi_id)}–{max(nuovi_id)})" if nuovi_id else ""))
    for campo, n in sorted(campi.items(), key=lambda kv: -kv[1]):
        print(f"    {campo:<22} {n}")
    if args.csv:
        scrivi_csv(args.csv, piano)
        print(f"\nPiano dettagliato in {args.csv}")

    if not piano:
        print("\nNiente da fare: il DB è già allineato al foglio.")
        return
    if not args.applica:
        print("\nNessuna scrittura: rilancia con --applica per eseguire il piano.")
        return

    # ── 4. scrittura ────────────────────────────────────────────────────────
    # Upsert per id: la riga inviata è già il risultato del merge, quindi
    # merge-duplicates non può cancellare nulla che non abbiamo deciso noi.
    print(f"\n⚠️  ogni riga scritta finisce in activity_log (trigger di audit):"
          f" ~{len(piano)} voci nel Registro attività.")
    lotto, scritti = [], 0
    for p, attuale, mod in piano:
        lotto.append(riga_completa(p["id_assegnato"], attuale, mod))
        if len(lotto) == 200:
            db.upsert(lotto)
            scritti += len(lotto)
            print(f"  scritti {scritti}/{len(piano)}", end="\r", flush=True)
            lotto = []
    if lotto:
        db.upsert(lotto)
        scritti += len(lotto)
    print(f"  scritti {scritti}/{len(piano)}")
    print("Fatto.")


def scrivi_csv(percorso: Path, piano: list[tuple]):
    """Il piano riga per riga, per rivederlo in Excel prima di applicarlo."""
    with percorso.open("w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f, delimiter=";")
        w.writerow(["riga_excel", "cod", "id", "nome_it", "portata", "portata_dedotta",
                    "categoria", "categoria_dedotta", "allergeni_annotati",
                    "allergeni_ipotizzati", "campi_da_scrivere"])
        for p, attuale, mod in piano:
            w.writerow([
                p["riga_excel"], p["cod"], p.get("id_assegnato", ""), p["nome_it"],
                p["tipo"], "sì" if p["portata_incerta"] else "",
                p["categoria"] or "", "sì" if p["categoria_dedotta"] else "",
                ",".join(str(n) for n in sorted(p["allergeni_annotati"])),
                ",".join(str(n) for n in sorted(p["allergeni_dedotti"])),
                " ".join(sorted(mod)),
            ])


if __name__ == "__main__":
    main()
