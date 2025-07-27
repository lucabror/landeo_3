import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

export function useCredits() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const hotelId = user?.hotelId;

  const { data: creditInfo = { credits: 0, totalCredits: 0, creditsUsed: 0 }, ...queryInfo } = useQuery({
    queryKey: ["/api/hotels", hotelId, "credits"],
    enabled: !!hotelId,
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  const refreshCredits = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/hotels", hotelId, "credits"] });
    queryClient.invalidateQueries({ queryKey: ["/api/hotels", hotelId, "stats"] });
  };

  return {
    ...creditInfo,
    refreshCredits,
    isLoading: queryInfo.isLoading,
    error: queryInfo.error
  };
}