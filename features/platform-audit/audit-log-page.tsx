"use client";

import { useState } from "react";
import { AuditLogTable } from "@/components/ui/audit-log-table";
import { platformKeys } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Download, FilterX } from "lucide-react";
import type { AuditLogListParams } from "@/services/audit";

const ENTITY_TYPES = ["ALL", "organization", "school", "user", "membership", "role", "person", "academic_year", "academic_term", "academic_class", "subject", "class_subject", "cohort"] as const;
const ACTIONS = ["ALL", "CREATE", "UPDATE", "DELETE", "LOGIN_SUCCESS", "LOGIN_FAILURE"] as const;

export function AuditLogPage() {
  const [entityType, setEntityType] = useState<string>("ALL");
  const [action, setAction] = useState<string>("ALL");
  const [actorId, setActorId] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [orgId, setOrgId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const params: AuditLogListParams = {};
  if (entityType !== "ALL") params.entity_type = entityType;
  if (actorId.trim()) params.actor_user_id = actorId.trim();
  if (schoolId.trim()) params.school_id = schoolId.trim();
  if (orgId.trim()) params.organization_id = orgId.trim();
  if (action !== "ALL") params.action = action;
  if (from) params.created_from = new Date(from + "T00:00:00.000Z").toISOString();
  if (to) params.created_to = new Date(to + "T23:59:59.999Z").toISOString();

  const hasFilters = entityType !== "ALL" || action !== "ALL" || actorId || schoolId || orgId || from || to;

  function clearFilters() {
    setEntityType("ALL");
    setAction("ALL");
    setActorId("");
    setSchoolId("");
    setOrgId("");
    setFrom("");
    setTo("");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
          <p className="text-sm text-muted-foreground">Platform-wide activity across all organizations and schools</p>
        </div>
        <Button variant="outline" size="sm" disabled>
          <Download className="size-4" />
          Export
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Organization ID</Label>
              <Input placeholder="organization_id" value={orgId} onChange={(e) => setOrgId(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">School ID</Label>
              <Input placeholder="school_id" value={schoolId} onChange={(e) => setSchoolId(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Actor User ID</Label>
              <Input placeholder="actor_user_id" value={actorId} onChange={(e) => setActorId(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Entity Type</Label>
              <Select value={entityType} onValueChange={setEntityType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map((t) => <SelectItem key={t} value={t}>{t === "ALL" ? "All" : t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Action</Label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTIONS.map((a) => <SelectItem key={a} value={a}>{a === "ALL" ? "All" : a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">From</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">To</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
          {hasFilters && (
            <div className="mt-3 flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <FilterX className="size-4" /> Clear filters
              </Button>
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">All filters are applied server-side. Export is coming soon.</p>
        </CardContent>
      </Card>

      <AuditLogTable queryKey={platformKeys.audit(params)} params={params} />
    </div>
  );
}
