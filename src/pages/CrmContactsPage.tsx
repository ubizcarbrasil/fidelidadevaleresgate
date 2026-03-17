import { useState, useDeferredValue, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useCrmContacts, useCrmContactEvents, useCrmContactStats, SOURCE_LABELS, SOURCE_COLORS } from "@/modules/crm";
import { Users, Smartphone, Globe, Upload, Search, ChevronLeft, ChevronRight, Coins } from "lucide-react";
import { getTierInfo } from "@/lib/tierUtils";

export default function CrmContactsPage() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [source, setSource] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [os, setOs] = useState<string>("");
  const [page, setPage] = useState(0);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  const { data, isLoading } = useCrmContacts({
    search: deferredSearch || undefined,
    source: source || undefined,
    gender: gender || undefined,
    os_platform: os || undefined,
    page,
  });

  // Fetch linked customer data for displaying points
  const contactIds = (data?.contacts || []).filter(c => c.customer_id).map(c => c.customer_id);
  const { data: linkedCustomers } = useQuery({
    queryKey: ["crm-linked-customers", contactIds],
    enabled: contactIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("customers").select("id, points_balance, money_balance, customer_tier, ride_count").in("id", contactIds as string[]);
      return data || [];
    },
  });
  const customerMap = new Map((linkedCustomers || []).map(c => [c.id, c]));
  const { data: stats } = useCrmContactStats();
  const { data: events } = useCrmContactEvents(selectedContactId);

  const contacts = data?.contacts || [];
  const total = data?.total || 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Contatos CRM" description="Base unificada de contatos de todas as fontes" />

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
                <p className="text-xs text-muted-foreground">Total de Contatos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {Object.entries(stats?.bySource || {}).map(([src, count]) => (
          <Card key={src}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                {src === "MOBILITY_APP" ? <Smartphone className="h-5 w-5 text-blue-500" /> :
                 src === "LOYALTY" ? <Globe className="h-5 w-5 text-green-500" /> :
                 <Upload className="h-5 w-5 text-amber-500" />}
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">{SOURCE_LABELS[src] || src}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, telefone, email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="pl-9"
              />
            </div>
            <Select value={source} onValueChange={(v) => { setSource(v === "all" ? "" : v); setPage(0); }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Origem" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas origens</SelectItem>
                <SelectItem value="MOBILITY_APP">App Mobilidade</SelectItem>
                <SelectItem value="LOYALTY">Fidelidade</SelectItem>
                <SelectItem value="STORE_UPLOAD">Upload Loja</SelectItem>
                <SelectItem value="MANUAL">Manual</SelectItem>
              </SelectContent>
            </Select>
            <Select value={gender} onValueChange={(v) => { setGender(v === "all" ? "" : v); setPage(0); }}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Gênero" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="M">Masculino</SelectItem>
                <SelectItem value="F">Feminino</SelectItem>
                <SelectItem value="O">Outro</SelectItem>
              </SelectContent>
            </Select>
            <Select value={os} onValueChange={(v) => { setOs(v === "all" ? "" : v); setPage(0); }}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Sistema" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="iOS">iOS</SelectItem>
                <SelectItem value="Android">Android</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Corridas</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Pontos</TableHead>
                    <TableHead>Última Corrida</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedContactId(c.id)}
                    >
                      <TableCell className="font-medium">{c.name || "—"}</TableCell>
                      <TableCell>{c.phone || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={SOURCE_COLORS[c.source] || ""}>
                          {SOURCE_LABELS[c.source] || c.source}
                        </Badge>
                      </TableCell>
                      <TableCell>{c.ride_count || 0}</TableCell>
                      <TableCell>
                        {(() => {
                          const cust = c.customer_id ? customerMap.get(c.customer_id) : null;
                          if (!cust) return <span className="text-muted-foreground text-xs">—</span>;
                          const tier = getTierInfo(cust.customer_tier || "INICIANTE");
                          return <Badge variant="outline" className={`text-xs ${tier.color}`}>{tier.label}</Badge>;
                        })()}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const cust = c.customer_id ? customerMap.get(c.customer_id) : null;
                          return cust ? <span className="font-medium">{cust.points_balance}</span> : <span className="text-muted-foreground text-xs">—</span>;
                        })()}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {c.last_ride_at ? new Date(c.last_ride_at).toLocaleDateString("pt-BR") : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {contacts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nenhum contato encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t">
                <p className="text-sm text-muted-foreground">{total} contatos</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={(page + 1) * 50 >= total} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Contact detail sheet */}
      <Sheet open={!!selectedContactId} onOpenChange={(open) => !open && setSelectedContactId(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalhes do Contato</SheetTitle>
          </SheetHeader>
          {selectedContactId && (
            <ContactDetail
              contact={contacts.find(c => c.id === selectedContactId)}
              events={events || []}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

const ContactDetail = memo(function ContactDetail({ contact, events }: { contact: any; events: any[] }) {
  if (!contact) return null;

  return (
    <div className="mt-4 space-y-6">
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">{contact.name || "Sem nome"}</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-muted-foreground">Telefone:</span> {contact.phone || "—"}</div>
          <div><span className="text-muted-foreground">Email:</span> {contact.email || "—"}</div>
          <div><span className="text-muted-foreground">CPF:</span> {contact.cpf || "—"}</div>
          <div><span className="text-muted-foreground">Gênero:</span> {contact.gender || "—"}</div>
          <div><span className="text-muted-foreground">SO:</span> {contact.os_platform || "—"}</div>
          <div><span className="text-muted-foreground">Corridas:</span> {contact.ride_count || 0}</div>
          <div><span className="text-muted-foreground">Ativo desde:</span> {contact.first_ride_at ? new Date(contact.first_ride_at).toLocaleDateString("pt-BR") : "—"}</div>
          <div><span className="text-muted-foreground">Última corrida:</span> {contact.last_ride_at ? new Date(contact.last_ride_at).toLocaleDateString("pt-BR") : "—"}</div>
          <div>
            <span className="text-muted-foreground">Origem:</span>{" "}
            <Badge variant="secondary" className={SOURCE_COLORS[contact.source] || ""}>
              {SOURCE_LABELS[contact.source] || contact.source}
            </Badge>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-3">Histórico de Eventos ({events.length})</h4>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {events.map((e: any) => (
            <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 text-sm">
              <div>
                <span className="font-medium">{e.event_type}</span>
                {e.event_subtype && <span className="text-muted-foreground ml-2">({e.event_subtype})</span>}
              </div>
              <span className="text-muted-foreground text-xs">
                {new Date(e.created_at).toLocaleString("pt-BR")}
              </span>
            </div>
          ))}
          {events.length === 0 && (
            <p className="text-muted-foreground text-center py-4">Nenhum evento registrado</p>
          )}
        </div>
      </div>
    </div>
  );
});
