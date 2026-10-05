"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSchool, listOrganizations } from "@/services/iam";
import { platformKeys } from "@/lib/query-keys";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { showMutationError } from "@/lib/error-messages";

interface CreateSchoolDialogProps {
  /** If provided, the organization is pre-selected and the org selector is hidden. */
  preselectedOrgId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSchoolDialog({ preselectedOrgId, open, onOpenChange }: CreateSchoolDialogProps) {
  const qc = useQueryClient();
  const [orgId, setOrgId] = useState(preselectedOrgId ?? "");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [shortName, setShortName] = useState("");
  const [board, setBoard] = useState("CBSE");
  const [affiliation, setAffiliation] = useState("");

  const orgsQuery = useQuery({
    queryKey: platformKeys.organizations({ limit: 100 }),
    queryFn: () => listOrganizations({ limit: 100 }),
    enabled: !preselectedOrgId,
  });

  const mut = useMutation({
    mutationFn: () =>
      createSchool({
        organization_id: orgId,
        code: code.trim(),
        name: name.trim(),
        short_name: shortName.trim() || null,
        board: board.trim() || null,
        affiliation_number: affiliation.trim() || null,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: platformKeys.schools() });
      if (preselectedOrgId) {
        void qc.invalidateQueries({ queryKey: platformKeys.orgSchools(preselectedOrgId) });
      }
      toast.success("School created");
      handleClose();
    },
    onError: (err) => showMutationError(err),
  });

  function handleClose() {
    onOpenChange(false);
    setOrgId(preselectedOrgId ?? "");
    setName("");
    setCode("");
    setShortName("");
    setBoard("CBSE");
    setAffiliation("");
  }

  const canSubmit = !!orgId && !!name.trim() && !!code.trim() && !mut.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create School</DialogTitle>
          <DialogDescription>Add a new school to the platform.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {!preselectedOrgId && (
            <div className="space-y-1.5">
              <Label htmlFor="cs-org">Organization *</Label>
              <Select value={orgId} onValueChange={setOrgId}>
                <SelectTrigger id="cs-org">
                  <SelectValue placeholder={orgsQuery.isLoading ? "Loading…" : "Select organization"} />
                </SelectTrigger>
                <SelectContent>
                  {(orgsQuery.data?.items ?? []).map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="cs-name">School Name *</Label>
            <Input id="cs-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Lincoln Elementary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cs-code">Code *</Label>
              <Input id="cs-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="LES-001" className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cs-short">Short Name</Label>
              <Input id="cs-short" value={shortName} onChange={(e) => setShortName(e.target.value)} placeholder="LES" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cs-board">Board</Label>
              <Input id="cs-board" value={board} onChange={(e) => setBoard(e.target.value)} placeholder="CBSE" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cs-affiliation">Affiliation No.</Label>
              <Input id="cs-affiliation" value={affiliation} onChange={(e) => setAffiliation(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={handleClose}>Cancel</Button>
            <Button onClick={() => mut.mutate()} disabled={!canSubmit}>
              {mut.isPending ? "Creating…" : "Create School"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
