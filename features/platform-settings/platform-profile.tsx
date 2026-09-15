"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

export function PlatformProfile() {
  const [productName, setProductName] = useState("School OS");
  const [supportEmail, setSupportEmail] = useState("support@schoolos.com");
  const [supportPhone, setSupportPhone] = useState("+91 11 0000 0000");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [locale, setLocale] = useState("en-IN");

  function handleSave() {
    toast.info("Platform settings are not yet persisted (requires dedicated settings store). This is an informational view for Phase 1.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Platform Identity</CardTitle>
        <CardDescription>Product and support information shown across the platform</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-w-xl">
        <div className="space-y-1.5">
          <Label>Product Name</Label>
          <Input value={productName} onChange={(e) => setProductName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Support Email</Label>
          <Input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Support Phone</Label>
          <Input value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Default Timezone</Label>
          <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Default Locale</Label>
          <Input value={locale} onChange={(e) => setLocale(e.target.value)} />
        </div>
        <div className="flex justify-end pt-2">
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </CardContent>
    </Card>
  );
}
