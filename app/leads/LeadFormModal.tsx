"use client";

import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function LeadFormModal({ close, refresh }:any){

  const [form,setForm]=useState({
    name:"",
    company:"",
    phone:"",
    email:"",
    source:"",
    notes:""
  });

  const createLead = async (e:any)=>{

    e.preventDefault();

    await fetch(`${API}/leads`,{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify(form)
    });

    refresh();
    close();
  };

  return(

    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

      <form
        onSubmit={createLead}
        className="bg-white p-6 rounded-xl w-[450px] space-y-3"
      >

        <h2 className="text-xl font-semibold">Create Lead</h2>

        <input
          placeholder="Name"
          className="border p-2 w-full rounded"
          onChange={(e)=>setForm({...form,name:e.target.value})}
        />

        <input
          placeholder="Company"
          className="border p-2 w-full rounded"
          onChange={(e)=>setForm({...form,company:e.target.value})}
        />

        <input
          placeholder="Phone"
          className="border p-2 w-full rounded"
          onChange={(e)=>setForm({...form,phone:e.target.value})}
        />

        <input
          placeholder="Email"
          className="border p-2 w-full rounded"
          onChange={(e)=>setForm({...form,email:e.target.value})}
        />

        <input
          placeholder="Source"
          className="border p-2 w-full rounded"
          onChange={(e)=>setForm({...form,source:e.target.value})}
        />

        <textarea
          placeholder="Notes"
          className="border p-2 w-full rounded"
          onChange={(e)=>setForm({...form,notes:e.target.value})}
        />

        <div className="flex justify-end gap-2 pt-2">

          <button
            type="button"
            onClick={close}
            className="border px-4 py-2 rounded"
          >
            Cancel
          </button>

          <button className="bg-violet-600 text-white px-4 py-2 rounded">
            Save
          </button>

        </div>

      </form>

    </div>

  );
}