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
        const { type, recipient_id, target_role } = req.query;
        
        let query = supabase
          .from("notifications")
          .select("*");
        
        if (type) {
          query = query.eq("type", type);
        }
        
        if (recipient_id) {
          query = query.eq("recipient_id", recipient_id);
        }
        
        if (target_role) {
          query = query.eq("target_role", target_role);
        }
        
        const { data, error } = await query
          .order("created_at", { ascending: false })
          .limit(50);
        
        if (error) {
          return res.status(500).json({ error: error.message });
        }
        
        return res.status(200).json(data);

      case "POST":
        const {
          title,
          message,
          type: notificationType,
          recipient_id: recipientId,
          target_role: targetRole,
          priority,
          action_url
        } = req.body;
        
        const { data: notification, error: createError } = await supabase
          .from("notifications")
          .insert([{
            title,
            message,
            type: notificationType,
            recipient_id: recipientId,
            target_role: targetRole,
            priority: priority || "medium",
            action_url,
            created_at: new Date().toISOString()
          }])
          .select();
          
        if (createError) {
          return res.status(500).json({ error: createError.message });
        }
        
        return res.status(201).json(notification);

      case "PUT":
        const { id } = req.query;
        const { read_at, ...updateData } = req.body;
        
        const { data: updated, error: updateError } = await supabase
          .from("notifications")
          .update({
            ...updateData,
            read_at: read_at || new Date().toISOString()
          })
          .eq("id", id)
          .select();
          
        if (updateError) {
          return res.status(500).json({ error: updateError.message });
        }
        
        return res.status(200).json(updated);

      case "DELETE":
        const { id: deleteId } = req.query;
        
        const { error: deleteError } = await supabase
          .from("notifications")
          .delete()
          .eq("id", deleteId);
          
        if (deleteError) {
          return res.status(500).json({ error: deleteError.message });
        }
        
        return res.status(200).json({ message: "Notification deleted" });

      default:
        res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error("Notifications API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
