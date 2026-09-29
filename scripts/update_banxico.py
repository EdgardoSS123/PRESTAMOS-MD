import json,re,urllib.request
from datetime import datetime
URL="https://www.banxico.org.mx/valores/PresentaDetallePosicionGub.faces?BMXC_instrumento=1&BMXC_lang=es_MX"
req=urllib.request.Request(URL,headers={"User-Agent":"Mozilla/5.0"})
html=urllib.request.urlopen(req,timeout=30).read().decode("utf-8","ignore")
text=re.sub(r"<[^>]+>"," ",html)
text=re.sub(r"&nbsp;"," ",text)
text=re.sub(r"\s+"," ",text)
m=re.search(r"Cetes BI en circulaci.n al (\d{1,2}) de ([a-zA-Záéíóúñ]+) de (\d{4})",text,re.I)
months={"enero":1,"febrero":2,"marzo":3,"abril":4,"mayo":5,"junio":6,"julio":7,"agosto":8,"septiembre":9,"octubre":10,"noviembre":11,"diciembre":12}
source_date=""
if m:
    month=months.get(m.group(2).lower(),1)
    source_date=f"{int(m.group(1)):02d}/{month:02d}/{m.group(3)}"
rows=re.findall(r"(\d{2}/\d{2}/\d{4})\s+([\d,]+\.\d)\s+[\d,]+\.\d",text)
items={}
for d,b in rows:
    dd,mm,yyyy=d.split("/")
    emission=yyyy[2:]+mm+dd
    bal=float(b.replace(",",""))
    items[emission]={"balance":bal,"window":round(bal*.04,1)}
if not items:
    raise SystemExit("No se encontraron saldos CETES")
with open("banxico.json","w",encoding="utf-8") as f:
    json.dump({"sourceDate":source_date,"source":URL,"items":items},f,ensure_ascii=False,indent=2)
