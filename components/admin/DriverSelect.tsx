export default function DriverSelect({
  label,
  drivers,
  value,
  setValue
}:any){

  return(

    <div>

      <label className="block mb-2 font-medium">
        {label}
      </label>

      <select
        value={value}
        onChange={(e)=>setValue(e.target.value)}
        className="border p-2 rounded w-full"
      >

        <option value="">Select driver</option>

        {drivers.map((d:any)=>(
          <option key={d.id} value={d.id}>
            {d.full_name}
          </option>
        ))}

      </select>

    </div>

  );

}