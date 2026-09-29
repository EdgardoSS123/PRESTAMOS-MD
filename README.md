# PRESTAMOS MD

Calculadora personal de mercado de dinero para bonos.

## Funciones
- Selección de bono.
- Préstamo actual.
- Fondeo actual.
- Valuación base.
- Fondeo manual → préstamo equivalente.
- Préstamo manual → fondeo equivalente.
- Carga del archivo diario `SENS-PRESTAMOS`.
- Curva completa.

## Fuente
Sólo se utiliza la hoja `SENS-PRESTAMOS`. `PRESTAMOS CTS` queda fuera.

- Bono: C
- Valuación: H
- Fondeo: I1
- Q: Q
- R: R
- PV01: U
- Préstamo: W

Relación:
`PREST = ((Q - R) - (R * FONDEO / 360)) / PV01`

Inversa:
`FONDEO = 360 * ((Q - R) - PREST * PV01) / R`
