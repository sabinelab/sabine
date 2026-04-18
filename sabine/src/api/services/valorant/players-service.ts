import type { PlayerData, PlayersData } from "@types";
import { env } from "@/env";

export const valorantPlayers = {
  async get() {
    const response = await fetch(env.API_URL + "/players/valorant", {
      headers: {
        authorization: env.AUTH
      }
    });
    const data: PlayersData[] = await response.json();

    return data;
  },
  async getById(id: string | number) {
    const response = await fetch(env.API_URL + "/players/valorant?id=" + id, {
      headers: {
        authorization: env.AUTH
      }
    });
    const data: PlayerData = await response.json();

    return data;
  }
};
