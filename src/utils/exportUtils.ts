import { toast } from "@/lib/toast";

// Tipos de exportação suportados
export type ExportFormat = "csv" | "excel" | "json" | "pdf";

interface ExportOptions {
  filename?: string;
  includeHeaders?: boolean;
  dateFormat?: string;
  columns?: string[];
}

// Função principal de exportação
export async function exportData(
  data: any[],
  format: ExportFormat,
  options: ExportOptions = {}
) {
  const {
    filename = `export-${new Date().toISOString().split("T")[0]}`,
    includeHeaders = true,
    dateFormat = "dd/MM/yyyy",
    columns,
  } = options;

  try {
    switch (format) {
      case "csv":
        exportCSV(data, filename, includeHeaders, columns);
        break;
      case "excel":
        await exportExcel(data, filename, includeHeaders, columns);
        break;
      case "json":
        exportJSON(data, filename);
        break;
      case "pdf":
        await exportPDF(data, filename, includeHeaders, columns);
        break;
      default:
        throw new Error(`Formato não suportado: ${format}`);
    }

    toast.success(`Exportado com sucesso em formato ${format.toUpperCase()}`);
  } catch (error) {
    console.error("Erro na exportação:", error);
    toast.error(`Erro ao exportar em formato ${format.toUpperCase()}`);
    throw error;
  }
}

// Exportar como CSV
export function exportCSV(
  data: any[],
  filename: string,
  includeHeaders: boolean = true,
  columns?: string[]
) {
  if (!data || data.length === 0) {
    toast.error("Nenhum dado para exportar");
    return;
  }

  // Determinar colunas a exportar
  const keys = columns || Object.keys(data[0]);

  // Criar linhas do CSV
  const csvContent: string[] = [];

  // Adicionar cabeçalhos
  if (includeHeaders) {
    csvContent.push(keys.map(formatHeader).join(","));
  }

  // Adicionar dados
  data.forEach((row) => {
    const values = keys.map((key) => {
      const value = row[key];
      return formatCSVValue(value);
    });
    csvContent.push(values.join(","));
  });

  // Criar blob e download
  const blob = new Blob([csvContent.join("\n")], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `${filename}.csv`);
}

// Exportar como Excel (usando biblioteca básica)
export async function exportExcel(
  data: any[],
  filename: string,
  includeHeaders: boolean = true,
  columns?: string[]
) {
  // Para Excel real, seria necessário uma biblioteca como xlsx
  // Por enquanto, vamos criar um HTML table que o Excel pode abrir
  if (!data || data.length === 0) {
    toast.error("Nenhum dado para exportar");
    return;
  }

  const keys = columns || Object.keys(data[0]);

  let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" ';
  html += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
  html += 'xmlns="http://www.w3.org/TR/REC-html40">';
  html += '<head><meta charset="utf-8"></head>';
  html += '<body><table border="1">';

  // Headers
  if (includeHeaders) {
    html += "<thead><tr>";
    keys.forEach((key) => {
      html += `<th style="background-color:#f0f0f0;font-weight:bold;">${formatHeader(key)}</th>`;
    });
    html += "</tr></thead>";
  }

  // Body
  html += "<tbody>";
  data.forEach((row) => {
    html += "<tr>";
    keys.forEach((key) => {
      const value = formatValue(row[key]);
      html += `<td>${value}</td>`;
    });
    html += "</tr>";
  });
  html += "</tbody></table></body></html>";

  const blob = new Blob([html], { type: "application/vnd.ms-excel" });
  downloadBlob(blob, `${filename}.xls`);
}

// Exportar como JSON
export function exportJSON(data: any[], filename: string) {
  if (!data || data.length === 0) {
    toast.error("Nenhum dado para exportar");
    return;
  }

  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  downloadBlob(blob, `${filename}.json`);
}

// Exportar como PDF (básico - HTML para PDF)
export async function exportPDF(
  data: any[],
  filename: string,
  includeHeaders: boolean = true,
  columns?: string[]
) {
  // Para PDF real, seria necessário uma biblioteca como jsPDF ou pdfmake
  // Por enquanto, vamos criar um HTML formatado para impressão
  if (!data || data.length === 0) {
    toast.error("Nenhum dado para exportar");
    return;
  }

  const keys = columns || Object.keys(data[0]);

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${filename}</title>
      <style>
        @page { size: A4; margin: 20mm; }
        body { font-family: Arial, sans-serif; font-size: 12px; }
        h1 { color: #333; font-size: 18px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f4f4f4; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .footer { margin-top: 20px; text-align: center; color: #666; font-size: 10px; }
      </style>
    </head>
    <body>
      <h1>Relatório de Clientes - ${new Date().toLocaleDateString("pt-BR")}</h1>
      <table>
  `;

  // Headers
  if (includeHeaders) {
    html += "<thead><tr>";
    keys.forEach((key) => {
      html += `<th>${formatHeader(key)}</th>`;
    });
    html += "</tr></thead>";
  }

  // Body
  html += "<tbody>";
  data.forEach((row) => {
    html += "<tr>";
    keys.forEach((key) => {
      const value = formatValue(row[key]);
      html += `<td>${value}</td>`;
    });
    html += "</tr>";
  });
  html += "</tbody></table>";

  html += `
      <div class="footer">
        <p>Gerado em ${new Date().toLocaleString("pt-BR")} | Oxy - Sistema de Gestão</p>
      </div>
    </body>
    </html>
  `;

  // Abrir em nova janela para impressão/salvamento como PDF
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}

// Funções auxiliares
function formatHeader(key: string): string {
  // Converter snake_case ou camelCase para título
  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .trim()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function formatCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  // Se contém vírgula, aspas ou quebra de linha, precisa de aspas
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    // Escapar aspas duplicando-as
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "boolean") {
    return value ? "Sim" : "Não";
  }

  if (value instanceof Date) {
    return value.toLocaleDateString("pt-BR");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// Função para exportar dados de clientes com formatação específica
export function exportClients(
  clients: any[],
  format: ExportFormat,
  options: ExportOptions = {}
) {
  // Transformar dados de clientes para formato mais legível
  const formattedData = clients.map(client => ({
    "Nome": client.full_name || client.name || "",
    "Telefone": client.phone_number || client.phone || "",
    "Email": client.email || "",
    "Status": client.is_active !== false ? "Ativo" : "Inativo",
    "Data Cadastro": new Date(client.created_at || client.createdAt).toLocaleDateString("pt-BR"),
    "Última Interação": client.last_message_at
      ? new Date(client.last_message_at).toLocaleDateString("pt-BR")
      : "Nunca",
    "Patients": client.pets_count || 0,
    "Agendamentos": client.bookings_count || 0,
    "Observações": client.notes || ""
  }));

  return exportData(formattedData, format, {
    ...options,
    filename: options.filename || `clientes-${new Date().toISOString().split("T")[0]}`
  });
}

// Função para exportar dados de patients com formatação específica
export function exportPets(
  patients: any[],
  format: ExportFormat,
  options: ExportOptions = {}
) {
  const formattedData = patients.map(patient => ({
    "Nome do Patient": patient.name || "",
    "Espécie": patient.gender_identity || "",
    "Raça": patient.age_group || "Não informada",
    "Idade": patient.age_years ? `${patient.age_years} anos` : "Não informada",
    "Peso": patient.weight_kg ? `${patient.weight_kg} kg` : "Não informado",
    "Dono": patient.owner_name || "",
    "Telefone Dono": patient.owner_phone || "",
    "Observações": patient.notes || "",
    "Ativo": patient.is_active ? "Sim" : "Não"
  }));

  return exportData(formattedData, format, {
    ...options,
    filename: options.filename || `patients-${new Date().toISOString().split("T")[0]}`
  });
}

// Função para exportar relatório de analytics
export function exportAnalytics(
  analyticsData: any,
  format: ExportFormat,
  options: ExportOptions = {}
) {
  const formattedData = [
    {
      "Métrica": "Total de Clientes",
      "Valor": analyticsData.total || 0,
      "Variação": "+0%"
    },
    {
      "Métrica": "Clientes Ativos",
      "Valor": analyticsData.active || 0,
      "Variação": analyticsData.activeRate || "0%"
    },
    {
      "Métrica": "Novos Clientes (Mês)",
      "Valor": analyticsData.newThisMonth || 0,
      "Variação": `+${analyticsData.growthRate || 0}%`
    },
    {
      "Métrica": "Taxa de Churn",
      "Valor": `${analyticsData.churnRate || 0}%`,
      "Variação": "0%"
    },
    {
      "Métrica": "Health Score",
      "Valor": analyticsData.healthScore || 0,
      "Variação": "0%"
    }
  ];

  return exportData(formattedData, format, {
    ...options,
    filename: options.filename || `analytics-${new Date().toISOString().split("T")[0]}`
  });
}