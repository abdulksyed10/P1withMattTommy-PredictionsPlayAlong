"use client";

import { useState } from "react";

export default function AdminResults() {

  const [raceId, setRaceId] = useState("");
  const [answers, setAnswers] = useState([]);

  async function saveResults() {
    await fetch("/api/admin/save-results", {
      method: "POST",
      body: JSON.stringify({ raceId, answers })
    });

    alert("Results saved");
  }

  return (
    <div className="p-8">

      <h1>Enter Race Results</h1>

      <select onChange={(e)=>setRaceId(e.target.value)}>
        {/* populate with races */}
      </select>

      <h2>P1</h2>
      <select>{/* drivers */}</select>

      <h2>P2</h2>
      <select>{/* drivers */}</select>

      <h2>P3</h2>
      <select>{/* drivers */}</select>

      <h2>Pole</h2>
      <select>{/* drivers */}</select>

      <h2>Good Surprise</h2>
      <button>Add driver/team</button>

      <h2>Big Flop</h2>
      <button>Add driver/team</button>

      <button onClick={saveResults}>
        Save Results
      </button>

    </div>
  );
}