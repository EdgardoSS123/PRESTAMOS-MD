import json
import re
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; PrestamosMD/1.0)"}
CETES_URL = "https://www.banxico.org.mx/valores/PresentaDetallePosicionGub.faces?BMXC_instrumento=1&BMXC_lang=es_MX"
UDIBONOS_URL = "https://www.banxico.org.mx/valores/PresentaDetallePosicionGub.faces?BMXC_instrumento=5&BMXC_lang=es_MX"
UDI_URL = "https://www.banxico.org.mx/tipcamb/llenarInflacionAction.do?idioma=sp&usarCache=false"
MONTHS = {"enero":1,"febrero":2,"marzo":3,"abril":4,"mayo":5,"junio":6,"julio":7,"agosto":8,"septiembre":9,"octubre":10,"noviembre":11,"diciembre":12}

def fetch(url):
    request = urllib.request.Request(url, headers=HEADERS)
    return urllib.request.urlopen(request, timeout=30).read().decode("utf-8", "ignore")

def clean(html):
    return re.sub(r"\s+", " ", re.sub(r"&nbsp;|<[^>]+>", " ", html))

def load(path):
    file = Path(path)
    return json.loads(file.read_text(encoding="utf-8")) if file.exists() else {}

def store(path, data):
    Path(path).write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

def source_date(text, expression):
    match = re.search(expression, text, re.I)
    if not match: return ""
    month = MONTHS.get(match.group(2).lower())
    if not month: return ""
    return f"{int(match.group(1)):02d}/{month:02d}/{match.group(3)}"

def fetch_cetes():
    text = clean(fetch(CETES_URL))
    date = source_date(text, r"Cetes BI en circulaci.n al (\d{1,2}) de ([a-zA-Záéíóúñ]+) de (\d{4})")
    rows = re.findall(r"(\d{2}/\d{2}/\d{4})\s+([\d,]+\.\d)\s+[\d,]+\.\d", text)
    items = {}
    for d, b in rows:
        dd, mm, yyyy = d.split("/")
        balance = float(b.replace(",", ""))
        items[yyyy[2:] + mm + dd] = {"balance":balance, "window":round(balance * 0.04, 1)}
    if not date or len(items) < 5: raise ValueError("Saldo CETES o fecha sin verificar")
    previous = load("banxico.json")
    if previous.get("sourceDate") != date or previous.get("items") != items:
        store("banxico.json", {"sourceDate":date, "source":CETES_URL, "items":items})
    print(f"CETES: {date}, {len(items)} emisiones")

def fetch_udi():
    text = clean(fetch(UDI_URL))
    daily = {d:float(v) for d, v in re.findall(r"(\d{2}/\d{2}/\d{4})\s+(\d+\.\d{6})", text)}
    if len(daily) < 2 or not all(7 < value < 15 for value in daily.values()):
        raise ValueError("UDI sin datos verificables")
    old = load("udi.json")
    old_values = old.get("values", {})
    values = {**old_values, **daily}
    old["udiSource"] = UDI_URL
    old["values"] = dict(sorted(values.items(), key=lambda kv: datetime.strptime(kv[0], "%d/%m/%Y")))
    old["latestUdiDate"] = max(daily.keys(), key=lambda k: datetime.strptime(k, "%d/%m/%Y"))
    old["checkedAtUtc"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    # No reemplazar metadatos de UDIBONOS si su consulta falla.
    try:
        data = clean(fetch(UDIBONOS_URL))
        day = source_date(data, r"Udibonos en circulaci.n al (\d{1,2}) de ([a-zA-Záéíóúñ]+) de (\d{4})")
        num = r"[\d,]+\.\d"
        pattern = (r"(\d{2}/\d{2}/\d{4})\s+" + (r"(" + num + r")\s+") * 9 + r"(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+\.\d+)")
        meta = {}
        for match in re.finditer(pattern, data):
            dd, mm, yyyy = match.group(1).split("/")
            meta[yyyy[2:] + mm + dd] = {"maturity":match.group(1), "balance":float(match.group(2).replace(",","")), "daysToMaturity":int(match.group(11)), "coupons":int(match.group(12)), "couponDays":int(match.group(13)), "daysElapsed":int(match.group(14)), "coupon":float(match.group(15))}
        if day and len(meta) >= 5:
            old["sourceDate"] = day
            old["udibonoSource"] = UDIBONOS_URL
            old["udibonos"] = meta
        else:
            print("Aviso: no se verificaron metadatos de UDIBONOS, se conservan los anteriores")
    except Exception as exc:
        print(f"Aviso: Banxico UDIBONOS no disponible: {exc}")
    store("udi.json", old)
    print(f"UDI: {len(daily)} observaciones recientes; hasta {old['latestUdiDate']}")

failures = []
for name, fn in [("CETES", fetch_cetes), ("UDI", fetch_udi)]:
    try:
        fn()
    except Exception as exc:
        failures.append(f"{name}: {exc}")
if failures:
    raise SystemExit(" | ".join(failures))
