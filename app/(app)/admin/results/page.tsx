"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import DriverSelect from "@/components/admin/DriverSelect";
import MultiSelect from "@/components/admin/MultiSelect";

export default function AdminResultsPage() {

  const [drivers,setDrivers] = useState<any[]>([]);
  const [teams,setTeams] = useState<any[]>([]);
  const [races,setRaces] = useState<any[]>([]);
  const [questions,setQuestions] = useState<any[]>([]);

  const [raceId,setRaceId] = useState("");

  const [p1,setP1] = useState("");
  const [p2,setP2] = useState("");
  const [p3,setP3] = useState("");
  const [pole,setPole] = useState("");

  const [goodSurprise,setGoodSurprise] = useState<string[]>([]);
  const [bigFlop,setBigFlop] = useState<string[]>([]);

  useEffect(()=>{

    async function load(){

      const {data:d} = await supabase
        .from("drivers")
        .select("id,full_name")
        .order("full_name");

      const {data:t} = await supabase
        .from("teams")
        .select("id,name")
        .order("name");

      const {data:r} = await supabase
        .from("races")
        .select("id,name,round")
        .order("round");
      
      const {data:q} = await supabase
        .from("questions")
        .select("id,key");

      setDrivers(d ?? []);
      setTeams(t ?? []);
      setRaces(r ?? []);
      setQuestions(q ?? []);

    }

    load();

  },[]);

  async function saveResults(){

    if(!raceId){
      alert("Select race first");
      return;
    }

    const answers = [

      {key:"p1",driver:p1},
      {key:"p2",driver:p2},
      {key:"p3",driver:p3},
      {key:"pole",driver:pole},

      {key:"good_surprise",drivers:goodSurprise},
      {key:"big_flop",drivers:bigFlop}

    ];

    for(const q of answers){

      const question = questions.find(x => x.key === q.key);

      if(!question){
        alert("Question not found: " + q.key);
        return;
      }

      const {data:keyRow,error:keyErr} = await supabase
        .from("race_question_answer_keys")
        .insert({
          race_id:raceId,
          question_key:q.key,
          is_final:true,
          published_at:new Date()
        })
        .select()
        .single();

      if(keyErr){
        alert(keyErr.message);
        return;
      }

      const rows:any[] = [];

      if(q.driver){

        rows.push({
          answer_key_id:keyRow.id,
          choice_kind:"driver",
          driver_id:q.driver
        });

      }

      if(q.drivers){

        for(const d of q.drivers){

          rows.push({
            answer_key_id:keyRow.id,
            choice_kind:"driver",
            driver_id:d
          });

        }

      }

      if(rows.length){

        await supabase
          .from("race_question_correct_choices")
          .insert(rows);

      }

    }

    alert("Results saved");

  }

  return(

    <div className="max-w-4xl mx-auto p-8 space-y-8">

      <h1 className="text-2xl font-bold">
        Admin – Enter Race Results
      </h1>

      <select
        value={raceId}
        onChange={(e)=>setRaceId(e.target.value)}
        className="border p-2 rounded w-full"
      >

        <option value="">Select race</option>

        {races.map(r=>(
          <option key={r.id} value={r.id}>
            Round {r.round} — {r.name}
          </option>
        ))}

      </select>

      <div className="grid grid-cols-2 gap-6">

        <DriverSelect label="P1" drivers={drivers} value={p1} setValue={setP1}/>
        <DriverSelect label="P2" drivers={drivers} value={p2} setValue={setP2}/>
        <DriverSelect label="P3" drivers={drivers} value={p3} setValue={setP3}/>
        <DriverSelect label="Pole" drivers={drivers} value={pole} setValue={setPole}/>

      </div>

      <MultiSelect
        label="Good Surprise"
        options={[...drivers,...teams]}
        selected={goodSurprise}
        setSelected={setGoodSurprise}
      />

      <MultiSelect
        label="Big Flop"
        options={[...drivers,...teams]}
        selected={bigFlop}
        setSelected={setBigFlop}
      />

      <button
        onClick={saveResults}
        className="bg-purple-600 text-white px-6 py-3 rounded"
      >
        Save Results
      </button>

    </div>

  );

}