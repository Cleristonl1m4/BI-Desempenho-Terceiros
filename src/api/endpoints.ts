// api/endpoints.ts - Versão melhorada
import axios from "axios";
import type {
  ApiHealth,
  BeneficiadorIndicador,
} from "@/types";

export interface IndicadoresPayload {
  indicadores: BeneficiadorIndicador[];
  indicadores_material: Record<string, BeneficiadorIndicador[]>;
  material_index: Record<string, string[]>;
  beneficiadores_alocados_count: number;
}

const baseURL = import.meta.env.VITE_API_URL ?? "/api";

export const apiClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

// 🔥 Interceptor para logging
apiClient.interceptors.request.use((config) => config);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);

export const beneficiadoresAPI = {
  async getIndicadores(): Promise<IndicadoresPayload> {
    try {
      const response = await apiClient.get("/beneficiadores/indicadores");
      const data = response.data as Partial<IndicadoresPayload>;
      return {
        indicadores: Array.isArray(data.indicadores) ? data.indicadores : [],
        indicadores_material: data.indicadores_material ?? {},
        material_index: data.material_index ?? {},
        beneficiadores_alocados_count: data.beneficiadores_alocados_count ?? 0,
      };
    } catch (error) {
      console.error("Erro ao buscar indicadores:", error);
      throw error;
    }
  },

  async getHealth(): Promise<ApiHealth> {
    try {
      const { data } = await apiClient.get("/health");
      if (!data || typeof data !== "object") {
        throw new Error("Resposta inválida");
      }
      return data as ApiHealth;
    } catch (error) {
      console.error();
      throw error;
    }
  },
};
