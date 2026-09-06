"use client";

import './pairing.css';




type PairingProps = {
    player: Player;
    opponents: Opponent[];
    selectOpponent: selectOpponent;
    undoPair: undoPair;
    className?: string;
};

type selectOpponent = (player: Player, opp: Opponent) => void
type undoPair = (player: Player) => void


const matrixColor = (rating: number | undefined) => {
    if (rating === undefined) {
        return "#ffd22efa"
    }
    
    if (rating > 12) {
        return "#00fd11"
    } else if (rating > 8) {
        return "#ffd22efa"
    } else {
        return "#ff0000"
    }
}

export default function Pairing({ player, opponents, selectOpponent, undoPair, className }: PairingProps) {
    const showList = player.pair === undefined;

    return (
        <div key={player.id} className={"pairing " + className}>
            {/* Player card */}
            <section aria-label="Player" className="player">
                {player.avatarUrl ? (
                    <img src={player.avatarUrl} alt={`${player.name} avatar`} className="avatar" />
                ) : (
                    <div aria-hidden className="blank-avatar" />
                )}
                <div>
                    <strong>{player.name}</strong>
                    <div style={{ fontWeight: 600, color: "#666" }}>{player.faction}</div>
                    <div></div>
                </div>
            </section>

            {/* Opponent list OR selected matchup */}
            {showList ? (
                <section aria-label="Opponents">
                    {opponents?.length === 0 ? (
                        <p style={{ color: "#666" }}>No opponents available.</p>
                    ) : (
                        <ul role="list" className="opponent-list ">
                            {opponents?.map((opponent) => (
                                <li key={opponent.id}>
                                    <button
                                        type="button"
                                        className="opponent"
                                        aria-label={`Select opponent ${opponent.name}`}
                                        >
                                        {opponent?.avatarUrl ? (
                                            <img src={opponent.avatarUrl} alt={`${opponent.name} avatar`} className="avatar" />
                                        ) : (
                                            <div aria-hidden className="blank-avatar" style={{ background: matrixColor(player.matrix?.get(opponent.faction))}} />
                                        )}
                                        <div onClick={() => selectOpponent(player, opponent)}>
                                            <div style={{ fontWeight: 600, color: "#666"}}>{opponent.faction}</div>
                                            <div style={{ fontWeight: 250, color: "#666", textOverflow: "ellipsis", maxWidth: 475, maxHeight: "2em"}}>{opponent.name}</div>
                                            <div style={{ color: "#666" }}>
                                                matchup: {player.matrix?.get(opponent.faction) ? player.matrix?.get(opponent.faction) : "unknown"}
                                            </div>
                                        </div>      
                                        <a style={{ color: "#666"}} target="_blank" href={opponent.list}>list</a>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            ) : (
                <section aria-label="Selected Matchup" >
                    <div className="opponent" >
                        <button type="button" className="undo-button" onClick={() => undoPair(player)} >X</button>
                        <div>
                            <div style={{ fontWeight: 600, color: "#666" }}>{player.pair!.faction}</div>
                            <div style={{ fontWeight: 250, color: "#666" }}>{player.pair!.name}</div>
                            {player.matrix?.get(player.pair!.faction) !== undefined && (
                                <div style={{ color: "#666" }}>
                                    matrix: {player.matrix?.get(player.pair!.faction)}
                                </div>
                            )}
                        </div>

                    </div>
                </section>
            )}
        </div>
    );
}

