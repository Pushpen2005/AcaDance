import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { method } = req;

    switch (method) {
      case "GET":
        const { role, id } = req.query;
        
        let query = supabase.from("profiles").select("*");
        
        if (role) {
          query = query.eq("role", role);
        }
        
        if (id) {
          query = query.eq("id", id);
        }
        
        const { data, error } = await query;
        
        if (error) {
          return res.status(500).json({ error: error.message });
        }
        
        return res.status(200).json(data);

      case "POST":
        const profileData = req.body;
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert([profileData])
          .select();
          
        if (createError) {
          return res.status(500).json({ error: createError.message });
        }
        
        return res.status(201).json(newProfile);

      case "PUT":
        const { id: updateId } = req.query;
        const updateData = req.body;
        
        const { data: updatedProfile, error: updateError } = await supabase
          .from("profiles")
          .update(updateData)
          .eq("id", updateId)
          .select();
          
        if (updateError) {
          return res.status(500).json({ error: updateError.message });
        }
        
        return res.status(200).json(updatedProfile);

      case "DELETE":
        const { id: deleteId } = req.query;
        
        const { error: deleteError } = await supabase
          .from("profiles")
          .delete()
          .eq("id", deleteId);
          
        if (deleteError) {
          return res.status(500).json({ error: deleteError.message });
        }
        
        return res.status(200).json({ message: "Profile deleted successfully" });

      default:
        res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
