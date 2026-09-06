import { useMutation } from "@tanstack/react-query";
import api from "../api/axios";

const useApiMutation = (
  endpoint,
  method = "POST",
  options = {}
) => {
  return useMutation({
    mutationFn: async (data) => {
      const response = await api({
        url: endpoint,
        method,
        data,
      });

      return response.data;
    },

    ...options,
  });
};

export default useApiMutation;
