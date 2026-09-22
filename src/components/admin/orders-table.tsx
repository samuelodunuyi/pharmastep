import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrderStatusBadge, PrescriptionStatusBadge } from "@/components/order/order-status-badge";
import { formatDate, formatNaira } from "@/lib/format";
import type { Order } from "@/generated/prisma/client";

type Row = Pick<
  Order,
  "id" | "reference" | "customerName" | "city" | "createdAt" | "paidAt" | "status" | "prescriptionStatus" | "totalKobo" | "isLegacy" | "legacyStatus"
>;

/** Orders list for the admin area. `dateField` picks which date to show. */
export function OrdersTable({ orders, dateField = "createdAt", showPrescription = true }: { orders: Row[]; dateField?: "createdAt" | "paidAt"; showPrescription?: boolean }) {
  return (
    <Card className="py-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>{dateField === "paidAt" ? "Paid" : "Placed"}</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            {showPrescription && <TableHead>Prescription</TableHead>}
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((o) => {
            const date = o[dateField];
            return (
              <TableRow key={o.id}>
                <TableCell className="font-semibold">
                  <Link href={`/admin/orders/${o.id}`} className="hover:underline">{o.reference}</Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{date ? formatDate(date) : "—"}</TableCell>
                <TableCell>
                  {o.customerName}
                  {o.city && <span className="block text-xs text-muted-foreground">{o.city}</span>}
                </TableCell>
                <TableCell><OrderStatusBadge status={o.status} legacyStatus={o.isLegacy ? o.legacyStatus : null} /></TableCell>
                {showPrescription && <TableCell><PrescriptionStatusBadge status={o.prescriptionStatus} /></TableCell>}
                <TableCell className="text-right font-medium">{formatNaira(o.totalKobo)}</TableCell>
              </TableRow>
            );
          })}
          {orders.length === 0 && (
            <TableRow>
              <TableCell colSpan={showPrescription ? 6 : 5} className="py-10 text-center text-muted-foreground">No orders here.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
