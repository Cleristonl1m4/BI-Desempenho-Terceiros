import { useQuery } from '@tanstack/react-query';
import { beneficiadoresAPI } from '@/api/endpoints';

export function useIndicadores() {
  return useQuery({
    queryKey: ['indicadores'],
    queryFn: () => beneficiadoresAPI.getIndicadores(),
    staleTime: Infinity,
    retry: 1,
  });
}

export function useApiHealth() {
  return useQuery({
    queryKey: ['api-health'],
    queryFn: () => beneficiadoresAPI.getHealth(),
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 0,
  });
}
