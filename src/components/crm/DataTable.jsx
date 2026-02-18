import React from "react";
import { motion } from "framer-motion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function DataTable({ columns, data, onRowClick, emptyMessage = "אין נתונים" }) {
  if (data.length === 0) {
    return (
      <div className="gesi-card p-12 text-center">
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="gesi-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b" style={{ borderColor: 'rgba(45,212,168,0.08)' }}>
              {columns.map(col => (
                <TableHead key={col.key} className="text-[11px] font-semibold text-gray-500 bg-[#0d1f26] whitespace-nowrap">
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, i) => (
              <motion.tr
                key={row.id || i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => onRowClick?.(row)}
                className="border-b cursor-pointer hover:bg-[#1a3a47] transition-colors"
                style={{ borderColor: 'rgba(255,255,255,0.03)' }}
              >
                {columns.map(col => (
                  <TableCell key={col.key} className="text-sm text-gray-300 whitespace-nowrap">
                    {col.render ? col.render(row) : row[col.key] || '—'}
                  </TableCell>
                ))}
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}