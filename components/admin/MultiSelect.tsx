export default function MultiSelect({
  label,
  options,
  selected,
  setSelected
}:any){

  function toggle(id:string){

    if(selected.includes(id)){
      setSelected(selected.filter((s:string)=>s!==id));
    }else{
      setSelected([...selected,id]);
    }

  }

  return(

    <div className="space-y-3">

      <h3 className="font-semibold">{label}</h3>

      <div className="grid grid-cols-3 gap-2">

        {options.map((o:any)=>{

          const name = o.full_name ?? o.name;

          return(

            <button
              key={o.id}
              type="button"
              onClick={()=>toggle(o.id)}
              className={`border rounded p-2 text-sm
                ${selected.includes(o.id)
                  ?"bg-purple-600 text-white"
                  :"bg-black text-white"
                }`}
            >
              {name}
            </button>

          );

        })}

      </div>

    </div>

  );

}