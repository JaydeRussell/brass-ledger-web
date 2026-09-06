"use client";
import React, { useEffect, useRef } from "react";

import Pairing from "./components/pairing/pairing";

const opponentData =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRcdQNKgQOjIqnLimYvEurAKWn4c7GQOV12zIfChzWoB-YoRQZ6-iMZYWsptdmoUzbbEZ4dpvFH7t1s/pub?output=csv";
const playerData =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vR0fGIK5on2vqYIlv7EZf5DNAx1GtMHhG9QMc7QFp7jMgrojr-_N3INII8uBdVx-M19QveCWfN-NSeH/pub?output=csv";

async function fetchOpponents(
  teams: Map<string, Opponent[]>,
  setOpponents: React.Dispatch<React.SetStateAction<Opponent[]>>,
  opposingTeam: string
) {
  try {
    const res = await fetch(opponentData);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const csv = await res.text();

    // Naive CSV parsing: split by lines, then commas.
    const lines = csv
      .trim()
      .split(/\r?\n/)
      .filter((l) => l.length > 0);

    // Assume headers: Name,Faction,Id (or no Id; we'll generate one)
    const [header, ...rows] = lines;
    const headers = header.split(",").map((h) => h.trim().toLowerCase());

    const teamIdx = headers.indexOf("team");
    const nameIdx = headers.indexOf("player");
    const factionIdx = headers.indexOf("faction");
    const listIdx = headers.indexOf("list");
    const idIdx = headers.indexOf("id"); // optional

    const data: Opponent[] = rows.map((line, index) => {
      const cols = line.split(",").map((c) => c.trim());

      return {
        team: cols[teamIdx] ?? "",
        name: cols[nameIdx] ?? "no name",
        faction: cols[factionIdx] ?? "",
        list: cols[listIdx] ?? "https://google.com",
        id:
          idIdx >= 0 && cols[idIdx] !== undefined
            ? Number(cols[idIdx])
            : index,
      };
    });

    // Reset the team lookup before repopulating so re-fetching doesn't
    // accumulate duplicate entries.
    teams.clear();
    data.forEach((opponent) => {
      const existing = teams.get(opponent.team);
      if (existing === undefined) {
        teams.set(opponent.team, [opponent]);
      } else {
        existing.push(opponent);
      }
    });

    setOpponents(teams.get(opposingTeam) ?? []);
  } catch (err) {
    console.log(err instanceof Error ? err.message : "Failed to load CSV");
  }
}

async function fetchTeamMatrix(
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>
) {
  try {
    const res = await fetch(playerData);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const csv = await res.text();

    // Naive CSV parsing: split by lines, then commas.
    const lines = csv
      .trim()
      .split(/\r?\n/)
      .filter((l) => l.length > 0);

    // Assume headers: Name,Faction,Id (or no Id; we'll generate one)
    const [header, ...rows] = lines;
    const headers = header.split(",").map((h) => h.trim().toLowerCase());

    const idIdx = headers.indexOf("id"); // optional
    const nameIdx = headers.indexOf("player");
    const factionIdx = headers.indexOf("faction");
    const factions: Map<string, number> = new Map<string, number>();
    headers.forEach((value, index) => {
      if (value !== "player" && value !== "faction" && value !== "") {
        factions.set(value, index);
      }
    });

    const data: Player[] = rows.map((line, index) => {
      const cols = line.split(",").map((c) => c.trim());
      const matrix: Map<string, number> = new Map<string, number>();
      factions.forEach((value, key) => {
        matrix.set(key, Number(cols[value]));
      });
      return {
        name: cols[nameIdx] ?? "no name",
        faction: cols[factionIdx] ?? "",
        team: "thundercluckers",
        matrix: matrix,
        id:
          idIdx >= 0 && cols[idIdx] !== undefined
            ? Number(cols[idIdx])
            : index,
      };
    });

    setPlayers(data);
  } catch (err) {
    console.log(err instanceof Error ? err.message : "Failed to load CSV");
  }
}

export default function Home() {
  const [opponents, setOpponents] = React.useState<Opponent[]>([]);
  const [players, setPlayers] = React.useState<Player[]>([]);
  const [opposingTeam, setOpposingTeam] = React.useState<string>("");

  // Scoped to this component instance (rather than a module-level global)
  // so it doesn't leak across mounts/hot reloads.
  const teamsRef = useRef<Map<string, Opponent[]>>(new Map());

  useEffect(() => {
    fetchOpponents(teamsRef.current, setOpponents, opposingTeam);
    fetchTeamMatrix(setPlayers);
    // Only runs once on mount; opposingTeam changes are handled by the
    // <select> below, which reads directly from teamsRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectOpponent = (player: Player, opp: Opponent) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === player.id ? { ...p, pair: opp } : p))
    );
    setOpponents((prev) => prev.filter((o) => o.id !== opp.id));
  };

  const undoPair = (player: Player) => {
    const releasedOpponent = player.pair;
    setPlayers((prev) =>
      prev.map((p) => (p.id === player.id ? { ...p, pair: undefined } : p))
    );
    if (releasedOpponent) {
      setOpponents((prev) => [...prev, releasedOpponent]);
    }
  };

  let expectedScore = 0;
  players.forEach((player) => {
    const opponent = player.pair;
    const expected = opponent ? player.matrix?.get(opponent.faction) ?? 0 : 0;
    expectedScore += expected;
  });

  return (
    <div>
      <div>
        Opponent:
        <select
          onChange={(e) => {
            const team = e.target.value;
            setOpposingTeam(team);
            setOpponents(teamsRef.current.get(team) ?? []);
          }}
        >
          {Array.from(teamsRef.current.keys()).map((team) => (
            <option key={team} value={team}>
              {team}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        {players.map((player) => (
          <Pairing
            key={player.id}
            player={player}
            opponents={opponents}
            selectOpponent={selectOpponent}
            undoPair={undoPair}
            className="bg-zinc-50 font-sans dark:bg-black"
          />
        ))}
      </div>
      <div className="flex items-center justify-center font-sans dark:bg-black">
        expectedScore: {expectedScore} out of {players.length * 20}
      </div>
    </div>
  );
}
