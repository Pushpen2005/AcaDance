import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    // Proxy to GPT or rule-based response
    const { message, role } = req.body;
    // Demo: Rule-based response
    let response = "Sorry, I can't answer that yet.";
    if (message.toLowerCase().includes("75%")) {
      response = "You need to attend 3 more classes to reach 75%.";
    } else if (message.toLowerCase().includes("< 50% attendance")) {
      response = "Students with < 50% attendance: John, Priya, Alex.";
    } else if (message.toLowerCase().includes("monthly attendance report")) {
      response = "Monthly attendance report generated for CSE-3rd Year.";
    }
    return res.status(200).json({ response });
  }
  res.status(405).end();
}
