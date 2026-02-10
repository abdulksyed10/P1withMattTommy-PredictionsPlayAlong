import { redirect } from "next/dist/client/components/navigation";

export default function Home() {
  // return (
  //   <main className="min-h-screen flex items-center justify-center bg-black text-white">
  //     <h1 className="text-4xl font-bold">P1 Predictions</h1>
  //   </main>
  // );
  redirect("/login");
}
