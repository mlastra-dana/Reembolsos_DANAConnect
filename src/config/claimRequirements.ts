export type ClaimType = "GASTOS_MEDICOS" | "EMERGENCIA" | "CONSULTA";
export type Slot = "FACTURA" | "INFORME_RECETA" | "EVIDENCIA_ADICIONAL";

type SlotRequirement = {
  title: string;
  helperText: string;
  examples: string[];
  required: boolean;
};

type ClaimRequirement = {
  title: string;
  description: string;
  slots: Record<Slot, SlotRequirement>;
};

export const CLAIM_REQUIREMENTS: Record<ClaimType, ClaimRequirement> = {
  CONSULTA: {
    title: "Carga de documentos",
    description: "Adjunta los documentos de tu consulta para el preregistro.",
    slots: {
      FACTURA: {
        title: "Facturas",
        helperText:
          "Facturas de consulta y HONORARIOS MEDICOS (comprobante de pago del medico o clinica).",
        examples: [
          "Factura de consulta medica",
          "Recibo de honorarios profesionales",
          "Comprobante de pago emitido por clinica"
        ],
        required: true
      },
      INFORME_RECETA: {
        title: "Informe / receta medica",
        helperText:
          "Informe medico o receta/orden emitida por el medico (diagnostico/indicaciones).",
        examples: [
          "Informe de consulta",
          "Receta medica",
          "Orden con indicaciones del medico"
        ],
        required: true
      },
      EVIDENCIA_ADICIONAL: {
        title: "Evidencia adicional",
        helperText:
          "Soportes adicionales: examenes, radiografias, ecografias, resultados de laboratorio (si aplica).",
        examples: [
          "Radiografia o ecografia",
          "Resultados de laboratorio",
          "Reporte de imagen diagnostica"
        ],
        required: false
      }
    }
  },
  EMERGENCIA: {
    title: "Carga de documentos",
    description: "Adjunta los soportes de la atencion de emergencia para tu preregistro.",
    slots: {
      FACTURA: {
        title: "Facturas",
        helperText:
          "Facturas de emergencia: clinica/hospital, medicamentos, materiales y HONORARIOS.",
        examples: [
          "Factura de hospital o clinica",
          "Comprobante de medicamentos",
          "Recibo de honorarios medicos"
        ],
        required: true
      },
      INFORME_RECETA: {
        title: "Informe / receta medica",
        helperText: "Informe de atencion de emergencia, epicrisis, indicaciones medicas.",
        examples: [
          "Informe de emergencia",
          "Epicrisis",
          "Indicaciones o receta post-atencion"
        ],
        required: true
      },
      EVIDENCIA_ADICIONAL: {
        title: "Evidencia adicional",
        helperText: "Examenes/imagenes: RX, eco, TAC, laboratorios, etc.",
        examples: [
          "RX o TAC",
          "Ecografia",
          "Resultados de laboratorio"
        ],
        required: false
      }
    }
  },
  GASTOS_MEDICOS: {
    title: "Carga de documentos",
    description: "Adjunta las facturas y documentos medicos necesarios para tu preregistro.",
    slots: {
      FACTURA: {
        title: "Facturas",
        helperText:
          "Facturas por gastos medicos: farmacia, clinica, procedimientos y HONORARIOS MEDICOS.",
        examples: [
          "Factura de farmacia",
          "Factura de clinica o procedimiento",
          "Recibo de honorarios medicos"
        ],
        required: true
      },
      INFORME_RECETA: {
        title: "Informe / receta medica",
        helperText:
          "Informe medico o receta/orden relacionada al gasto (diagnostico/indicaciones).",
        examples: [
          "Informe medico",
          "Receta u orden medica",
          "Indicaciones del especialista"
        ],
        required: true
      },
      EVIDENCIA_ADICIONAL: {
        title: "Evidencia adicional",
        helperText: "Evidencia adicional: resultados de laboratorio, imagenes diagnosticas, reportes.",
        examples: [
          "Resultados de laboratorio",
          "Imagenes diagnosticas",
          "Reportes de estudios"
        ],
        required: false
      }
    }
  }
};
