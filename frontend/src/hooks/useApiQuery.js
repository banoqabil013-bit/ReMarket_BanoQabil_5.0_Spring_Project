import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";

const useApiQuery = (queryKey, endpoint, options = {}) => {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await api.get(endpoint);
      return response.data;
    },
    ...options,
  });
};

export default useApiQuery;
