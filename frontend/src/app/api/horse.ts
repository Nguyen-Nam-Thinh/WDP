import { API_URL } from "./auth";

export interface Horse {
  _id: string;
  ownerId: string;
  name: string;
  breed?: string;
  gender: "male" | "female";
  birthDate: string;
  weight: number;
  color?: string;
  primaryImageUrl?: string;
  imageUrls?: string[];
  currentGrade: "Maiden" | "G3" | "G2" | "G1";
  totalPoints: number;
  totalEarnings: number;
  raceCount: number;
  winCount: number;
  regularJockeys?: string[];
  violations?: any[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const authHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const horseApi = {
  getMyHorses: async (
    token: string,
    page = 1,
    limit = 10,
    isActive?: boolean,
    grade?: string,
  ) => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (isActive !== undefined) params.append("isActive", isActive.toString());
    if (grade) params.append("grade", grade);

    const response = await fetch(`${API_URL}/horses?${params}`, {
      headers: authHeader(token),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error((errorData as any).message || "Failed to fetch horses");
    }
    const json = await response.json();
    return json.data;
  },

  getHorseById: async (token: string, horseId: string): Promise<Horse> => {
    const response = await fetch(`${API_URL}/horses/${horseId}`, {
      headers: authHeader(token),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error((errorData as any).message || "Failed to fetch horse");
    }
    const json = await response.json();
    return json.data;
  },

  createHorse: async (token: string, data: any): Promise<Horse> => {
    const response = await fetch(`${API_URL}/horses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(token),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error((errorData as any).message || "Failed to create horse");
    }
    const json = await response.json();
    return json.data;
  },

  updateHorse: async (
    token: string,
    horseId: string,
    data: any,
  ): Promise<Horse> => {
    const response = await fetch(`${API_URL}/horses/${horseId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(token),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error((errorData as any).message || "Failed to update horse");
    }
    const json = await response.json();
    return json.data;
  },

  deactivateHorse: async (token: string, horseId: string): Promise<Horse> => {
    const response = await fetch(`${API_URL}/horses/${horseId}`, {
      method: "DELETE",
      headers: authHeader(token),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        (errorData as any).message || "Failed to deactivate horse",
      );
    }
    const json = await response.json();
    return json.data;
  },

  uploadImages: async (
    token: string,
    horseId: string,
    files: File[],
  ): Promise<Horse> => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const response = await fetch(`${API_URL}/horses/${horseId}/upload-images`, {
      method: "POST",
      headers: authHeader(token),
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error((errorData as any).message || "Failed to upload images");
    }
    const json = await response.json();
    return json.data;
  },

  setPrimaryImage: async (
    token: string,
    horseId: string,
    imageUrl: string,
  ): Promise<Horse> => {
    const response = await fetch(`${API_URL}/horses/${horseId}/primary-image`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(token),
      },
      body: JSON.stringify({ imageUrl }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        (errorData as any).message || "Failed to set primary image",
      );
    }
    const json = await response.json();
    return json.data;
  },

  deleteImage: async (
    token: string,
    horseId: string,
    imageUrl: string,
  ): Promise<Horse> => {
    const response = await fetch(`${API_URL}/horses/${horseId}/image`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(token),
      },
      body: JSON.stringify({ imageUrl }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error((errorData as any).message || "Failed to delete image");
    }
    const json = await response.json();
    return json.data;
  },

  addRegularJockey: async (
    token: string,
    horseId: string,
    jockeyId: string,
  ): Promise<Horse> => {
    const response = await fetch(
      `${API_URL}/horses/${horseId}/regular-jockeys/${jockeyId}`,
      {
        method: "POST",
        headers: authHeader(token),
      },
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        (errorData as any).message || "Failed to add regular jockey",
      );
    }
    const json = await response.json();
    return json.data;
  },

  removeRegularJockey: async (
    token: string,
    horseId: string,
    jockeyId: string,
  ): Promise<Horse> => {
    const response = await fetch(
      `${API_URL}/horses/${horseId}/regular-jockeys/${jockeyId}`,
      {
        method: "DELETE",
        headers: authHeader(token),
      },
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        (errorData as any).message || "Failed to remove regular jockey",
      );
    }
    const json = await response.json();
    return json.data;
  },
};
