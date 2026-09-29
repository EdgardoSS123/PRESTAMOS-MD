# PRESTAMOS MD

App personal para Bonos y CETES.

## Valuación diaria
El botón **Valuación diaria** acepta el archivo `Resumen_Tradition_YYYYMMDD.xls/xlsx`.

Del mismo archivo toma:
- Bonos M: emisión, cierre Hoy y Ayer.
- CETES: emisión, plazo, cierre Hoy y Ayer.

## Bonos
Mantiene el motor préstamo ↔ fondeo validado contra la hoja SENS-PRESTAMOS.

## CETES
Para cada emisión calcula préstamo a partir del fondeo manual reproduciendo la lógica de la calculadora original:
- precio MD
- precio 24 horas
- PV01 a +1 bp
- préstamo equivalente

## Ventana CETES
Fuente oficial:
https://www.banxico.org.mx/valores/PresentaDetallePosicionGub.faces?BMXC_instrumento=1&BMXC_lang=es_MX

`Ventana = Saldo Total por Colocación × 4%`

`banxico.json` se actualiza automáticamente mediante GitHub Actions en días hábiles.
