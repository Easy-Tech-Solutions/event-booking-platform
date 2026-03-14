import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Mail, Phone, Send } from "lucide-react";

// Demo: Email/SMS blast to registered attendees
export function BlastMessageSender({ eventId: _eventId }: { eventId: string }) {
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [type, setType] = useState("email");
  const [status, setStatus] = useState("");

  const handleSend = () => {
    setStatus(`Blast sent via ${type === "email" ? "Email" : "SMS"} to all attendees!`);
    setMessage("");
    setSubject("");
    setTimeout(() => setStatus(""), 3000);
  };

  return (
    <Card className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Email/SMS Blast</h2>
      <div className="flex gap-2 mb-4">
        <Button variant={type === "email" ? "default" : "outline"} onClick={() => setType("email")}> <Mail className="w-4 h-4 mr-1" /> Email </Button>
        <Button variant={type === "sms" ? "default" : "outline"} onClick={() => setType("sms")}> <Phone className="w-4 h-4 mr-1" /> SMS </Button>
      </div>
      {type === "email" && (
        <Input placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} className="mb-3" />
      )}
      <Textarea placeholder="Message" value={message} onChange={e => setMessage(e.target.value)} className="mb-3" />
      <Button className="w-full bg-[#004406] text-white" onClick={handleSend} disabled={!message || (type === "email" && !subject)}>
        <Send className="w-4 h-4 mr-2" /> Send Blast
      </Button>
      {status && <div className="mt-4 text-green-700 text-sm font-medium">{status}</div>}
      <div className="mt-6 text-xs text-muted-foreground">(Demo: No actual messages sent)</div>
    </Card>
  );
}
