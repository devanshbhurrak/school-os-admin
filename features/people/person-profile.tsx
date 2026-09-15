"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Cake,
  Droplets,
  Flag,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import {
  deleteAddress,
  deleteContact,
  deletePerson,
  getPerson,
  listAddresses,
  listContacts,
} from "@/services";
import type { Address, Contact } from "@/types";
import { useSchoolContextValue } from "@/hooks/use-school-context";
import { usePermissions } from "@/hooks/use-permissions";
import { schoolKeys, STALE_TIME } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/permissions";
import { MAX_PAGE_SIZE } from "@/lib/constants";
import {
  formatAge,
  formatDate,
  initials,
  personDisplayName,
} from "@/lib/format";
import {
  ADDRESS_TYPE_LABELS,
  CONTACT_TYPE_LABELS,
} from "@/lib/display";
import { showMutationError } from "@/lib/error-messages";
import { ErrorState } from "@/components/patterns/error-state";
import { EmptyState } from "@/components/patterns/empty-state";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PermissionGate } from "@/components/ui/permission-gate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PersonFormDialog } from "./person-form-dialog";
import { ContactDialog } from "./contact-dialog";
import { AddressDialog } from "./address-dialog";

function InfoItem({ icon: Icon, label, value }: { icon: typeof Cake; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

export function PersonProfile({ personId }: { personId: string }) {
  const { activeSchool } = useSchoolContextValue();
  const { hasPermission } = usePermissions();
  const schoolId = activeSchool?.id ?? "";
  const queryClient = useQueryClient();
  const router = useRouter();

  const [editOpen, setEditOpen] = useState(false);
  const [contactDialog, setContactDialog] = useState<{ open: boolean; contact?: Contact | null }>({ open: false });
  const [addressDialog, setAddressDialog] = useState<{ open: boolean; address?: Address | null }>({ open: false });
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [deletingAddress, setDeletingAddress] = useState<Address | null>(null);
  const [deletingPerson, setDeletingPerson] = useState(false);

  const personQuery = useQuery({
    queryKey: schoolKeys.person(schoolId, personId),
    queryFn: () => getPerson(personId),
    enabled: !!schoolId,
    staleTime: STALE_TIME.frequent,
  });

  const contactsQuery = useQuery({
    queryKey: schoolKeys.contacts(schoolId, "PERSON", personId),
    queryFn: () => listContacts("PERSON", personId, { limit: MAX_PAGE_SIZE }),
    enabled: !!schoolId && hasPermission(PERMISSIONS.contact.list),
    staleTime: STALE_TIME.frequent,
    select: (data) => data.items,
  });

  const addressesQuery = useQuery({
    queryKey: schoolKeys.addresses(schoolId, "PERSON", personId),
    queryFn: () => listAddresses("PERSON", personId, { limit: MAX_PAGE_SIZE }),
    enabled: !!schoolId && hasPermission(PERMISSIONS.address.list),
    staleTime: STALE_TIME.frequent,
    select: (data) => data.items,
  });

  if (personQuery.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-40" />
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <Skeleton className="size-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </CardContent>
        </Card>
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (personQuery.isError) {
    return (
      <ErrorState
        error={personQuery.error}
        onRetry={() => void personQuery.refetch()}
      />
    );
  }

  const person = personQuery.data!;
  const displayName = personDisplayName(person);
  const contacts = contactsQuery.data ?? [];
  const addresses = addressesQuery.data ?? [];

  const canEdit = hasPermission(PERMISSIONS.person.update);
  const canManageContacts =
    hasPermission(PERMISSIONS.contact.create) ||
    hasPermission(PERMISSIONS.contact.delete);
  const canManageAddresses =
    hasPermission(PERMISSIONS.address.create) ||
    hasPermission(PERMISSIONS.address.delete);

  async function handleDeleteContact() {
    if (!deletingContact) return;
    try {
      await deleteContact(deletingContact.id);
      toast.success("Contact deleted");
      setDeletingContact(null);
      void queryClient.invalidateQueries({
        queryKey: schoolKeys.contacts(schoolId, "PERSON", personId),
      });
    } catch (error) {
      showMutationError(error);
    }
  }

  async function handleDeleteAddress() {
    if (!deletingAddress) return;
    try {
      await deleteAddress(deletingAddress.id, deletingAddress.version);
      toast.success("Address deleted");
      setDeletingAddress(null);
      void queryClient.invalidateQueries({
        queryKey: schoolKeys.addresses(schoolId, "PERSON", personId),
      });
    } catch (error) {
      showMutationError(error);
    }
  }

  async function handleDeletePerson() {
    try {
      await deletePerson(person.id, person.version);
      queryClient.removeQueries({ queryKey: schoolKeys.person(schoolId, person.id) });
      void queryClient.invalidateQueries({ queryKey: schoolKeys.persons(schoolId) });
      toast.success("Person deleted");
      router.push("/people");
    } catch (error) {
      showMutationError(error);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/people"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to people
        </Link>
      </div>

      {person.status === "MERGED" ? (
        <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          <AlertTriangle className="size-4" aria-hidden />
          <AlertTitle>This record has been merged</AlertTitle>
          <AlertDescription className="flex items-center gap-1.5">
            This person was merged into another record. Some actions are unavailable.
            <Link
              href="/people"
              className="inline-flex items-center gap-1 font-medium underline underline-offset-2"
            >
              Browse people
              <ArrowRight className="size-3" aria-hidden />
            </Link>
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarFallback className="text-lg">{initials(displayName)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight">{displayName}</h1>
                <StatusBadge status={person.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {[person.primary_email, person.primary_phone].filter(Boolean).join(" · ") || "No primary contact"}
              </p>
              {person.date_of_birth ? (
                <p className="text-sm text-muted-foreground">
                  {formatDate(person.date_of_birth)}
                  {formatAge(person.date_of_birth) ? ` · ${formatAge(person.date_of_birth)}` : ""}
                  {person.gender ? ` · ${person.gender}` : ""}
                </p>
              ) : person.gender ? (
                <p className="text-sm text-muted-foreground">{person.gender}</p>
              ) : null}
            </div>
          </div>
          {person.status !== "MERGED" ? (
            <div className="flex shrink-0 items-center gap-2">
              <PermissionGate permission={PERMISSIONS.person.update}>
                <Button variant="outline" onClick={() => setEditOpen(true)}>
                  <Pencil className="size-4" />
                  Edit
                </Button>
              </PermissionGate>
              <PermissionGate permission={PERMISSIONS.person.delete}>
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeletingPerson(true)}
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </PermissionGate>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <InfoItem
                icon={Cake}
                label="Date of birth"
                value={person.date_of_birth ? `${formatDate(person.date_of_birth)}${formatAge(person.date_of_birth) ? ` · ${formatAge(person.date_of_birth)}` : ""}` : "—"}
              />
              <InfoItem icon={UserRound} label="Gender" value={person.gender ?? "—"} />
              <InfoItem icon={Droplets} label="Blood group" value={person.blood_group ?? "—"} />
              <InfoItem icon={Flag} label="Nationality" value={person.nationality ?? "—"} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="mt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Contact information</CardTitle>
              {person.status !== "MERGED" ? (
                <PermissionGate permission={PERMISSIONS.contact.create}>
                  <Button size="sm" variant="outline" onClick={() => setContactDialog({ open: true, contact: null })}>
                    <Plus className="size-4" />
                    Add contact
                  </Button>
                </PermissionGate>
              ) : null}
            </CardHeader>
            <CardContent>
              {contactsQuery.isPending ? (
                <div className="space-y-2">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              ) : contacts.length ? (
                <ul className="divide-y">
                  {contacts.map((contact) => (
                    <li key={contact.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                          {contact.contact_type === "EMAIL" ? (
                            <Mail className="size-4 text-muted-foreground" aria-hidden />
                          ) : (
                            <Phone className="size-4 text-muted-foreground" aria-hidden />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{contact.value}</p>
                          <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                            {CONTACT_TYPE_LABELS[contact.contact_type] ?? contact.contact_type}
                            {contact.label ? ` · ${contact.label}` : null}
                            {contact.is_primary ? <Badge variant="secondary">Primary</Badge> : null}
                            {contact.is_emergency ? <Badge variant="outline" className="text-destructive">Emergency</Badge> : null}
                          </p>
                        </div>
                      </div>
                      {person.status !== "MERGED" ? (
                        <div className="flex shrink-0 items-center gap-1">
                          <PermissionGate permission={PERMISSIONS.contact.update}>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Edit contact"
                              onClick={() => setContactDialog({ open: true, contact })}
                            >
                              <Pencil className="size-4" />
                            </Button>
                          </PermissionGate>
                          <PermissionGate permission={PERMISSIONS.contact.delete}>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Delete contact"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeletingContact(contact)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </PermissionGate>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  compact
                  icon={Mail}
                  title="No contact information"
                  description={
                    canManageContacts && person.status !== "MERGED"
                      ? "Add a phone, email, or WhatsApp contact."
                      : "No contact information on record."
                  }
                  action={
                    canManageContacts && person.status !== "MERGED" ? (
                      <Button size="sm" onClick={() => setContactDialog({ open: true, contact: null })}>
                        <Plus className="size-4" />
                        Add contact
                      </Button>
                    ) : undefined
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses" className="mt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Addresses</CardTitle>
              {person.status !== "MERGED" ? (
                <PermissionGate permission={PERMISSIONS.address.create}>
                  <Button size="sm" variant="outline" onClick={() => setAddressDialog({ open: true, address: null })}>
                    <Plus className="size-4" />
                    Add address
                  </Button>
                </PermissionGate>
              ) : null}
            </CardHeader>
            <CardContent>
              {addressesQuery.isPending ? (
                <div className="space-y-2">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              ) : addresses.length ? (
                <ul className="divide-y">
                  {addresses.map((address) => (
                    <li key={address.id} className="flex items-start justify-between gap-3 py-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <MapPin className="size-4 text-muted-foreground" aria-hidden />
                        </div>
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-1.5 text-sm">
                            {ADDRESS_TYPE_LABELS[address.address_type] ?? address.address_type}
                            {address.is_primary ? <Badge variant="secondary">Primary</Badge> : null}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {[address.line1, address.line2, address.city, address.state, address.postal_code, address.country_code]
                              .filter(Boolean)
                              .join(", ") || "No address details"}
                          </p>
                        </div>
                      </div>
                      {person.status !== "MERGED" ? (
                        <div className="flex shrink-0 items-center gap-1">
                          <PermissionGate permission={PERMISSIONS.address.update}>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Edit address"
                              onClick={() => setAddressDialog({ open: true, address })}
                            >
                              <Pencil className="size-4" />
                            </Button>
                          </PermissionGate>
                          <PermissionGate permission={PERMISSIONS.address.delete}>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Delete address"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeletingAddress(address)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </PermissionGate>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  compact
                  icon={MapPin}
                  title="No addresses"
                  description={
                    canManageAddresses && person.status !== "MERGED"
                      ? "Add a residential or permanent address."
                      : "No addresses on record."
                  }
                  action={
                    canManageAddresses && person.status !== "MERGED" ? (
                      <Button size="sm" onClick={() => setAddressDialog({ open: true, address: null })}>
                        <Plus className="size-4" />
                        Add address
                      </Button>
                    ) : undefined
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {canEdit ? (
        <PersonFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          person={person}
          onSaved={(saved) => {
            queryClient.setQueryData(schoolKeys.person(schoolId, saved.id), saved);
          }}
        />
      ) : null}

      <ContactDialog
        open={contactDialog.open}
        onOpenChange={(open) => setContactDialog((prev) => ({ ...prev, open }))}
        entityType="PERSON"
        entityId={person.id}
        contact={contactDialog.contact}
      />

      <AddressDialog
        open={addressDialog.open}
        onOpenChange={(open) => setAddressDialog((prev) => ({ ...prev, open }))}
        entityType="PERSON"
        entityId={person.id}
        address={addressDialog.address}
      />

      <ConfirmDialog
        open={!!deletingContact}
        onOpenChange={(open) => {
          if (!open) setDeletingContact(null);
        }}
        title="Delete contact"
        description={
          deletingContact
            ? `Delete ${deletingContact.value}? This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeleteContact}
      />

      <ConfirmDialog
        open={!!deletingAddress}
        onOpenChange={(open) => {
          if (!open) setDeletingAddress(null);
        }}
        title="Delete address"
        description="This address will be permanently removed. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeleteAddress}
      />

      <ConfirmDialog
        open={deletingPerson}
        onOpenChange={setDeletingPerson}
        title="Delete person"
        description={
          <>
            This will permanently delete{" "}
            <span className="font-medium">{displayName}</span> and their contact
            details. This action cannot be undone.
          </>
        }
        confirmLabel="Delete person"
        destructive
        onConfirm={handleDeletePerson}
      />
    </div>
  );
}