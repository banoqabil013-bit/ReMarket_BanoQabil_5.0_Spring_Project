import api from "../api/axios";

const categoryService = {
  getAllCategories: async () => {
    const response = await api.get("/category");
    return response.data;
  },
};

export default categoryService;
