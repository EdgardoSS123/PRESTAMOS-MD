import json,re,urllib.request
from datetime import datetime

HEADERS={"User-Agent":"Mozilla/5.0"}
CETES_URL="https://www.banxico.org.mx/valores/PresentaDetallePosicionGub.faces?BMXC_instrumento=1&BMXC_lang=es_MX"
UDIBONOS_URL="https://www.banxico.org.mx/valores/PresentaDetallePosicionGub.faces?BMXC_instrumento=5&BMXC_lang=es_MX"
UDI_URL="https://www.banxico.org.mx/tipcamb/llenarInflacionAction.do?idioma=sp&usarCache=false"

months={"enero":1,"febrero":2,"marzo":3,"abril":4,"mayo":5,"junio":6,"julio":7,"agosto":8,"septiembre":9,"octubre":10,"noviembre":11,"diciembre":12}

def fetch(url):
    req=urllib.request.Request(url,headers=HEADERS)
    return urllib.request.urlopen(req,timeout=30).read().decode("utf-8","ignore")

def clean(html):
    t=re.sub(r"<[^>]+>"," ",html)
    t=re.sub(r"&nbsp;"," ",t)
    t=re.sub(r"\s+"," ",t)
    return t

def source_date(text,pattern):
    m=re.search(pattern,text,re.I)
    if not m:return ""
    month=months.get(m.group(2).lower(),1)
    return f"{int(m.group(1)):02d}/{month:02d}/{m.group(3)}"

# CETES
ct=clean(fetch(CETES_URL))
cdate=source_date(ct,r"Cetes BI en circulaci.n al (\d{1,2}) de ([a-zA-Záéíóúñ]+) de (\d{4})")
rows=re.findall(r"(\d{2}/\d{2}/\d{4})\s+([\d,]+\.\d)\s+[\d,]+\.\d",ct)
items={}
for d,b in rows:
    dd,mm,yyyy=d.split("/")
    emission=yyyy[2:]+mm+dd
    bal=float(b.replace(",",""))
    items[emission]={"balance":bal,"window":round(bal*.04,1)}
if not items: raise SystemExit("No se encontraron saldos CETES")
with open("banxico.json","w",encoding="utf-8") as f:
    json.dump({"sourceDate":cdate,"source":CETES_URL,"items":items},f,ensure_ascii=False,indent=2)

# UDI daily values
ut=clean(fetch(UDI_URL))
udi_values={}
for d,v in re.findall(r"(\d{2}/\d{2}/\d{4})\s+(\d+\.\d{6})",ut):
    udi_values[d]=float(v)
if not udi_values: raise SystemExit("No se encontraron valores UDI")

# UDIBONOS metadata
st=clean(fetch(UDIBONOS_URL))
sdate=source_date(st,r"Udibonos en circulaci.n al (\d{1,2}) de ([a-zA-Záéíóúñ]+) de (\d{4})")
num=r"[\d,]+\.\d"
pattern=(r"(\d{2}/\d{2}/\d{4})\s+"
         +r"("+num+r")\s+("+num+r")\s+("+num+r")\s+("+num+r")\s+("+num+r")\s+"
         +r"("+num+r")\s+("+num+r")\s+("+num+r")\s+("+num+r")\s+"
         +r"(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+\.\d+)")
udibonos={}
for m in re.finditer(pattern,st):
    d=m.group(1); dd,mm,yyyy=d.split("/")
    emission=yyyy[2:]+mm+dd
    udibonos[emission]={
        "maturity":d,
        "balance":float(m.group(2).replace(",","")),
        "daysToMaturity":int(m.group(11)),
        "coupons":int(m.group(12)),
        "couponDays":int(m.group(13)),
        "daysElapsed":int(m.group(14)),
        "coupon":float(m.group(15))
    }
if not udibonos: raise SystemExit("No se encontraron metadatos UDIBONOS")

with open("udi.json","w",encoding="utf-8") as f:
    json.dump({
        "sourceDate":sdate,
        "udiSource":UDI_URL,
        "udibonoSource":UDIBONOS_URL,
        "values":udi_values,
        "udibonos":udibonos
    },f,ensure_ascii=False,indent=2)
